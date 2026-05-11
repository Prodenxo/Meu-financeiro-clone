-- Cobrança MEI via Stripe: cliente por empresa + linhas de pacotes (vagas MEI)

alter table public.empresas
  add column if not exists stripe_customer_id text;

create unique index if not exists empresas_stripe_customer_id_key
  on public.empresas (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.empresa_mei_subscription_lines (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  mei_slots integer not null,
  status text not null default 'pending'
    constraint empresa_mei_subscription_lines_status_check
      check (status in ('pending', 'active', 'cancelled')),
  value_numeric numeric(14, 2),
  billing_type text,
  external_reference text,
  description text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empresa_mei_subscription_lines_mei_slots_positive check (mei_slots > 0)
);

create index if not exists empresa_mei_subscription_lines_empresa_id_idx
  on public.empresa_mei_subscription_lines (empresa_id);

create index if not exists empresa_mei_subscription_lines_status_idx
  on public.empresa_mei_subscription_lines (empresa_id, status);

-- Várias linhas podem partilhar a mesma subscription Stripe (ex.: add-on na próxima fatura)
create index if not exists empresa_mei_subscription_lines_stripe_subscription_id_idx
  on public.empresa_mei_subscription_lines (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists empresa_mei_lines_stripe_checkout_session_id_key
  on public.empresa_mei_subscription_lines (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.empresa_mei_subscription_lines enable row level security;
