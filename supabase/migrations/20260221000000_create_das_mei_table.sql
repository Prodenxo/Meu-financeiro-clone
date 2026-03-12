create table if not exists public."DAS_mei" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  periodo_apuracao timestamptz not null,
  "DAS" text not null,
  created_at timestamptz not null default now()
);
create index if not exists das_mei_user_id_idx on public."DAS_mei"(user_id);
create index if not exists das_mei_periodo_apuracao_idx on public."DAS_mei"(periodo_apuracao);
alter table public."DAS_mei" enable row level security;
create policy "das_mei_select_own"
on public."DAS_mei"
for select
using (user_id = auth.uid());
create policy "das_mei_insert_own"
on public."DAS_mei"
for insert
with check (user_id = auth.uid());
create policy "das_mei_update_own"
on public."DAS_mei"
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
