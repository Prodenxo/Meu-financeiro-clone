alter table public."DAS_mei"
  drop constraint if exists "DAS_mei_DAS_key";
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'das_mei_user_id_periodo_apuracao_key'
      and conrelid = 'public."DAS_mei"'::regclass
  ) then
    alter table public."DAS_mei"
      add constraint das_mei_user_id_periodo_apuracao_key
      unique (user_id, periodo_apuracao);
  end if;
end $$;
