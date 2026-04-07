# Story — FR-GUIA-FISC (P0): Guia MEI — seletor de tipo + formulário NF-e/NFC-e + emissão

**ID:** STORY-FR-GUIA-FISC-P0-SELETOR-FORM-EMITIR  
**Prioridade:** P0  
**Depende de:** —  
**Bloqueia:** [story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md](./story-fr-guia-fisc-p0-lista-filtro-tipos-documento.md) (recomendado entregar primeiro ou em paralelo se a lista já mostrar `document_type`)  
**Fonte:** `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (**FR-GUIA-FISC-01** a **04**, **06**, **CR-GUIA-FISC-01**)  
**Arquitetura:** `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` §3, §7  
**UX:** `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` §3–§6, §8, §11–§14

## User story

**Como** MEI no Guia Mei Infinito,  
**quero** escolher **NFS-e**, **NF-e** ou **NFC-e** no topo da área de emissão, preencher o formulário correcto para o tipo e emitir usando o emissor já integrado,  
**para** emitir nota de produto (NF-e/NFC-e) sem confundir com NFS-e de serviço (**FR-GUIA-FISC-01**, **03**, **04**).

## Reconciliação 2026-04-07 (POSQA)

**Pedido:** **FR-POSQA-04** — [`docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md) (PRD POSQA §8.3).  
**Story de processo:** [`story-posqa-2-reconciliacao-fr-guia-fisc-p0.md`](./story-posqa-2-reconciliacao-fr-guia-fisc-p0.md).  
**Nota:** não duplica requisitos do PRD funcional do Guia (`PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md`); apenas alinha checkboxes com código + testes à data.

| Critério PRD/UX (referência) | Estado | Evidência (ficheiro / teste) |
|------------------------------|--------|------------------------------|
| **FR-GUIA-FISC-01** — Seletor triplo NFS-e / NF-e / NFC-e (NFSE/NFE/NFCE) | Entregue | `MeiFiscalEmissionTypeSegmented.tsx`; `GuidesMei.permissions.test.tsx` |
| **FR-GUIA-FISC-01** — Default **NFSE** ao abrir | Entregue | `GuidesMei.tsx` — estado inicial `'NFSE'` |
| **FR-GUIA-FISC-01** — P1: persistir último tipo em `localStorage` | **Em aberto** | Não implementado; backlog sugerido **`FR-GUIA-FISC-01-P1-last-emission-type-storage`** (story filha a abrir se PO priorizar). |
| **FR-GUIA-FISC-01** — A11y (`fieldset`/`legend`, sem `tablist`, teclado) | Entregue | Componente do seletor; QA 2026-04-06 |
| **PRD §6.4 / UX §5** — Troca de tipo com *dirty* + confirmação | Entregue | `MeiFiscalChangeEmissionTypeDialog.tsx`; cópia UX §5.3 |
| **PRD §6.4** — Troca sem *dirty* imediata | Entregue | `requestEmissionDocumentTypeChange` → `performEmissionTypeSwitch` em `GuidesMei.tsx` |
| **FR-GUIA-FISC-02 / CR-GUIA-FISC-01** — NFS-e sem regressão | Entregue | Ramo `NFSE`; testes `GuidesMei.nfse-*.test.tsx`, `emitirNfse` |
| **FR-GUIA-FISC-03 / 04** — Formulário NFe-like + `emitirNfe` / `emitirNfce` | Entregue | `MeiNfeLikeEmitForm.tsx`, `meiNfeLikePayloadBuilder.ts`, `handleEmitNfeLike` |
| **NFR-GUIA-FISC-02** — Validação cliente + servidor | Entregue | `meiNfeLikeClientValidation.ts` + `meiNfeLikeClientValidation.test.ts` |
| **FR-GUIA-FISC-06** — Erros contextualizados por tipo | Entregue | `formatMeiFiscalErr` / `EmissaoFiscalErrorAlert`; ver Dev Agent Record |
| **FR-GUIA-FISC-08** — Ajuda por tipo (P0 mínimo: linha por tipo) | Entregue | `meiFiscalEmissionHelpLine` em `MeiFiscalEmissionTypeSegmented.tsx` |

### Itens P1 explicitamente em aberto

1. **Persistência do último tipo de emissão (NFSE/NFE/NFCE) em `localStorage`** — não implementado; referência de backlog: **`FR-GUIA-FISC-01-P1-last-emission-type-storage`** (alinhar a futura story filha ao PRD funcional §6.1).

---

## Contexto técnico

- **Backend:** `POST /mei-notas/emitir` já suporta `documentType` **NFE** / **NFCE** / **NFSE** e `payload` alinhado a `validateNfeLikePayload` (`mei-notas.service.js`).  
- **Cliente:** `frontend/src/services/meiNotasService.ts` — usar **`emitirNfe`**, **`emitirNfce`**, **`emitirNfse`** (tipos `NfeLikePayloadInput`, `EmitirNfseInput`). Forma preferida: `{ documentType, payload }` para NFE/NFCE (arquitetura §3.2).  
- **Página:** `frontend/src/pages/GuidesMei.tsx` — tab workspace `nfse` hoje; UX recomenda renomear label/descrição para “Emissão fiscal” / “Notas fiscais” e actualizar *hero* (UX §3.1).  
- **Modelo:** não expor `modelo` 55/65 ao utilizador; o servidor normaliza; UI pode omitir ou enviar coerente via tipo seleccionado.

## Critérios de aceite

### Seletor e default (**FR-GUIA-FISC-01**, PRD §6.1)

- [x] Controlo **segmented** (ou radiogroup equivalente) com três opções: **NFS-e**, **NF-e**, **NFC-e**; valores internos **NFSE**, **NFE**, **NFCE**. — *`MeiFiscalEmissionTypeSegmented.tsx`*  
- [x] **Default** ao abrir o painel de emissão: **NFS-e** (NFSE). — *`GuidesMei.tsx` (`useState` inicial `NFSE`)*  
- [ ] **P1 (em aberto):** persistir “último tipo” em `localStorage` quando PO priorizar — backlog **`FR-GUIA-FISC-01-P1-last-emission-type-storage`**.  
- [x] **A11y:** `aria-label` / `fieldset`+`legend` conforme UX §4.2; **não** usar `role="tablist"` para este controlo. Navegação por teclado (grupo de rádio nativo; paridade com UX §4.2). — *ver revisão QA 2026-04-06*

### Troca de tipo com dados (**PRD §6.4**, UX §5)

- [x] Se o utilizador alterar o tipo e existirem campos **dirty** no modo actual, mostrar diálogo de confirmação com *copy* canónica da UX §5.3; **Cancelar** mantém tipo e dados; **Alterar tipo** limpa o estado do formulário do modo anterior. — *`MeiFiscalChangeEmissionTypeDialog.tsx`*  
- [x] Sem dados dirty: troca **imediata** de blocos de formulário.

### NFS-e — não regressão (**FR-GUIA-FISC-02**, **CR-GUIA-FISC-01**)

- [x] Com **NFS-e** seleccionado, o fluxo actual de emissão (prestador, tomador, serviço, validações, *submit*) mantém-se funcionalmente equivalente; apenas mudanças cosméticas/estruturais aceitáveis se não alterarem contrato enviado ao `emitirNfse`.

### NF-e / NFC-e — formulário e envio (**FR-GUIA-FISC-03**, **04**)

- [x] Blocos **Emitente**, **Destinatário**, **Itens** (MVP: adicionar/remover linhas) com campos mínimos alinhados a `validateNfeLikePayload` (NCM 8, CFOP 4, unidade, quantidade &gt; 0, valor unitário &gt; 0, ICMS CST/CSOSN, PIS/COFINS CST por item). — *`MeiNfeLikeEmitForm.tsx`*  
- [x] **Submit** chama `emitirNfe` ou `emitirNfce` com `payload` completo; sucesso: feedback na pilha existente e lista actualizada (como hoje para NFS-e).  
- [x] Validação **cliente** antes do *submit* com mensagens por campo (`aria-describedby` onde aplicável); servidor continua fonte de verdade (**NFR-GUIA-FISC-02**). — *`meiNfeLikeClientValidation.ts`*

### Erros (**FR-GUIA-FISC-06**, UX §8)

- [x] Erros API / Plugnotas reutilizam `formatPlugnotasIntegrationError` / padrão actual; quando fizer sentido, prefixar ou contextualizar com o tipo activo (ex.: “NFC-e: …”). — *`formatMeiFiscalErr`, `emissionFeedbackDocumentLabel`*

### Ajuda contextual (**FR-GUIA-FISC-08**, P1 se PO apertar escopo)

- [x] Linha de ajuda dinâmica sob o seletor com texto por tipo (UX §6.2) — **P0 mínimo:** pelo menos uma linha por tipo; pode ser texto estático. — *`meiFiscalEmissionHelpLine`*

## Tasks (implementação)

1. [x] Extrair ou implementar `MeiFiscalDocumentTypeSegmented` (ou nome alinhado à equipa) + estado em `GuidesMei` ou *parent*.  
2. [x] Implementar formulário NF-e/NFC-e (componente dedicado) montando `NfeLikePayloadInput`; reutilizar estilos/acordeões do Guia MEI.  
3. [x] Integrar `emitirNfe` / `emitirNfce` no handler de *submit* condicional ao tipo.  
4. [x] Diálogo de confirmação na troca de tipo (*dirty*).  
5. [x] Actualizar *copy* tab workspace + *hero* conforme UX §3.1 (ou alternativa brownfield documentada).  
6. [x] Testes: extensão de `meiNotasService.test.ts` se necessário; testes de componente/util de validação se o repo usar Vitest/Jest para UI.

## Fora de escopo

- *Callout* de capacidade Plugnotas (NFE/NFC-e inactivos) — [story-fr-guia-fisc-p1-capability-callout-plugnotas.md](./story-fr-guia-fisc-p1-capability-callout-plugnotas.md).  
- Integração catálogo produtos/clientes para NFE — story futura (**FR-GUIA-FISC-09**).  
- Alteração `empresa.service.js` / ADR “apenas NFS-e” — story futura ou spike separado.  
- Paridade admin — [story-fr-guia-fisc-p2-admin-paridade-seletor.md](./story-fr-guia-fisc-p2-admin-paridade-seletor.md).

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/components/mei/` — novos componentes (seletor, formulário NFe-like, opcional diálogo)  
- [x] `frontend/src/services/meiNotasService.ts` — só se forem necessários ajustes de tipo/export *(sem alterações; API já coberta por testes existentes)*  
- [x] `frontend/src/utils/` — validação NFe-like partilhada (opcional)  
- [x] `frontend/src/services/meiNotasService.test.ts` ou testes de componente *(validação: `meiNfeLikeClientValidation.test.ts`)*  
- [x] `frontend/src/utils/nfseEmitenteHydration.ts` — `createInitialEmitirNfseInput` para reset/troca de tipo

## Definition of Done

- Critérios de aceite marcados e verificados em QA.  
- `npm run lint`, `npm run typecheck`, `npm test` (raiz ou pacotes tocados) conforme `AGENTS.md`.  
- Sem regressão smoke em emissão NFS-e.

## Qualidade / CodeRabbit

- Evitar inflacionar `GuidesMei.tsx`: extrair componentes (arquitetura §7, PRD risco).  
- Não duplicar regras de validação que contradizam `validateNfeLikePayload` no servidor.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- **Seguimento QA (2026-04-06):** modal §5.3 — **Cancelar** com `planner-button` (fecho primário); **Alterar tipo** com `planner-button-secondary-compact` neutro. Após NF-e/NFC-e com sucesso: `loadNfseCatalog()` em `Promise.all` com lista e limite (paridade NFS-e). Destinatário: validação cliente com dígitos verificadores (`validateCpfCnpjBr` + testes). Testes UI em `GuidesMei.permissions.test.tsx`: modal com NFS-e *dirty* + submit NF-e chama `emitirNfe` (mock).
- Seletor **NFS-e | NF-e | NFC-e** (`MeiFiscalEmissionTypeSegmented`): `fieldset` + `legend` *sr-only*, rádios estilo *segmented*; defeito **NFSE**; linha de ajuda UX §6.2 (`meiFiscalEmissionHelpLine`).
- Troca de tipo com **dirty** (`JSON.stringify` vs *baseline*): modal `MeiFiscalChangeEmissionTypeDialog` (UX §5.3); sem dirty → `performEmissionTypeSwitch` imediato; NFSE→NFE/NFC limpa NFS-e e pré-preenche emitente a partir do prestador NFS-e + razão do cadastro; NFE↔NFC mantém emitente no novo formulário vazio de itens.
- Formulário **NF-e/NFC-e**: `MeiNfeLikeEmitForm` + `validateMeiNfeLikeForm` / `buildNfeLikePayloadFromMeiForm`; *submit* via `emitirNfe` / `emitirNfce`; feedback na pilha existente com `emissionFeedbackDocumentLabel`.
- **Copy** UX §3.1: tab **Emissão fiscal**, subtítulo *NFS-e, NF-e e NFC-e*, *hero* com notas fiscais nos três tipos; testes que abriam o separador por texto **NFS-e** passam a usar **Emissão fiscal** (`#mei-tab-nfse` inalterado).
- `createInitialEmitirNfseInput` em `nfseEmitenteHydration.ts` para reset consistente; após emitir NFS-e com sucesso, *baseline* de dirty actualizado.
- Gates: `npm run typecheck`, `npm test` na raiz OK; `npm run lint` OK (avisos pré-existentes noutros ficheiros).

### File List (final)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/components/mei/MeiFiscalEmissionTypeSegmented.tsx`
- `frontend/src/components/mei/MeiFiscalChangeEmissionTypeDialog.tsx`
- `frontend/src/components/mei/MeiNfeLikeEmitForm.tsx`
- `frontend/src/utils/meiNfeLikeFormState.ts`
- `frontend/src/utils/meiNfeLikePayloadBuilder.ts`
- `frontend/src/utils/meiNfeLikeClientValidation.ts`
- `frontend/src/utils/meiNfeLikeClientValidation.test.ts`
- `frontend/src/utils/validateCpfCnpjBr.ts`
- `frontend/src/utils/validateCpfCnpjBr.test.ts`
- `frontend/src/utils/nfseEmitenteHydration.ts`
- `frontend/src/pages/GuidesMei.permissions.test.tsx`
- `frontend/src/pages/GuidesMei.limite-integracao.test.tsx`
- `frontend/src/pages/GuidesMei.nfse-feedback-stack.test.tsx`

---

## QA Results

### Revisão QA — 2026-04-06 (Quinn)

**Decisão de gate:** **PASS com observações**

#### Rastreio — critérios de aceite (story)

| Área | Veredicto | Evidência / notas |
|------|-----------|---------------------|
| **Seletor** triplo NFSE/NFE/NFCE, *segmented* / radiogroup | **Satisfeito** | `MeiFiscalEmissionTypeSegmented.tsx`: `fieldset` + `legend.sr-only`, `input type="radio"` estilizado; **sem** `role="tablist"`. |
| **Default NFS-e (NFSE)** | **Satisfeito** | `GuidesMei.tsx`: `useState<...>('NFSE')`. P1 *localStorage* não implementado (conforme story). |
| **A11y + teclado** | **Satisfeito** | Grupo nativo de rádio: setas entre opções no browser; foco visível nos *labels*. *Roving tabindex* explícito não há — paridade funcional com padrão de rádio HTML. |
| **Troca com dirty → modal UX §5.3** | **Satisfeito** | `MeiFiscalChangeEmissionTypeDialog`: título e corpo alinhados ao canónico; **Cancelar** / **Alterar tipo**. |
| **Troca sem dirty → imediata** | **Satisfeito** | `requestEmissionDocumentTypeChange` → `performEmissionTypeSwitch` sem modal. |
| **Limpeza modo anterior** | **Satisfeito** | NFSE→NFE/NFC: `createInitialEmitirNfseInput`; NFE↔NFC: novo estado com emitente preservado; NFE/NFC→NFSE: `createEmptyMeiNfeLikeFormState`, sem reset agressivo do `nfseForm` quando regressa (coerente com não limpar o modo que não se está a abandonar). |
| **NFS-e sem regressão** | **Satisfeito (código + testes)** | Formulário e `handleEmitNfse` / `emitirNfse` mantidos no ramo `emissionDocumentType === 'NFSE'`; regressões existentes (`GuidesMei.nfse-emitente-regression.test.tsx`, etc.) usam `#mei-tab-nfse`. |
| **NF-e/NFC-e formulário + payload** | **Satisfeito** | `MeiNfeLikeEmitForm` + `buildNfeLikePayloadFromMeiForm`; itens com NCM/CFOP/unidade/qtd/valor/tributos; modelo omitido (servidor normaliza). |
| **Submit `emitirNfe` / `emitirNfce`** | **Satisfeito** | `handleEmitNfeLike` chama API correcta; sucesso: pilha `nfseSuccess` + `loadNfseList` + `loadMeiLimiteServidor`. |
| **Validação cliente + `aria-describedby`** | **Satisfeito** | `validateMeiNfeLikeForm` espelha regras principais de `validateNfeLikePayload`; erros por campo no formulário + resumo na pilha (primeira mensagem). |
| **Erros API / contexto tipo** | **Satisfeito** | `formatMeiFiscalErr`; `EmissaoFiscalErrorAlert` com `emissionFeedbackDocumentLabel`; *fallback* da mensagem inclui `Erro ao emitir ${docShort}`. |
| **Ajuda contextual §6.2** | **Satisfeito** | `meiFiscalEmissionHelpLine` por tipo. |

#### Testes automáticos

- **`meiNfeLikeClientValidation.test.ts`:** cobre rejeição de vazio e caso mínimo válido — **adequado** como base da validação.
- **Sem** teste de integração/UI que prove: (a) abertura do modal com *dirty*, (b) chamada a `emitirNfe`/`emitirNfce` após *submit* — **lacuna leve** (risco médio-baixo dado serviço já testado em `meiNotasService.test.ts`).

#### Observações (não bloqueantes)

1. **UX §5.3 botões:** *copy* UX sugere *Cancelar* como acção de fecho “primária” e *Alterar tipo* sem ênfase de sucesso; na UI actual *Alterar tipo* usa `planner-button` (mais destacado que *Cancelar*). Preferível alinhar estilos ao guia PO se quiserem paridade literal.
2. **Validação CPF/CNPJ destinatário:** cliente só verifica comprimento 11/14; o servidor valida dígitos — aceitável com **NFR-GUIA-FISC-02** (servidor fonte de verdade); utilizador pode ver erro só após *submit*.
3. **Pós-émito NFE/NFC-e:** não chama `loadNfseCatalog()` (NFS-e chama); impacto **baixo** se catálogo for só atalho NFS-e.
4. **DoD story:** *smoke* manual de emissão NFS-e **e** um fluxo NF-e ou NFC-e em ambiente integrado continua recomendado antes de promoção; gates `npm test` / `typecheck` conforme notas do dev (esta revisão não reexecutou CI local).

#### Critérios de aceite no corpo da story

- As checkboxes em **Critérios de aceite** permanecem por marcar no fluxo PO/QA do repositório; esta revisão **não** as altera (secção fora do âmbito de edição do agente QA no ficheiro).

**CodeRabbit:** não executado nesta revisão.

— Quinn, guardião da qualidade 🛡️
