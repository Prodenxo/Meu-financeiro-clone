-- FR-CAD-DOC P1 (pós-QA): RLS em user_mei_certificates — só a própria linha (user_id = auth.uid()).
-- O backend usa service role e continua a contornar RLS; anon não tem políticas ⇒ sem acesso direto.
-- Alinhado a mei_nfse_clientes / DAS_mei (force RLS + auth.uid()).

do $$
begin
  if to_regclass('public.user_mei_certificates') is null then
    raise notice 'user_mei_certificates ausente — ignorar RLS nesta migração';
    return;
  end if;

  execute 'alter table public.user_mei_certificates enable row level security';
  execute 'alter table public.user_mei_certificates force row level security';

  execute $pol$
    drop policy if exists "user_mei_certificates_select_own" on public.user_mei_certificates;
    create policy "user_mei_certificates_select_own"
    on public.user_mei_certificates
    for select
    using ((select auth.uid()) = user_id);
  $pol$;

  execute $pol$
    drop policy if exists "user_mei_certificates_insert_own" on public.user_mei_certificates;
    create policy "user_mei_certificates_insert_own"
    on public.user_mei_certificates
    for insert
    with check ((select auth.uid()) = user_id);
  $pol$;

  execute $pol$
    drop policy if exists "user_mei_certificates_update_own" on public.user_mei_certificates;
    create policy "user_mei_certificates_update_own"
    on public.user_mei_certificates
    for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  $pol$;

  execute $pol$
    drop policy if exists "user_mei_certificates_delete_own" on public.user_mei_certificates;
    create policy "user_mei_certificates_delete_own"
    on public.user_mei_certificates
    for delete
    using ((select auth.uid()) = user_id);
  $pol$;
end $$;
