-- Contas em moeda estrangeira (Conta Global) — não entram no saldo BRL do dashboard.
CREATE TABLE IF NOT EXISTS public.contas_moeda_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moeda TEXT NOT NULL CHECK (char_length(moeda) = 3),
  nome TEXT,
  valor NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_moeda_global_user_id
  ON public.contas_moeda_global(user_id);

CREATE INDEX IF NOT EXISTS idx_contas_moeda_global_user_ativo
  ON public.contas_moeda_global(user_id, ativo);

ALTER TABLE public.contas_moeda_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contas_moeda_global" ON public.contas_moeda_global;
CREATE POLICY "Users can view own contas_moeda_global" ON public.contas_moeda_global
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own contas_moeda_global" ON public.contas_moeda_global;
CREATE POLICY "Users can insert own contas_moeda_global" ON public.contas_moeda_global
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contas_moeda_global" ON public.contas_moeda_global;
CREATE POLICY "Users can update own contas_moeda_global" ON public.contas_moeda_global
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contas_moeda_global" ON public.contas_moeda_global;
CREATE POLICY "Users can delete own contas_moeda_global" ON public.contas_moeda_global
  FOR DELETE USING (auth.uid() = user_id);
