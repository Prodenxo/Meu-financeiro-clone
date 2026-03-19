-- Controle de execução diária do job de materialização de recorrências (evita duplicar no mesmo dia)
CREATE TABLE IF NOT EXISTS public.recorrencias_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL,
  run_type TEXT NOT NULL DEFAULT 'diario',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recorrencias_job_runs_run_key_check CHECK (run_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT recorrencias_job_runs_unique_key UNIQUE (run_key, run_type)
);

CREATE INDEX IF NOT EXISTS idx_recorrencias_job_runs_run_key ON public.recorrencias_job_runs(run_key);
