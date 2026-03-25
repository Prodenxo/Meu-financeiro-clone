-- US-INV-01: convites de usuário por empresa (persistência + RLS).
-- Ver: docs/adr/ADR-empresa-user-invites-table-rls.md

create table if not exists public.empresa_invites (
  id uuid primary key default gen_random_uuid(),
  empresas_id uuid not null references public.empresas (id) on delete cascade,
  token_hash text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  invited_email text,
  constraint empresa_invites_token_hash_key unique (token_hash)
);

comment on table public.empresa_invites is
  'Convites para cadastro de usuario vinculado a uma empresa. O segredo do convite nao e armazenado; apenas token_hash (ex.: SHA-256 hex).';

create index if not exists empresa_invites_empresas_id_idx
  on public.empresa_invites (empresas_id);

create index if not exists empresa_invites_expires_at_idx
  on public.empresa_invites (expires_at);

alter table public.empresa_invites enable row level security;

-- Leitura: superadmin (app ou profile); admin apenas da propria empresa.
drop policy if exists "empresa_invites_select_scope" on public.empresa_invites;
create policy "empresa_invites_select_scope"
on public.empresa_invites
for select
using (
  public.current_app_role() = 'superadmin'
  or public.current_role() = 'superadmin'
  or (
    public.current_app_role() = 'admin'
    and empresas_id = public.current_empresa_id()
  )
);

-- Inserção: mesmo escopo; created_by deve ser o usuário autenticado.
drop policy if exists "empresa_invites_insert_scope" on public.empresa_invites;
create policy "empresa_invites_insert_scope"
on public.empresa_invites
for insert
with check (
  created_by = auth.uid()
  and (
    public.current_app_role() = 'superadmin'
    or public.current_role() = 'superadmin'
    or (
      public.current_app_role() = 'admin'
      and public.current_empresa_id() is not null
      and empresas_id = public.current_empresa_id()
    )
  )
);

-- Atualização (ex.: revoked_at, used_at): mesmo escopo de linha que select.
drop policy if exists "empresa_invites_update_scope" on public.empresa_invites;
create policy "empresa_invites_update_scope"
on public.empresa_invites
for update
using (
  public.current_app_role() = 'superadmin'
  or public.current_role() = 'superadmin'
  or (
    public.current_app_role() = 'admin'
    and empresas_id = public.current_empresa_id()
  )
)
with check (
  public.current_app_role() = 'superadmin'
  or public.current_role() = 'superadmin'
  or (
    public.current_app_role() = 'admin'
    and empresas_id = public.current_empresa_id()
  )
);

grant select, insert, update on public.empresa_invites to authenticated;
