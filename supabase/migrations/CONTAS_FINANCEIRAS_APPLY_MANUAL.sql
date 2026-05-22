-- =============================================================================
-- Contas e cartões (Fase 4) — aplicar manualmente no Supabase Dashboard
-- SQL Editor: https://supabase.com/dashboard/project/<seu-projeto>/sql
-- Cole e execute este arquivo inteiro se POST /contas_financeiras retornar 404.
-- =============================================================================

-- Contas bancárias e cartões (cadastro manual; Open Finance futuro)
CREATE TABLE IF NOT EXISTS public.contas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (
    tipo IN ('corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'outro')
  ),
  saldo_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0,
  limite_credito NUMERIC(12, 2),
  dia_fechamento INT CHECK (dia_fechamento IS NULL OR (dia_fechamento >= 1 AND dia_fechamento <= 31)),
  dia_vencimento INT CHECK (dia_vencimento IS NULL OR (dia_vencimento >= 1 AND dia_vencimento <= 31)),
  cor TEXT,
  instituicao_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  of_provider TEXT,
  of_external_id TEXT,
  of_last_synced_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_user_id
  ON public.contas_financeiras(user_id);

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_user_ativo
  ON public.contas_financeiras(user_id, ativo);

ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can view own contas_financeiras" ON public.contas_financeiras
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can insert own contas_financeiras" ON public.contas_financeiras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can update own contas_financeiras" ON public.contas_financeiras
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can delete own contas_financeiras" ON public.contas_financeiras
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.lancamentos_id
  ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.contas_financeiras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lancamentos_id_conta_id
  ON public.lancamentos_id(user_id, conta_id)
  WHERE conta_id IS NOT NULL;

-- Se a tabela já existia sem instituicao_id:
ALTER TABLE public.contas_financeiras
  ADD COLUMN IF NOT EXISTS instituicao_id TEXT;

-- Após executar: Settings → API → "Reload schema" (se o 404 persistir por cache do PostgREST)
