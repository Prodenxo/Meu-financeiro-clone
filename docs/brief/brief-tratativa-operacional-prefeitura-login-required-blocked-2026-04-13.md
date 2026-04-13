# Brief: tratativa operacional para `prefeitura_login_required_blocked` no setup fiscal MEI

**Data:** 2026-04-13  
**Origem:** incidente no cadastro fiscal da Guia MEI com `POST /api/mei-notas/setup/emissao-fiscal/empresa` retornando `HTTP 400` e `errors.plugnotasCode = prefeitura_login_required_blocked`.  
**Produto:** Meu Financeiro — Guia MEI (fluxo NFS-e Nacional por padrão).

**Referências internas:**

- [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — secção canónica TOP `2h` e matriz ROB/NATEX.
- [`docs/brief/brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](./brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md)
- [`docs/stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](../stories/story-fr-top-p1-operacao-qa-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md)
- [`docs/stories/story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md`](../stories/story-fr-top-p1-frontend-ux-validacao-roteiro-teste-prefeitura-login-required-blocked-2026-04-10.md)
- [`docs/qa/top-prefeitura-login-required-blocked-2026-04-10.md`](../qa/top-prefeitura-login-required-blocked-2026-04-10.md)

---

## 1. Resumo executivo

O erro observado **não** indica falha de endpoint no frontend nem bug genérico do `apiClient`.  
Ele representa uma resposta classificada pelo backend para um cenário em que o emissor exige login municipal (`prefeitura.login/senha`) fora do fluxo nacional atual.

**Recomendação objetiva no estado atual do produto:**

1. tratar como **comportamento esperado da política vigente**;
2. classificar como **`não suportado no fluxo nacional`**;
3. seguir a tratativa operacional (evidência redigida + ticket interno + runbook), sem abrir correção pontual no endpoint atual.

---

## 2. Sintoma consolidado

| Campo | Valor observado |
|---|---|
| Endpoint BFF | `POST /api/mei-notas/setup/emissao-fiscal/empresa` |
| HTTP | `400 Bad Request` |
| Código | `errors.plugnotasCode = prefeitura_login_required_blocked` |
| Método/path upstream | `plugnotasRequest.method = POST`, `plugnotasRequest.path = /empresa` |
| Mensagem | fluxo nacional padrão + caso tratado fora deste percurso |

---

## 3. Interpretação de negócio

O fluxo principal do produto continua sendo NFS-e Nacional.  
Quando o emissor exige credencial municipal para cadastro, o cenário sai do percurso suportado e deve ser tratado como exceção operacional, não como falha de rota.

Em termos práticos:

- **não** pedir `login`/`senha` municipal no fluxo atual da Guia MEI;
- **não** reclassificar como “endpoint errado”;
- **não** abrir correção técnica local sem evidência de regressão real.

---

## 4. Decisão recomendada (curto prazo)

1. **Operação/QA**
   - executar/registrar o roteiro TOP no runbook (`Passo A–D`);
   - anexar evidência redigida (`message`, `plugnotasCode`, `plugnotasRequest`, `httpStatus`);
   - preservar causalidade: `POST` falho -> `GET` negativo como consequência.

2. **Produto**
   - manter decisão atual: `prefeitura_login_required_blocked` = `não suportado no fluxo nacional`.

3. **Engenharia**
   - sem mudança de comportamento no endpoint atual enquanto a política de produto permanecer igual.

---

## 5. Quando escalar para nova iniciativa de produto

Abrir iniciativa nova (PRD dedicado) se houver pelo menos um destes gatilhos:

1. volume recorrente de ocorrências impactando operação/suporte;
2. necessidade comercial explícita de suportar municípios que exigem credencial;
3. decisão estratégica de ampliar cobertura para cenário municipal fora do fluxo nacional padrão.

Escopo dessa iniciativa (se aprovada): política de suporte, UX, segurança de credenciais e arquitetura específica.  
Não acoplar essa decisão ao fix operacional do endpoint atual.

---

## 6. Critérios de encerramento desta tratativa

- classificação final registrada como `não suportado no fluxo nacional`;
- ticket interno com evidência redigida e sem segredos;
- runbook/top story como fonte canónica de execução e decisão;
- ausência de abertura de bug técnico indevido para “erro de endpoint”.

---

## 7. Próximos passos sugeridos

1. consolidar este brief como referência de suporte/triagem para incidentes iguais;
2. manter monitoramento de recorrência em ticket interno;
3. se houver recorrência relevante, acionar `@pm` para PRD de expansão de suporte municipal.

---

## Change log

| Data | Nota |
|---|---|
| 2026-04-13 | Brief criado a partir do incidente real e da decisão operacional vigente para `prefeitura_login_required_blocked`. |
