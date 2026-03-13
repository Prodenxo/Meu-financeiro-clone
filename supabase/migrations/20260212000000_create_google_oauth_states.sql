-- ============================================================================
-- Migração: Criar tabela para estados OAuth do Google
-- ============================================================================
-- Armazena o state temporário gerado no fluxo OAuth para validar callbacks.
-- A tabela é acessada apenas pela Edge Function usando service role.
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_user_id ON google_oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_expires_at ON google_oauth_states(expires_at);
ALTER TABLE google_oauth_states ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy: apenas service role deve acessar a tabela.;
