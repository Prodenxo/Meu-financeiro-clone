-- Migration (one-time): Permitir 'saída' (com acento) além de 'saida' (sem acento)
-- Data: 2026-01-15
-- Objetivo: Ajustar CHECK constraints para aceitar 'entrada', 'saida' e 'saída'
-- Observação: Não normaliza valores existentes. Apenas permite ambos formatos.

-- 1) lancamentos_id
ALTER TABLE lancamentos_id
DROP CONSTRAINT IF EXISTS lancamentos_id_tipo_check;

ALTER TABLE lancamentos_id
ADD CONSTRAINT lancamentos_id_tipo_check
CHECK (tipo IN ('entrada', 'saida', 'saída'));

-- 2) categorias_id
ALTER TABLE categorias_id
DROP CONSTRAINT IF EXISTS categorias_id_tipo_check;

ALTER TABLE categorias_id
ADD CONSTRAINT categorias_id_tipo_check
CHECK (tipo IN ('entrada', 'saida', 'saída'));

-- 3) assinaturas_id (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assinaturas_id') THEN
    ALTER TABLE assinaturas_id
    DROP CONSTRAINT IF EXISTS assinaturas_id_tipo_check;

    ALTER TABLE assinaturas_id
    ADD CONSTRAINT assinaturas_id_tipo_check
    CHECK (tipo IN ('saida', 'saída'));
  END IF;
END $$;

