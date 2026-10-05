-- Vínculo de lançamentos importados via Open Finance (deduplicação no re-sync)

ALTER TABLE public.lancamentos_id
  ADD COLUMN IF NOT EXISTS of_provider TEXT,
  ADD COLUMN IF NOT EXISTS of_external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lancamentos_id_of_external
  ON public.lancamentos_id(user_id, of_provider, of_external_id)
  WHERE of_external_id IS NOT NULL;
