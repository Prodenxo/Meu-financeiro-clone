-- Ícone / instituição do catálogo local (bankCatalog no app)
ALTER TABLE public.contas_financeiras
  ADD COLUMN IF NOT EXISTS instituicao_id TEXT;
