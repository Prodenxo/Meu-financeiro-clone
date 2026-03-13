alter table if exists public.mei_nfse
  add column if not exists document_type text not null default 'NFSE',
  add column if not exists provider text not null default 'plugnotas',
  add column if not exists archived_at timestamptz,
  add column if not exists metadata_json jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mei_nfse_document_type_chk'
  ) then
    alter table public.mei_nfse
      add constraint mei_nfse_document_type_chk
      check (document_type in ('NFSE', 'NFE', 'NFCE', 'CTE'));
  end if;
end
$$;

create index if not exists mei_nfse_document_type_idx on public.mei_nfse(document_type);
create index if not exists mei_nfse_provider_idx on public.mei_nfse(provider);
create index if not exists mei_nfse_user_archived_at_idx on public.mei_nfse(user_id, archived_at);
