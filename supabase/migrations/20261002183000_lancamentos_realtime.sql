-- Toast no site quando lançamento Open Finance é inserido (Supabase Realtime)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lancamentos_id'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos_id;
  END IF;
END $$;
