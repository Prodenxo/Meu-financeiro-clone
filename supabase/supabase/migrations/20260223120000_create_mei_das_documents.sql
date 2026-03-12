create table if not exists public.das_mensal_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  empresa_id uuid not null,
  competencia text not null,
  documento_fiscal text null,
  status text not null default 'pendente',
  pdf_bucket text not null default 'mei-das-pdfs',
  pdf_path text not null,
  source text not null default 'automatico',
  error_message text null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint das_mensal_status_status_check check (status in ('pago', 'pendente', 'erro')),
  constraint das_mensal_status_competencia_check check (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint das_mensal_status_doc_check check (documento_fiscal is null or documento_fiscal ~ '^[0-9]{14}$'),
  constraint das_mensal_status_user_competencia_key unique (user_id, competencia)
);
create index if not exists idx_das_mensal_status_empresa_competencia_status
  on public.das_mensal_status (empresa_id, competencia, status);
create index if not exists idx_das_mensal_status_user_competencia
  on public.das_mensal_status (user_id, competencia);
create or replace function public.set_das_mensal_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_das_mensal_status_updated_at on public.das_mensal_status;
create trigger trg_das_mensal_status_updated_at
before update on public.das_mensal_status
for each row
execute function public.set_das_mensal_status_updated_at();
