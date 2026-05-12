-- Agenda a materialização automática de recorrências no 1º dia de cada mês.
-- Requer a extensão pg_cron (habilitada por padrão no Supabase).

select cron.schedule(
  'recorrencias-materializar-mensal',   -- nome único do job
  '0 6 1 * *',                          -- 06:00 UTC no dia 1 de cada mês
  $$
    select net.http_post(
      url    := current_setting('app.supabase_url') || '/functions/v1/recorrencias-materializar',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body   := '{}'::jsonb
    );
  $$
);
