# Especificação de front-end e UX — Mei Infinito (`/guias-mei`)

**Versão:** 1.0  
**Data:** 2026-03-30  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`, tokens em `frontend/src/index.css`  

---

## 1. Objetivo deste documento

Servir de **contrato de experiência e implementação** entre UX, produto e engenharia: estrutura de ecrã, comportamento dos componentes, regras de conteúdo (métricas e *copy*), acessibilidade e mapeamento a **FR-UX-MEI-***. Não substitui stories em `docs/stories/`; alimenta checklist de aceite e *file list*.

---

## 2. Arquitetura de informação (IA)

### 2.1 Hierarquia de níveis

| Nível | Nome canónico | Função |
|-------|----------------|--------|
| L0 | Página | Rota `/guias-mei`; título de documento / *shell* existente do *layout*. |
| L1 | **Hero Mei Infinito** | Identidade da área, *value proposition* em uma linha, **fonte canónica de KPIs** (FR-UX-MEI-01). |
| L2 | **Fluxo do MEI** (navegação contextual) | Seleção de *workspace*: `overview`, `das`, `nfse`, `parcelamentos`. |
| L3 | **Área de trabalho** | Conteúdo varia por `activeWorkspace`; em `overview`, bloco **Visão geral operacional**. |

### 2.2 Mapa de *workspaces* (inalterado conceptualmente)

- `overview` — Visão geral + atalhos.  
- `das` — Certificado digital + CNPJ + DAS (+ bloco NFS-e mínimos se `canViewNfse`).  
- `nfse` — Lista / emissão NFS-e.  
- `parcelamentos` — Consulta SERPRO.  

---

## 3. Wireframes lógicos (baixa fidelidade)

### 3.1 Desktop (≥ md)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [L1 HERO] Mei Infinito               [Badge status certificado]  │
│ Subtítulo (com/sem NFS-e)                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ Períodos │ │ Pendênc. │ │ Notas*   │ │ Status   │  ← KPIs     │
│ │   DAS    │ │   DAS    │ │ exibidas │ │ certif.  │  (* se NFSe)│
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [L2] Fluxo do MEI — subtítulo orientação                        │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ Visão      │ │ Certif.    │ │ NFS-e*     │ │ Parcelam.  │    │
│ │ geral      │ │ e DAS      │ │            │ │            │    │
│ │ [sem #dup] │ │ [estado]   │ │ [estado]   │ │ [estado]   │    │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
└─────────────────────────────────────────────────────────────────┘

(se activeWorkspace === overview)

┌─────────────────────────────────────────────────────────────────┐
│ [L3] Visão geral operacional                                     │
│ ┌─────────────────────────┐ ┌─────────────────────────┐       │
│ │ Certificado e DAS       │ │ NFS-e*                  │       │
│ │ 2–3 linhas estado       │ │  idem                    │       │
│ │ [CTA primário]          │ │ [CTA primário]          │       │
│ │ badges secundários      │ │ ou empty state          │       │
│ └─────────────────────────┘ └─────────────────────────┘       │
│ ┌─────────────────────────┐                                    │
│ │ Parcelamentos           │                                    │
│ └─────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Regra de redundância (FR-UX-MEI-01)

- **O *grid* de estatísticas do hero** (`admin-stat-grid` / `admin-stat-card`) é a **única** zona que mostra os **valores numéricos brutos** para: `meiPeriods.length`, `dasPendentesCount`, `filteredNfseList.length` (se aplicável).  
- Nos botões do **Fluxo do MEI**, o canto inferior/direito (`tab.badge`) **não** repete o mesmo número para a mesma métrica. Substituir por:
  - **texto de estado** (ex.: “Resumo de períodos”, “Ver guias”, “Acompanhar notas”) **ou**
  - **atalho sem número** (ex.: “Ir para DAS”) **ou**
  - número **só** se for *informação nova* relativa ao tab (ex.: contagem distinta — hoje não há, evitar duplicar).

*Tabela de substituição sugerida (implementação)*

| Tab | `badge` atual (duplicado) | Proposta de `badge` (sem duplicar KPI) |
|-----|---------------------------|----------------------------------------|
| Visão geral | `N períodos DAS` | `Resumo e atalhos` ou `Ver detalhes no topo` (evitar N) |
| Certificado e DAS | `N pendências` / `Sem pendências` | `Configurar e gerar` + estado curto: `Há pendência` / `Em dia` *(sem repetir N se o hero já mostra o dígito)* |
| NFS-e | `N notas no filtro` | `Emitir e filtrar` ou `Notas de serviço` *(contagem só no hero)* |
| Parcelamentos | pode manter `N pedidos` se **não** existir KPI equivalente no hero; caso contrário estado: `Consulta SERPRO` |

*Nota de produto:* se o negócio quiser **manter** um número no tab por *scan* rápido, a alternativa é **remover** esse KPI do hero **ou** do cartão correspondente na visão geral — **uma** fonte canónica, não três.

---

## 4. Componentes e comportamento

### 4.1 Hero (`admin-hero`)

| Elemento | Classe / padrão | Comportamento |
|----------|-----------------|---------------|
| Título | `admin-hero-title` | Texto fixo: “Mei Infinito”. |
| Subtítulo | `admin-hero-subtitle` | Condicional `canViewNfse` (já existente). |
| Badge de certificado | `admin-badge-success` / `primary` / `warning` | Mantém `certificateScopeLabel`; alinhado a FR-UX-MEI-04 (ver §5). |
| *Stat cards* | `admin-stat-card` | **Somente leitura**; remover *hover* que sugira clicável se não houver `onClick` (hoje há `hover:-translate-y` — **especificação:** remover tradução/sombra de “cartão clicável” nos KPIs **ou** documentar como “inspeção visual” neutra, sem affordance de botão). |

**FR-UX-MEI-03:** KPIs não devem parecer botões; não usar `cursor-pointer` nos stat cards.

### 4.2 Navegação “Fluxo do MEI”

| Elemento | Implementação atual | Especificação alvo |
|----------|---------------------|-------------------|
| Container | `admin-toolbar` + `grid` | Manter; garantir gap e área de toque ≥ 44×44 px efetivos (padding). |
| Item | `<button>` + `planner-tab` + `planner-tab-active` | Manter *pattern.* |
| Estado ativo | `planner-tab-active` | **Reforçar** contraste *dark*: considerar anel `ring-2 ring-blue-400/50` no ativo **ou** borda inferior 2px no `rounded-xl` (decisão única no CSS; não ambos excessivos). |

**Acessibilidade (FR-UX-MEI-05):**

- Preferível **tablist** semântico: contentor `role="tablist"`, cada botão `role="tab"`, `aria-selected={true|false}`, `aria-controls` apontando para `id` do painel visível (o painel com `role="tabpanel"`).  
- Se se mantiver apenas botões: pelo menos `aria-selected` (em alternativa consistente a `aria-pressed`) + **ordem de foco** = ordem visual.  
- Foco visível: `focus-visible:outline` ou `ring` compatível com tema escuro (cumprir NFR-UX-01).

### 4.3 Visão geral operacional — cartões atalho

Cada cartão é **zonas claras**:

1. **Título** (`text-sm font-semibold`) — inalterado conceptualmente.  
2. **Corpo** — 2–3 linhas: mistura de *copy* estático + dados reais (pendências, contagem de notas **permitida aqui** se for “resumo de ação”, **ou** referência “conforme resumo acima” para cumprir FR-UX-MEI-01).  
3. **Linha de ação** — botão explícito `planner-button-secondary` / link estilizado: texto tipo **“Abrir Certificado e DAS”**, **“Abrir NFS-e”**, **“Abrir parcelamentos”** (substituir ou complementar o `onClick` em todo o cartão — ver §4.4).  
4. **Badges** — secundários; não repetir três vezes o mesmo inteiro.

**Empty states (FR-UX-MEI-02):**

- NFS-e: se `filteredNfseList.length === 0` e `nfseList` vazio (ou critério acordado), mostrar: *“Nenhuma nota no período/filtro atual.”* + CTA *“Emitir NFS-e”* / *“Ajustar filtros”* conforme estado de `activeWorkspace` futuro.  
- Parcelamentos: se zero pedidos, CTA *“Consultar na SERPRO”* mantém orientação.

### 4.4 Cartão clicável vs botão (FR-UX-MEI-03)

**Opção A (recomendada):** Cartão = `div` com sombra/borda; **dentro**, botão primário único com label claro. Clicar fora do botão não navega (reduz cliques acidentais).

**Opção B:** Manter cartão `<button>` mas adicionar **ícone** “→” ou texto “Abrir” sempre visível para reforçar affordance.

*Mobile:* Opção A favorece alvos tocáveis claros.

---

## 5. Certificado do servidor e alinhamento (FR-UX-MEI-04)

| Estado (`certificateScopeLabel`) | Comportamento UX |
|--------------------------------|------------------|
| Certificado (utilizador) | Badge verde no hero; copy na visão geral: “Certificado em uso na sessão”. |
| Certificado do servidor | Badge azul (`admin-badge-primary`); subtítulo ou linha no hero: *“Autenticação via certificado do servidor; envie o seu se precisar de operações com o seu A1.”* **ou** link *“Saiba mais”* para *scroll* à secção Certificado em `das`. |
| Sem certificado ativo | Badge aviso; CTA na visão geral destacado *“Configurar certificado”* levando a `das`. |

Não introduzir botão solto sem rótulo de destino; qualquer controlo “servidor” deve referir **o mesmo** fluxo que `activeWorkspace === 'das'`.

---

## 6. Microcopy (FR-UX-MEI-06)

| Local | Texto atual (referência) | Direção |
|-------|--------------------------|---------|
| Hero subtítulo | Já claro | Manter; opcional segunda linha dinâmica se `dasPendentesCount > 0`: *“Há períodos DAS em aberto — abra Certificado e DAS.”* |
| Fluxo do MEI subtítulo | “Navegue por contexto…” | Opcional: *“Use as áreas abaixo; os números principais estão no resumo acima.”* *(só se FR-UX-MEI-01 aplicado)* |
| Visão geral subtítulo | “Escolha uma etapa…” | Manter ou *“Atalhos para cada etapa do fluxo MEI.”* |

*Regra:* strings dinâmicas só com variáveis já existentes no componente (`dasPendentesCount`, `hasUserCertificate`, etc.).

---

## 7. Design tokens e CSS (NFR-UX-04)

**Reutilizar** (não criar tokens paralelos sem necessidade):

- Cartões / secções: `planner-card`, `admin-section-card`, `admin-hero`.  
- Títulos: `admin-hero-title`, `admin-section-title`, `admin-section-subtitle`.  
- Navegação: `planner-tab`, `planner-tab-active`.  
- Botões: `planner-button-secondary`, `planner-input-compact`.  
- Badges: `admin-badge-*` (já usados).  

**Ajustes permitidos** em `index.css`:

- Variante `.planner-tab-active` com reforço de contraste *dark*.  
- `.admin-stat-card` sem *hover* de “elevação” **ou** *hover* subtíris só se permanecer não interativo.  

**Proibido** neste *slice:* novo tema de cores global ou troca de família tipográfica.

---

## 8. Dados e *props* (sem novos endpoints)

Mapeamento **UX → estado existente** em `GuidesMei.tsx` (referência):

| Conteúdo UX | Fonte (já no ficheiro) |
|---------------|-------------------------|
| Períodos DAS | `meiPeriods.length` |
| Pendências | `dasPendentesCount` |
| Notas filtradas | `filteredNfseList.length`, `nfseList` |
| Certificado | `hasUserCertificate`, `hasServerCertificate`, `certificateScopeLabel`, `certValidFrom` / `To` |
| Parcelamentos | `parcelamentosList.length` |
| Tabs | `workspaceTabs` (+ alteração de `badge` conforme §3.2) |

Se algum empty state exigir dado não calculado hoje, levantar **spike** mínimo (produto); fora do escopo PRD sem aprovação.

---

## 9. Responsividade

- *Grid* hero: 2 colunas (`sm`) → 4 (`lg`), já alinhado a `admin-stat-grid`.  
- Tabs: 3 ou 4 colunas `md`; abaixo de `md`, **scroll horizontal** com *snap* opcional ou *stack* (evitar botões cortados).  
- Cartões visão geral: `md:grid-cols-2`; parcelamentos pode ocupar largura total ou ½ — preferir **1 coluna** em mobile para leitura.

---

## 10. Matriz de rastreio PRD ↔ UI

| ID PRD | Secção desta spec |
|--------|-------------------|
| FR-UX-MEI-01 | §3.2 |
| FR-UX-MEI-02 | §4.3, §8 |
| FR-UX-MEI-03 | §4.1, §4.4 |
| FR-UX-MEI-04 | §5 |
| FR-UX-MEI-05 | §4.2 |
| FR-UX-MEI-06 | §6 |
| FR-UX-MEI-07 | §11 |
| NFR-UX-01–04 | §4.2, §7, §9 |

---

## 11. Preferência de última tab (FR-UX-MEI-07, P2)

- Chave sugerida: `mei-workspace-last` (valores: `overview` | `das` | `nfse` | `parcelamentos`).  
- Ler no *mount*; gravar em `setActiveWorkspace`.  
- Respeitar *feature* e política de privacidade: não guardar PII; apenas preferência de UI.  
- *Fallback:* `overview` se valor inválido ou `canViewNfse` falso e último foi `nfse`.

---

## 12. Checklist de aceite (réplica para story)

- [ ] Hero: KPIs sem affordance de clique; um dígito por métrica na viewport.  
- [ ] Tabs: badges sem duplicar números do hero (ou hero ajustado como única fonte, documentado).  
- [ ] Visão geral: cada cartão com 2–3 linhas + CTA ou empty state.  
- [ ] Certificado servidor alinhado a copy e fluxo `das`.  
- [ ] Tabs: foco visível + `aria-selected` (ou `tab`/`tabpanel`).  
- [ ] `npm run lint` e `npm run typecheck` no `frontend`; testes `App.mei-gate.test.tsx` OK.  
- [ ] *(P2)* Última tab persistida conforme §11.

---

## 13. Referências

- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`  
- `frontend/src/pages/GuidesMei.tsx` (estrutura L1–L3)  
- `frontend/src/index.css` — utilitários `.admin-*`, `.planner-tab*`  

---

— *Especificação pronta para *story* e implementação incremental (P0 → P1 → P2).*
