# Especificação de front-end e UX — teste operacional `prefeitura_login_required_blocked`

**Versão:** 1.0  
**Data:** 2026-04-10  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../prd/PRD-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md) (**FR-TOP-01** a **FR-TOP-08**, **NFR-TOP-01** a **NFR-TOP-04**, **DP-TOP-01** a **DP-TOP-03**)  
**Brief base:** [`docs/brief/brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md`](../brief/brief-teste-operacional-prefeitura-login-required-blocked-2026-04-10.md)

**Relação com specs existentes (não substituição):**

| Artefato | Papel |
|---|---|
| [`ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md`](./ux-spec-nfse-nacional-padrao-bloqueio-excecao-credenciais-prefeitura-plugnotas-2026-04-10.md) | Política UX do fluxo nacional-first e bloqueio da exceção |
| [`ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](./ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) | Heurísticas e narrativa da exceção por mensagem/código |
| [`ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](./ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | Causalidade operacional `POST` -> `GET` para triagem |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Matriz ROB/NATEX e decisão operacional final |

---

## 1. Objetivo deste documento

Definir a camada de UX do **teste operacional** para o incidente:

- `POST /api/mei-notas/setup/emissao-fiscal/empresa` retorna `HTTP 400`;
- `errors.plugnotasCode = prefeitura_login_required_blocked`.

Esta spec não cria feature nova de formulário. Ela padroniza:

1. o que observar na interface;
2. como registrar evidência mínima redigida;
3. como preservar causalidade entre erro de cadastro e consulta posterior.

---

## 2. Escopo UX

### 2.1 Dentro do escopo

- validação visual e textual do erro principal no frontend;
- validação dos metadados mostrados/propagados para diagnóstico;
- alinhamento de linguagem com runbook;
- critérios de aceite UX para execução do teste.

### 2.2 Fora do escopo

- novo fluxo de credenciais municipais;
- redesign da tela da Guia MEI;
- alteração de política de produto para suportar `login`/`senha`;
- mudança de backend além do comportamento já vigente.

---

## 3. Princípios de UX para o teste

| Princípio | Aplicação |
|---|---|
| **Erro certo, narrativa certa** | `prefeitura_login_required_blocked` não deve aparecer como “endpoint errado”. |
| **Causa antes de consequência** | `POST` falho é causa raiz; `GET` negativo posterior é consequência. |
| **Sem pedido de credenciais** | A UI não deve induzir o utilizador a informar login/senha municipal neste fluxo. |
| **Evidência útil e redigida** | Captura deve focar campos diagnósticos mínimos, sem segredo. |
| **Consistência com runbook** | Classificação final deve convergir para ROB/NATEX. |

---

## 4. Superfícies e atores

| Persona | Superfície | Objetivo no teste |
|---|---|---|
| Utilizador MEI | Guia MEI (`GuidesMei`) | Ver erro com copy coerente e sem instrução indevida |
| Operação/QA | DevTools Network + runbook | Registrar evidência mínima e classificar cenário |
| Produto/PO | Resultado consolidado | Decidir próximos passos quando houver regressão |

---

## 5. Fluxo UX do teste operacional

### 5.1 Passo A — execução do cadastro

Ação:

- submeter cadastro da empresa pela Guia MEI.

Expectativa UX:

- em caso de incidente, interface apresenta erro principal coerente com exceção municipal bloqueada.

### 5.2 Passo B — captura de resposta da API

Ação:

- abrir DevTools > Network > request do `POST /setup/emissao-fiscal/empresa`;
- registrar resposta JSON.

Evidência mínima (FR-TOP-04):

- `message`
- `errors.plugnotasCode`
- `errors.plugnotasRequest.method`
- `errors.plugnotasRequest.path`
- `errors.httpStatus`

### 5.3 Passo C — validação de causalidade com consulta

Ação:

- executar consulta `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` após falha do `POST` (quando aplicável).

Expectativa UX:

- se houver ausência de empresa, interpretação deve permanecer como consequência de cadastro não concluído, não causa raiz isolada.

### 5.4 Passo D — classificação final

Ação:

- classificar cenário via matriz ROB/NATEX no runbook.

Resultado esperado:

- com `plugnotasCode = prefeitura_login_required_blocked`, classificação final operacional é `não suportado no fluxo nacional`.

---

## 6. Regras de copy para validação

### 6.1 Deve aparecer

- linguagem de limite/compatibilidade do fluxo nacional;
- referência a impossibilidade de concluir cadastro naquele contexto;
- próximo passo operacional (guia/suporte) quando disponível.

### 6.2 Não deve aparecer

- “endpoint errado”;
- instrução para preencher `login`/`senha` na interface;
- culpa direta ao utilizador por campo inexistente no fluxo.

---

## 7. Estados UX esperados no teste

| Estado | Expectativa |
|---|---|
| `POST` sucesso | Fluxo segue normalmente, sem cenário de bloqueio |
| `POST` 400 + `prefeitura_login_required_blocked` | Alerta principal de exceção bloqueada, sem coleta de credenciais |
| `GET` posterior sem empresa | Mantém causalidade de falha anterior no cadastro |
| Erro de ambiente/payload diferente | Narrativa correspondente, sem misturar com exceção municipal |

---

## 8. Acessibilidade e privacidade

- manter padrão de alerta principal acessível (`role="alert"` ou equivalente atual);
- evitar duplicação de alertas com conteúdo idêntico;
- evidência registrada deve remover segredo/PII sensível;
- screenshots para ticket devem ocultar dados sensíveis quando necessário.

---

## 9. Critérios de aceite UX (QA)

- [ ] O cenário de erro é identificado na UI sem narrativa de endpoint errado.
- [ ] A captura da resposta inclui todos os campos diagnósticos mínimos (FR-TOP-04).
- [ ] Não há instrução de preencher credenciais municipais no frontend.
- [ ] `GET` negativo posterior é interpretado como consequência do `POST` falho.
- [ ] A classificação final do cenário converge com ROB/NATEX.
- [ ] Evidências anexadas estão redigidas e sem segredo (NFR-TOP-01).

---

## 10. Arquivos de referência para implementação/validação

| Arquivo | Papel provável |
|---|---|
| `frontend/src/pages/GuidesMei.tsx` | Superfície principal de erro e fluxo de cadastro |
| `frontend/src/lib/fiscalUserError.ts` | Mapeamento de copy por `plugnotasCode` |
| `frontend/src/utils/apiClientError.ts` | Propagação de `plugnotasCode` e `httpStatus` |
| `docs/operacao-mei-nfse.md` | Fonte de classificação operacional final |

---

## 11. Change log

| Versão | Data | Nota |
|---|---|---|
| 1.0 | 2026-04-10 | Spec inicial derivada do PRD de teste operacional `prefeitura_login_required_blocked`. |

