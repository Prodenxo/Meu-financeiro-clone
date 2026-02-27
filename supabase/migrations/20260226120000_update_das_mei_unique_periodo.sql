alter table public."DAS_mei"
  drop constraint if exists "DAS_mei_DAS_key";

alter table public."DAS_mei"
  add constraint das_mei_user_id_periodo_apuracao_key
  unique (user_id, periodo_apuracao);
