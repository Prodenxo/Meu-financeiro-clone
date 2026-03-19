#!/usr/bin/env node
/**
 * Aplica as migrations de recorrências (recorrencias, recorrencias_job_runs, lancamentos_id)
 * usando SUPABASE_DB_URL ou DATABASE_URL do .env.
 *
 * Uso (a partir da raiz do repositório):
 *   cd backend && node ../scripts/apply-recorrencias-migrations.mjs
 * (Requer .env em backend/ ou na raiz com SUPABASE_DB_URL ou DATABASE_URL.)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const backendRoot = resolve(repoRoot, 'backend');

// Carregar .env da raiz e depois backend
require('dotenv').config({ path: resolve(repoRoot, '.env') });
require('dotenv').config({ path: resolve(backendRoot, '.env') });

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('[ERRO] Defina SUPABASE_DB_URL ou DATABASE_URL no .env (raiz ou backend).');
  process.exit(1);
}

const migrations = [
  '20260319120000_create_recorrencias.sql',
  '20260319120001_recorrencias_job_runs.sql',
  '20260319120002_lancamentos_recorrencia_ref.sql'
];

async function main() {
  const pg = require('pg');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
  });

  try {
    await client.connect();
    console.log('[INFO] Conectado ao banco. Aplicando migrations de recorrências...');

    for (const name of migrations) {
      const path = resolve(repoRoot, 'supabase', 'migrations', name);
      if (!existsSync(path)) {
        console.error('[ERRO] Arquivo não encontrado:', path);
        process.exit(1);
      }
      const sql = readFileSync(path, 'utf8');
      await client.query(sql);
      console.log('[OK]', name);
    }

    console.log('[INFO] Todas as migrations de recorrências foram aplicadas.');
  } catch (err) {
    console.error('[ERRO]', err.message);
    if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND')) {
      console.error('');
      console.error('Se o banco Supabase não for acessível daqui (rede/VPN), aplique manualmente:');
      console.error('  1. Abra Supabase Dashboard → SQL Editor');
      console.error('  2. Cole e execute: supabase/migrations/RECORRENCIAS_APPLY_MANUAL.sql');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
