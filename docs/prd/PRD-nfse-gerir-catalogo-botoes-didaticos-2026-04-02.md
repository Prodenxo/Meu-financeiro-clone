# PRD — NFS-e: ações **Gerir clientes** e **Gerir serviços e produtos** (visibilidade e didática)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Tipo:** Brownfield — evolução de experiência (frontend, âmbito localizado)  
**Fonte canónica do pedido:** `docs/brief/brief-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md`  
**Implementação principal:** `frontend/src/pages/GuidesMei.tsx` (constante `catalogoClientesLinkClass`; blocos `Link` / `<a>` para `/mei-catalogo/*`)

**Relação com outros artefatos:**

- **Implementa um subconjunto** da intenção de `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md` — em concreto a **zona pré-formulário** (“atalhos → gestão”) e a **coerência** com **FR-NFSE-UX-07** (sem duplicar mensagens de orientação de forma redundante).  
- **Não substitui** o PRD geral do workspace NFS-e; pode ser entregue **antes** ou **em paralelo** a outras ondas desse PRD, desde que gates e ficheiros partilhados sejam coordenados.  
- **Alinha-se** a `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` e `docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md` (rotas de catálogo).  
- **Atualiza** a expectativa de `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md` (§3.3: links deixam de ser apenas “discretos” — mantêm destinos e guards).  
- **Respeita** `docs/operacao-mei-nfse.md` e **não** altera regras fiscais nem APIs.

---

## 1. Resumo executivo

Na secção **“Antes de emitir”** do workspace **NFS-e**, os selects de atalho (**Cliente salvo** / **Serviço salvo**) têm destaque claro; as entradas para **gerir o catálogo** (**Gerir clientes**, **Gerir serviços e produtos**) estão hoje como **hiperligações pequenas** (`text-xs`, estilo link azul sublinhado), com **baixa salience** relativamente aos selects e ao botão **Salvar dados do emitente**. Utilizadores — sobretudo em **primeira emissão** — demoram a associar “cadastrar/editar no catálogo” aos **atalhos** acima.

Este PRD define requisitos **rastreáveis (FR-NFSE-GCAT-*)**, critérios de aceite, NFRs e critérios de release para **elevar visibilidade e didática** dessas duas entradas (botões secundários, chips ou equivalente aprovado em UX), **centralizar** implementação para evitar drift entre blocos duplicados em `GuidesMei.tsx`, e manter **rotas, guards e comportamento SPA vs `<a>`** sem regressão.

---

## 2. Visão de produto (experiência)

O utilizador deve **reconhecer em segundos**, na mesma vista em que escolhe atalhos, **onde abrir a gestão de clientes e de serviços/produtos** que alimentam esses atalhos. A hierarquia visual deve comunicar **ação secundária** (não competir com **Emitir NFS-e**), mas **não secundária a ponto de parecer rodapé irrelevante**.

A **copy** deve reforçar a ligação **catálogo ↔ atalhos**, sem **triplicar** mensagens já previstas no cabeçalho dinâmico (**FR-NFSE-UX-07**): preferir **uma** linha de apoio concisa junto ao grupo de controlos ou subtítulo partilhado, coordenado com PO/UX.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Descoberta** | Links pequenos e estilo “hiperligação genérica” passam despercebidos. | Controlos com **área de toque/clique** e **peso visual** alinhados a CTAs secundários (`planner-*` / `admin-*` / botões outline). |
| **Modelo mental** | “Gerir” não explica o efeito nos atalhos. | Microcopy didática: cadastro **usado nos atalhos** (ou equivalente validado). |
| **Manutenção** | Mesmo padrão repetido em vários blocos do ficheiro. | **Um** componente ou módulo partilhado (ex. props `inRouter`), **AC-GCAT-05**. |
| **Coerência global** | PRD NFS-e já prevê ordem bloqueios → atalhos → gestão. | Este slice **materializa** a parte “gestão” com affordance explícita. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI (primeira NFS-e) | Encontrar onde cadastrar cliente/serviço a partir da emissão. | Identificar entradas de gestão em **≤ 15 s** na secção “Antes de emitir” (alinhado ao brief). |
| MEI recorrente | Ir ao catálogo rapidamente sem confundir com emitente. | Dois destinos distintos permanecem claros; navegação **idêntica** à atual (rotas). |
| Teclado / leitor de ecrã | Operar e perceber propósito do controlo. | Foco visível; nome acessível liga ação ao contexto (atalhos) se necessário. |

**Stakeholders:** PO (decisão variante A vs B do brief), UX (ícones, texto final), Frontend, QA (regressão NFS-e + catálogo).

---

## 5. Escopo

### 5.1 Dentro do escopo

- Substituição ou evolução do padrão visual atual (`catalogoClientesLinkClass` + par de `Link`/`<a>` em linha com `·`) por **controlos mais visíveis e didáticos**, conforme **opção aprovada**:  
  - **Preferência (brief §5.1):** dois **botões secundários** (outline/ghost), ícone opcional, layout **responsivo** (coluna em mobile, linha em `sm+` quando couber).  
  - **Alternativa (brief §5.2):** **chips** clicáveis com maior padding e `text-sm`, se PO escolher menor mudança.  
- **Texto de apoio** didático (uma linha partilhada ou `aria-describedby` / subtítulo — ver **FR-NFSE-GCAT-02**).  
- **Centralização** de markup/estilos para **todos** os usos em `GuidesMei.tsx` que apontam para as duas rotas de catálogo com este padrão (**FR-NFSE-GCAT-05**).  
- **Copy opcional condicional** quando catálogo vazio — **sem** redundância com cabeçalho (**FR-NFSE-GCAT-03** e coordenação com **FR-NFSE-UX-07**).

### 5.2 Fora do escopo

- Alteração das **URLs** `/mei-catalogo/clientes` e `/mei-catalogo/servicos-produtos`.  
- Alteração de **guards** de rota, políticas de catálogo ou **APIs**.  
- Redesign do **formulário completo** de emissão, **lista de notas** ou **hero** Mei Infinito (coberto por outros PRDs/stories).  
- Novo tema global ou novos tokens fora dos padrões existentes (**NFR-NFSE-04** do PRD NFS-e, reproduzido abaixo).

---

## 6. Requisitos funcionais (UI/UX)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-NFSE-GCAT-01** | As entradas para gestão de catálogo na zona de **atalhos** (painel NFS-e e quaisquer outros blocos em `GuidesMei.tsx` que reutilizem o mesmo padrão para estas rotas) têm **peso visual e área clicável** claramente superiores ao estado atual (hiperligação `text-xs` isolada). | P0 |
| **FR-NFSE-GCAT-02** | Existe **texto de apoio didático** que associa **gestão do catálogo** aos **atalhos** (subtítulo, linha acima do grupo, ou `aria-describedby` / tooltip no foco — decisão UX), com redação aprovada por PO. | P0 |
| **FR-NFSE-GCAT-03** | Se existir reforço quando **catálogo vazio**, a **copy local** não duplica de forma incoerente a linha de orientação do **cabeçalho** do workspace (**FR-NFSE-UX-07**); PO/UX define a fonte canónica da mensagem “sem atalhos”. | P1 |
| **FR-NFSE-GCAT-04** | Comportamento **equivalente** entre navegação via **`Link`** (SPA) e **`<a href>`** (fora do router): mesmos destinos, sem regressão de navegação ou guards. | P0 |
| **FR-NFSE-GCAT-05** | Estilos e estrutura **centralizados** (componente dedicado ou módulo único) para evitar divergência entre instâncias no mesmo ficheiro. | P0 |

**Mapeamento para aceite do brief:** os critérios **AC-GCAT-01** a **AC-GCAT-05** do brief correspondem a **FR-NFSE-GCAT-01** a **05** (com **FR-NFSE-GCAT-03** a cobrir a coordenação de copy vazia com **FR-NFSE-UX-07**).

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-GCAT-01** | Acessibilidade | Contraste e **foco visível** em tabulação (objetivo WCAG 2.1 AA para controlos alterados). Se houver ícone com texto curto, **nome acessível** completo (`aria-label` ou texto visível). |
| **NFR-GCAT-02** | Performance | Evitar re-renders desnecessários; mudança essencialmente presentacional. |
| **NFR-GCAT-03** | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados; testes de `GuidesMei` / permissões **verdes** ou atualizados explicitamente. |
| **NFR-GCAT-04** | Consistência visual | Tokens/classes existentes (`planner-*`, `admin-*`, variantes de botão já usadas no projeto); **sem** novo tema global. |

---

## 8. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Descoberta da gestão de catálogo | Teste moderado ou sessão interna: pergunta “Onde adiciono um cliente para o atalho?” — **≤ 15 s** na secção relevante (brief). |
| Qualidade | Zero regressão nos fluxos **NFS-e** e **rotas de catálogo** cobertos por testes automatizados. |
| Clareza de copy | Sem aumento de reclamações por mensagens **contraditórias** entre cabeçalho e zona de atalhos (revisão PO após implementação). |

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Botões demasiado “fortes” competem com **Emitir** | Confusão de hierarquia | Variante **secundária** (outline/ghost); posicionamento só na zona de catálogo. |
| Texto longo empurra o formulário | Scroll excessivo | Uma linha de apoio; cabeçalho mantém parte da orientação (**FR-NFSE-UX-07**). |
| Refactor incompleto deixa estilos duplicados | Drift visual | **FR-NFSE-GCAT-05** obrigatório no mesmo entregável. |

---

## 10. Priorização e dependências

| Dependência | Nota |
|-------------|------|
| **FR-NFSE-UX-07** (PRD NFS-e) | Coordenar copy “catálogo vazio” para não haver três mensagens redundantes. |
| **story-cat-mei-05** | Links deixam de ser apenas “discretos”; **destinos e guards** mantêm-se. |

**Sugestão de onda:** **P0** — **FR-NFSE-GCAT-01, 02, 04, 05**; **P1** — **FR-NFSE-GCAT-03** (copy condicional fina).

---

## 11. Critérios de release

1. Todos os requisitos **P0** (**FR-NFSE-GCAT-01, 02, 04, 05**) verificados em revisão ou staging.  
2. **P1** (**FR-NFSE-GCAT-03**) cumprido ou explicitamente adiado com registo no backlog.  
3. Gates do repositório verdes nos ficheiros alterados (**NFR-GCAT-03**).  
4. Regressão manual mínima: `canViewNfse`, abertura workspace NFS-e, clique nas duas entradas (SPA e, se aplicável, fluxo `<a>`), vista mobile.  
5. Checklist a11y: foco por teclado nos novos controlos; leitor de ecrã anuncia propósito de forma compreensível.

---

## 12. Próximos passos

- **PO/UX:** fechar variante **§5.1 vs §5.2** do brief e textos finais (incl. **FR-NFSE-GCAT-03**).  
- **@sm:** story em `docs/stories/` com IDs **FR-NFSE-GCAT-*** e *file list* (`GuidesMei.tsx` + componente extra se existir).  
- **@dev / @qa:** implementação e regressão conforme secções 7 e 11.

---

## 13. Referências

- `docs/brief/brief-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md`  
- `docs/prd/PRD-mei-nfse-workspace-ui-ux-melhoria-2026-04-01.md`  
- `docs/stories/story-cat-mei-05-navegacao-guards-integracao-emissao-nfse.md`  
- `frontend/src/pages/GuidesMei.tsx` (`catalogoClientesLinkClass`, blocos de links para catálogo)

---

— *PRD pronto para desdobramento em backlog e story.*
