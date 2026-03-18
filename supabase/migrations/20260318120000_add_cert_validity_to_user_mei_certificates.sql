-- Add certificate validity dates to user_mei_certificates for display without decoding PFX.
alter table if exists public.user_mei_certificates
  add column if not exists cert_valid_from timestamptz null;
alter table if exists public.user_mei_certificates
  add column if not exists cert_valid_to timestamptz null;
