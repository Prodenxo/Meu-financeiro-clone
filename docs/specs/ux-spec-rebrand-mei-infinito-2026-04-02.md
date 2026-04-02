# Especificação de front-end e UX — Rebrand **Mei Infinito** (naming da área MEI)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-rebrand-mei-infinito-2026-04-02.md`](../prd/PRD-rebrand-mei-infinito-2026-04-02.md)  
**Brief:** [`docs/brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md`](../brief/brief-rebrand-meu-mei-para-mei-infinito-2026-04-02.md)

---

## 1. Objetivo deste documento

Definir o **contrato de copy, superfícies e acessibilidade** para substituir o nome de produto **«Meu MEI»** por **«Mei Infinito»** onde esse texto designa a **área dedicada ao MEI** na aplicação — **sem** alterar layout, tokens visuais, hierarquia de ecrã nem requisitos **FR-UX-MEI-*** da [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md).

Este ficheiro **complementa** a spec L0–L3 de `/guias-mei`: onde ambas se aplicam à mesma string (ex.: título do hero), **prevalecem as tabelas deste documento** para o **texto visível**; estrutura HTML, classes CSS e comportamento mantêm-se conforme spec original, salvo quando explicitamente referido (ex.: nome acessível = texto visível).

---

## 2. Relação com outras especificações

| Documento | Relação |
|-----------|---------|
| [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) | Continua canónica para **IA**, **wireframes**, **KPIs**, **tabs**, **cartões**, **FR-UX-MEI-***. **Substituir** apenas ocorrências narrativas e de UI de **«Meu MEI»** (nome da área) por **Mei Infinito** quando este spec o lista. |
| [`ux-spec-mei-nfse-workspace-2026-04-01.md`](ux-spec-mei-nfse-workspace-2026-04-01.md) (se existir) | Links «Voltar ao…» e menções ao nome da área devem alinhar à **secção 4** abaixo. |
| Specs de catálogo MEI | Idem para retornos e copy satélite. |

**Opção A (ficheiros):** não renomear `ux-spec-meu-mei-ui-*.md`; atualizar **conteúdo** interno das specs para o novo nome onde for nome de área.

---

## 3. Terminologia e regras de exclusão

### 3.1 O que muda (nome da área produto)

| Contexto | De | Para |
|----------|-----|------|
| Marca da área | Meu MEI | **Mei Infinito** |
| Retorno contextual (links/botões) | Voltar ao Meu MEI | **Voltar ao Mei Infinito** |
| Bloqueio de permissão (título) | Área Meu MEI não disponível | **Área Mei Infinito não disponível** |
| Admin — painel cliente | Meu MEI (cliente) | **Mei Infinito (cliente)** |

**Capitalização:** **M**ei **I**nfinito (duas palavras; «Infinito» com inicial maiúscula).

### 3.2 O que não muda

| Elemento | Motivo |
|----------|--------|
| **Meu Financeiro** | Nome da aplicação; não substituir por Mei Infinito. |
| **MEI** sozinha ou em expressões de regime | Sigla do microempreendedor individual (ex.: «Fluxo do MEI», «enquadramento MEI», textos legais/fiscais). |
| Rotas `/guias-mei`, `/mei-catalogo/...` | Fora de âmbito; URLs estáveis. |
| IDs de requisito `FR-UX-MEI-*`, `FR-BRAND-*` | Rastreabilidade; apenas o **texto** apresentado ao utilizador muda. |
| Classes CSS (`admin-hero-title`, etc.) | Sem renomeação obrigatória; só o **conteúdo textual** dos nós. |

### 3.3 Armadilha (revisão manual)

Expressões como «guia MEI» ou «notas MEI» referem-se ao **regime**, não ao nome da área: **não** trocar «MEI» por «Mei Infinito» nesses casos.

---

## 4. Inventário por superfície (UI)

### 4.1 Navegação global — Sidebar (desktop ≥ md)

| Elemento | Comportamento UX | Copy canónica | FR-BRAND |
|----------|-------------------|---------------|----------|
| `Link` para `/guias-mei` | Único rótulo da área MEI na lista principal | **Mei Infinito** | FR-BRAND-02 |
| Estado ativo | Mantém lógica atual (pathname exato vs catálogo) | — | — |

**Acessibilidade:** o **nome acessível** do link deve coincidir com o texto visível (**Mei Infinito**), salvo `aria-label` mais descritivo acordado (ex.: «Mei Infinito — guia fiscal») — se existir, deve **começar por** «Mei Infinito» para consistência com busca por voz.

### 4.2 Atalhos rápidos — `Layout` (viewport &lt; md / FAB)

| Elemento | Copy canónica | FR-BRAND |
|----------|---------------|----------|
| Atalho para `/guias-mei` | **Mei Infinito** (igual à sidebar) | FR-BRAND-03 |

### 4.3 Página `/guias-mei` — Hero (L1)

| Elemento | Classe / papel | Texto |
|------------|----------------|-------|
| Título principal | `admin-hero-title` | **Mei Infinito** |

Subtítulo, badges e grelha KPI: **sem alteração de copy** por este spec (continua [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) §4.1), exceto referências explícitas no corpo a «Meu MEI» como nome da área.

**Wireframe lógico (apenas label L1):**

```text
┌──────────────────────────────────────────────────────────────┐
│ [L1 HERO] Mei Infinito              [Badge status certificado] │
│ … (inalterado quanto a KPIs e subtítulo, salvo grep editorial) │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Links «Voltar ao…» (workspaces satélites)

Onde existir navegação secundária de retorno à área principal MEI:

| Copy | FR-BRAND |
|------|----------|
| **Voltar ao Mei Infinito** | FR-BRAND-01 |

Aplicar de forma uniforme (ex.: `GuidesMei.tsx` zonas NFS-e/outros, `MeiCatalogoClientes.tsx`, `MeiCatalogoServicosProdutos.tsx`).

### 4.5 Bloqueio de acesso — `accessBlockPresets` / explicador

| Campo | Valor |
|-------|--------|
| Título | **Área Mei Infinito não disponível** |

Corpo da mensagem: manter tom e estrutura existentes; apenas ajustar referências ao nome antigo da área, se houver.

### 4.6 Admin — dados de utilizador

| Elemento | Copy |
|----------|------|
| Secção / título contextual | **Mei Infinito (cliente)** |

### 4.7 Comentários e CSS

Prioridade P2: comentários que servem de documentação humana («Meu MEI» como nome de produto) → **Mei Infinito**; não bloquear release P0.

---

## 5. Acessibilidade (NFR-BRAND-01)

| Requisito | Verificação |
|-----------|-------------|
| **Consistência** | Leitor de ecrã anuncia o mesmo nome que o utilizador vê nos links principais (sidebar + FAB + hero). |
| **Foco** | Após alteração de texto, ordem de tab e estados `:focus-visible` inalterados. |
| **Sem ambiguidade** | Evitar `aria-label` genérico «Voltar» sem referência ao destino; preferir incluir **Mei Infinito** se o padrão atual já nomeava o destino. |

---

## 6. Design system e tokens

**Sem alteração** de cores, tipografia, espaçamentos ou componentes por este rebrand. Trata-se exclusivamente de **substituição de strings**.

---

## 7. Mapeamento PRD → esta spec

| ID PRD | Secção desta spec |
|--------|-------------------|
| FR-BRAND-01 | §4 global + §3 |
| FR-BRAND-02 | §4.1 |
| FR-BRAND-03 | §4.2 |
| FR-BRAND-04 | §2 + atualização editorial da [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) (título L1 e narrativa) |
| FR-BRAND-05 | Docs satélites (fora do JSX; seguir tabelas §3–4) |
| FR-BRAND-06 | §4.7 |

---

## 8. Checklist de aceite (UX / QA)

1. Sidebar, FAB, hero `/guias-mei`: texto **Mei Infinito** conforme §4.  
2. Nenhuma string de UI com **«Meu MEI»** como nome da área (grep + revisão §3.3).  
3. **Meu Financeiro** e sigla **MEI** (regime) preservados onde aplicável.  
4. Leitura rápida com NVDA/VoiceOver nos links renomeados (smoke).  
5. Screenshots de referência opcionais: antes/depois apenas do **bloco de título** e da **sidebar** (evidência de consistência).

---

## 9. Ficheiros de implementação (referência)

| Área | Ficheiros típicos |
|------|-------------------|
| Guia MEI | `frontend/src/pages/GuidesMei.tsx` |
| Shell | `frontend/src/Layout/Sidebar.tsx`, `frontend/src/Layout/Layout.tsx` |
| Catálogo | `frontend/src/pages/MeiCatalogoClientes.tsx`, `MeiCatalogoServicosProdutos.tsx` |
| Permissões | `frontend/src/lib/accessBlockPresets.ts`, componentes de bloqueio associados |
| Admin | `frontend/src/pages/AdminUserData.tsx` |
| Estilos | `frontend/src/index.css` (comentários apenas, P2) |

---

## 10. Histórico de versões

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-02 | Versão inicial alinhada ao PRD-rebrand-mei-infinito-2026-04-02. |

---

— *Spec pronta para *file list* em story e implementação em conjunto com a spec canónica da área Mei Infinito (`ux-spec-meu-mei-ui-2026-03-30.md`).*
