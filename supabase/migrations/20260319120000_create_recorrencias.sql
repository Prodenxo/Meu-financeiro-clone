-- Tabela de modelos de recorrência (lançamentos recorrentes)
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
