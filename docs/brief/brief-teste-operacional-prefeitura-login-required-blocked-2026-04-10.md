# Brief: teste operacional do erro `prefeitura_login_required_blocked` no cadastro de empresa PlugNotas

**Data:** 2026-04-10  
**Origem:** incidente em execução local com `POST /api/mei-notas/setup/emissao-fiscal/empresa` retornando HTTP 400 e `errors.plugnotasCode = prefeitura_login_required_blocked`.  
**Produto:** Meu Financeiro — Guia MEI / setup de emissão fiscal.

**Referências internas:**

- [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)
- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)
- [`backend/src/services/plugnotas/prefeituraPortalCredentials.js`](../../backend/src/services/plugnotas/prefeituraPortalCredentials.js)
- [`backend/src/services/plugnotas/empresa.service.js`](../../backend/src/services/plugnotas/empresa.service.js)
- [`backend/tests/plugnotas-empresa.test.js`](../../backend/tests/plugnotas-empresa.test.js)
- [`backend/tests/mei-notas-empresa-http.test.js`](../../backend/tests/mei-notas-empresa-http.test.js)

---

## 1. Resumo executivo

O erro recebido no frontend não indica falha do `apiClient`.  
Ele representa a política atual do fluxo nacional-first: quando o emissor exigir `prefeitura.login`/`senha`, o backend classifica e devolve `prefeitura_login_required_blocked` com HTTP 400.

Este brief define um teste operacional para:

1. confirmar que o comportamento observado é consistente com contrato atual;
2. separar regressão técnica de limitação operacional do emissor/município;
3. padronizar evidência para suporte, QA e decisão de produto.

---

## 2. Sintoma alvo do teste

| Campo | Valor esperado no incidente |
|---|---|
| Rota BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` |
| HTTP | `400` |
| Código | `errors.plugnotasCode = prefeitura_login_required_blocked` |
| Mensagem | fluxo nacional padrão + caso tratado fora do percurso atual |
| Metadados | `errors.plugnotasRequest`, `errors.httpStatus` |

---

## 3. Objetivo do teste

Validar, com evidência mínima e redigida, se o cenário atual é:

1. **Comportamento esperado da política vigente** (não suportado no fluxo nacional); ou
2. **Regressão técnica** de classificação, rota, ambiente ou payload.

---

## 4. Pré-condições

1. Backend local ativo.
2. Frontend local ativo.
3. `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` no mesmo ambiente.
4. `PLUGNOTAS_DEBUG=true` para evidência redigida de request em falha 400 de cadastro.
5. Reinício do backend após alteração de `.env`.

Notas observadas no ambiente local no momento deste brief:

- `PLUGNOTAS_API_BASE_URL=https://api.plugnotas.com.br`
- `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`

---

## 5. Roteiro de execução

1. Executar o cadastro da empresa pela Guia MEI com dados do cenário que reproduz o incidente.
2. Capturar a resposta JSON da chamada `POST /setup/emissao-fiscal/empresa` (Network/Response).
3. Capturar no backend o log redigido do payload 400 (`[plugnotas empresa cadastro] ... 400 request payload (redacted)`).
4. Registrar apenas campos diagnósticos:
   - `message`
   - `errors.plugnotasCode`
   - `errors.plugnotasRequest.method`
   - `errors.plugnotasRequest.path`
   - `errors.httpStatus`
5. Executar `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` e registrar se houver `empresa_nao_cadastrada` como consequência.
6. Aplicar classificação final usando a matriz ROB/NATEX do runbook.

---

## 6. Resultado esperado por cenário

| Cenário | Resultado esperado |
|---|---|
| Emissor exige `prefeitura.login`/`senha` | `400` + `prefeitura_login_required_blocked`; classificar como `não suportado no fluxo nacional` |
| Erro de ambiente (token/base/prefixo) | `ambiente_configuracao` (ou gateway code) |
| Rejeição de dados/contrato | `payload_contrato` |
| `GET` negativo após `POST` falho | tratar como consequência; não substituir causa raiz do `POST` |

---

## 7. Critérios de aceite do teste

1. Evidência redigida anexada sem segredos.
2. Classificação final escolhida sem ambiguidade (ROB/NATEX).
3. Cadeia causal preservada: `POST` falho -> `GET` negativo (quando aplicável).
4. Conclusão explícita:
   - `esperado pela política vigente`, ou
   - `regressão técnica a corrigir`.

---

## 8. Evidências mínimas a anexar

1. Screenshot/JSON redigido da resposta HTTP 400 no frontend.
2. Trecho de log redigido do backend para o mesmo evento.
3. Registro de ambiente (host base e data; sem chave/token).
4. Resultado da consulta `GET` posterior, quando executada.

---

## 9. Riscos e decisões

### Riscos

- interpretar o caso como “endpoint errado” sem validar `plugnotasCode`;
- confundir erro municipal bloqueado com erro de ambiente;
- perder causalidade ao analisar apenas o `GET`.

### Decisão operacional atual

- Se `plugnotasCode = prefeitura_login_required_blocked`, manter classificação: **não suportado no fluxo nacional**.
- Encaminhar via runbook/suporte do emissor, sem abrir ação para coletar `login`/`senha` no produto neste fluxo.

---

## 10. Próximos passos sugeridos

1. Executar este teste em homologação e produção controlada (com evidência redigida).
2. Consolidar os resultados em ticket único de operação/QA.
3. Se necessário, abrir decisão de produto separada para eventual suporte municipal fora do fluxo nacional atual.

---

## Change log

| Data | Nota |
|---|---|
| 2026-04-10 | Versão inicial do brief de teste operacional para `prefeitura_login_required_blocked`. |

