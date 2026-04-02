# Story — FR-NFSE-GCAT (P0): Atalhos NFS-e — gestão de catálogo visível e didática (botões + componente)

**ID:** STORY-FR-NFSE-GCAT-P0  
**Prioridade:** P0 (Must — PRD `PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` onda P0)  
**Depende de:** Nenhuma (brownfield; substitui padrão de links introduzido em [story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md](./story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md) §3.3)  
**Fonte:** `docs/prd/PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` (FR-NFSE-GCAT-01, 02, 04, 05; NFR-GCAT-01–04)  
**Especificação UX:** `docs/specs/ux-spec-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` (VAR-A recomendada; §4–6, §8–9)

## User story

**Como** utilizador MEI na emissão de NFS-e,  
**quero** ver ações claras para **gerir clientes** e **gerir serviços e produtos** junto aos atalhos, com uma linha que explique que o catálogo alimenta esses atalhos,  
**para** encontrar o cadastro sem confundir com links secundários pequenos e perceber a relação com os selects acima.

## Contexto técnico

- **Problema atual:** `frontend/src/pages/GuidesMei.tsx` usa `catalogoClientesLinkClass` (hiperligação `text-xs` azul sublinhada) e blocos repetidos `Link` / `<a href>` para `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos` (aprox. linhas 1772–1792, 1994–2012, 2774–2792 + dependências).
- **Solução:** Implementar **VAR-A** da spec UX — dois controlos **`planner-button-secondary`** (ou equivalente aprovado), ícones alinhados ao que já existir em `MeiCatalogoClientes` / `MeiCatalogoServicosProdutos` se possível, *hint* único: *“Cadastre ou edite itens para os atalhos acima.”* (`id` sugerido `mei-nfse-catalog-actions-hint`).
- **Molécula:** Novo componente em `frontend/src/components/` (nome canónico **`MeiNfseCatalogManageActions`** na spec) com prop **`inRouter: boolean`** — `true` → `Link`; `false` → `<a href>` (**FR-NFSE-GCAT-04**). Prop opcional **`variant`** reservada para VAR-B (não obrigatório nesta story se só entregar VAR-A).
- **Layout:** `flex flex-col gap-2 sm:flex-row sm:gap-3`; mobile `w-full` e área de toque confortável (≥ 44px alvo — spec §4.2).
- **Remover** usos duplicados de `catalogoClientesLinkClass` para estas duas rotas; **remover** a constante se deixar de ser usada (incluir dependência em `nfseWorkspaceGuidance` `useMemo` — hoje linhas ~1803–1810 — se a constante sair).
- **`nfseWorkspaceGuidance` (catálogo vazio):** o cabeçalho dinâmico inclui **também** pares `Link`/`<a>` com `catalogoClientesLinkClass` (~1766–1796). Decisão de implementação alinhada à spec: **(preferido)** manter só o **texto** longo no cabeçalho (*“Cadastre clientes e serviços…”*) e **retirar** os links inline daqui — os CTAs fortes ficam na secção “Antes de emitir” via `MeiNfseCatalogManageActions` — **ou** reutilizar uma **variante compacta** do mesmo componente no parágrafo, sem duplicar a frase longa. Documentar a escolha no PR de implementação.
- **Coordenação com cabeçalho:** não duplicar a frase longa do **FR-NFSE-UX-07** na zona de atalhos — *hint* §7.1 da spec basta no P0. Copy extra quando vazio → [story-fr-nfse-gcat-p1-hint-catalogo-vazio-coordenacao.md](./story-fr-nfse-gcat-p1-hint-catalogo-vazio-coordenacao.md) (P1).

## Critérios de aceite

- [x] **FR-NFSE-GCAT-01:** Na zona “Antes de emitir” (e em **todos** os sítios de `GuidesMei.tsx` que apontavam para estas rotas com o padrão antigo), as entradas de gestão têm **peso visual** e **área clicável** claramente superiores ao link `text-xs` anterior.
- [x] **FR-NFSE-GCAT-02:** Linha de apoio didática visível (texto canónico spec §7.1 ou alternativa aprovada por PO no PR) **uma vez** por instância do componente.
- [x] **FR-NFSE-GCAT-04:** Comportamento equivalente entre `Link` (router) e `<a href>` (fora do router); destinos inalterados.
- [x] **FR-NFSE-GCAT-05:** Um único componente (ou módulo) usado em todos os *call sites*; sem cópias divergentes de markup/estilo.
- [x] **NFR-GCAT-01:** Foco por teclado visível; ícones decorativos com `aria-hidden`; se rótulo curto em “Serviços e produtos”, `aria-label` completo conforme spec §9.
- [x] **NFR-GCAT-03:** `npm run lint`, `npm run typecheck`, `npm test` verdes nos pacotes tocados; `GuidesMei.permissions.test.tsx` / testes relacionados atualizados se asserções de DOM/texto quebrarem.

## Fora de escopo

- Alteração de URLs, guards ou APIs.  
- **FR-NFSE-GCAT-03** (copy condicional extra quando catálogo vazio) → story P1 dedicada.  
- VAR-B (chips) — só se PO fechar explicitamente em follow-up; o PRD prefere VAR-A.

## File list (checklist implementação)

- [x] `frontend/src/components/MeiNfseCatalogManageActions.tsx` (ou nome final alinhado à spec)
- [x] `frontend/src/pages/GuidesMei.tsx` — substituir blocos duplicados; remover `catalogoClientesLinkClass` se órfã
- [x] Testes: `frontend/src/components/MeiNfseCatalogManageActions.test.tsx`; `GuidesMei.permissions.test.tsx` sem alterações necessárias (asserções compatíveis)

## Definition of Done

- QA manual: workspace NFS-e, cliques nas duas ações, vista mobile (`w-full`), tab através dos botões.  
- Confirmar que a hierarquia visual do botão **Emitir NFS-e** e **Salvar dados do emitente** permanece mais forte que estas ações secundárias.

## Qualidade / CodeRabbit

- Evitar re-renders desnecessários: componente presentacional, props estáveis (**NFR-GCAT-02**).  
- Não introduzir tokens globais novos (**NFR-GCAT-04**).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação + follow-up QA)

### Completion Notes List

- Implementação FR-NFSE-GCAT: componente `MeiNfseCatalogManageActions`, integração em hero e “Antes de emitir”, `nfseWorkspaceGuidance` sem links inline quando catálogo vazio (texto remete aos botões na secção).
- Follow-up QA: adicionado `MeiNfseCatalogManageActions.test.tsx` (RTL: `inRouter` true/false, `showHint` false); checklists e Dev Agent Record atualizados.

### File List

- `frontend/src/components/MeiNfseCatalogManageActions.tsx`
- `frontend/src/components/MeiNfseCatalogManageActions.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Change Log

- 2026-04-02 — Story criada pelo SM (River) a partir do PRD + spec UX.
- 2026-04-02 — Implementação e gate de qualidade; teste RTL pós-QA.

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-02  
**Gate:** **PASS** (com observações menores)

### Rastreio aos critérios de aceite

| ID | Verificação | Evidência |
|----|-------------|-----------|
| **FR-NFSE-GCAT-01** | Cumprido | `MeiNfseCatalogManageActions` usa `planner-button-secondary`, `min-h-[44px]`, `w-full` em coluna mobile; substitui links `text-xs` no hero e em “Antes de emitir”. |
| **FR-NFSE-GCAT-02** | Cumprido | *Hint* canónico `DEFAULT_HINT` com `id` default `mei-nfse-catalog-actions-hint`; `showHint={false}` no hero evita copy incorreta (“atalhos acima”). |
| **FR-NFSE-GCAT-04** | Cumprido | `inRouter` alterna `Link` vs `<a href>`; rotas inalteradas. |
| **FR-NFSE-GCAT-05** | Cumprido | Um único componente em `frontend/src/components/MeiNfseCatalogManageActions.tsx`, dois *call sites* em `GuidesMei.tsx`. |
| **NFR-GCAT-01** | Cumprido | Ícones `aria-hidden`; foco `focus-visible:ring-*`; segundo botão com `aria-label` quando rótulo curto “Serviços e produtos”. |
| **NFR-GCAT-03** | Cumprido | `npm run lint`, `npm run typecheck`, `npm test` executados na raiz — **exit code 0**. |

### Pontos fortes

- Cabeçalho dinâmico com catálogo vazio: links inline removidos; texto reforça uso dos botões em “Antes de emitir”, alinhado à story e à **FR-NFSE-UX-07** (sem triplicar CTAs no mesmo parágrafo).
- Componente presentacional, sem novos tokens globais.

### Observações (não bloqueantes)

1. **Testes automatizados do componente:** não há teste dedicado a `MeiNfseCatalogManageActions`; regressão coberta por suíte global. *Nice-to-have:* um teste RTL mínimo (render com `inRouter` true/false e presença de rotas).
2. **Story / Dev Agent Record:** checkboxes de aceite e *Dev Agent Record* ainda em estado inicial; recomenda-se o **@dev** marcar critérios e preencher *File List* / *Status* para “Ready for Review” no fluxo AIOX.
3. **`aria-label` no segundo botão:** quando `produtoLabel` é “Serviços e produtos (NFS-e)” (hero), `aria-label` fica ausente — comportamento esperado (texto visível completo).

### Testes executados (evidência)

- Comando: `npm run lint && npm run typecheck && npm test` (raiz do repositório) — **sucesso** (2026-04-02).
