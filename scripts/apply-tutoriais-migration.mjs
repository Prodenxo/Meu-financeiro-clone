#!/usr/bin/env node
/**
 * Cria public.tutoriais no Postgres do backend/.env.
 * Só aplica se o projeto do banco for o mesmo do site (web/.env.local).
 * Não imprime URL, senha nem connection string.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function projectRef(value) {
  const raw = String(value || '');
  const api = raw.match(/https?:\/\/([a-z0-9]{20})\.supabase\.co/i);
  if (api) return api[1].toLowerCase();
  const db = raw.match(/db\.([a-z0-9]{20})\.supabase\.co/i);
  if (db) return db[1].toLowerCase();
  const pooler = raw.match(/postgres\.([a-z0-9]{20})/i);
  if (pooler) return pooler[1].toLowerCase();
  return '';
}

function safeError(error) {
  return String(error?.message || error || 'falha')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[url]')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .slice(0, 300);
}

const backendEnv = readEnvFile(resolve(repoRoot, 'backend', '.env'));
const webEnv = readEnvFile(resolve(repoRoot, 'web', '.env.local'));
const connectionString = backendEnv.SUPABASE_DB_URL || '';
if (!connectionString) {
  console.error('[ERRO] SUPABASE_DB_URL nao definido em backend/.env');
  process.exit(1);
}

const refDb = projectRef(connectionString) || projectRef(backendEnv.SUPABASE_URL);
const refWeb = projectRef(webEnv.NEXT_PUBLIC_SUPABASE_URL);
if (!refDb || !refWeb || refDb !== refWeb) {
  console.error('[ERRO] O banco do backend e o do site novo nao sao o mesmo projeto. Migracao nao aplicada.');
  process.exit(1);
}

const sql = readFileSync(resolve(repoRoot, 'supabase', 'migrations', '20261001140000_create_tutoriais.sql'), 'utf8');
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  await client.query("notify pgrst, 'reload schema'");
  const { rows } = await client.query("select to_regclass('public.tutoriais') as reg");
  if (!rows[0]?.reg) {
    console.error('[ERRO] O SQL rodou, mas a tabela tutoriais nao apareceu.');
    process.exit(1);
  }
  console.log('[INFO] Tabela tutoriais pronta no mesmo projeto do site.');
} catch (error) {
  console.error('[ERRO]', safeError(error));
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
