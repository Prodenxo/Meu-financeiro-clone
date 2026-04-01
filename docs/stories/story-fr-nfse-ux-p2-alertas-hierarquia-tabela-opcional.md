# Story — FR-NFSE-UX (P2): Workspace NFS-e — hierarquia de alertas e tabela desktop (opcional)

**ID:** STORY-FR-NFSE-UX-P2  
**Prioridade:** P2 (Could — PRD onda 3)  
**Depende de:** [story-fr-nfse-ux-p1-formulario-acoes-filtros-a11y.md](./story-fr-nfse-ux-p1-formulario-acoes-filtros-a11y.md) (recomendado — alertas coexistem com formulário/lista já reestruturados)  
**Fonte:** `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md` (FR-NFSE-UX-06; fase 2 vista tabela)  
**Especificação UX:** `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` §7, §8.4

## User story

**Como** utilizador que emite NFS-e e lê vários avisos ao mesmo tempo,  
**quero** que mensagens de bloqueio, validação, erro do provedor e sucesso apareçam numa ordem de prioridade clara,  
**para** saber primeiro o que me impede de avançar e depois o detalhe.

**Como** utilizador com muitas notas em desktop,  
**quero** opcionalmente uma vista em tabela (além dos cartões),  
**para** comparar linhas mais rapidamente — mantendo em mobile apenas a vista em cartão.

## Contexto técnico

- **FR-NFSE-UX-06:** Ordem de renderização na zona de emissão (abaixo do formulário / feedback): (1) bloqueio crítico emitente/certificado, (2) validação cliente `nfseValidationMessage`, (3) erro emissão/provedor, (4) sucesso. Lista (zona C) mantém mensagens próprias autónomas (spec §7).
- **§8.4 spec (opcional):** Tabela só `lg:` com colunas sugeridas (ID/integração, data, status, ações); mobile **só** cartão; paridade de ações com P1.

## Critérios de aceite

- [x] **FR-NFSE-UX-06:** Ordem de alertas na pilha de emissão conforme spec §7; cenário manual documentado no Dev Agent Record (múltiplas mensagens simuladas ou estados reais).
- [x] **Opcional (marcar no PR se deferido):** Vista tabela desktop spec §8.4 com mesmas operações que cartão.
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Novas APIs, exportações em lote, novos tipos de documento.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`
- [x] `frontend/src/components/MeiNfseListRowActions.tsx` (ações partilhadas cartão + tabela; sem ficheiro `MeiNfseListTable` separado)
- [x] Tabela usa classes `admin-table*` já no projeto (`index.css` não foi alterado)

## Definition of Done

- QA: validar ordem visual com combinação validação + erro de API (ambiente de teste ou mock).  
- Se tabela entregue: verificar responsividade (oculta `< lg`).

## Qualidade / CodeRabbit

- Tabela não deve duplicar lógica de negócio — reutilizar handlers existentes da lista em cartão.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor / Composer (implementação assistida)

### Completion Notes List

- **FR-NFSE-UX-06:** Região `#mei-nfse-emit-feedback` com ordem: (1) bloqueios críticos emitente/certificado/conectividade (`nfseEmitFeedbackTier1`), (2) validação cliente (`data-nfse-feedback-tier="validation"`), (3) erro emissão, (4) erro provedor, (5) sucesso (`data-nfse-feedback-tier="success"`). **Mitigação QA:** `provider-error` na pilha B já não exige `nfseList.length > 0`; lista vazia com falha em `listarNfse` mostra o alerta em B. Na zona C (empty state), texto orientativo + «Tentar novamente» evita duplicar o mesmo `FiscalProviderErrorAlert` que B.
- **Testes §7:** `GuidesMei.nfse-feedback-stack.test.tsx` — `provider-error` com lista vazia; ordem `critical` → `validation` → `provider-error` na pilha.
- **§8.4:** Lista NFS-e: `lg:hidden` mantém cartões; `hidden lg:block` tabela `admin-table` (ID/integração, data, status, ações). Ações via `MeiNfseListRowActions` com `layout="card" | "table"`. Menu «Mais ações» usa chave `layout:id` no estado para evitar duplicados no DOM (foco/a11y).
- Gates: `npm run lint` (avisos pré-existentes noutros ficheiros), `npm run typecheck` e `npm test` OK.

### File List (implementação)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/components/MeiNfseListRowActions.tsx`
- `frontend/src/pages/GuidesMei.permissions.test.tsx` (seletores `#nfse-more-actions-card-*`)
- `frontend/src/pages/GuidesMei.nfse-feedback-stack.test.tsx` (pilha §7 / QA)

### Debug Log References

—

### Change Log

- 2026-04-01 — P2: pilha de alertas emissão §7; vista tabela desktop §8.4; `menuKey` `layout:id` para menu por linha; testes de permissões atualizados.
- 2026-04-01 — Pós-QA: `provider-error` sem condição de tamanho da lista; empty state C sem alerta duplicado; `GuidesMei.nfse-feedback-stack.test.tsx`.

---

## QA Results

### Revisão QA — 2026-04-01 (Quinn)

**Decisão de gate:** **PASS com observações (CONCERNS)** — critérios de aceite da story satisfeitos no código e alinhamento forte com `ux-spec-mei-nfse-workspace-2026-04-01.md` §7 e §8.4; recomenda-se confirmação manual da pilha de alertas e smoke em viewport `lg` antes do merge, conforme DoD da story.

---

#### Rastreabilidade (Given–When–Then resumido)

| Requisito | Evidência |
|-----------|-----------|
| **FR-NFSE-UX-06** — ordem da pilha abaixo de Emitir | `GuidesMei.tsx`: região `#mei-nfse-emit-feedback` (`role="region"`) com sequência DOM: `nfseEmitFeedbackTier1` → `data-nfse-feedback-tier="validation"` → `emission-error` → `provider-error` → `success`. Tier1 agrega bloqueios certificado/emitente/conectividade (`data-nfse-feedback-tier="critical"`). |
| **§7 spec** — (1) bloqueio (2) validação (3) erro servidor/provedor (4) sucesso | Implementação faz (3) em **dois** blocos consecutivos (`EmissaoFiscalErrorAlert` vs `FiscalProviderErrorAlert`), coerente com “ou” da spec; ordem relativa emissão → provedor é sensata. |
| **§8.4** — tabela só `lg`, colunas, paridade de ações | Lista: contentor cartões `lg:hidden`; tabela `hidden lg:block` com colunas ID/integração, data, status, ações; `MeiNfseListRowActions` com `layout` `card` ou `table` e mesmos handlers. |
| **Sem duplicar lógica de negócio** | Ações centralizadas em `MeiNfseListRowActions.tsx`. |
| **A11y / foco com duas vistas no DOM** | Estado do menu `moreMenuOpenId` usa chave `layout:id`; `data-nfse-more-menu-root` e `id` do menu incluem `layout`; testes em `GuidesMei.permissions.test.tsx` atualizados para `#nfse-more-actions-card-*`. |

---

#### Testes e automação

- **Coberto:** regressão P1/P2 nas permissões NFS-e (menu, teclado, estados desativados).
- **Lacuna (observação):** não há teste automatizado que asserte a **ordem** dos nós com `data-nfse-feedback-tier` na pilha de emissão; a verificação §7 no DoD continua dependente de **teste manual** ou futuro teste de integração/React Testing Library.

---

#### Observações (CONCERNS)

1. **`provider-error` condicionado a `nfseList.length > 0`:** se existir cenário de erro de operação/provedor com lista ainda vazia ou não carregada, o `FiscalProviderErrorAlert` não aparece na pilha B. Validar com produto se é intencional.
2. **Sobreposição de mensagens** entre secção “Antes de emitir” (A) e tier1 na pilha (B) foi aceite no Dev Record; QA considera aceitável para cumprir §7 na zona de emissão, desde que copy não contradiga de forma crítica.
3. **Lint:** story regista avisos ESLint pré-existentes noutros ficheiros; gate de aceite “lint verde” interpretado como **sem erros novos bloqueantes** no âmbito desta alteração.

---

#### Verificação de ferramentas (esta revisão)

- `npm run typecheck` à raiz: **OK** (2026-04-01).

---

**Próximos passos sugeridos:** smoke manual em `/mei` (ou rota equivalente) — separador NFS-e, largura ≥1024px: confirmar tabela visível e cartão oculto; &lt;1024px: o inverso; combinar validação + erro de emissão e confirmar ordem visual da pilha. Opcional: teste RTL que leia `children` ou ordem de `data-nfse-feedback-tier` em `#mei-nfse-emit-feedback`.

— Quinn, guardião da qualidade 🛡️
