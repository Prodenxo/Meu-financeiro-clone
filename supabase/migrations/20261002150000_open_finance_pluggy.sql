-- Open Finance (Pluggy): conexões por usuário + índice único em contas importadas

CREATE TABLE IF NOT EXISTS public.open_finance_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pluggy',
  item_id TEXT NOT NULL,
  connector_id TEXT,
  status TEXT,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider, item_id)
);

CREATE INDEX IF NOT EXISTS idx_open_finance_connections_user
  ON public.open_finance_connections(user_id);

ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own open_finance_connections" ON public.open_finance_connections;
CREATE POLICY "Users manage own open_finance_connections" ON public.open_finance_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_financeiras_of_external
  ON public.contas_financeiras(user_id, of_provider, of_external_id)
  WHERE of_external_id IS NOT NULL;
