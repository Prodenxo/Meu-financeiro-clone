-- Harden RLS for DAS tables and restrict role link insert scope.

alter table public.das_mensal_status enable row level security;
alter table public.das_mensal_status force row level security;

drop policy if exists "das_mensal_status_select_scope" on public.das_mensal_status;
create policy "das_mensal_status_select_scope"
on public.das_mensal_status
for select
using (
  user_id = auth.uid()
  or public.current_app_role() = 'superadmin'
  or (public.current_app_role() = 'admin' and empresa_id = public.current_empresa_id())
);

drop policy if exists "das_mensal_status_insert_scope" on public.das_mensal_status;
create policy "das_mensal_status_insert_scope"
on public.das_mensal_status
for insert
with check (
  user_id = auth.uid()
  or public.current_app_role() = 'superadmin'
  or (public.current_app_role() = 'admin' and empresa_id = public.current_empresa_id())
);

drop policy if exists "das_mensal_status_update_scope" on public.das_mensal_status;
create policy "das_mensal_status_update_scope"
on public.das_mensal_status
for update
using (
  user_id = auth.uid()
  or public.current_app_role() = 'superadmin'
  or (public.current_app_role() = 'admin' and empresa_id = public.current_empresa_id())
)
with check (
  user_id = auth.uid()
  or public.current_app_role() = 'superadmin'
  or (public.current_app_role() = 'admin' and empresa_id = public.current_empresa_id())
);

alter table public.das_mensal_job_runs enable row level security;
alter table public.das_mensal_job_runs force row level security;

drop policy if exists "das_mensal_job_runs_select_superadmin" on public.das_mensal_job_runs;
create policy "das_mensal_job_runs_select_superadmin"
on public.das_mensal_job_runs
for select
using (public.current_app_role() = 'superadmin');

drop policy if exists "role_link_insert_admin" on public.role_x_user_x_empresa;
create policy "role_link_insert_admin"
on public.role_x_user_x_empresa
for insert
with check (
  public.current_app_role() = 'superadmin'
  or (
    public.current_app_role() = 'admin'
    and empresas_id = public.current_empresa_id()
    and exists (
      select 1
      from public.roles r
      where r.id = roles_id
        and lower(r.roles) in ('usuario', 'user', 'outsider')
    )
  )
);
