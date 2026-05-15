-- Backfill nome_fantasia com o valor de empresa para empresas existentes.
-- Preserva registros que já têm nome_fantasia definido manualmente.
UPDATE empresas
SET nome_fantasia = TRIM(empresa)
WHERE nome_fantasia IS NULL
  AND empresa IS NOT NULL
  AND TRIM(empresa) != '';
