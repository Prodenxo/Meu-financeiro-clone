# Brief: melhorias **NF-e / NFC-e** após cobertura de testes automatizados

**Data:** 2026-04-07  
**Origem:** validação técnica (testes unitários e de integração cliente/servidor) + lacunas E2E documentadas  
**Produto:** Meu Financeiro — Guia MEI / `mei-notas` / integração Plugnotas  

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` — requisitos rastreáveis Guia MEI (NF-e / NFC-e).  
- `docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md` — pedido original (seletor, formulário contextual).  
- `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` — contratos HTTP, riscos de cadastro empresa, limite MEI.  
- `docs/stories/story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` — critérios de aceite (incl. itens a fechar).  
- `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md` — agregado de limite (NFSE-only no servidor).

**Próximos passos típicos:** `@pm` — priorizar melhorias e eventual PRD delta; `@architect` — smoke técnico e contratos Plugnotas; `@qa` — roteiro E2E manual ou automatizado sandbox; `@sm` — fatiar stories com file list e gates.

---

## 1. Resumo executivo

Os testes automatizados **comprovam** o contrato de software: chamadas HTTP aos endpoints Plugnotas (`POST /nfe`, `POST /nfce`), validação de payload no `mei-notas.service.js`, coerência de modelo **55/65**, e comportamento da UI (serviço cliente, Guia MEI com seletor/filtros, bloqueio quando `nfe`/`nfce` está inativo na empresa). **Não comprovam** autorização real na SEFAZ, mensagens de homologação/produção nem alinhamento do cadastro da empresa no Plugnotas com a necessidade fiscal do utilizador.

Este brief consolida **cinco linhas de melhoria** para fechar a lacuna entre “código testado” e “produto confiável em ambiente real”, sem duplicar o PRD de emissão — foca no **pós-QA automatizado** e na **decisão de produto** onde ainda há ambiguidade.

---

## 2. Contexto: o que os testes já cobrem

| Camada | Evidência |
|--------|-----------|
| **Plugnotas (NF-e / NFC-e)** | `backend/tests/plugnotas-nfe.test.js`, `plugnotas-nfce.test.js` — URL, método, corpo, cancelamento, relatório NF-e, agregação de erros 400. |
| **Domínio mei-notas** | `backend/tests/mei-notas-core.test.js` — `documentType`, `validateNfeLikePayload`, modelo vs tipo, rejeições esperadas. |
| **Frontend** | `meiNotasService.test.ts`, `GuidesMei.permissions.test.tsx`, `plugnotasEmpresaCapabilities.test.ts` — contrato API, fluxos de emissão e capacidades `nfe`/`nfce`. |

**Limitação explícita:** ausência de teste E2E com **API Plugnotas real** (credenciais, certificado A1, CNPJ e empresa com modalidades ativas).

---

## 3. Problema / oportunidade (por melhoria)

| ID | Lacuna | Risco ou impacto | Oportunidade |
|----|--------|-------------------|--------------|
| **M1 — Smoke E2E** | Cobertura para no mock/fetch simulado e validação local. | Regressão fiscal só descoberta em produção ou homologação manual ad hoc. | Documentar (ou automatizar) um fluxo mínimo **sandbox** com payload válido, certificado e empresa com NFE/NFCE ativos; validar mensagens SEFAZ e PDF/XML. |
| **M2 — Cadastro empresa Plugnotas** | Setup MEI pode manter `nfe`/`nfce` **inativos** por desenho (“apenas NFS-e”). | Utilizador com testes verdes no CI mas **emissão bloqueada** ou rejeitada no provedor. | Evoluir **POST/PATCH** de empresa (ou fluxo dedicado) para **habilitação explícita** NF-e/NFC-e quando o produto exigir, com pré-requisitos claros (CSC, IE, ambiente, etc. — validar com conteúdo fiscal). |
| **M3 — Story / aceite** | `story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md` pode ter checkboxes desatualizados face a `GuidesMei.tsx` e testes. | Planeamento e “done” desalinhados da realidade do código. | Rever critérios, marcar o já entregue, escopar **P1** (ex.: “último tipo” em `localStorage`) com owner. |
| **M4 — Limite MEI** | `agregarLimiteFaturamento` considera essencialmente **NFSE** (e nulos); NF-e/NFC-e fora do somatório. | Utilizador assume que “todas as notas” contam para o teto MEI; risco de interpretação errada na UI. | Decisão de produto explícita: **manter** (com copy clara) ou **estender** o limite a NFE/NFCE (implica PRD + alteração de regra e testes). |
| **M5 — Observabilidade na UI** | Logs de 400 no backend são úteis para engenharia. | Utilizador vê mensagem genérica ou incompleta vs detalhe técnico no servidor. | Garantir **paridade de mensagem útil** na UI (erros Plugnotas agregados), com **redação** e **mascaramento** de PII/segredos. |

---

## 4. Objetivos deste brief (entregáveis sugeridos)

1. **Runbook ou checklist** de smoke E2E (sandbox): pré-condições, passos, resultado esperado, onde registar evidência (ticket/ADR leve).  
2. **Decisão registada** sobre cadastro empresa: manter comportamento atual vs roadmap para ativar NFE/NFCE no Plugnotas a partir do produto.  
3. **Story atualizada** ou nota de reconciliação: o que já está coberto por código/testes vs o que falta (incl. P1 localStorage se aplicável).  
4. **Uma linha de decisão** sobre limite MEI e NFE/NFCE (referência cruzada ao PRD/ADR de limite).  
5. **Critério de UX** para erros de emissão: utilizador consegue **agir** (corrigir campo, contactar suporte) sem ver stack trace nem dados sensíveis.

---

## 5. Fora de âmbito (sugerido; validar com PO)

- Troca de integrador fiscal ou implementação direta com SEFAZ.  
- Consultoria tributária ou definição de CFOP/CST por segmento (permanece responsabilidade do utilizador + contador).  
- Refator grande de `mei_nfse` (nome de tabela) salvo story própria.  
- CTe na mesma jornada (só se requisito explícito futuro).

---

## 6. Critérios de sucesso (definição de “pronto” para este pacote de melhorias)

| Critério | Medição |
|----------|---------|
| Smoke documentado | Existe documento em `docs/runbook/` ou secção no `docs/operacao-mei-nfse.md` com passos reproduzíveis. |
| Risco empresa Plugnotas | ADR ou nota no PRD/PROJECT_MEMORY com “como habilitar NFE/NFCE” ou “bloqueio intencional até X”. |
| Story alinhada | Checklist da story P0 reflete testes e código; itens em aberto têm ID ou story filha. |
| Limite MEI | UI e/ou help text explicam se NF-e/NFC-e entram ou não no agregado (ou decisão futura explícita). |
| Erros na UI | Pelo menos um teste (ou revisão QA) confirma mensagem útil para 400 Plugnotas típico em NF-e e NFC-e. |

---

## 7. Dependências e riscos

- **Dependência:** credenciais e projeto Plugnotas (sandbox) disponíveis para quem executar o smoke — não versionar secrets.  
- **Risco:** sandbox ≠ produção; mensagens SEFAZ podem diferir por UF.  
- **Risco:** alterar limite MEI sem assessoria de produto/regulamentar pode induzir utilizadores a decisões fiscais incorretas.

---

## 8. Referências de código (auditoria rápida)

| Tema | Local principal |
|------|-----------------|
| Emissão unificada | `backend/src/services/mei-notas.service.js` — `emitirNota`, `validateNfeLikePayload` |
| Plugnotas NF-e / NFC-e | `backend/src/services/plugnotas/nfe.service.js`, `nfce.service.js` |
| Capacidades empresa | `frontend/src/utils/plugnotasEmpresaCapabilities.ts` |
| UI Guia MEI | `frontend/src/pages/GuidesMei.tsx` |
| Testes citados | `backend/tests/plugnotas-nfe.test.js`, `plugnotas-nfce.test.js`, `mei-notas-core.test.js`; `frontend/src/services/meiNotasService.test.ts`, `GuidesMei.permissions.test.tsx` |

---

*Brief preparado no papel Atlas (análise / descoberta brownfield). Não substitui PRD nem decisão arquitetural formal.*
