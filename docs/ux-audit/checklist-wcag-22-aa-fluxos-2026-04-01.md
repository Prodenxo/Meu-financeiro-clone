# Checklist WCAG 2.2 AA — fluxos prioritários (Fase A)

**Data:** 2026-04-01  
**Requisito PRD:** FR-UX-GLOBAL-A05  
**Spec:** `docs/specs/ux-spec-revisao-iu-ux-global-2026-04-01.md` §7.1  

---

## Estado da verificação (clareza pós-QA)

| Símbolo | Significado |
|---------|-------------|
| **P** | **Passou** em inspeção estática (código / revisão humana) na data do cabeçalho — **não** substitui auditoria instrumental. |
| **P\*** | **Hipótese** com **amostragem parcial** (subconjunto de páginas); tratar como **pendente** até varrimento completo ou ferramenta. |
| **P\*\*** | Caso especial documentado na nota de rodapé (ex.: bottom nav + rótulo “Mais”). |
| **P\*\*\*** | Assunção documentada; **obrigatório** revalidar em QA manual nos formulários de auth. |
| **N/A** | Critério não aplicável ao fluxo nesta fase. |
| **Pend. inst.** | A preencher na [tabela de histórico](#histórico-de-execução-instrumental) após Axe, Lighthouse ou equivalente. |

**Seguimento QA:** valores **P\*** na grelha abaixo **não** fecham o critério AA para todo o fluxo até execução das verificações da secção “Itens a revalidar” e registo no histórico.

---

## Legenda compacta (tabela)

**P** = Passou (inspeção estática) · **F** = Falhou · **N/A** = Não aplicável.

---

## Tabela por fluxo

| Critério (resumo) | Autenticação | Núcleo financeiro | Planeamento | Conta | MEI + catálogo | Shell |
|-------------------|--------------|-------------------|-------------|-------|----------------|-------|
| Contraste mínimo (texto/UI) | P | P* | P* | P* | P* | P* |
| Foco visível | P | P* | P* | P* | P* | P |
| Ordem de foco lógica | P | P* | P* | P* | P* | P |
| Nome acessível (ícones só) | P | P* | P* | P* | P* | P** |
| Erros associados a campos | P*** | P* | P* | P* | P* | N/A |
| Alvo tocável ≥ 24×24 CSS (mobile) | P | P* | P* | P* | P* | P** |
| Motion / `prefers-reduced-motion` | N/A | N/A | N/A | N/A | N/A | N/A |

\* *Amostra: `Login`, `Dashboard`, `Transactions`, `Settings`, `Sidebar`, `BottomNavigation`, `Layout` — outras vistas do mesmo fluxo ficam **Pend. inst.** ou nova linha no histórico.*  
\** *Bottom nav: nome visível + ícone; risco semântico em “Mais” (matriz UX-GLOBAL-M007).*  
\*** *Login/registo: assumida associação label/input; confirmar em QA manual.*

---

## Histórico de execução instrumental

Preencher após Axe / Lighthouse / pa11y / inspeção teclado (fecha ressalva QA sobre **P\***).

| Ferramenta / método | Data (YYYY-MM-DD) | Rotas ou âmbito | Resultado (resumo) | Responsável |
|---------------------|-------------------|-----------------|--------------------|-------------|
| *Ex.: Lighthouse* | | `/login`, `/`, … | | |
| *Ex.: Teclado* | | Shell + 1 formulário | | |

*Estado atual: **nenhuma execução registada** — Fase A documental apenas.*

---

## Itens a revalidar com ferramenta (não bloqueantes Fase A)

1. Executar **Axe** ou **Lighthouse** em: `/login`, `/`, `/transacoes`, `/settings`, `/guias-mei` (utilizador com MEI).  
2. Percursos completos **teclado** (Tab) no *shell* e num formulário de transação.  
3. **VoiceOver / NVDA** no bottom nav e sidebar.

---

## Falhas conhecidas da matriz (ligação)

| ID matriz | Relação WCAG / heurística |
|-----------|---------------------------|
| UX-GLOBAL-M003 | 3.3.* orientação ao utilizador (espírito WCAG quando erro de “permissão”) |
| UX-GLOBAL-M007 | 4.1.2 Nome, função, valor |

---

*Atualizado após feedback QA (2026-04-01). Preenchimento final após stories UX-GLOBAL-03 a UX-GLOBAL-07 e execução instrumental.*
