-- Espelho local da selecção «documentos ativos» (NFS-e / NF-e / NFC-e) após POST/PATCH empresa Plugnotas.
-- Precedência UX: remoto (GET empresa) > este espelho > default PRD.

alter table if exists public.user_mei_certificates
  add column if not exists documentos_ativos jsonb null;

comment on column public.user_mei_certificates.documentos_ativos is
  'Espelho { "nfse": bool, "nfe": bool, "nfce": bool }; preenchido após cadastro/atualização empresa no emissor fiscal.';
