-- ID do certificado retornado pelo PlugNotas após upload do .pfx.
-- Salvo para reutilização posterior sem necessidade de reenviar o arquivo.
alter table if exists public.user_mei_certificates
  add column if not exists plugnotas_cert_id text null;

comment on column public.user_mei_certificates.plugnotas_cert_id is
  'ID retornado pelo PlugNotas ao registrar o certificado A1 (.pfx). Reutilizado no cadastro de empresa.';
