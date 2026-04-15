# Evidência TOP — prefeitura_login_required_blocked

- Data da execução: 2026-04-13
- Responsável: @dev (Dex)
- Story ID: STORY-FR-TOP-P1-FRONTEND-UX-VALIDACAO-ROTEIRO-TESTE-PREFEITURA-LOGIN-REQUIRED-BLOCKED-2026-04-10
- Ticket da ocorrência (ID/link): `INC-TOP-2026-04-13-PLOGIN-BLOCKED` (registro interno local; referência canónica na story)
- Ambiente (local/homologação/produção controlada): local (`frontend` + `backend`), backend em `http://localhost:3333`, com cenário reproduzido para `POST /api/mei-notas/setup/emissao-fiscal/empresa`
- Evidência manual da sessão UI/Network: incidente reportado em browser (console/network) na data da execução, com `POST /api/mei-notas/setup/emissao-fiscal/empresa` retornando `400` e `plugnotasCode = prefeitura_login_required_blocked`

## Passo B — POST /api/mei-notas/setup/emissao-fiscal/empresa (FR-TOP-04)
- message: "Este fluxo usa NFS-e Nacional como padrão e não aceita credenciais do portal da prefeitura. Quando o emissor exigir login municipal, o caso deve ser tratado fora deste percurso."
- errors.plugnotasCode: `prefeitura_login_required_blocked`
- errors.plugnotasRequest.method: `POST`
- errors.plugnotasRequest.path: `/empresa`
- errors.httpStatus: `400`

## Passo C — GET causal (quando aplicável)
- Endpoint consultado: `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=17***72` (consulta causal validada também por regressão de serviço em `GET /empresa/:cnpj`)
- Resultado: cenário negativo com `plugnotasCode = empresa_nao_cadastrada` após o `POST` falho
- Interpretação causal (consequência do POST falho): o `GET` negativo foi tratado como consequência de cadastro não concluído no emissor; a causa raiz permanece no `POST` com `prefeitura_login_required_blocked`

## Passo D — Classificação ROB/NATEX
- Classificação final: `não suportado no fluxo nacional`
- Decisão final: esperado pela política vigente

## Checklist de redaction
- [x] Sem token/certificado/credenciais em claro
- [x] Sem payload bruto sensível

## Referências de validação usadas nesta execução
- `backend/tests/mei-notas-empresa-http.test.js` (bloqueio HTTP 400 com `prefeitura_login_required_blocked` em `POST /api/mei-notas/setup/emissao-fiscal/empresa`)
- `backend/tests/plugnotas-empresa.test.js` (causalidade `POST` falho -> `GET` negativo com `empresa_nao_cadastrada`)
- `frontend/src/pages/GuidesMei.certificate-connectivity.test.tsx` (narrativa UX sem "rota errada", sem pedido de credenciais municipais, e preservação de causalidade)
