#!/usr/bin/env node
/**
 * Aplica apenas as migrations de empresa_invites via conexão Postgres direta
 * (SUPABASE_DB_URL em backend/.env) quando `supabase db push` falha no pooler/SASL.
 * Idempotente: se a tabela já existir, regista versões em falta no histórico e sai.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const backendEnv = resolve(repoRoot, 'backend', '.env');

if (!existsSync(backendEnv)) {
  console.error('[ERRO] backend/.env nao encontrado');
  process.exit(1);
}

const envText = readFileSync(backendEnv, 'utf8');
const urlLine = envText.split(/\r?\n/).find((l) => l.startsWith('SUPABASE_DB_URL='));
if (!urlLine) {
  console.error('[ERRO] SUPABASE_DB_URL nao definido em backend/.env');
  process.exit(1);
}
const connectionString = urlLine.slice('SUPABASE_DB_URL='.length).trim();

const MIGRATIONS = [
  { version: '20260325120000', file: '20260325120000_create_empresa_invites.sql' },
  { version: '20260326120000', file: '20260326120000_empresa_invites_force_row_level_security.sql' },
];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows: regRows } = await client.query(
    "select to_regclass('public.empresa_invites') as reg"
  );
  const tableExists = regRows[0]?.reg != null;

  const { rows: applied } = await client.query(
    `select version from supabase_migrations.schema_migrations where version = any($1::text[])`,
    [MIGRATIONS.map((m) => m.version)]
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  if (tableExists && MIGRATIONS.every((m) => appliedSet.has(m.version))) {
    console.log('[INFO] empresa_invites ja existe e migracoes estao no historico. Nada a fazer.');
    process.exit(0);
  }

  if (!tableExists) {
    console.log('[INFO] Aplicando SQL das migrations empresa_invites...');
    for (const { file } of MIGRATIONS) {
      const sqlPath = resolve(repoRoot, 'supabase', 'migrations', file);
      const sql = readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log('[INFO] OK:', file);
    }
  } else {
    console.log('[INFO] Tabela existe; apenas sincronizando historico de migracoes se faltar.');
  }

  for (const { version, file } of MIGRATIONS) {
    if (appliedSet.has(version)) continue;
    let recorded = false;
    try {
      await client.query(
        `insert into supabase_migrations.schema_migrations(version, name)
         select $1::text, $2::text where not exists (
           select 1 from supabase_migrations.schema_migrations where version = $1
         )`,
        [version, file]
      );
      recorded = true;
    } catch {
      try {
        await client.query(
          `insert into supabase_migrations.schema_migrations(version)
           select $1::text where not exists (
             select 1 from supabase_migrations.schema_migrations where version = $1
           )`,
          [version]
        );
        recorded = true;
      } catch (e2) {
        console.warn('[AVISO] Nao foi possivel atualizar schema_migrations:', e2.message || e2);
        console.warn('[AVISO] Tabela pode estar OK; sincronize com `supabase migration repair` quando a CLI funcionar.');
      }
    }
    if (recorded) console.log('[INFO] Historico registado:', version);
  }

  const { rows: verify } = await client.query(
    "select to_regclass('public.empresa_invites') as reg"
  );
  if (!verify[0]?.reg) {
    console.error('[ERRO] Smoke falhou: empresa_invites ainda nao existe');
    process.exit(1);
  }
  console.log('[INFO] Smoke OK: public.empresa_invites presente');
} catch (e) {
  console.error('[ERRO]', e.message || e);
  process.exit(1);
} finally {
  await client.end();
}
