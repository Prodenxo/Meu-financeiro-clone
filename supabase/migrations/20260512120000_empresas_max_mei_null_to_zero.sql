-- Normaliza legado: max_mei NULL era tratado como "ilimitado" na API, mas no produto
-- passa a significar o mesmo que módulo MEI desligado (0). Evita empresas aparecerem
-- como "MEI ativo" só por terem NULL. Novo "ilimitado com módulo ligado" continua a ser
-- gravado como NULL a partir do app após activar o toggle e deixar o teto vazio/0.
UPDATE public.empresas
SET max_mei = 0
WHERE max_mei IS NULL;
