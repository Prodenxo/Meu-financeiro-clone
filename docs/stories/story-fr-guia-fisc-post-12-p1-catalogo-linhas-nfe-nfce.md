# Story — FR-GUIA-FISC-12 (P1): Catálogo de produtos → pré-preencher linhas NF-e / NFC-e

**ID:** STORY-FR-GUIA-FISC-POST-12-CATALOGO-LINHAS-NFE-NFCE  
**Prioridade:** P1  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** Emissão NF-e/NFC-e com **seletor, formulário e secção de itens** no Guia MEI — **mínimo:** [`story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md`](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) concluída ou *merge* iminente documentado; relacionado: [`story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md`](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) (lista/filtros — não bloqueia inserção de linhas). Baseline PRD: `PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`. **Catálogo produtos MEI:** `story-cat-mei-04-frontend-pagina-servicos-produtos-catalogo.md`, `story-cat-mei-02-backend-post-patch-catalogo.md` (API). Contrato produto → linha com **@architect** se necessário.  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-12**); baseline **FR-GUIA-FISC-09**  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §4  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §3  
**QA (referência):** `docs/qa/plugnotas-multitipo-checklist.md` — actualizar quando este incremento fechar, se aplicável.  
**Refinamento:** SM **iteração 1** — alinhamento ao padrão POST-11 (BDD, âmbito, DoR, AC mensurável, QA manual, NFR; feedback PO 7→*Ready*); **iteração 2** — dependências P0 com ficheiros de story; BDD *Então* sem ambiguidade de “válido” (feedback PO 8,5→9); **iteração 3** — *Então* resumido na tabela + detalhe em lista (legibilidade; feedback PO 9,5→10 doc).

## User story

**Como** utilizador MEI a emitir **NF-e** ou **NFC-e**,  
**quero** **adicionar itens a partir do catálogo de produtos** para pré-preencher código, descrição, NCM, CFOP e campos alinhados,  
**para** reduzir erro manual e tempo de preenchimento (**FR-GUIA-FISC-12**), sem quebrar **NFS-e**.

## Cenário principal (BDD)

| | |
|--|--|
| **Dado** | O utilizador está no Guia MEI com tipo **NF-e** ou **NFC-e** e a secção de **itens** visível; existem produtos no catálogo compatíveis com linha de nota de produto (conforme contrato fechado na implementação). |
| **Quando** | O utilizador escolhe **Adicionar do catálogo**, selecciona um produto e confirma. |
| **Então** | **Nova linha** com campos mínimos pré-preenchidos e **editáveis**; integração do catálogo **não** corrompe o fluxo de emissão (ver detalhe abaixo). |

**Detalhe do *Então* (contrato):**

- Estado do formulário **coerente** após fechar o modal; **sem** falha atribuível só à integração catálogo → linha.  
- Campos ainda por preencher (ex.: tributos) seguem a **validação normal** ao **Emitir**, como numa linha só manual.  
- Esta story **não** exige **emissão com sucesso** apenas por ter escolhido o produto no catálogo.  

## Âmbito

| Classificação | Conteúdo |
|---------------|----------|
| **Must (v1)** | Botão **"Adicionar do catálogo"** só em **NF-e** / **NFC-e**; reutilização de `MeiCatalogoProdutoModal.tsx` (ou fluxo equivalente); **mapper** catálogo → linha compatível com `validateNfeLikePayload` / `MeiNfeLikeEmitForm`; *empty state*; a11y do modal; **sem** regressão **NFS-e**. |
| **Could / follow-up** | Filtro server-side adicional de produtos por `document_type` se o contrato de API evoluir; *copy* extra de ajuda por UF — só com PRD/story própria. |
| **Fora de âmbito** | Migrações de BD ou novas tabelas sem story **@data-engineer**; alteração das regras fiscais Plugnotas. |

## Definition of Ready (checklist PO/SM)

*(Marcar no arranque do sprint ou no *refinement* antes do *commit* da equipa.)*

- [ ] [`story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md`](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) **entregue** ou *merge* iminente documentado (secção de itens NFE/NFCE utilizável).  
- [ ] Contrato **catálogo produto → campos de linha** revisto com **@architect** (NCM, CFOP, tributos default).  
- [ ] **Owner QA** atribuído (secção *QA manual*) ou delegação com data.  

## Contexto técnico

- Mapper puro: `mapCatalogProdutoToNfeItemRow` (nome ajustável) — saída compatível com `validateNfeLikePayload` / formulário `MeiNfeLikeEmitForm`.  
- Reutilizar UI de catálogo: `MeiCatalogoProdutoModal.tsx` ou listagem API já usada no projeto.  
- Itens só **NFE/NFCE:** botão **"Adicionar do catálogo"** visível apenas quando o modo de emissão é NF-e ou NFC-e.  
- Produtos incompatíveis (só NFS-e ou sem dados para produto): **não listar** ou mensagem conforme UX spec §4.2 — comportamento explícito nos critérios.

## Critérios de aceite

### Funcional (Must)

- [x] **Inserção a partir do catálogo (mesmo requisito — duas facetas verificáveis):**  
  - **(a) Comportamento (UI):** em modo **NF-e** ou **NFC-e**, o utilizador abre o selector de produto e **insere linha** com campos mínimos pré-preenchidos; campos **permanecem editáveis** após inserção.  
  - **(b) Prova automática (mapper / teste):** testes unitários do mapper com **fixtures** representativas (pelo menos um caso *happy path*); valores de saída alinhados ao mínimo esperado pelo servidor para uma linha válida (*shape* acordado com **@architect**).  
- [x] **Sem regressão NFS-e:** em modo **NFS-e**, o botão **não** aparece e fluxos de catálogo / serviço existentes mantêm-se **inalterados** (smoke visual + ausência de chamadas novas indevidas, se aplicável).  
- [x] ***Empty state*** quando não há produtos utilizáveis (UX §4.3): mensagem + CTA coerente (ex.: *"Ir ao catálogo"* se navegação existir).  
- [x] **Acessibilidade:** modal com `aria-modal="true"`, gestão de foco e *return focus* ao fechar (UX §4.4).  

### Casos limite

- [x] Produto **incompatível** com linha NF-e/NFC-e (ex.: apenas metadados NFS-e): **não** entra na lista **ou** mensagem explícita UX §4.2 — documentar qual opção foi implementada na *Completion Notes*.  
- [x] **NFC-e vs NF-e:** o mesmo fluxo de catálogo serve ambos os tipos; diferenças de modelo **55/65** continuam a ser tratadas pelo fluxo de emissão existente (sem duplicar lógica de modelo na story).  

### Testes automáticos

- [x] Testes unitários do **mapper** (obrigatório).  
- [x] Teste RTL **mínimo** *happy path* (recomendado): abrir modal (mock), seleccionar produto, verificar linha no formulário ou estado intermédio acordado.  

### QA manual (checklist)

**Owner QA (sprint):** *(a preencher em planning — nome ou equipa)*  

1. Guia MEI → **NF-e** → secção itens → **Adicionar do catálogo** → seleccionar produto → confirmar campos pré-preenchidos e editáveis.  
2. Repetir para **NFC-e**.  
3. **NFS-e:** confirmar **ausência** do botão e fluxo de emissão serviço intacto.  
4. Catálogo vazio ou sem produtos compatíveis: verificar *empty state* / mensagem.  
5. Registar evidência no *Dev Agent Record* (data, ambiente).  
6. *(Opcional)* Actualizar `docs/qa/plugnotas-multitipo-checklist.md` se o fluxo for coberto lá.  

## Tasks (implementação)

1. [x] Fechar contrato item de catálogo → linha NFE com **@architect** (incl. defaults de tributos).  
2. [x] Implementar mapper + testes unitários.  
3. [x] Integrar botão e modal na secção de itens (`GuidesMei.tsx` ou componente extraído).  
4. [x] Testes RTL opcionais + gates `AGENTS.md`.  

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` e/ou componente de itens NF-e  
- [ ] `frontend/src/components/MeiCatalogoProdutoModal.tsx` *(reutilização / extensão)* — **não alterado**: selector dedicado `MeiNfeLikeCatalogProdutoPickerModal` (fluxo equivalente).  
- [x] Mapper: `frontend/src/utils/mapCatalogProdutoToNfeItem.ts` *(path sugerido)*  
- [ ] `frontend/src/services/meiNotasService.ts` *(se filtros de listagem)* — **sem alteração** (reutiliza `listarCatalogoNfseProdutos` com `documentType`).  
- [x] Testes `*.test.ts` / `*.test.tsx`  
- [x] `docs/qa/plugnotas-multitipo-checklist.md` *(se actualização)*  

## Definition of Done

- Critérios **Must** e **Casos limite** verificados.  
- QA manual executado ou delegado com data.  
- `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`).  
- **NFR-POST-02:** não introduzir `console.log` de payload completo de catálogo/API nem PII em código novo.  

## Dev Agent Record

### Status

Implementado (2026-04-16) — QA manual pendente / delegável.

### Owner QA

*(opcional — duplicar de *QA manual* quando fechado)*  

- Nome / data execução manual: *(preencher)*

### Completion Notes List

- **Produtos incompatíveis:** a listagem usa `GET …/catalogo/produtos?documentType=NFE` ou `NFCE` conforme o modo de emissão; registos só **NFSE** (ou outro tipo) **não** são devolvidos pela API e por isso **não entram na lista**. O modal explica que só aparecem produtos com o tipo seleccionado.  
- **Defaults de linha:** `metadata_json` pode incluir `ncm`, `cfop`, `unidade`; em falta usam-se NCM `01012100`, CFOP `5102`, unidade `UN`, quantidade `1`, valor sugerido ou `1,00`, tributos como em `createEmptyMeiNfeLikeItem` (CSOSN 102, PIS/COFINS 49). O utilizador pode editar antes de emitir.  
- **NFR-POST-02:** sem `console.log` de payloads completos.  
- **Follow-up QA (pós-revisão Quinn):** armadilha de foco (Tab) no diálogo do selector; testes RTL adicionais — NFC-e (`documentType: NFCE`), *empty state* (lista vazia + link), fluxo erro + «Tentar novamente».

### File List (final)

- `frontend/src/utils/mapCatalogProdutoToNfeItem.ts` — mapper + `formatValorUnitarioFromCatalogValorSugerido`  
- `frontend/src/utils/mapCatalogProdutoToNfeItem.test.ts`  
- `frontend/src/components/mei/MeiNfeLikeCatalogProdutoPickerModal.tsx`  
- `frontend/src/components/mei/MeiNfeLikeEmitForm.tsx` — botão «Adicionar do catálogo», prop `nfLikeCatalogDocumentType`  
- `frontend/src/components/mei/MeiNfeLikeEmitForm.catalog.test.tsx`  
- `frontend/src/pages/GuidesMei.tsx` — passa `nfLikeCatalogDocumentType` em NF-e / NFC-e  
- `frontend/src/pages/AdminUserData.tsx` — mesma prop no emissor NF-e/NFC-e (paridade)
