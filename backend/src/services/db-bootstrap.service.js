import { Client } from 'pg';
import { env } from '../config/env.js';

const DAS_STATUS_SCHEMA_SQL = `
create table if not exists public.das_mensal_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  empresa_id uuid not null,
  competencia text not null,
  documento_fiscal text null,
  status text not null default 'pendente',
  pdf_bucket text not null default 'mei-das-pdfs',
  pdf_path text not null,
  source text not null default 'automatico',
  error_message text null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint das_mensal_status_status_check check (status in ('pago', 'pendente', 'erro')),
  constraint das_mensal_status_competencia_check check (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint das_mensal_status_doc_check check (documento_fiscal is null or documento_fiscal ~ '^[0-9]{14}$'),
  constraint das_mensal_status_user_competencia_key unique (user_id, competencia)
);

create index if not exists idx_das_mensal_status_empresa_competencia_status
  on public.das_mensal_status (empresa_id, competencia, status);

create index if not exists idx_das_mensal_status_user_competencia
  on public.das_mensal_status (user_id, competencia);

create or replace function public.set_das_mensal_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_das_mensal_status_updated_at on public.das_mensal_status;
create trigger trg_das_mensal_status_updated_at
before update on public.das_mensal_status
for each row
execute function public.set_das_mensal_status_updated_at();
`;

const DAS_JOB_RUNS_SCHEMA_SQL = `
create table if not exists public.das_mensal_job_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null,
  run_type text not null default 'automatico',
  timezone text not null default 'America/Sao_Paulo',
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint das_mensal_job_runs_run_key_check check (run_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint das_mensal_job_runs_unique_key unique (run_key, run_type)
);

create index if not exists idx_das_mensal_job_runs_run_key
  on public.das_mensal_job_runs (run_key);
`;

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'sim'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'nao', 'não'].includes(normalized)) return false;
  return defaultValue;
};

const createPgClient = async (connectionString, sslEnabled) => {
  const client = new Client({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
  });
  await client.connect();
  return client;
};

const ensureDasSchema = async (client) => {
  await client.query(DAS_STATUS_SCHEMA_SQL);
  await client.query(DAS_JOB_RUNS_SCHEMA_SQL);
};

export const bootstrapDatabase = async (options = {}) => {
  const autoSchemaDefault = env.NODE_ENV !== 'production';
  const autoSchema = options.autoSchema ?? parseBoolean(env.DB_BOOTSTRAP_AUTO_SCHEMA, autoSchemaDefault);
  const failFast = options.failFast ?? parseBoolean(env.DB_BOOTSTRAP_FAIL_FAST, true);
  const sslEnabled = options.sslEnabled ?? parseBoolean(env.DB_BOOTSTRAP_SSL, true);
  const dbUrl = options.dbUrl ?? env.SUPABASE_DB_URL;
  const dbClientFactory = options.dbClientFactory || createPgClient;

  if (!autoSchema && !options.forceConnectionCheck) {
    return { connected: false, schemaEnsured: false, skipped: true };
  }

  if (!dbUrl) {
    const error = new Error('SUPABASE_DB_URL não configurado para bootstrap automático do schema DAS.');
    if (failFast) {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.warn('[db-bootstrap] bootstrap ignorado:', error.message);
    return { connected: false, schemaEnsured: false, skipped: true, error };
  }

  let client;
  try {
    client = await dbClientFactory(dbUrl, sslEnabled);
    await client.query('select 1');
    if (autoSchema) {
      await ensureDasSchema(client);
    }
    // eslint-disable-next-line no-console
    console.info('[db-bootstrap] conexão OK e schema DAS garantido');
    return { connected: true, schemaEnsured: autoSchema };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[db-bootstrap] falha ao validar/criar schema DAS', error instanceof Error ? error.message : error);
    if (failFast) {
      throw error;
    }
    return { connected: false, schemaEnsured: false, error };
  } finally {
    if (client?.end) {
      await client.end();
    }
  }
};
