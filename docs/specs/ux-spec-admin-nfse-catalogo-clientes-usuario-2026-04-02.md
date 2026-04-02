# Especificação de front-end e UX — Admin: catálogo de clientes (tomadores) no modal “Emitir NFSe”

**Versão:** 1.0  
**Data:** 2026-04-02  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`](../prd/PRD-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md) (FR-ADM-NFSE-*, NFR-ADM-NFSE-*)  
**Brief de apoio:** [`docs/brief/brief-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md`](../brief/brief-admin-nfse-selecionar-gerir-clientes-usuario-2026-04-02.md)

**Relação com specs irmãs:**

- **Consome a mesma fonte de dados** que o Guia MEI (`mei_nfse_clientes`) — alinhar **rótulos e campos** a [`docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`](ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md) onde aplicável (lista, criar/editar).  
- **Não** duplica a página dedicada `/mei-catalogo/clientes`; este fluxo é **embutido** no painel admin, no contexto de **U** já selecionado.  
- **Tokens e padrões visuais:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — `planner-input-compact`, `planner-button*`, modal existente em `AdminUserData.tsx`.

**Implementação de referência (pré-mudança):** `frontend/src/pages/AdminUserData.tsx` — modal “Emitir NFSe” (`showEmitirNotaModal`), campos tomador + serviço; `frontend/src/services/adminUserDataService.ts` — `emitirNotaAsAdmin`.

---

## 1. Objetivo deste documento

Contrato de **experiência, estrutura, comportamento, *copy* e acessibilidade** para:

1. **Seleccionar** um cliente do catálogo de **U** e **preencher** (sem persistir automaticamente) documento, razão social e e-mail no formulário de emissão.  
2. **Manter** entrada **manual** explícita e equivalente ao comportamento actual.  
3. **Gerir** clientes de **U** (listar, criar, editar; eliminar conforme paridade) **sem** obrigar navegação a outra área — fluxo **preferencial A** (painel lateral ou segundo nível modal).

Serve de base para critérios de aceite, *file list* e QA; **não** substitui stories em `docs/stories/`.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Rastreio do contexto** | Em todo o fluxo fica claro que a emissão e o catálogo são **do utilizador U** da página (FR-ADM-NFSE-09). |
| **Sem surpresas na persistência** | Seleccionar da lista **só** preenche o formulário; alterações no catálogo só com acções explícitas no sub-fluxo “Gerir” (e eventual botão “Atualizar cadastro…” se PO fechar §6.1 do PRD). |
| **Paridade com MEI** | O admin vê o **mesmo universo** de clientes que o utilizador no Guia MEI para **U**; mensagens de validação e campos editáveis espelham política já definida no serviço. |
| **Consistência brownfield** | Reutilizar anatomia do modal actual (`role="dialog"`, `aria-labelledby`, `EmissaoFiscalErrorAlertModal`, botões `planner-button*`). |

---

## 3. Arquitectura de informação no modal

### 3.1 Ordem vertical recomendada (dentro do cartão do modal)

1. **Título** — “Emitir NFSe” (mantém `id="emitir-nota-modal-title"`).  
2. **Subtítulo / contexto** — reforçar **U** (nome ou identificador já mostrado na página) + lembrete do provedor fiscal (texto actual pode fundir-se com uma frase curta sobre catálogo).  
3. **Alertas** — erro fiscal (`EmissaoFiscalErrorAlertModal`), sucesso (banner verde existente).  
4. **Secção Tomador** (agrupamento visual `space-y-3` ou `border-t pt-4` após bloco introdutório):  
   - **4a.** Controlo **“Cliente do catálogo (opcional)”** — combobox com pesquisa + primeira opção canónica **“Preencher manualmente”** (valor sentinela; limpa vínculo de selecção mas **não** apaga campos já editados sem confirmação — ver §7.2).  
   - **4b.** Botão/link secundário **“Gerir clientes deste utilizador”** — abre fluxo A (§4).  
   - **4c.** Campos **CPF/CNPJ**, **Razão social**, **E-mail (opcional)** — iguais ao actual; editáveis após selecção (FR-ADM-NFSE-02).  
5. **Secção Serviço** — inalterada em relação ao PRD (código, discriminação, valor, CNAE se aplicável).  
6. **Rodapé** — Cancelar | Emitir.

### 3.2 Largura e *scroll*

- Se o combobox + hint ocuparem altura extra, manter `max-w-lg` ou subir para `max-w-xl` **só** se necessário para evitar *scroll* interno duplo; preferir **uma** coluna com `max-h-[vh]` e *scroll* no corpo do modal se o conteúdo exceder ~85vh.  
- Em viewports estreitas, empilhar; botão “Gerir clientes” **largura total** abaixo do combobox.

---

## 4. Fluxo preferencial A — “Gerir clientes deste utilizador”

**Decisão de UX (PRD §5.1):** segundo nível **sem** sair da emissão.

### 4.1 Variante recomendada: **Drawer (painel lateral)**

| Aspecto | Especificação |
|---------|----------------|
| **Disparo** | Botão `planner-button-secondary-compact` ou `planner-button-secondary` com ícone opcional (`Users`). |
| **Posição** | `fixed` à direita (`inset-y-0 right-0`), largura `w-full max-w-md` (tablet/desktop); em mobile, **full-screen overlay** com cabeçalho fixo e corpo com *scroll*. |
| **Z-index** | Acima do *backdrop* do modal principal (`z-[60]` ou equivalente), mantendo o modal de emissão visível por baixo (opcional: *backdrop* semi-transparente só no drawer). |
| **Foco** | Ao abrir: mover foco para título do drawer (`h2` com `tabIndex={-1}` ou primeiro controlo focável); **Focus trap** dentro do drawer; ao fechar: devolver foco ao botão “Gerir clientes…”. |
| **Fecho** | Botão “Fechar”, tecla `Esc`, clique fora (se não conflitar com modal pai — preferir **Esc** + botão explícito). |

### 4.2 Variante aceitável: **Modal secundário**

- Segundo `role="dialog"` centrado, `aria-modal="true"`, `aria-labelledby` distinto.  
- **Risco:** empilhamento de modais e gestão de foco mais exigente; documentar na story se for a opção escolhida.

### 4.3 Conteúdo mínimo do painel “Gerir”

1. **Cabeçalho:** título **“Clientes para NFS-e”** (ou **“Clientes de [nome/ID de U]”** se PO preferir máximo rastreio).  
2. **Subtítulo curto:** *“Alterações aqui reflectem-se no Guia MEI deste utilizador.”*  
3. **Lista** com busca opcional (debounce alinhado ao parâmetro `q` da API), estados vazio/carregamento/erro (§6).  
4. **Acções por linha:** Editar; Eliminar **só** se FR-ADM-NFSE-06 / story de catálogo o permitirem — com confirmação (`Dialog` de confirmação ou padrão já usado no produto).  
5. **CTA primário:** **“Novo cliente”** — abre formulário *inline*, secção expansível ou sub-modal **dentro** do drawer (preferir formulário no próprio drawer para reduzir profundidade).  
6. **Após criar/editar/eliminar:** refrescar lista; opcionalmente **toast** de sucesso; ao fechar o drawer, o combobox do modal principal deve **re-fetch** ou invalidar cache para incluir o novo registo (critério de aceite técnico).

---

## 5. Combobox “Cliente do catálogo (opcional)”

### 5.1 Comportamento

| Estado | Comportamento |
|--------|----------------|
| **Carga inicial** | Ao **abrir** o modal “Emitir NFSe” (ou ao primeiro foco no combobox — preferir **abrir modal** para lista pronta), `GET` admin com `userId` da página, `limit` conforme API; mostrar *skeleton* ou `aria-busy` no controlo. |
| **Pesquisa** | Filtrar via `q` quando o utilizador digita; *debounce* 300ms; mínimo 0 caracteres para listar top N. |
| **Selecção** | Ao escolher um item: preencher `tomadorCpfCnpj` (com `formatDocument`), `tomadorRazaoSocial`, `tomadorEmail` no estado local do formulário (FR-ADM-NFSE-02). |
| **“Preencher manualmente”** | Opção sempre visível no topo da lista; selecção não força *reset* dos campos se o admin já os editou — **recomendação:** ao mudar de “cliente X” para “manual”, **manter** valores actuais; ao mudar de cliente A para B, **sobrescrever** com dados de B. |
| **Erro de API** | Mensagem inline abaixo do controlo + `role="alert"` (FR-ADM-NFSE-07). |

### 5.2 Apresentação das opções

- **Label da opção:** preferir **razão social** + documento mascarado entre parênteses (ex.: `ACME Ltda (12.345.678/0001-90)`); secundário: e-mail truncado se couber.  
- **Teclado:** navegação por setas, Enter para confirmar, Escape fecha lista — alinhar ao componente base (Combobox Headless UI, Radix, ou `<select>` nativo **não** cumpre pesquisa rica; usar padrão já adoptado no frontend se existir).

---

## 6. Estados vazios, carregamento e erros

### 6.1 Lista no combobox

| Estado | *Copy* sugerida (PT-PT) |
|--------|-------------------------|
| **Vazio (0 clientes)** | *“Este utilizador ainda não tem clientes guardados para NFS-e. Use **Gerir clientes deste utilizador** para adicionar ou preencha os dados manualmente.”* |
| **Carregamento** | Spinner discreto ou texto *“A carregar clientes…”* com `aria-live="polite"`. |
| **Erro** | *“Não foi possível carregar o catálogo. Tente novamente ou use preenchimento manual.”* |

### 6.2 Drawer “Gerir” — lista vazia

- Ilustração opcional omitida no MVP; mensagem + botão **“Novo cliente”** proeminente.

### 6.3 MEI não habilitado (PRD §6.2 — decisão PO)

| Opção PO | UX |
|----------|-----|
| **(a) Ocultar** | Não renderizar combobox nem botão “Gerir”; subtítulo do modal pode mencionar *“Catálogo de clientes disponível quando o MEI estiver configurado.”* apenas se útil. |
| **(b) Somente leitura** | Mostrar texto explicativo; desactivar combobox e “Gerir”. |
| **(c) Igual** | Comportamento completo; documentar pré-requisitos de dados. |

A spec de implementação deve referenciar **uma** linha escolhida na story.

---

## 7. *Copy* canónica (FR-ADM-NFSE-09)

| Local | Texto (ajustar nome de U dinamicamente) |
|-------|----------------------------------------|
| Subtítulo do modal (extensão) | *“Emissão e dados do tomador em nome de **{nome ou e-mail de U}**. O catálogo de clientes é também deste utilizador.”* |
| Label do combobox | **Cliente do catálogo (opcional)** |
| Opção sentinela | **Preencher manualmente** |
| Botão gestão | **Gerir clientes deste utilizador** |
| Drawer — linha de confiança | *“As alterações guardadas aparecem no Guia MEI ao autenticar como este utilizador.”* |

**Nota §6.1 PRD:** se existir botão **“Atualizar cadastro com estes dados”**, colocar **abaixo** dos campos tomador, estilo secundário, com *tooltip* ou texto auxiliar: *“Grava no catálogo as alterações feitas nos campos acima (não altera a nota até emitir).”* — só incluir na UI após fecho PO.

---

## 8. Acessibilidade (NFR-ADM-NFSE-04)

- Associar **`<label htmlFor=...>`** a todos os inputs; combobox: padrão **combobox** + **listbox** com `aria-expanded`, `aria-controls`, `aria-activedescendant` conforme implementação.  
- Anunciar erros com `role="alert"` ou `aria-live="assertive"` após submissão falhada no sub-fluxo.  
- Contraste e foco visível: reutilizar `focus-visible:ring-2` já usado nos acordeões da mesma página.  
- Não remover o fecho do modal principal por teclado quando o drawer está aberto: **Esc** fecha primeiro o foco contextual (drawer), depois o modal (ordem de pilha).

---

## 9. Mapeamento FR → superfície UI

| ID | Superfície |
|----|------------|
| **FR-ADM-NFSE-01** | Combobox + fetch ao abrir modal (ou política acordada). |
| **FR-ADM-NFSE-02** | Selecção → estado `emitirNotaForm`; inputs tomador editáveis. |
| **FR-ADM-NFSE-03** | Opção “Preencher manualmente” + campos sempre utilizáveis sem selecção. |
| **FR-ADM-NFSE-04** | Formulário “Novo cliente” no drawer (submit → POST admin). |
| **FR-ADM-NFSE-05** | Editar na lista → PATCH admin. |
| **FR-ADM-NFSE-06** | Eliminar na lista + confirmação (se aplicável). |
| **FR-ADM-NFSE-07** | Mensagens de erro; nunca mostrar dados fora de **U**. |
| **FR-ADM-NFSE-08** | Botão + drawer/modal secundário. |
| **FR-ADM-NFSE-09** | Subtítulo + cabeçalho drawer (§7). |

---

## 10. Componentização sugerida (brownfield)

Para respeitar risco “ficheiro grande” (PRD §12):

| Peça | Responsabilidade |
|------|------------------|
| `AdminEmitirNfseModal` (ou nome alinhado à equipa) | Shell do modal, secções tomador/serviço, botões. |
| `AdminMeiCatalogClienteCombobox` | Fetch, pesquisa, opção manual, integração com `adminUserDataService`. |
| `AdminUserMeiClientesDrawer` | Lista, busca, CRUD UI, chamadas admin. |

Local sugerido: `frontend/src/components/admin/` ou `frontend/src/pages/admin/` conforme convenção do repo após *grep* de pastas existentes.

---

## 11. Critérios de aceite UX (checklist)

- [ ] Admin consegue emitir **sem** abrir o combobox (fluxo actual preservado).  
- [ ] Admin consegue **selecionar → ajustar → emitir** num único modal.  
- [ ] **“Gerir clientes”** permite criar cliente e **vê-lo** na lista do combobox após fechar/atualizar sem *hard refresh*.  
- [ ] Estados vazio, erro e carregamento têm *copy* orientadora (§6).  
- [ ] Foco e anúncio de erros verificáveis com leitor de ecrã (amostragem QA).  
- [ ] Decisões PRD **§6.1–6.3** reflectidas na UI e na story (sem ambiguidade).

---

## 12. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-02 | Versão inicial a partir do PRD admin NFSe + padrões `AdminUserData.tsx`. |

---

*Próximo passo AIOX:* story em `docs/stories/` com *file list*; @dev implementa serviços + componentes; QA valida checklist §11.
