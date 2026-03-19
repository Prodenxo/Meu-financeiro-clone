-- Referência à recorrência em lançamentos materializados (idempotência e futuro "editar só esta ocorrência")
ALTER TABLE public.lancamentos_id
  ADD COLUMN IF NOT EXISTS recorrencia_id UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_ano_mes TEXT;

CREATE INDEX IF NOT EXISTS idx_lancamentos_id_recorrencia_ano_mes
  ON public.lancamentos_id(user_id, recorrencia_id, recorrencia_ano_mes)
  WHERE recorrencia_id IS NOT NULL;
