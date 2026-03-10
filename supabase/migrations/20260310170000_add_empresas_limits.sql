alter table public.empresas
  add column if not exists max_mei integer,
  add column if not exists max_usuarios_nao_mei integer;

alter table public.empresas
  drop constraint if exists empresas_max_mei_nonnegative;

alter table public.empresas
  drop constraint if exists empresas_max_usuarios_nao_mei_nonnegative;

alter table public.empresas
  add constraint empresas_max_mei_nonnegative
    check (max_mei is null or max_mei >= 0),
  add constraint empresas_max_usuarios_nao_mei_nonnegative
    check (max_usuarios_nao_mei is null or max_usuarios_nao_mei >= 0);
