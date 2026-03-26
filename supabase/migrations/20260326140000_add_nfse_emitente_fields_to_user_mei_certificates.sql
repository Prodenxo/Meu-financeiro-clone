-- Campos fiscais e de endereço para emissão NFS-e (formulário "DADOS MÍNIMOS PARA EMISSÃO DE NFS-E").
-- CNPJ continua em cert_document; certificado .pfx/senha em pfx_base64 + passphrase_*.

alter table if exists public.user_mei_certificates
  add column if not exists razao_social text null;

alter table if exists public.user_mei_certificates
  add column if not exists nome_fantasia text null;

alter table if exists public.user_mei_certificates
  add column if not exists fiscal_email text null;

-- Ex.: "1" ou "simples_nacional" conforme convenção do emissor (Plugnotas).
alter table if exists public.user_mei_certificates
  add column if not exists regime_tributario text null;

alter table if exists public.user_mei_certificates
  add column if not exists inscricao_municipal text null;

alter table if exists public.user_mei_certificates
  add column if not exists cep text null;

alter table if exists public.user_mei_certificates
  add column if not exists logradouro text null;

alter table if exists public.user_mei_certificates
  add column if not exists numero text null;

alter table if exists public.user_mei_certificates
  add column if not exists complemento text null;

alter table if exists public.user_mei_certificates
  add column if not exists bairro text null;

alter table if exists public.user_mei_certificates
  add column if not exists ibge_municipio text null;

alter table if exists public.user_mei_certificates
  add column if not exists cidade text null;

alter table if exists public.user_mei_certificates
  add column if not exists uf text null;

alter table if exists public.user_mei_certificates
  add column if not exists optante_simples_nacional boolean null default true;

comment on column public.user_mei_certificates.razao_social is 'Razão social (NFS-e / cadastro emissor)';
comment on column public.user_mei_certificates.nome_fantasia is 'Nome fantasia (opcional)';
comment on column public.user_mei_certificates.fiscal_email is 'Email fiscal (opcional)';
comment on column public.user_mei_certificates.regime_tributario is 'Código ou identificador do regime (ex. Simples Nacional)';
comment on column public.user_mei_certificates.inscricao_municipal is 'Inscrição municipal (exigida pelo emissor)';
comment on column public.user_mei_certificates.cep is 'CEP (apenas dígitos ou formatado)';
comment on column public.user_mei_certificates.logradouro is 'Logradouro / rua';
comment on column public.user_mei_certificates.numero is 'Número do endereço';
comment on column public.user_mei_certificates.complemento is 'Complemento (opcional)';
comment on column public.user_mei_certificates.bairro is 'Bairro';
comment on column public.user_mei_certificates.ibge_municipio is 'Código IBGE do município';
comment on column public.user_mei_certificates.cidade is 'Nome do município';
comment on column public.user_mei_certificates.uf is 'UF (2 letras)';
comment on column public.user_mei_certificates.optante_simples_nacional is 'Empresa optante pelo Simples Nacional';
