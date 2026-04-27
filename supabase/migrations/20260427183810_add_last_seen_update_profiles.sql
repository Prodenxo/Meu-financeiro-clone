alter table profiles
  add column if not exists last_seen_update_id text default null;
