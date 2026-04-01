# Brief: revisão completa de IU e UX — intuitividade para primeiro contacto

**Data:** 2026-04-01  
**Origem:** pedido de produto (Atlas / analista)  
**Produto:** Meu Financeiro (React + React Router, `frontend/`)

---

## 1. Resumo executivo

Pretende-se uma **revisão sistemática de interface (IU) e experiência (UX)** do site, com o objetivo de **qualquer pessoa conseguir concluir tarefas principais sem treino formal** — incluindo quem não está habituada a apps de finanças ou a fluxos fiscais (MEI / NFS-e). O trabalho deve produzir **diagnóstico priorizado**, **recomendações acionáveis** e, quando aplicável, **critérios de aceitação** para stories de implementação.

---

## 2. Problema / oportunidade

- **Dor percebida:** risco de **sobrecarga cognitiva** (muitas áreas: dashboard, transações, orçamentos, categorias, agenda, recorrências, definições, fluxo MEI com guias, catálogo de clientes e serviços/produtos), **navegação híbrida** (sidebar + bottom nav + atalhos móveis) e **vocabulário de domínio** (MEI, NFS-e, emitente) que pode afastar utilizadores casuais.
- **Oportunidade:** alinhar **linguagem, hierarquia visual, padrões de formulário e feedback** (erros, estados vazios, carregamento) para reduzir abandono, erros de dados e pedidos de suporte implícitos (“não sei onde clicar”).

---

## 3. Objetivos (mensuráveis na medida do possível)

1. **Descoberta:** em ≤ 30 segundos após login, um utilizador novo identifica **onde registar uma despesa/receita** e **onde ver o resumo financeiro** (teste com tarefa guiada).
2. **Conclusão de tarefa crítica:** ≥ 80% dos participantes num teste moderado (n ≥ 5) completam **uma transação simples** e **encontram definições** sem ajuda externa (alvo a calibrar com PO).
3. **Consistência:** inventário de **padrões de componente** (botões, tabelas, modais, toasts) com lista de **desvios** a corrigir ou documentar no design system leve do projeto.
4. **Acessibilidade baseline:** verificação contra **WCAG 2.2 nível AA** nos fluxos prioritários (contraste, foco, labels, mensagens de erro associadas a campos, alvos tocáveis em mobile).
5. **MEI / fiscal:** onde o produto exige pré-requisitos (certificado, dados do emitente, catálogo), a UI deve **explicar o “porquê”** e o **próximo passo** em linguagem simples, não só mensagens técnicas.

---

## 4. Público-alvo e princípios de simplicidade

| Segmento | Implicação para UX |
|----------|-------------------|
| Utilizador **sem** background contabilístico | Evitar jargão ou glossário embutido; tooltips curtos onde o termo for inevitável. |
| Utilizador **mobile-first** | Bottom navigation, áreas de toque, formulários longos quebrados em passos ou secções colapsáveis. |
| Utilizador **MEI ocasional** | Caminhos claros desde o dashboard até “emitir / preparar NFS-e” e até catálogo; estados “bloqueado” com CTA único. |
| Administradores | Rotas em `/settings` — não confundir com fluxo do dia a dia; rótulos que diferenciem “conta pessoal” vs “gestão de utilizadores”. |

**Princípio reitor:** *uma intenção = um caminho óbvio*; secundários via “Mais opções” ou definições.

---

## 5. Âmbito do produto (brownfield — referência técnica)

Áreas já mapeadas no router autenticado (`frontend/src/App.tsx`):

- **Núcleo financeiro:** `/` (Dashboard), `/transacoes`, `/orcamentos`, `/categorias`, `/agenda`, `/recorrencias`
- **MEI (com guards de role/mei):** `/guias-mei`, `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos`
- **Conta e admin:** `/settings`, `/settings/users`, `/settings/usuarios-dados`
- **Shell:** `Layout` com `Header`, `Sidebar`, `Footer`, `BottomNavigation`, `UpdatesPanel`, atalhos rápidos móveis

**Incluir na revisão:** fluxos de **login, registo, recuperação de password** (páginas públicas).

**Fora de âmbito inicial (a menos que PO estenda):** rebranding completo, ilustração/marketing site externo, performance profunda (pode ser lista separada de “quick wins” se o audit encontrar bloqueios óbvios).

---

## 6. Metodologia sugerida

1. **Auditoria heurística** (Nielsen 10 + extensões fiscais “clareza de requisitos legais”) — documento com severidade (crítico / alto / médio / baixo).
2. **Auditoria de consistência visual** — tipografia, espaçamento, estados hover/focus/disabled, dark mode.
3. **Revisão de microcopy** — títulos de página, CTAs, mensagens de erro da API traduzidas para linguagem humana.
4. **Testes com utilizadores** (moderados, remoto ou presencial) com cenários:
   - “Registaste um café de 15 € hoje”
   - “Queres ver quanto gastaste este mês em alimentação”
   - (Se MEI habilitado) “Precisas de preparar dados para uma nota para um cliente já no catálogo”
5. **Síntese:** backlog priorizado (Quick wins / Médio / Estrutural) com dono sugerido (UX / frontend / conteúdo).

---

## 7. Entregáveis esperados

| Entregável | Descrição |
|------------|-----------|
| **Relatório de auditoria** | PDF ou Markdown em `docs/` com capturas e referências a rotas/componentes. |
| **Matriz de problemas** | ID, local, heurística violada, impacto, esforço, sugestão de correção. |
| **Fluxos recomendados** | Diagramas simples (opcional) para: primeiro uso pós-registo, primeira transação, primeiro acesso MEI. |
| **Proposta de navegação** | Se a auditoria concluir que sidebar + bottom duplicam ou confundem — recomendação única de IA de informação. |
| **Handoff** | Lista de itens prontos para **stories** em `docs/stories/` (critérios de aceitação testáveis). |

---

## 8. Critérios de sucesso do projeto de revisão

- Documento aprovado por **PO/produto** com priorização explícita.
- Lista de **≤ 10 quick wins** implementáveis numa sprint.
- Nenhum fluxo prioritário com **dead end** sem explicação (páginas vazias com texto de apoio + CTA).
- Checklist AA dos fluxos prioritários **preenchida** (passou / falhou / N/A com nota).

---

## 9. Riscos e dependências

- **Papéis e permissões:** mensagens para `usuario` sem MEI devem ser **esperadas** e **orientadas**, não genéricas 403 na UI.
- **Dependência de backend:** erros opacos na emissão/catálogo exigem **mapeamento** mensagem técnica → mensagem de utilizador (coordenação com backend).
- **Over-engineering:** evitar redesenho total antes de validar com 3–5 utilizadores reais.

---

## 10. Próximos passos recomendados (workflow AIOX)

1. **@ux-design-expert** — aplicar metodologia, produzir matriz e mockups só onde o gap for estrutural.  
2. **@pm** — incorporar conclusões no roadmap e fatiar em stories.  
3. **@dev** — implementar quick wins e alinhar componentes ao padrão acordado.  
4. **@qa** — regressão nos fluxos tocados + verificação acessibilidade automatizada onde existir no pipeline.

---

## 11. Notas de linguagem (alinhamento de produto)

O objetivo é **máxima clareza e respeito pelo utilizador**. Na documentação e na UI, preferir expressões como **“utilizador sem experiência prévia”**, **“primeiro contacto”** ou **“tarefa do dia a dia”** em vez de termos pejorativos — mantendo o **mesmo rigor** na simplicidade pretendida.

---

— Brief preparado para execução da revisão IU/UX; ajustar métricas numéricas com PO conforme disponibilidade de testes.
