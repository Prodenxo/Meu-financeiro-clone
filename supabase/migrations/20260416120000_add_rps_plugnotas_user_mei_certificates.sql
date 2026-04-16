-- Numeração RPS (PlugNotas) espelhada localmente para autopreenchimento do formulário Guia MEI.
alter table if exists public.user_mei_certificates
  add column if not exists rps_lote integer null default 1;

alter table if exists public.user_mei_certificates
  add column if not exists rps_numero integer null default 1;

alter table if exists public.user_mei_certificates
  add column if not exists rps_serie text null default '1';

comment on column public.user_mei_certificates.rps_lote is 'Lote inicial RPS (PlugNotas) — espelho local';
comment on column public.user_mei_certificates.rps_numero is 'Número inicial RPS — espelho local';
comment on column public.user_mei_certificates.rps_serie is 'Série RPS — espelho local';
