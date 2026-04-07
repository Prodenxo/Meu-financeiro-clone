#!/usr/bin/env node
/**
 * CORR-01: alinhar `user_mei_certificates` com migrações NFS-e emitente + `tipo_logradouro` quando
 * `supabase db push` não está disponível ou o projeto remoto ficou sem DDL.
 *
 * Usa SUPABASE_DB_URL em backend/.env (connection string Postgres direta).
 * O pacote `pg` é carregado a partir de `backend/package.json` para evitar falhas de resolução
 * a partir da raiz do monorepo.
 *
 * Uso:
 *   node scripts/nfse-emitente-user-mei-certificates-schema.mjs --check
 *   node scripts/nfse-emitente-user-mei-certificates-schema.mjs --apply
 */

import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const backendEnv = resolve(repoRoot, 'backend', '.env');
const requireBackend = createRequire(resolve(repoRoot, 'backend', 'package.json'));
const pg = requireBackend('pg');

const MIGRATIONS = [
  {
    version: '20260326140000',
    file: '20260326140000_add_nfse_emitente_fields_to_user_mei_certificates.sql',
  },
  {
    version: '20260326150000',
    file: '20260326150000_add_tipo_logradouro_user_mei_certificates.sql',
  },
  {
    version: '20260407130000',
    file: '20260407130000_add_documentos_ativos_user_mei_certificates.sql',
  },
];

/** Colunas esperadas após ambas as migrações (ver brief NFS-e). */
const REQUIRED_COLUMNS = [
  'razao_social',
  'nome_fantasia',
  'fiscal_email',
  'regime_tributario',
  'inscricao_municipal',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'ibge_municipio',
  'cidade',
  'uf',
  'optante_simples_nacional',
  'tipo_logradouro',
  'documentos_ativos',
];

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const modeCheck = hasFlag('--check');
const modeApply = hasFlag('--apply');

const fail = (msg, detail = '') => {
  console.error(`\n[ERRO] ${msg}`);
  if (detail) console.error(detail);
  process.exit(1);
};

const info = (msg) => console.log(`[INFO] ${msg}`);

/** Extrai o project ref (subdomínio) de SUPABASE_URL ou SUPABASE_DB_URL para cruzamento. */
const refFromSupabaseUrl = (line) => {
  if (!line || typeof line !== 'string') return null;
  const v = line.replace(/^[^=]+=/, '').trim().replace(/^["']|["']$/g, '');
  const api = v.match(/https?:\/\/([a-z0-9]{20})\.supabase\.co/i);
  if (api) return api[1].toLowerCase();
  return null;
};

const refFromDbUrl = (dbUrl) => {
  if (!dbUrl || typeof dbUrl !== 'string') return null;
  const db = dbUrl.match(/db\.([a-z0-9]{20})\.supabase\.co/i);
  if (db) return db[1].toLowerCase();
  return null;
};

if (!modeCheck && !modeApply) {
  fail(
    'Indique --check ou --apply.',
    'Ex.: node scripts/nfse-emitente-user-mei-certificates-schema.mjs --check'
  );
}

if (!existsSync(backendEnv)) {
  fail('backend/.env nao encontrado', 'Configure SUPABASE_DB_URL para Postgres direto.');
}

const envText = readFileSync(backendEnv, 'utf8');
const lines = envText.split(/\r?\n/);
const urlLine = lines.find((l) => l.startsWith('SUPABASE_DB_URL='));
if (!urlLine) {
  fail('SUPABASE_DB_URL nao definido em backend/.env');
}
const connectionString = urlLine.slice('SUPABASE_DB_URL='.length).trim().replace(/^["']|["']$/g, '');

const urlLineApi = lines.find((l) => l.startsWith('SUPABASE_URL='));
const refDb = refFromDbUrl(connectionString);
const refApi = urlLineApi ? refFromSupabaseUrl(urlLineApi) : null;
if (refDb && refApi && refDb !== refApi) {
  fail(
    'SUPABASE_URL e SUPABASE_DB_URL parecem ser de projetos Supabase diferentes.',
    `ref em SUPABASE_DB_URL (host): ${refDb}\nref em SUPABASE_URL: ${refApi}\nCorrija o .env antes de aplicar DDL.`
  );
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const recordMigration = async (version, file) => {
  try {
    await client.query(
      `insert into supabase_migrations.schema_migrations(version, name)
       select $1::text, $2::text
       where not exists (select 1 from supabase_migrations.schema_migrations where version = $1)`,
      [version, file]
    );
  } catch {
    try {
      await client.query(
        `insert into supabase_migrations.schema_migrations(version)
         select $1::text where not exists (
           select 1 from supabase_migrations.schema_migrations where version = $1
         )`,
        [version]
      );
    } catch (e2) {
      console.warn('[AVISO] Nao foi possivel atualizar schema_migrations:', e2.message || e2);
      console.warn(
        '[AVISO] O DDL pode ja ter sido aplicado. Sincronize o historico com: supabase migration repair (ou SQL manual no Supabase).'
      );
    }
  }
};

const loadExistingColumns = async () => {
  const { rows } = await client.query(
    `select column_name
     from information_schema.columns
     where table_schema = 'public'
       and table_name = 'user_mei_certificates'`
  );
  return new Set(rows.map((r) => r.column_name));
};

const runCheck = async () => {
  const { rows: tableRows } = await client.query(
    "select to_regclass('public.user_mei_certificates') as reg"
  );
  if (!tableRows[0]?.reg) {
    fail(
      'A tabela public.user_mei_certificates nao existe nesta base.',
      'Aplique primeiro as migracoes base do repositorio (ou supabase db push) antes de CORR-01.'
    );
  }

  const cols = await loadExistingColumns();
  const missing = REQUIRED_COLUMNS.filter((c) => !cols.has(c));
  if (missing.length === 0) {
    info('Schema OK: todas as colunas NFS-e emitente + tipo_logradouro presentes em user_mei_certificates.');
    return;
  }
  console.error('[FALHA] Colunas em falta em user_mei_certificates:', missing.join(', '));
  process.exit(1);
};

const runApply = async () => {
  const { rows: tableRows } = await client.query(
    "select to_regclass('public.user_mei_certificates') as reg"
  );
  if (!tableRows[0]?.reg) {
    fail('Tabela public.user_mei_certificates nao existe. Aplique migrações base do projeto primeiro.');
  }

  for (const { version, file } of MIGRATIONS) {
    const sqlPath = resolve(repoRoot, 'supabase', 'migrations', file);
    if (!existsSync(sqlPath)) {
      fail(`Ficheiro de migracao nao encontrado: ${file}`);
    }
    const sql = readFileSync(sqlPath, 'utf8');
    info(`Aplicando SQL: ${file}`);
    await client.query(sql);
    await recordMigration(version, file);
    info(`OK: ${version}`);
  }

  await runCheck();
  info('Apply concluido. Se o PostgREST ainda reclamar de schema cache, use Reload schema no painel Supabase (API).');
};

try {
  await client.connect();
  if (modeCheck) {
    await runCheck();
  } else {
    await runApply();
  }
} catch (e) {
  console.error('[ERRO]', e.message || e);
  process.exit(1);
} finally {
  await client.end();
}
