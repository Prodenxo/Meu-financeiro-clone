create table if not exists public.mei_nfse_clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  documento text,
  nome text,
  email text,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mei_nfse_clientes_documento_len_chk
    check (documento is null or char_length(documento) in (11, 14))
);

create unique index if not exists mei_nfse_clientes_user_dedupe_key_uq
  on public.mei_nfse_clientes(user_id, dedupe_key);
create index if not exists mei_nfse_clientes_user_last_used_idx
  on public.mei_nfse_clientes(user_id, last_used_at desc);
create index if not exists mei_nfse_clientes_user_documento_idx
  on public.mei_nfse_clientes(user_id, documento);

alter table public.mei_nfse_clientes enable row level security;
alter table public.mei_nfse_clientes force row level security;

drop policy if exists "mei_nfse_clientes_select_own" on public.mei_nfse_clientes;
create policy "mei_nfse_clientes_select_own"
on public.mei_nfse_clientes
for select
using ((select auth.uid()) = user_id);

drop policy if exists "mei_nfse_clientes_insert_own" on public.mei_nfse_clientes;
create policy "mei_nfse_clientes_insert_own"
on public.mei_nfse_clientes
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "mei_nfse_clientes_update_own" on public.mei_nfse_clientes;
create policy "mei_nfse_clientes_update_own"
on public.mei_nfse_clientes
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.mei_nfse_produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  codigo text not null default '',
  cnae text not null default '',
  discriminacao text not null,
  aliquota numeric(10,4),
  valor_sugerido numeric(14,2),
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mei_nfse_produtos_user_dedupe_key_uq
  on public.mei_nfse_produtos(user_id, dedupe_key);
create index if not exists mei_nfse_produtos_user_last_used_idx
  on public.mei_nfse_produtos(user_id, last_used_at desc);
create index if not exists mei_nfse_produtos_user_codigo_cnae_idx
  on public.mei_nfse_produtos(user_id, codigo, cnae);

alter table public.mei_nfse_produtos enable row level security;
alter table public.mei_nfse_produtos force row level security;

drop policy if exists "mei_nfse_produtos_select_own" on public.mei_nfse_produtos;
create policy "mei_nfse_produtos_select_own"
on public.mei_nfse_produtos
for select
using ((select auth.uid()) = user_id);

drop policy if exists "mei_nfse_produtos_insert_own" on public.mei_nfse_produtos;
create policy "mei_nfse_produtos_insert_own"
on public.mei_nfse_produtos
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "mei_nfse_produtos_update_own" on public.mei_nfse_produtos;
create policy "mei_nfse_produtos_update_own"
on public.mei_nfse_produtos
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
