# Story — FR-NFSE-GCAT (P1): Coordenação de *copy* — catálogo vazio na zona de atalhos (sem redundância com cabeçalho)

**ID:** STORY-FR-NFSE-GCAT-P1  
**Prioridade:** P1 (Should — PRD onda sugerida; pode ser adiada explicitamente no backlog)  
**Depende de:** [story-fr-nfse-gcat-p0-atalhos-gestao-catalogo-botoes.md](./story-fr-nfse-gcat-p0-atalhos-gestao-catalogo-botoes.md) (componente `MeiNfseCatalogManageActions` e *hint* base §7.1)  
**Fonte:** `docs/prd/PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` (**FR-NFSE-GCAT-03**)  
**Especificação UX:** `docs/specs/ux-spec-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` §7.3

## User story

**Como** utilizador MEI com **catálogo ainda vazio**,  
**quero** que a zona de atalhos **não repita** a mesma mensagem longa do cabeçalho dinâmico (**FR-NFSE-UX-07**), mas possa mostrar **opcionalmente** um reforço **curto e distinto** junto às ações de gestão,  
**para** sentir orientação sem ruído nem contradições entre blocos.

## Contexto técnico

- **Estado de dados:** condição já usada noutros sítios — ex.: ambos `nfseCatalogClientes.length === 0` e `nfseCatalogProdutos.length === 0` **após** carga relevante (não durante loading inicial de forma a disparar falso positivo). Alinhar à matriz **§4.2** de `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` e à implementação atual de `nfseWorkspaceGuidance` / estado de catálogo em `GuidesMei.tsx`.
- **Prop:** `catalogEmpty` (ou nome equivalente) no componente `MeiNfseCatalogManageActions` — quando `true`, mostrar **opcionalmente** linha extra curta conforme spec §7.3 **Opção B**, ex.: *“Ainda sem itens guardados.”*
- **Regra anti-redundância:** **não** colar a frase longa *“Cadastre clientes e serviços para usar atalhos…”* do cabeçalho nesta zona; cabeçalho = fonte canónica da mensagem estratégica longa (**FR-NFSE-UX-07**).
- **Coordenação PO:** fechar em PR se **Opção A** (apenas *hint* §7.1 sempre) for suficiente — nesse caso esta story reduz-se a documentar a decisão “não implementar linha extra” e validar ausência de duplicação.

## Critérios de aceite

- [x] **FR-NFSE-GCAT-03:** Com catálogo vazio, **ou** (A) apenas o *hint* base P0 sem linha adicional **e** revisão PO a confirmar que não há sensação de falta de informação, **ou** (B) linha extra curta **única** (spec §7.3 Opção B) **sem** repetir verbatim a mensagem do cabeçalho dinâmico.
- [x] Com catálogo **não** vazio, nenhuma linha extra específica de “vazio” é mostrada.
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Fora de escopo

- Mudar texto ou lógica do **cabeçalho** `nfseWorkspaceGuidance` (salvo ajuste mínimo para evitar contradição — coordenar com dono de **FR-NFSE-UX-07**).  
- Novos endpoints.

## File list (checklist implementação)

- [x] `frontend/src/components/MeiNfseCatalogManageActions.tsx` (ou nome final)
- [x] `frontend/src/pages/GuidesMei.tsx` — passar estado `catalogEmpty` derivado de dados reais
- [x] `frontend/src/components/MeiNfseCatalogManageActions.test.tsx` — casos `catalogEmpty`

## Definition of Done

- Revisão PO/UX: uma passagem pela vista com catálogo vazio e cabeçalho visível — **sem** três mensagens redundantes (cabeçalho + banner + zona atalhos).

## Qualidade / CodeRabbit

- Condição `catalogEmpty` deve ser **estável** e alinhada ao loading (evitar flash de texto “vazio” antes do fetch).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação)

### Completion Notes List

- **Opção B (spec §7.3):** `catalogEmpty` + linha *“Ainda sem itens guardados.”* só quando `!nfseCatalogLoading &&` ambos os arrays vazios; hero mantém `showHint={false}` (sem linha vazia).
- Cabeçalho `nfseWorkspaceGuidance` inalterado (mensagem longa canónica no topo).
- **Follow-up QA:** botões de gestão ligam aos textos didáticos via `aria-describedby`: hint base (`idHint`); com `catalogEmpty` e `showHint`, também `idCatalogEmptyHint` (observação não bloqueante em QA Results).

### File List

- `frontend/src/components/MeiNfseCatalogManageActions.tsx`
- `frontend/src/components/MeiNfseCatalogManageActions.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Change Log

- 2026-04-02 — Story criada pelo SM (River); P1 opcional face ao PRD §10.
- 2026-04-02 — Implementação FR-NFSE-GCAT-03 (`catalogEmpty` + testes).
- 2026-04-02 — `aria-describedby` nos links de gestão (hint + linha vazio quando aplicável); testes atualizados.

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-02  
**Gate:** **PASS**

### Rastreio aos critérios de aceite

| Critério | Verificação |
|----------|-------------|
| **FR-NFSE-GCAT-03 (Opção B)** | Linha curta *“Ainda sem itens guardados.”* (`EMPTY_CATALOG_HINT`) só com `catalogEmpty` e `showHint`; **não** repete a frase longa do cabeçalho (`nfseWorkspaceGuidance`). |
| **Catálogo não vazio** | `catalogEmpty` em `GuidesMei.tsx` só é `true` quando ambos os arrays têm length 0; com qualquer item, a linha extra não renderiza. |
| **Estabilidade / loading** | `catalogEmpty` inclui `!nfseCatalogLoading` — evita *flash* da linha antes do fetch (alinhado à story §Qualidade). |
| **Hero** | Teste `catalogEmpty` + `showHint={false}` garante que a linha de vazio não aparece no hero. |
| **Gates** | `npm run lint`, `npm run typecheck`, `npm test` na raiz — **exit code 0** (2026-04-02). |

### Testes automatizados

- `MeiNfseCatalogManageActions.test.tsx`: cenários `catalogEmpty` true/false e combinação com `showHint` false — cobertura adequada para regressão.

### Definition of Done (PO/UX)

- **Manual:** recomenda-se uma passagem rápida com catálogo vazio (emitente configurado) para confirmar que o conjunto **cabeçalho + *hint* base + linha curta** não é percecido como ruído excessivo; não é bloqueio de gate técnico.

### Observações (não bloqueantes)

- **`idCatalogEmptyHint`:** presente para eventual `aria-describedby` futuro; não obrigatório para este gate.
