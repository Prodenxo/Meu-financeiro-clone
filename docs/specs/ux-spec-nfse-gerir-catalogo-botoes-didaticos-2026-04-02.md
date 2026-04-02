# Especificação de front-end e UX — **Gestão de catálogo** junto aos atalhos (NFS-e)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` (FR-NFSE-GCAT-*, NFR-GCAT-*)  
**Brief de pesquisa:** `docs/brief/brief-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md`

**Relação com specs irmãs:**

- **Detalha e substitui** a linha genérica “links Gerir clientes / serviços” em `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` **§3.1 wireframe** e **§5.1 item 3 (Atalhos)** — mantém a **ordem vertical** (bloqueios → emitente → atalhos + **gestão de catálogo** → pré-prestador); apenas a **afordância** da gestão passa de hiperligação `text-xs` a controlos definidos abaixo.  
- **Alinha-se** a `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` para tokens globais (`planner-*`, `admin-*`).  
- **Não** altera rotas: `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` permanece válida para as páginas de catálogo.

**Implementação de referência (pré-mudança):** `frontend/src/pages/GuidesMei.tsx` — `catalogoClientesLinkClass`, blocos com `Link` / `<a href>` para `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos`.

---

## 1. Objetivo deste documento

Contrato de **experiência e implementação** para a **micro-zona** “atalhos de catálogo → gestão”, dentro de **NFS-L1-A — Antes de emitir**. Define:

- **Variante visual recomendada (A)** e **alternativa (B)** alinhadas ao PRD.  
- **Anatomia** da molécula reutilizável (centralização **FR-NFSE-GCAT-05**).  
- **Copy** didática, **estados** (incl. coordenação com **FR-NFSE-UX-07**), **a11y** e **mapeamento** explícito a FR-NFSE-GCAT-*.

Não substitui stories; alimenta *checklist* de aceite e *file list*.

---

## 2. Âmbito e posição na IA

| Conceito | Valor |
|----------|--------|
| **Nível** | Sub-bloco **NFS-L1-A.3b** — imediatamente **após** a grelha dos selects “Cliente salvo (atalho)” e “Serviço salvo (atalho)”, **antes** de `nfseCatalogLoading` / `nfseCatalogError` / *spinner* pré-prestador quando a ordem global for respeitada (ver spec pai **§5.1**). |
| **Fora de âmbito** | URLs, guards, API, hero Mei Infinito, lista de notas, botão **Emitir NFS-e**. |

---

## 3. Decisão de variante (PO)

| ID | Nome | Uso | Quando escolher |
|----|------|-----|-----------------|
| **VAR-A** | **Botões secundários** | **Recomendado** (PRD preferência) | Máxima descoberta e didática; alinha a “Salvar dados do emitente” como família de controlos clicáveis fortes. |
| **VAR-B** | **Chips** clicáveis | Alternativa | Menor mudança visual; ainda cumpre FR-NFSE-GCAT-01 se padding ≥ 8px e `text-sm`. |

**Regra:** uma única variante por *release*; não misturar A e B em instâncias diferentes do mesmo padrão.

---

## 4. Wireframe lógico da micro-zona

### 4.1 VAR-A — Desktop (≥ `sm`)

```text
┌─ Grid 2 colunas: [ Cliente salvo ▼ ]  [ Serviço salvo ▼ ] ─────────┐
└────────────────────────────────────────────────────────────────────┘

  Linha de apoio (text-xs ou text-sm, cor secundária)
  "Cadastre ou edite itens para os atalhos acima."
  id="mei-nfse-catalog-actions-hint"   ← opcional: aria-describedby

  ┌─────────────────────────┐  ┌─────────────────────────┐
  │ [icon] Gerir clientes    │  │ [icon] Gerir serviços   │
  │      (atalho)            │  │      e produtos         │
  └─────────────────────────┘  └─────────────────────────┘
     planner-button-secondary      planner-button-secondary
     flex-1 min-w-0                 flex-1 min-w-0
```

- **Layout:** contentor `flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3` — em **mobile**, botões **empilhados** (`w-full`); em **`sm+`**, **dois alvos lado a lado** com largura equilibrada.  
- **Texto do botão:** preferir **uma linha** por botão; se “Gerir serviços e produtos” partir linha, permitir `whitespace-normal text-left` **ou** rótulo curto **“Serviços e produtos”** com `aria-label` longo (§9).

### 4.2 VAR-A — Mobile (< `sm`)

```text
[ Cliente salvo ▼  largura total ]
[ Serviço salvo ▼  largura total ]

(texto de apoio — 1 linha)

[ ícone  Gerir clientes          ]  ← largura total, min-height toque ≥ 44px
[ ícone  Gerir serviços e prod.  ]  ← largura total
```

### 4.3 VAR-B — Chips (alternativa)

- Par em `flex flex-col gap-2 sm:flex-row`.  
- Cada chip: `inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium` + classes de borda/cor alinhadas a `planner-input-compact` / slate (sem novos tokens globais).  
- **Mesma linha de apoio** acima dos chips que em VAR-A.

---

## 5. Anatomia do componente (molécula)

**Nome sugerido:** `MeiNfseCatalogManageActions` (ou equivalente no *folder* `frontend/src/components/`).

### 5.1 Props / contrato

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `inRouter` | `boolean` | Sim | `true` → renderizar `Link` do React Router; `false` → `<a href>`. **FR-NFSE-GCAT-04**. |
| `variant` | `'buttons' \| 'chips'` | Não | Defeito `'buttons'` (VAR-A). |
| `catalogEmpty` | `boolean` | Não | Se `true`, permite *hint* extra **P1** (**FR-NFSE-GCAT-03**) — ver §7.3. |
| `className` | `string` | Não | *Wrapper* opcional. |

**Rotas fixas (props internas ou constantes):**

- `/mei-catalogo/clientes`  
- `/mei-catalogo/servicos-produtos`

### 5.2 Conteúdo interno mínimo

1. **Bloco de *hint* didático** (sempre **FR-NFSE-GCAT-02**): um `<p>` com a copy canónica da §7.1.  
2. **Dois destinos** com label + ícone opcional (§6).  
3. **Opcional (P1):** segunda linha curta **só** se `catalogEmpty` e PO aceitar reforço local (§7.3).

### 5.3 Centralização

Todos os pontos de `GuidesMei.tsx` que hoje duplicam `catalogoClientesLinkClass` + par de links **devem** usar esta molécula (**FR-NFSE-GCAT-05**). Contagem esperada de *call sites*: alinhar a um *grep* no PR; o brief referiu hero + painel NFS-e — **um** componente evita drift.

---

## 6. Tokens, classes e ícones

### 6.1 Classes (sem tema novo — **NFR-GCAT-04**)

| Elemento | VAR-A | VAR-B |
|----------|-------|-------|
| Botão / chip | `planner-button-secondary` **ou** `planner-button-secondary-compact` conforme densidade da secção; preferir **`planner-button-secondary`** nesta zona para **área de toque** visível. | `border border-slate-300 bg-transparent text-sm … dark:border-slate-600` (espelhar contraste de `planner-input-compact`). |
| *Hint* | `text-xs text-slate-500 dark:text-slate-400` (ou `text-sm` se *only* linha didática na zona). | Idêntico. |
| Contentor | `flex flex-col gap-2` + `sm:flex-row sm:gap-3` para o par de controlos. | Idêntico. |

**Não** reutilizar a classe antiga `catalogoClientesLinkClass` para o novo padrão; pode permanecer só até remoção completa no refactor.

### 6.2 Ícones (recomendado VAR-A)

| Ação | Sugestão semântica | Notas |
|------|-------------------|--------|
| Gerir clientes | `Users` / `UserRound` / equivalente já importado no projeto | 16–18px; `shrink-0`; **não** ícone isolado sem texto visível. |
| Gerir serviços e produtos | `Package` / `Boxes` / `ShoppingBag` | Idem. |

Se o pacote de ícones do *frontend* já tiver um par usado em `MeiCatalogoClientes` / `MeiCatalogoServicosProdutos`, **reutilizar** para coerência de modelo mental.

---

## 7. Copy e estados

### 7.1 Linha didática principal (P0 — **FR-NFSE-GCAT-02**)

**Texto canónico (PT-PT):**

> **Cadastre ou edite itens para os atalhos acima.**

- **Uma** linha; não repetir nos dois botões.  
- Associa explicitamente **cadastro** ↔ **atalhos**.  
- *Alternativa aprovada por PO:* “O que guardar no catálogo aparece nos atalhos.” (tom ligeiramente mais conversacional.)

### 7.2 Rótulos dos controlos

| Destino | Rótulo visível (VAR-A) | Notas |
|---------|------------------------|--------|
| Clientes | **Gerir clientes** | Mantém verbo familiar. |
| Serviços/produtos | **Gerir serviços e produtos** **ou** **Serviços e produtos** | Se encurtar, **`aria-label="Gerir serviços e produtos"`** obrigatório. |

### 7.3 Catálogo vazio (**FR-NFSE-GCAT-03**, P1)

A spec pai (`ux-spec-mei-nfse-workspace-2026-04-01` **§4.2**, estado 2) já coloca no **cabeçalho dinâmico** a frase *“Cadastre clientes e serviços para usar atalhos, ou preencha o formulário manualmente.”* com CTAs para as mesmas rotas.

**Regra anti-redundância:**

- **Não** duplicar essa frase longa no bloco de botões.  
- **Opção A (preferida):** *hint* local = apenas §7.1 (igual com catálogo vazio ou cheio).  
- **Opção B (se PO quiser reforço):** uma linha **extra** **só** quando `catalogEmpty`, curta e diferente do cabeçalho, ex.: *“Ainda sem itens guardados.”* — **sem** repetir “cadastre clientes e serviços” na íntegra.

Coordenação final com **FR-NFSE-UX-07**: uma única “fonte” da mensagem *estratégica* longa = cabeçalho; zona de atalhos = **reforço estrutural** (controlos + *hint* §7.1).

---

## 8. Comportamento e navegação

| Aspeto | Regra |
|--------|--------|
| **Clique** | Navegação completa para a rota; sem `preventDefault` extra. |
| **`Link` vs `<a>`** | Mesmos `to` / `href`; **sem** `target="_blank"` salvo decisão futura explícita. |
| **Estado desabilitado** | Não aplicável — sempre navegável se utilizador tem acesso à rota (guards inalterados). |
| **Hover / focus** | Usar estados já definidos em `planner-button-secondary` (anel de foco visível — **NFR-GCAT-01**). |

---

## 9. Acessibilidade (**NFR-GCAT-01**)

| Requisito | Implementação |
|-----------|----------------|
| **Contraste** | Texto dos botões e bordas conforme tokens existentes; validar *pair* no tema claro e escuro. |
| **Foco** | Ordem de tabulação: *hint* (se não for focável, ignorar) → botão 1 → botão 2 → seguinte controlo da página. |
| **Nome acessível** | Se rótulo visual curto, `aria-label` completo no destino mais verboso. |
| **Ícones** | `aria-hidden="true"` nos SVG decorativos; significado no texto do botão. |
| **Região** | Opcional: `aria-labelledby` no *wrapper* apontando para um `id` do *hint* — útil se leitor de ecrã beneficiar de contexto agrupado (testar com NVDA/VoiceOver). |

---

## 10. Mapeamento FR-NFSE-GCAT-* → esta spec

| ID | Secção(is) desta spec |
|----|------------------------|
| **FR-NFSE-GCAT-01** | §4, §6 — peso visual e área clicável (VAR-A ou VAR-B). |
| **FR-NFSE-GCAT-02** | §7.1, §5.2 — *hint* didático obrigatório. |
| **FR-NFSE-GCAT-03** | §7.3 — regra de não duplicação com cabeçalho **FR-NFSE-UX-07**. |
| **FR-NFSE-GCAT-04** | §5.1 `inRouter`, §8 — paridade `Link` / `<a>`. |
| **FR-NFSE-GCAT-05** | §5 — molécula única; §5.3 centralização. |

---

## 11. Checklist de QA (rápido)

- [ ] Desktop: dois botões lado a lado com largura equilibrada; *hint* acima.  
- [ ] Mobile: botões `w-full`, altura de toque confortável.  
- [ ] Tema escuro: contraste aceitável e bordas visíveis.  
- [ ] Tab: foco visível nos dois destinos.  
- [ ] `inRouter` true/false: navegação correta em ambos.  
- [ ] Catálogo vazio: cabeçalho dinâmico + zona de atalhos sem mensagens contraditórias.  
- [ ] Regressão visual: **Emitir NFS-e** e **Salvar emitente** mantêm hierarquia primária.

---

## 12. Referências

- `docs/prd/PRD-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md`  
- `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` (NFS-L1-A, §4–5)  
- `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md` (§3.3)

---

— *Spec pronta para *handoff* a engenharia e @sm (story + *file list*).*
