-- US-INV-01 (pós-QA): alinhar `empresa_invites` ao padrão de endurecimento (ex.: DAS — force RLS).
-- Garante que o dono da tabela (table owner) também está sujeito às políticas quando aplicável.

alter table public.empresa_invites force row level security;
