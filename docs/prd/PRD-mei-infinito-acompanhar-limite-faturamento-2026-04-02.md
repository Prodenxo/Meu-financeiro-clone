# PRD — Mei Infinito: acompanhar **limite de faturamento** (MEI)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Tipo:** Brownfield — evolução de experiência e dados (frontend; possível endpoint conforme decisão técnica)  
**Fonte canónica do pedido:** `docs/brief/brief-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md`  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`; persistência de workspace em `frontend/src/pages/guidesMeiWorkspaceStorage.ts`

**Relação com outros artefatos:**

- **Complementa** `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` — em especial **FR-UX-MEI-01** (métrica canónica), **FR-UX-MEI-02** (visão geral) e hierarquia de KPIs no hero.  
- **Alinha-se** a `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` — hero Mei Infinito como **fonte canónica de KPIs** (níveis L1–L3).  
- **Respeita** o contexto brownfield em `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` (fluxos MEI / NFS-e).  
- **Não substitui** legislação nem orientação oficial; valores legais de tetos e regras de atividade são **referência configurável** com **disclaimer** informativo (ver §6 e §10).

---

## 1. Resumo executivo

O MEI precisa **monitorizar a receita bruta anual** face ao **limite permitido** pelo regime, para evitar ultrapassar o teto e ter de se reenquadrar ou regularizar. O Mei Infinito já concentra certificado, DAS, NFS-e e parcelamentos, mas **não oferece** um indicador explícito de “quanto já faturei no ano” vs “quanto ainda posso faturar” (ou percentagem utilizada), alinhado à **orientação rápida** do PRD de UX.

Este PRD define **requisitos rastreáveis (FR-LIM-*)**, critérios de aceite (mapeados a **AC-LIM-*** do brief), NFRs, decisões de MVP para questões em aberto, métricas leves e critérios de release, para um **único bloco canónico** de acompanhamento do limite na área Mei Infinito — com **alertas** configuráveis e **transparência** sobre período, base de cálculo e origem do valor de referência.

---

## 2. Visão de produto (experiência)

O utilizador deve **perceber em menos de 15–20 s** se está **confortável**, **aproximando-se** ou em **situação crítica** relativamente ao limite anual de referência, **sem** ver o mesmo número repetido em três sítios sem valor acrescentado (**FR-UX-MEI-01**). A cópia deve ser **calma e acionável** (links para NFS-e ou textos genéricos sobre reenquadramento), não alarmista.

O indicador é **informativo**: não substitui contador, escrituração oficial nem fontes da Receita Federal.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Consciência situacional** | DAS e notas são visíveis, mas não “quanto falta para o teto” num só sítio. | **KPI ou cartão canónico** para limite MEI, com barra ou percentagem e valor monetário. |
| **Fonte de verdade** | Faturamento pode vir de NFS-e na app, importações futuras ou registo manual. | **MVP:** soma de NFS-e emitidas no **ano civil** na conta + legenda explícita; evolução para ajuste manual / outras fontes sem quebrar o contrato de UX. |
| **Ansiedade fiscal** | Medo de ultrapassar o limite sem aviso. | Estados **seguro / atenção / crítico** com limiares configuráveis (ex.: ≥ 80 %, ≥ 95 %). |
| **Atualização legal** | Tetos mudam ao longo dos anos. | **Valor de referência administrado** (config ou tabela versionada) + **vigência** visível na UI. |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo | Ver em **≤ 15 s** se está confortável face ao limite anual. | Abrir Mei Infinito → localizar indicador sem rolagem excessiva (hero ou visão geral). |
| MEI com NFS-e frequente | Correlacionar **notas emitidas** com **progresso do limite**. | Dados de teste/staging: total alinha à soma esperada. |
| Utilizador com atividade mista | Saber que **regras detalhadas** podem exigir conferência externa. | UI com **limitações do cálculo** e link para ajuda fiscal existente, se houver. |

**Stakeholders:** PO (escopo MVP e limiares), UX (wireframe hero vs overview), Frontend, Backend (se houver agregado servidor), QA (a11y + regressão `/guias-mei`).

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP)

- **Um único bloco canónico** (preferência: **hero Mei Infinito**, L1 na spec de UX; alternativa: **Visão geral operacional** se o hero estiver saturado) com:  
  - valor utilizado (R$) e/ou **percentagem** 0–100 %;  
  - **limite de referência** (R$) com **ano de vigência** ou etiqueta “vigência 20XX”;  
  - legenda curta sobre **base de cálculo** (MVP: texto do tipo *“Baseado em NFS-e emitidas nesta conta no ano civil”* ou equivalente aprovado);  
  - **estados visuais** distintos (tokens existentes `planner-*` / `admin-*` conforme NFRs do PRD Mei Infinito).  
- **Atualização** quando o utilizador **emite ou cancela** NFS-e, se o somatório for por notas no período.  
- **Empty state** honesto quando não houver dados no ano (alinhado a **FR-UX-MEI-02**).  
- **Disclaimer** curto de caráter informativo (§6).  
- **Acessibilidade:** leitores de ecrã anunciam valor, percentagem e estado; foco visível em “saber mais” se existir.

### 5.2 Fora do escopo (MVP)

- **Bloqueio automático** de emissão de NFS-e apenas por este indicador (**decisão explícita de negócio**; predefinição: **não** na V1 — ver §8).  
- Integração com **APIs oficiais** da Receita ou importação de extrato completa (podem ser **fase posterior** desde que o desenho não fixe dados só no cliente sem extensão).  
- Discriminação fina de **sublimites** por tipo de atividade (comércio vs serviço) — **roadmap** opcional; MVP pode usar **um teto único** configurável se PO fechar assim.  
- Alteração de regras fiscais reais — apenas **exibição** de parâmetros de referência e cópia legal.

### 5.3 Decisões de MVP sugeridas (fechar com PO)

| Tema | Proposta MVP | Alternativa |
|------|----------------|-------------|
| **Somatório** | Soma de **NFS-e emitidas pela app** no **ano civil** corrente. | Incluir ajuste manual, CSV ou outras receitas (story futura). |
| **Limite numérico** | Constante/tabela **por ano** em config (ex.: env / Edge Config / tabela versionada) com **data de vigência** na UI. | Apenas constante única por ambiente (menos flexível). |
| **Cálculo** | Preferência: reutilizar dados já carregados na página; **endpoint dedicado** (`GET …/mei/limit-progress`) se o agregado for pesado ou partilhado — decisão **@architect** + @dev. | Cálculo só no cliente a partir de lista já obtida. |
| **Bloqueio de emissão** | **Apenas aviso** na V1. | Hard stop acima de X % (story e regras à parte). |

---

## 6. Conformidade e limitação de responsabilidade

- Tetos e regras legais do MEI são definidos pela **legislação** e podem ser atualizados.  
- A aplicação deve exibir valores **como referência configurável**, com **data de vigência** quando aplicável.  
- Deve existir **disclaimer** visível (tooltip, rodapé do cartão ou linha sob o KPI) de que o indicador é **informativo**, **não substitui** contador nem obrigações legais, nem a conferência com a Receita Federal.

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-LIM-01** | Existe **um único bloco canónico** (hero ou visão geral) que mostra **progresso do faturamento contabilizado** vs **limite de referência** para o MEI no **ano corrente**, com unidade monetária e percentagem ou barra (**AC-LIM-01**). | P0 |
| **FR-LIM-02** | O utilizador identifica **qual período** está a ser considerado e **qual a base de cálculo** (ex.: soma de NFS-e) numa linha de texto, subtítulo ou **tooltip acessível** (**AC-LIM-02**). | P0 |
| **FR-LIM-03** | Quando o limite de referência for **configurável**, a UI indica **vigência** ou data de atualização da tabela/constante (**AC-LIM-03**). | P0 |
| **FR-LIM-04** | Limiares de proximidade (ex.: ≥ 80 %, ≥ 95 %) produzem **mensagem** e **estilo** distintos, **sem** contradizer **FR-UX-MEI-01** (sem repetir o mesmo número em três sítios sem valor acrescentado) (**AC-LIM-04**). | P0 |
| **FR-LIM-05** | **Disclaimer** curto de caráter informativo, conforme §6 (**AC-LIM-05**). | P0 |
| **FR-LIM-06** | **Acessibilidade:** SR anuncia valor, percentagem e estado; foco visível em links de “saber mais” se existirem (**AC-LIM-06**). | P0 |
| **FR-LIM-07** | **Empty state** quando não houver notas no ano: mensagem honesta (ex.: limite ainda não aplicável ao cálculo), alinhada a **FR-UX-MEI-02**. | P0 |
| **FR-LIM-08** | **Atualização** do indicador após emissão ou cancelamento de NFS-e quando o modo de cálculo for por notas no período. | P0 |

**Mapeamento:** os critérios **AC-LIM-01** a **AC-LIM-06** do brief correspondem a **FR-LIM-01** a **FR-LIM-06**; **FR-LIM-07–08** detalham empty state e refresco já implícitos no brief §5.3.

---

## 8. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| **NFR-LIM-01** | Acessibilidade | Objetivo WCAG 2.1 AA para o novo bloco; contraste nos estados de alerta; ordem de foco lógica. |
| **NFR-LIM-02** | Performance | Evitar re-fetch desnecessário; se houver agregação, considerar cache ou memoização conforme arquitetura. |
| **NFR-LIM-03** | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados; testes existentes da rota `/guias-mei` permanecem verdes ou atualizados explicitamente. |
| **NFR-LIM-04** | Consistência visual | Reutilizar tokens/classes existentes (`planner-*`, `admin-*`, padrões do hero Mei Infinito). |
| **NFR-LIM-05** | Manutenção legal | Valores de teto e vigência tratados como **dados de configuração** versionáveis; alterações documentadas em release notes quando o produto atualizar a referência. |

---

## 9. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Compreensão rápida | Teste de primeira impressão: “Consigo dizer se estou perto do limite MEI?” — **≤ 20 s** na primeira dobra (brief §9). |
| Qualidade | Zero regressão nos fluxos críticos Mei Infinito e NFS-e cobertos por testes. |
| Confiança responsável | Utilizador vê **base de cálculo** e **disclaimer** sem aumento de reclamações por “número oficial da Receita” (revisão PO após lançamento, se houver canal). |

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Utilizador trata o número como **oficial** da Receita | Decisões fiscais incorretas | **FR-LIM-05**, §6; explicar soma da app vs obrigações reais. |
| Teto legal **muda** | UI desatualizada | **NFR-LIM-05**; revisão anual ou trigger de produto. |
| Diferença entre receita bruta fiscal e **soma de notas** | Desconfiança ou litígio de expectativa | **FR-LIM-02**: terminologia clara (“total das notas emitidas nesta conta” vs ambiguidade “faturamento”). |
| **Sobrecarga do hero** | Poluição visual | Cartão colapsável, KPI **secundário**, ou bloco só em `overview` com link “ver detalhe” — decisão UX (**FR-UX-MEI-01**). |
| **Bloqueio** de emissão por engenharia sem aprovação | Risco de negócio | **Fora do MVP** salvo decisão PO explícita (§5.2). |

---

## 11. Priorização e dependências

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0** | Bloco canónico, base de cálculo MVP (NFS-e ano civil), estados, disclaimer, empty state, atualização pós nota, a11y | **FR-LIM-01–08** |
| **P1** | Ajuste manual / outras fontes de receita; refinamento de copy por sublimites (se roadmap) | Backlog |
| **P2** | Integrações externas, bloqueio de emissão | Backlog / decisão legal-produto |

**Dependências:** **FR-UX-MEI-01** e spec UX do hero; coordenação com iniciativas que toquem `GuidesMei.tsx` e listagens NFS-e.

---

## 12. Critérios de release

1. Todos os requisitos **P0** (**FR-LIM-01** a **FR-LIM-08**) verificados em revisão ou staging.  
2. Gates do repositório verdes nos ficheiros alterados (**NFR-LIM-03**).  
3. Nenhuma regressão nos fluxos críticos MEI (rota `/guias-mei`, emissão/cancelamento NFS-e conforme casos de teste existentes).  
4. Checklist mínimo de acessibilidade: teclado, SR nos valores/estados, foco em controlos novos.  
5. **Disclaimer** e **vigência** do limite de referência visíveis conforme **FR-LIM-03** e **FR-LIM-05**.

---

## 13. Próximos passos

| Responsável | Ação |
|-------------|------|
| **PO** | Fechar escopo MVP (somatório, bloqueio sim/não, modelo de config do teto, hero vs overview). |
| **@architect** | Esboço técnico: origem do agregado, cache, impacto em `GuidesMei.tsx` / API. |
| **@sm** | Story em `docs/stories/` com **AC-LIM-*** / **FR-LIM-*** e *file list*. |
| **UX** | Wireframe do cartão/faixa alinhado a `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`. |
| **@dev / @qa** | Implementação e regressão conforme §8 e §12. |

---

## 14. Referências

- `docs/brief/brief-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md`  
- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md`  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` (§4.1, §6 — hero e KPIs)  
- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`  
- `frontend/src/pages/GuidesMei.tsx`  
- `frontend/src/pages/guidesMeiWorkspaceStorage.ts`  

---

— *PRD pronto para desdobramento em backlog e stories; valores legais finais são responsabilidade da legislação e da configuração de produto.*
