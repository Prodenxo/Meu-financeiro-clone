-- =============================================================================
-- Migrations de Recorrências — aplicar manualmente no Supabase Dashboard
-- (SQL Editor: https://supabase.com/dashboard/project/_/sql)
-- Execute este arquivo inteiro se o script npm run db:migrate:recorrencias falhar
-- por rede (ENOTFOUND) ou se preferir aplicar pelo Dashboard.
-- =============================================================================

-- 1) Tabela de modelos de recorrência (lançamentos recorrentes)
CREATE TABLE IF NOT EXISTS public.recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia_do_mes INT NOT NULL CHECK (dia_do_mes >= 1 AND dia_do_mes <= 31),
  valor NUMERIC(10, 2) NOT NULL,
  classificacao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saída', 'saida')),
  status TEXT NOT NULL DEFAULT 'pago',
  obs TEXT,
  categoria TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recorrencias_user_id ON public.recorrencias(user_id);
CREATE INDEX IF NOT EXISTS idx_recorrencias_ativo ON public.recorrencias(ativo);
CREATE INDEX IF NOT EXISTS idx_recorrencias_user_ativo ON public.recorrencias(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_recorrencias_dia_do_mes ON public.recorrencias(dia_do_mes);

ALTER TABLE public.recorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recorrencias" ON public.recorrencias;
CREATE POLICY "Users can view own recorrencias" ON public.recorrencias
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recorrencias" ON public.recorrencias;
CREATE POLICY "Users can insert own recorrencias" ON public.recorrencias
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recorrencias" ON public.recorrencias;
CREATE POLICY "Users can update own recorrencias" ON public.recorrencias
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recorrencias" ON public.recorrencias;
CREATE POLICY "Users can delete own recorrencias" ON public.recorrencias
  FOR DELETE USING (auth.uid() = user_id);

-- 2) Controle de execução diária do job (idempotência)
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

-- 3) Colunas em lancamentos_id para vínculo com recorrência
ALTER TABLE public.lancamentos_id
  ADD COLUMN IF NOT EXISTS recorrencia_id UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_ano_mes TEXT;

CREATE INDEX IF NOT EXISTS idx_lancamentos_id_recorrencia_ano_mes
  ON public.lancamentos_id(user_id, recorrencia_id, recorrencia_ano_mes)
  WHERE recorrencia_id IS NOT NULL;
