# Operacao MEI/NFSe

## Objetivo
Registrar pre-condicoes, variaveis de ambiente e orientacoes basicas para operacao do fluxo MEI/NFSe.

## Pre-condicoes
1. Backend configurado com Supabase e credenciais da integracao externa.
2. Usuario autenticado para acessar endpoints protegidos de NFSe.
3. Frontend apontando para backend correto via `VITE_API_URL`.

## Variaveis de Ambiente Criticas (Backend)
- `PLUGNOTAS_API_BASE_URL`
- `PLUGNOTAS_API_KEY`
- `PLUGNOTAS_TIMEOUT_MS`
- `PLUGNOTAS_WEBHOOK_TOKEN`
- `MEI_API_BASE_URL`
- `MEI_API_TOKEN`
- `MEI_API_TIMEOUT_MS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Endpoints Relevantes

### Emissao e Gestao NFSe
- `POST /api/mei-notas/emitir`
- `GET /api/mei-notas`
- `GET /api/mei-notas/:id`
- `GET /api/mei-notas/:id/pdf`
- `GET /api/mei-notas/:id/xml`
- `POST /api/mei-notas/webhook`

### Fluxo Guia MEI
- `POST /api/mei-guide`
- `GET /api/mei-guide/:periodo/download`
- `POST /api/mei-guide/validate`

### DAS Mensal (Admin)
- `GET /api/admin/das/status`
- `GET /api/admin/das/pending`
- `POST /api/admin/das/reprocess`

## Troubleshooting Rapido

### 1) Webhook nao autorizado
- Verificar se `PLUGNOTAS_WEBHOOK_TOKEN` esta configurado no backend.
- Confirmar envio de token no header `x-webhook-token` (ou `x-api-key`) ou query `token`.

### 2) Erro na emissao de NFSe
- Validar CNPJ do prestador (14 digitos).
- Confirmar campos obrigatorios do servico (codigo, cnae, discriminacao, aliquota, valor).
- Verificar disponibilidade e credenciais da integracao PlugNotas.

### 3) PDF/XML indisponivel
- Confirmar se a nota ja foi concluida/autorizada.
- Atualizar status da nota via sincronizacao antes de novo download.

### 4) Falha de CORS/autenticacao
- Revisar `CORS_ORIGIN` no backend.
- Confirmar token de sessao no frontend e autorizacao nas chamadas API.

### 5) Job mensal DAS nao executou
- Verificar se `MEI_DAS_SCHEDULER_ENABLED` nao esta `false`.
- Confirmar horario local esperado: dia 1, a partir das 08:00 (`America/Sao_Paulo`).
- Verificar logs do backend com prefixo `[mei-das]`.

### 6) Cliente ficou com status erro no DAS
- Validar se o usuario possui `cert_document` com CNPJ valido (14 digitos).
- Validar disponibilidade da integracao Serpro no momento do processamento.
- Executar reprocessamento manual via `POST /api/admin/das/reprocess`.

## Fluxo Operacional Recomendado
1. Validar CNPJ e dados basicos do prestador.
2. Emitir NFSe.
3. Sincronizar status ate conclusao.
4. Baixar PDF/XML quando disponivel.
5. Em caso de erro recorrente, coletar logs e payload resumido para diagnostico.

## Operacao DAS Mensal (Runbook Curto)
1. No dia 1, monitorar resumo de execucao do job DAS no backend.
2. Validar `total`, `ok` e `erro` do lote e competencia processada.
3. Em caso de falha parcial, usar `POST /api/admin/das/reprocess` por usuario/competencia.
4. Conferir painel admin em `/dados-dos-usuarios` na secao de pendencias DAS.
5. Se necessario, abrir incidente com logs de `[mei-das]` e contexto de usuario/competencia.
