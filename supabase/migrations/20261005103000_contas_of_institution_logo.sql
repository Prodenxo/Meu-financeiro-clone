-- Logo da instituição (URL da Pluggy) para contas Open Finance.
ALTER TABLE public.contas_financeiras
  ADD COLUMN IF NOT EXISTS of_institution_logo_url TEXT;

COMMENT ON COLUMN public.contas_financeiras.of_institution_logo_url IS
  'URL pública da logo do conector/instituição (Pluggy Open Finance).';
