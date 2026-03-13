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
