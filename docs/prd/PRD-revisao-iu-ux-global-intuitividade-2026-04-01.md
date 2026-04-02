# PRD — Revisão global de IU/UX: intuitividade e primeiro contacto

**Versão:** 1.0  
**Data:** 2026-04-01  
**Tipo:** Brownfield — programa de auditoria, síntese e remediação (frontend + microcopy + coordenação com backend onde necessário)  
**Fontes:** `docs/brief/brief-revisao-iu-ux-intuitividade-site.md`

**Relação com outros documentos**

- **`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`** — visão de produto e iniciativas transversais; este PRD **não** substitui requisitos fiscais nem contratos de API.
- **`docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`** — escopo **restrito** à rota `/guias-mei`. O presente PRD cobre **todo o site** (shell, núcleo financeiro, auth, settings, MEI além do guia quando aplicável). Evitar duplicação: melhorias já exigidas pelo PRD da área Mei Infinito permanecem canónicas **nessa rota**; aqui referenciam-se apenas quando a auditoria global tocar a mesma página.

---

## 1. Resumo executivo

O Meu Financeiro expõe **múltiplos domínios** (finanças pessoais/empresa, agenda, orçamentos, MEI/NFS-e, administração) através de um **shell híbrido** (sidebar, navegação inferior, atalhos móveis). O risco de **sobrecarga cognitiva** e de **vocabulário técnico** sem apoio contextual pode impedir que utilizadores sem experiência prévia concluam tarefas do dia a dia.

Este PRD define o **programa de revisão IU/UX em duas fases**: (A) **descoberta e auditoria** com entregáveis documentais priorizados; (B) **remediação** fatiada em ondas (quick wins → médio → estrutural), com requisitos funcionais de experiência, não funcionais (acessibilidade, qualidade), métricas e critérios de release. A execução deve produzir **matriz de problemas**, **backlog priorizado** e **handoff** para stories em `docs/stories/`.

---

## 2. Visão de produto (experiência)

Um utilizador em **primeiro contacto** deve, em poucos segundos, **perceber onde está**, **qual o próximo passo** para as tarefas mais comuns (ver resumo, registar movimento, aceder a definições) e **nunca ficar num beco sem saída** sem explicação e CTA. O domínio MEI/fiscal continua exigente por natureza: a UI deve **traduzir pré-requisitos** (certificado, emitente, catálogo) em linguagem simples — **porquê** e **o que fazer a seguir** — em coordenação com mensagens de backend quando forem opacas.

**Princípio reitor:** *uma intenção = um caminho óbvio*; caminhos secundários via “Mais opções”, definições ou navegação claramente rotulada.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **IA da informação** | Muitas rotas e padrões de entrada (sidebar vs bottom vs atalhos); possível duplicação ou competição de caminhos. | Mapa canónico de tarefas → entrada principal; recomendação documentada se a auditoria concluir redundância prejudicial. |
| **Linguagem** | Termos MEI, NFS-e, emitente sem glossário leve na UI. | Microcopy, tooltips curtos, empty states educativos sem jargão desnecessário. |
| **Feedback** | Erros, carregamento, listas vazias podem ser pouco orientadores. | Padrão único de estados (loading, empty, erro) com ação seguinte. |
| **Papéis** | `usuario` sem MEI ou sem permissão pode ver bloqueios pouco explicados. | Mensagens **esperadas** e **orientadas**, não genéricas de “acesso negado” sem próximo passo. |
| **Acessibilidade** | Risco de lacunas AA em mobile (alvos tocáveis, foco, contraste). | Checklist WCAG 2.2 AA nos fluxos prioritários com evidência (passou/falhou/N/A). |

---

## 4. Personas, stakeholders e fluxos prioritários

### 4.1 Personas (resumo do brief)

| Persona | Necessidade | Implicação |
|---------|-------------|------------|
| Sem background contabilístico | Concluir tarefas sem treino | Copy simples; evitar suposições fiscais na navegação principal. |
| Mobile-first | Usar com uma mão, ecrã pequeno | Bottom nav e formulários usáveis; CTAs com área de toque adequada. |
| MEI ocasional | Emitir/preparar nota e gerir catálogo | Cadeia clara desde o dashboard ou entrada MEI; bloqueios com um CTA principal. |
| Administrador | Gerir utilizadores/dados | `/settings` claramente separado do fluxo “dia a dia”. |

### 4.2 Stakeholders

Produto (aprovação e priorização), UX (auditoria e recomendações visuais), Engenharia frontend (implementação), Backend (mapeamento de erros quando necessário), QA (regressão e a11y).

### 4.3 Fluxos prioritários para auditoria e critérios AA

1. **Autenticação:** login, registo, recuperação/redefinição de password.  
2. **Núcleo financeiro:** dashboard (`/`), transações (`/transacoes`), categorias (`/categorias`) — tarefa “registar movimento” e “ver resumo”.  
3. **Planeamento:** orçamentos (`/orcamentos`), agenda (`/agenda`), recorrências (`/recorrencias`) — pelo menos navegação e um fluxo de criação/edição representativo por área.  
4. **Conta:** definições (`/settings`) e, se aplicável, subrotas admin.  
5. **MEI (quando elegível):** `/guias-mei`, `/mei-catalogo/clientes`, `/mei-catalogo/servicos-produtos` — alinhado ao PRD da área Mei Infinito onde coincidente.  
6. **Shell:** `Layout` (header, sidebar, footer, bottom nav, painel de atualizações, atalhos móveis).

---

## 5. Escopo

### 5.1 Dentro do escopo

- **Fase A — Auditoria e síntese**
  - Auditoria heurística (Nielsen 10 + extensão “clareza de requisitos legais” onde o copy fiscal for inevitável).
  - Auditoria de consistência visual (tipografia, espaçamento, estados hover/focus/disabled, dark mode).
  - Revisão de microcopy (títulos, CTAs, erros).
  - Testes moderados com utilizadores (mínimo sugerido **n ≥ 5**) com cenários do brief: café 15 €; gasto em alimentação no mês; preparação de dados para nota com cliente no catálogo (MEI habilitado).
  - Entregáveis: relatório (Markdown ou PDF em `docs/`), **matriz de problemas** (ID, local, heurística, severidade, impacto, esforço, dono sugerido), **fluxos recomendados** (opcional diagramado), **proposta de navegação** se a auditoria concluir que sidebar + bottom nav + atalhos confundem.
- **Fase B — Remediação**
  - Implementação dos itens priorizados em ondas, com critérios de aceite por story.
  - **Quick wins:** lista **≤ 10** itens aptos a uma sprint, aprovada por PO.
  - Eliminação de **dead ends** nos fluxos prioritários: toda página vazia ou bloqueada com texto de apoio + CTA.

### 5.2 Fora do escopo inicial

- Rebranding completo ou novo design system de raiz (salvo conclusão explícita da auditoria com aprovação de roadmap).
- Site de marketing externo à app.
- **Performance profunda** (Core Web Vitals, bundle) como objetivo principal — exceto **quick wins** identificados na auditoria (ex.: bloqueio óbvio de UX).
- Alteração de regras de negócio fiscal/MEI **não motivada** por lacuna de dados ou mensagem já coberta por outro PRD.

---

## 6. Requisitos funcionais (programa e produto)

### 6.1 Fase A — Entregáveis obrigatórios

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-UX-GLOBAL-A01 | Publicar **relatório de auditoria** referenciando rotas e, quando possível, componentes (`frontend/src/...`). | P0 |
| FR-UX-GLOBAL-A02 | Publicar **matriz de problemas** com severidade (crítico / alto / médio / baixo), impacto, esforço estimado e sugestão de correção. | P0 |
| FR-UX-GLOBAL-A03 | Produzir **backlog priorizado** em três faixas: Quick wins / Médio / Estrutural, com dono sugerido (UX / frontend / conteúdo / backend). | P0 |
| FR-UX-GLOBAL-A04 | Executar testes moderados com **n ≥ 5** participantes nos cenários definidos no brief (ou justificar redução com aprovação de PO). | P0 |
| FR-UX-GLOBAL-A05 | Preencher **checklist WCAG 2.2 AA** nos fluxos da secção 4.3 com estado passou/falhou/N/A e nota. | P0 |
| FR-UX-GLOBAL-A06 | Entregar **handoff**: lista de itens com critérios de aceite testáveis prontos para `docs/stories/`. | P0 |
| FR-UX-GLOBAL-A07 | Se aplicável, **proposta de navegação** (documento único de recomendação) quando a auditoria concluir redundância ou conflito entre sidebar, bottom nav e atalhos. | P1 |

### 6.2 Fase B — Requisitos de experiência (remediação)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-UX-GLOBAL-B01 | **Descoberta pós-login:** em teste com tarefa guiada, utilizador novo identifica em **≤ 30 s** onde registar despesa/receita e onde ver resumo financeiro (após remediação das causas P0 identificadas na matriz). | P0 |
| FR-UX-GLOBAL-B02 | **Tarefa crítica:** ≥ **80%** dos participantes em teste moderado (n ≥ 5) completam **uma transação simples** e **encontram definições** sem ajuda externa (alvo a calibrar com PO antes do go-live da onda correspondente). | P0 |
| FR-UX-GLOBAL-B03 | **Consistência:** inventário de padrões de componente (botões, tabelas, modais, toasts) com **lista de desvios** resolvida ou **documentada** como exceção aceite no “design system leve” do repositório. | P1 |
| FR-UX-GLOBAL-B04 | **Estados vazios e erros:** nenhum fluxo prioritário (secção 4.3) permanece sem explicação útil e CTA quando aplicável. | P0 |
| FR-UX-GLOBAL-B05 | **Papéis:** utilizador sem MEI ou sem permissão vê mensagem **orientadora** (o que aconteceu + próximo passo possível), não apenas bloqueio técnico opaco. | P0 |
| FR-UX-GLOBAL-B06 | **MEI/fiscal:** onde houver pré-requisitos (certificado, emitente, catálogo), a UI explica **porquê** e **próximo passo**; erros de API mapeados para linguagem humana quando a matriz identificar **gap** (com tarefa backend se necessário). | P1 |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-UX-GLOBAL-01 | Acessibilidade | WCAG **2.2 nível AA** nos fluxos da secção 4.3 (contraste, foco, labels, erros associados a campos, alvos tocáveis em mobile). |
| NFR-UX-GLOBAL-02 | Qualidade de código | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados; sem regressão nos testes existentes de gates MEI/rota (`App.mei-gate.test.tsx`, etc.) quando tocados. |
| NFR-UX-GLOBAL-03 | Documentação | Artefactos de Fase A versionados em `docs/` com data e ligação a este PRD. |
| NFR-UX-GLOBAL-04 | Privacidade | Testes com utilizadores sem dados reais de clientes; seguir políticas internas de gravação/consentimento. |

---

## 8. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Aprovação do programa | Documento de Fase A aprovado por **PO/produto** com priorização explícita da matriz. |
| Velocidade de melhoria | **≤ 10 quick wins** identificados e comprometidos para primeira onda de implementação. |
| Aprendizagem | ≥ 80% sucesso nos cenários de teste moderado definidos em FR-UX-GLOBAL-B02 (pós-remediação P0 relevante). |
| Descoberta | Cumprimento do alvo de ≤ 30 s em FR-UX-GLOBAL-B01 em sessão de validação. |
| Acessibilidade | Checklist AA completa com **sem falhas críticas** não justificadas nos fluxos prioritários antes de release da onda P0 de remediação. |

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Auditoria sem participantes | Viés de equipa | Mínimo n ≥ 5; recrutamento externo ou painel; PO aprova exceções. |
| Redesenho total antes de evidência | Atraso e conflitos | Fase A obrigatória; ondas quick wins primeiro; PRD da área Mei Infinito respeitado em `/guias-mei`. |
| Erros opacos só no backend | UI não consegue cumprir FR-UX-GLOBAL-B06 | Itens na matriz com dono **backend**; stories de mapeamento código → mensagem. |
| Duplicação de trabalho com PRD da área Mei Infinito | Conflito de aceite | Coordenação explícita: mesma página = requisitos do PRD Mei Infinito (`PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`) + itens globais não contraditórios. |

---

## 10. Priorização (ondas sugeridas)

| Onda | Conteúdo típico | Critério de entrada |
|------|-----------------|---------------------|
| **P0 — Quick wins** | Copy, empty states, labels de navegação, contrastes pontuais, mensagens de bloqueio | Matriz: severidade crítico/alto + baixo esforço |
| **P1 — Médio** | Consolidação de componentes, fluxos de erro, harmonização sidebar/bottom, glossário leve | Matriz: médio impacto + esforço médio |
| **P2 — Estrutural** | Reorganização de IA, grandes refactors de `Layout`, redesign de fluxos multi-página | Aprovação PO + dependências técnicas |

---

## 11. Critérios de release (por onda)

1. Itens da onda cumpridos com evidência em *staging* ou ambiente de revisão.  
2. Gates do repositório verdes nos ficheiros alterados.  
3. Regressão QA nos fluxos tocados; para P0 de remediação, **checklist AA** sem falhas críticas abertas.  
4. Stories atualizadas (checklist e *file list*) conforme `AGENTS.md`.

---

## 12. Dependências e próximos passos (AIOX)

1. **@ux-design-expert** — conduzir Fase A (heurísticas, consistência, síntese visual); apoiar cenários de teste.  
2. **@sm** — gerar stories a partir da matriz e handoff (FR-UX-GLOBAL-A06, FR-UX-GLOBAL-B*).  
3. **@dev** — implementar ondas; coordenar com backend para FR-UX-GLOBAL-B06.  
4. **@qa** — validar a11y e regressão; opcionalmente integrar verificação automatizada onde o pipeline permitir.

---

## 13. Referências

- `docs/brief/brief-revisao-iu-ux-intuitividade-site.md` — brief fonte  
- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto produto  
- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` — escopo `/guias-mei`  
- `frontend/src/App.tsx` — mapa de rotas  
- `frontend/src/Layout/Layout.tsx` — shell da aplicação  

---

— *PRD pronto para aprovação de PO e desdobramento em backlog (Fase A → Fase B).*
