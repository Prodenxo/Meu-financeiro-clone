-- Tabela para persistir PDFs de parcelamento (MEI/Simples Nacional) em base64.
-- O backend usa SUPABASE_SERVICE_ROLE_KEY e faz upsert por (user_id, numero_parcelamento).
create table if not exists public.parcelamento_pdfs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contribuinte_numero text not null,
  numero_parcelamento text not null,
  modalidade text,
  pdf_base64 text not null,
  created_at timestamptz not null default now(),
  constraint parcelamento_pdfs_user_numero_key unique (user_id, numero_parcelamento)
);

create index if not exists parcelamento_pdfs_user_id_idx on public.parcelamento_pdfs(user_id);
create index if not exists parcelamento_pdfs_user_numero_idx on public.parcelamento_pdfs(user_id, numero_parcelamento);

alter table public.parcelamento_pdfs enable row level security;

-- Policies idempotentes: remover antes de criar para permitir reaplicar a migration
drop policy if exists "parcelamento_pdfs_select_own" on public.parcelamento_pdfs;
create policy "parcelamento_pdfs_select_own"
  on public.parcelamento_pdfs
  for select
  using (user_id = auth.uid());

drop policy if exists "parcelamento_pdfs_insert_own" on public.parcelamento_pdfs;
create policy "parcelamento_pdfs_insert_own"
  on public.parcelamento_pdfs
  for insert
  with check (user_id = auth.uid());

drop policy if exists "parcelamento_pdfs_update_own" on public.parcelamento_pdfs;
create policy "parcelamento_pdfs_update_own"
  on public.parcelamento_pdfs
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
