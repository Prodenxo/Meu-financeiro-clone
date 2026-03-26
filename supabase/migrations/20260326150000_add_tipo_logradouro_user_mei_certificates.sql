-- Tipo de via (Rua, Av., etc.) — espelha o campo separado do formulário NFS-e.
alter table if exists public.user_mei_certificates
  add column if not exists tipo_logradouro text null;

comment on column public.user_mei_certificates.tipo_logradouro is 'Tipo de logradouro (ex.: Rua, Av.) — alinhado ao formulário de emissão';
