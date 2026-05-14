-- Normaliza legado: max_usuarios_nao_mei = 0 era exibido como "ILIMITADO" no painel
-- (frontend tratava 0/null como ilimitado), mas o backend tratava 0 como limite zero
-- e bloqueava qualquer criação. Bug observado em produção: empresa com
-- max_usuarios_nao_mei=0 + 1 usuário cadastrado dispara "Limite de usuários não MEI
-- atingido" mesmo a UI mostrando "ILIMITADO".
--
-- Decisão: NULL é o único marcador canônico de "ilimitado" para esse campo.
-- 0 nunca foi um estado intencional aqui (diferente de max_mei, onde 0 = desligado),
-- então convertemos os 0s legados em NULL.
UPDATE public.empresas
SET max_usuarios_nao_mei = NULL
WHERE max_usuarios_nao_mei = 0;
