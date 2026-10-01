-- Central de tutoriais.
-- Leitura dos publicados: usuário com vínculo ativo.
-- Rascunho, escrita e exclusão: somente superadmin (public.current_app_role()).

create table if not exists public.tutoriais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  modulo text not null,
  tipo text not null,
  capa_url text,
  video_url text,
  etapas jsonb not null default '[]'::jsonb,
  ordem integer not null default 0,
  publicado boolean not null default false,
  destaque boolean not null default false,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint tutoriais_modulo_check check (
    modulo in ('visao-geral', 'transacoes', 'contas', 'orcamentos', 'categorias', 'agenda', 'conta-global')
  ),
  constraint tutoriais_tipo_check check (tipo in ('video', 'passo-a-passo')),
  constraint tutoriais_ordem_check check (ordem >= 0 and ordem <= 9999),
  constraint tutoriais_titulo_check check (char_length(titulo) between 3 and 120)
);

create index if not exists idx_tutoriais_publicados
  on public.tutoriais (publicado, ordem, titulo);

-- Vínculo ativo (status diferente de false). Não usa e-mail fixo nem profiles.role.
create or replace function public.tutorial_access_ok()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.role_x_user_x_empresa rx
    where rx.user_id = auth.uid()
      and rx.status is distinct from false
  );
$$;

-- Só um publicado pode ficar em destaque. Rascunho não toma o banner.
create or replace function public.tutoriais_um_destaque()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.destaque is true and new.publicado is true then
    update public.tutoriais
      set destaque = false,
          atualizado_em = now()
      where id is distinct from new.id
        and destaque is true;
  end if;
  if new.publicado is not true then
    new.destaque := false;
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_tutoriais_um_destaque on public.tutoriais;
create trigger trg_tutoriais_um_destaque
before insert or update on public.tutoriais
for each row execute procedure public.tutoriais_um_destaque();

alter table public.tutoriais enable row level security;

revoke all on public.tutoriais from anon, public;
grant select, insert, update, delete on public.tutoriais to authenticated;
grant execute on function public.tutorial_access_ok() to authenticated;

drop policy if exists "tutoriais_select_publicado_ou_superadmin" on public.tutoriais;
create policy "tutoriais_select_publicado_ou_superadmin"
on public.tutoriais
for select
using (
  lower(btrim(public.current_app_role())) = 'superadmin'
  or (publicado is true and public.tutorial_access_ok())
);

drop policy if exists "tutoriais_insert_superadmin" on public.tutoriais;
create policy "tutoriais_insert_superadmin"
on public.tutoriais
for insert
with check (lower(btrim(public.current_app_role())) = 'superadmin');

drop policy if exists "tutoriais_update_superadmin" on public.tutoriais;
create policy "tutoriais_update_superadmin"
on public.tutoriais
for update
using (lower(btrim(public.current_app_role())) = 'superadmin')
with check (lower(btrim(public.current_app_role())) = 'superadmin');

drop policy if exists "tutoriais_delete_superadmin" on public.tutoriais;
create policy "tutoriais_delete_superadmin"
on public.tutoriais
for delete
using (lower(btrim(public.current_app_role())) = 'superadmin');
