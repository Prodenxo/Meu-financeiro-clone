-- Vagas MEI pagas fora da Stripe (ex.: PIX / planilha legada), para migração manual para a assinatura Stripe.

alter table public.empresas
  add column if not exists legacy_mei_slots_pix integer not null default 0;

alter table public.empresas
  drop constraint if exists empresas_legacy_mei_slots_pix_non_negative;

alter table public.empresas
  add constraint empresas_legacy_mei_slots_pix_non_negative
  check (legacy_mei_slots_pix >= 0);

comment on column public.empresas.legacy_mei_slots_pix is
  'MEI slots cobertos fora da Stripe (PIX etc.); superadmin migra para próxima fatura via API.';
