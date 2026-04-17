# Evidência canónica — Onda 1 (VIS-THEME / FR-VIS-THEME-03)

**Story:** [STORY-VIS-THEME-03](../stories/story-vis-theme-p0-qa-regressao-visual-e-contraste.md)  
**Data do artefacto:** 2026-04-17  
**Ambiente:** local (`npm run dev`) ou staging — _preencher URL usada na verificação final_  
**Build / integração:** branch/commit de referência: `19a452309837c82bfe7582c4e4c7a70080b0fb0b` (_atualizar se o merge for outro_)

---

## 1. Cabeçalho (metadados)

| Campo | Valor |
|--------|--------|
| Responsável elaboração estrutura | Eng. (Dex / AIOX) |
| Execução checklist visual §8 | _Pendente QA / PO_ |
| Assinatura QA | _data / nome_ |

---

## 2. Checklist UX spec §8 (8 linhas)

Executar em **tema claro** e **tema escuro** (Definições ou mecanismo existente).  
Para cada linha: marcar **Passa** ou **N/A** (uma coluna por tema) e nota se N/A.

Fonte: [UX spec §8](../specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md#8-checklist-de-regressão-visual-fr-vis-theme-03).

| # | Área | O que verificar | Claro — Passa? | Escuro — Passa? | N/A? | Nota |
|---|------|-----------------|----------------|-----------------|------|------|
| 1 | Header | Borda inferior visível; botão sidebar legível | ☐ | ☐ | ☐ | Shell Onda 0: `frontend/src/Layout/Header.tsx` |
| 2 | Sidebar | Borda direita; ícones inativos legíveis; ativo azul legível | ☐ | ☐ | ☐ | `frontend/src/Layout/Sidebar.tsx` |
| 3 | Bottom nav (mobile) | Ícones inativos no escuro; ativo distinguível | ☐ | ☐ | ☐ | `frontend/src/components/BottomNavigation.tsx` — viewport estreito |
| 4 | Dashboard | Cartões principais com contorno perceptível | ☐ | ☐ | ☐ | |
| 5 | Transações | Tabelas/listas: linhas ou cartões não “somem” no fundo | ☐ | ☐ | ☐ | |
| 6 | Definições | Toggle/área de tema; textos secundários legíveis | ☐ | ☐ | ☐ | |
| 7 | `/guias-mei` | Scroll: secções com divisórias perceptíveis | ☐ | ☐ | ☐ | Ver [evidence-vis-theme-02-guidesmei-bordas.md](./evidence-vis-theme-02-guidesmei-bordas.md); teste `GuidesMei.visThemeBorders.test.ts` |
| 8 | Modal catálogo (produto ou cliente) | Fecho visível e tocável nos dois temas | ☐ | ☐ | ☐ | Ver [evidence-vis-theme-01-contraste.md](./evidence-vis-theme-01-contraste.md); modais `MeiCatalogoProdutoModal` / `MeiCatalogoClienteModal` |

**Itens 7 ou 8 em N/A:** justificar (ex.: utilizador sem acesso Mei Infinito / modal indisponível no ambiente).

**Critério de conclusão Onda 1 (UX spec):** todos os itens **Passa** ou **N/A** documentado.

### Guia de smoke (rotas e pré-requisitos) — mitigação risco QA

Fonte de rotas: `frontend/src/App.tsx` (rotas autenticadas dentro de `Layout`).

| # §8 | Rota sugerida | Pré-requisitos / notas |
|------|---------------|-------------------------|
| 1–2 | Qualquer rota autenticada (ex.: `/`) | Header + Sidebar visíveis em desktop; sidebar pode ser colapsável — validar botão menu |
| 3 | `/` ou `/transacoes` | **Viewport mobile:** largura ≤768px (DevTools responsive ou telemóvel) para `BottomNavigation` |
| 4 | `/` | Dashboard — cartões principais |
| 5 | `/transacoes` | Tabela/lista de transações |
| 6 | `/settings` | Toggle / área de tema e textos secundários |
| 7 | `/guias-mei` | Utilizador com acesso Mei Infinito (`canAccessMeiArea`); sem acesso → **N/A** com justificativa |
| 8 | `/mei-catalogo/servicos-produtos` ou `/mei-catalogo/clientes` | Abrir **Novo** ou **Editar** para mostrar `MeiCatalogoProdutoModal` / `MeiCatalogoClienteModal`; sem MEI → **N/A** |

**Tema claro/escuro:** alterar em **Definições** (`/settings`) e repetir as linhas relevantes.

---

## 3. Contraste (NFR-VIS-THEME-01) — amostragem Onda 1

| Amostra | Par fundo / primeiro plano (resumo) | Ferramenta | Resultado |
|---------|----------------------------------------|------------|-----------|
| Fecho modais catálogo MEI | Ver tabela em [evidence-vis-theme-01-contraste.md](./evidence-vis-theme-01-contraste.md) | WebAIM ou equivalente | Pass AA (análise com equivalentes sólidas) |
| Divisórias `/guias-mei` (neutras) | Par canónico `border-slate-200` / `dark:border-slate-700` — não é texto; ver §7 UX para gráficos se aplicável | — | Alinhado a [evidence-vis-theme-02-guidesmei-bordas.md](./evidence-vis-theme-02-guidesmei-bordas.md) |

**Nota:** amostragem focada nas entregas STORY-01 / STORY-02; não é auditoria WCAG completa do site.

---

## 4. NFR-VIS-THEME-02 (bordas no tema claro)

Parecer: bordas neutras Onda 1 usam par canónico sem acrescentar “segunda borda” em cartões (FR-VIS-THEME-04). **Subjetivo:** se houver disputa “borda pesada”, usar screenshot em ambiente de pré-visualização (PRD §11).

---

## 5. Shell Onda 0 + critérios globais PRD §10

Fonte: [PRD §10](../prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md#10-critérios-de-aceite-globais-release-da-onda-1).

| Critério PRD §10 | Verificado? | Nota |
|------------------|-------------|------|
| Navegação inferior: ícones inativos distinguem-se do fundo no **tema escuro** | ☐ | Alinhado a checklist §8 item 3 |
| Sidebar: borda direita visível e equilibrada no **tema claro** | ☐ | §8 item 2 |
| Cartões/tabelas admin/planner: contornos perceptíveis nos dois temas | ☐ | §8 itens 4–5 |
| Modais auditados: fecho/ação não só cinza demasiado claro no escuro | ☐ | §8 item 8 + STORY-01 |
| Documentação: PRD/brief referenciados; stories em `docs/stories/` ligadas | ☑ | Este ficheiro + stories VIS-THEME |

**Critérios globais §10 “satisfeitos”:** ☐ sim (após preenchimento) / ☐ exceção aprovada PO: _descrever_

---

## 6. Artefatos (ligação ao repositório)

| Artefato | Path |
|----------|------|
| PRD | [PRD-revisao-visual-temas-claro-escuro-2026-04-17.md](../prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md) |
| Brief | [brief-revisao-visual-temas-claro-escuro-2026-04-17.md](../brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md) |
| UX spec | [ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md](../specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md) |
| Arquitetura | [architecture-revisao-visual-temas-claro-escuro-2026-04-17.md](../technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md) |
| Evidência STORY-01 | [evidence-vis-theme-01-contraste.md](./evidence-vis-theme-01-contraste.md) |
| Evidência STORY-02 | [evidence-vis-theme-02-guidesmei-bordas.md](./evidence-vis-theme-02-guidesmei-bordas.md) |

---

## 7. Assinatura

| Papel | Nome | Data |
|-------|------|------|
| QA (checklist §8 + §10) | _pendente_ | |
| PO / delegado (aceite critérios §10 PRD, se aplicável) | _pendente_ | |

---

_Estrutura mínima conforme template STORY-VIS-THEME-03. Substitua ☐ por ☑ após verificação._
