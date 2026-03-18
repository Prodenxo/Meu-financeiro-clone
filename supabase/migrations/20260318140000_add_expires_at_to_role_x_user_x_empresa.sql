-- Data de validade por usuário (apenas role usuario); configurável por admin/superadmin.
-- Bloqueio automático quando expires_at < now() (checado no login e em getRequesterContext).
alter table public.role_x_user_x_empresa
  add column if not exists expires_at timestamptz null;

create index if not exists idx_role_x_user_x_empresa_expires_at
  on public.role_x_user_x_empresa (expires_at)
  where expires_at is not null;
