alter table if exists public.mei_nfse_clientes
  add column if not exists document_type text not null default 'NFSE',
  add column if not exists metadata_json jsonb;

alter table if exists public.mei_nfse_produtos
  add column if not exists document_type text not null default 'NFSE',
  add column if not exists metadata_json jsonb;

do $$
begin
  if to_regclass('public.mei_nfse_clientes') is not null then
    update public.mei_nfse_clientes
    set document_type = 'NFSE'
    where document_type is null;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.mei_nfse_produtos') is not null then
    update public.mei_nfse_produtos
    set document_type = 'NFSE'
    where document_type is null;
  end if;
end
$$;

alter table if exists public.mei_nfse_clientes
  alter column document_type set default 'NFSE';
alter table if exists public.mei_nfse_clientes
  alter column document_type set not null;

alter table if exists public.mei_nfse_produtos
  alter column document_type set default 'NFSE';
alter table if exists public.mei_nfse_produtos
  alter column document_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mei_nfse_clientes_document_type_chk'
  ) then
    alter table public.mei_nfse_clientes
      add constraint mei_nfse_clientes_document_type_chk
      check (document_type in ('NFSE', 'NFE', 'NFCE', 'CTE'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mei_nfse_produtos_document_type_chk'
  ) then
    alter table public.mei_nfse_produtos
      add constraint mei_nfse_produtos_document_type_chk
      check (document_type in ('NFSE', 'NFE', 'NFCE', 'CTE'));
  end if;
end
$$;

drop index if exists mei_nfse_clientes_user_dedupe_key_uq;
drop index if exists mei_nfse_clientes_user_last_used_idx;
drop index if exists mei_nfse_clientes_user_documento_idx;

create unique index if not exists mei_nfse_clientes_user_doc_type_dedupe_uq
  on public.mei_nfse_clientes(user_id, document_type, dedupe_key);
create index if not exists mei_nfse_clientes_user_doc_type_last_used_idx
  on public.mei_nfse_clientes(user_id, document_type, last_used_at desc);
create index if not exists mei_nfse_clientes_user_doc_type_documento_idx
  on public.mei_nfse_clientes(user_id, document_type, documento);

drop index if exists mei_nfse_produtos_user_dedupe_key_uq;
drop index if exists mei_nfse_produtos_user_last_used_idx;
drop index if exists mei_nfse_produtos_user_codigo_cnae_idx;

create unique index if not exists mei_nfse_produtos_user_doc_type_dedupe_uq
  on public.mei_nfse_produtos(user_id, document_type, dedupe_key);
create index if not exists mei_nfse_produtos_user_doc_type_last_used_idx
  on public.mei_nfse_produtos(user_id, document_type, last_used_at desc);
create index if not exists mei_nfse_produtos_user_doc_type_codigo_cnae_idx
  on public.mei_nfse_produtos(user_id, document_type, codigo, cnae);
