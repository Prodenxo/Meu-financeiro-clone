# Brief: acompanhar **limite de faturamento do MEI** na área Mei Infinito

**Data:** 2026-04-02  
**Origem:** pedido de produto / descoberta (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Mei Infinito** (`/guias-mei`, hero e *workspaces* do fluxo MEI)  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`; persistência de workspace em `frontend/src/pages/guidesMeiWorkspaceStorage.ts`

**Documentos relacionados (não substituídos por este brief):**

- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` — FR-UX-MEI-01 (métrica canónica), FR-UX-MEI-02 (visão geral), hierarquia de KPIs.  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` — hero Mei Infinito como **fonte canónica de KPIs** (FR-UX-MEI-01), IA L1–L3.  
- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto brownfield MEI / NFS-e (quando existir no repositório).

**Aviso de conformidade:** limites legais do MEI (teto anual de receita bruta, regras por atividade, reenquadramento) são definidos pela legislação e podem ser atualizados. A aplicação deve **exibir valores oficiais como referência configurável** e **disclaimer** de que o cálculo é informativo; não substitui contador nem obrigações legais.

---

## 1. Resumo executivo

O MEI precisa **monitorizar a receita bruta anual** face ao **limite permitido** para o regime, para evitar ultrapassar o teto e ter de se reenquadrar ou regularizar. Hoje o Mei Infinito concentra certificado, DAS, NFS-e e parcelamentos, mas **não oferece um indicador explícito** de “quanto já faturei no ano” vs “quanto ainda posso faturar” (ou percentagem utilizada), alinhado ao objetivo de **orientação rápida** descrito no PRD de UX.

Este brief pede uma **função de acompanhamento do limite** na área Mei Infinito: visibilidade clara, atualização coerente com os dados que a app já tem (ou passos para os obter), e **alertas** antes de situações de risco — **sem** assumir que a app substitui a escrituração oficial ou fontes da Receita Federal.

---

## 2. Problema / oportunidade

| Dimensão | Situação provável | Oportunidade |
|----------|-------------------|--------------|
| **Consciência situacional** | Utilizador vê notas e DAS, mas não “quanto falta para o teto” num só sítio. | **Um KPI ou cartão canónico** (alinhado a FR-UX-MEI-01) para limite MEI, com barra ou percentagem e valor monetário. |
| **Fonte de verdade** | Faturamento real pode vir de NFS-e emitidas na app, importações futuras, ou registo manual. | Definir **modo MVP**: ex. soma de NFS-e do período civil + opção de ajuste manual / nota “estimativa”. |
| **Ansiedade fiscal** | Medo de “passar do limite” sem aviso. | **Estados**: seguro / aproximando-se / crítico; *copy* calma e acionável (ex.: link para área NFS-e ou texto de reenquadramento genérico). |
| **Atualização legal** | Tetos e regras mudam ao longo dos anos. | **Configuração administrativa ou constante versionada** + data de vigência visível na UI. |

---

## 3. Utilizadores e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|------------------------|
| MEI autónomo | Ver em **menos de 15 s** se está confortável em relação ao limite anual. | Abrir Mei Infinito → localizar indicador sem rolagem excessiva (hero ou visão geral). |
| MEI com emissão frequente de NFS-e | Correlacionar **notas emitidas** com **progresso do limite**. | Emitir notas de teste / dados de staging: total reflete soma esperada. |
| Utilizador com atividade mista | Saber que **regras detalhadas** (comércio vs serviço, etc.) podem exigir conferência externa. | UI mostra **limitações do cálculo** e link para ajuda fiscal já existente no produto, se houver. |

---

## 4. Objetivos (produto)

1. **Visibilidade:** mostrar **receita contabilizada pela app** (ou pelo modo definido) **face ao limite de referência** do MEI para o ano-calendário corrente.  
2. **Prevenção:** alertar quando a **proximidade do limite** for configurável (ex.: ≥ 80 %, ≥ 95 %) sem alarmismo desnecessário.  
3. **Coerência:** não duplicar números em três sítios (FR-UX-MEI-01): **um bloco canónico** no hero ou na visão geral, com detalhe opcional noutro painel.  
4. **Transparência:** deixar explícito **o que entra no somatório**, **o período** (ano civil vs competência, se aplicável) e **a origem do valor do limite**.  
5. **Extensibilidade:** permitir evolução para integração com APIs oficiais ou importação de extrato **sem refazer** o contrato de UX na primeira versão.

---

## 5. Proposta de experiência (recomendações)

### 5.1 Onde colocar (MVP)

- **Preferência:** cartão ou faixa no **Hero Mei Infinito** (L1 na spec de UX), como **KPI primário ou secundário** ao lado de DAS / NFS-e, com rótulo do tipo *“Limite MEI (ano)”* ou *“Faturamento vs teto”*.  
- **Alternativa:** bloco dedicado apenas em **Visão geral operacional** (`overview`) se o hero estiver saturado — mantendo **uma** fonte canónica (FR-UX-MEI-01).

### 5.2 Conteúdo mínimo do controlo

- **Valor utilizado** (R$) e/ou **percentagem** da faixa 0–100 %.  
- **Limite de referência** (R$) com **ano de vigência** ou etiqueta “vigência 20XX” (valor administrado por configuração).  
- **Legenda curta:** *“Baseado em NFS-e emitidas nesta conta”* (ou texto equivalente ao modo de cálculo escolhido).  
- **Estado visual:** cores neutras para “ok”; destaque para “atenção” e “crítico” (tokens existentes `planner-*` / `admin-*` conforme NFRs do PRD Mei Infinito).

### 5.3 Comportamento

- Atualização quando o utilizador **emite ou cancela** NFS-e (se o somatório for por notas).  
- Se não houver dados: *empty state* honesto (*“Sem notas no ano — limite ainda não aplicável ao cálculo”*) em linha com FR-UX-MEI-02.  
- **Não** bloquear emissão automaticamente só por este indicador na V1 (decisão de negócio: aviso vs bloqueio — ver §8).

---

## 6. Requisitos de aceite (sugeridos para story / PRD)

| ID | Critério |
|----|----------|
| **AC-LIM-01** | Existe um único bloco canónico (hero ou visão geral) que mostra **progresso do faturamento** vs **limite de referência** para o MEI no **ano corrente**, com unidade monetária e percentagem ou barra. |
| **AC-LIM-02** | O utilizador identifica **qual período** está a ser considerado e **qual a base de cálculo** (ex.: soma de NFS-e) numa linha de texto ou tooltip acessível. |
| **AC-LIM-03** | Quando o limite de referência ou regras forem **configuráveis**, a UI indica **vigência** ou data de atualização da tabela de referência. |
| **AC-LIM-04** | Estados de proximidade (ex.: ≥ 80 %, ≥ 95 %) produzem **mensagem** e **estilo** distintos, sem contradizer FR-UX-MEI-01 (sem repetir o mesmo número em três sítios sem valor acrescentado). |
| **AC-LIM-05** | Existe **disclaimer** curto de que o indicador é **informativo** e não substitui obrigações legais nem a conferência com contador/Receita Federal. |
| **AC-LIM-06** | Acessibilidade: leitores de ecrã anunciam valor, percentagem e estado; foco visível em links de “saber mais” se existirem. |

---

## 7. Questões em aberto (para @pm / @architect)

1. **Somatório:** apenas NFS-e emitidas pela app no ano civil, ou também **outras receitas** (manual, CSV, integração futura)?  
2. **Limite numérico:** constante por ambiente (ex.: config / Edge Config) vs tabela por ano com histórico?  
3. **Sublimites** (comércio vs serviço): MVP ignora e usa um único teto, ou há roadmap para discriminar atividades?  
4. **Bloqueio de emissão:** na V1 apenas **aviso**, ou **hard stop** acima de X % (implica regra de negócio e possível story à parte)?  
5. **Sincronização:** necessidade de endpoint dedicado `GET …/mei/limit-progress` vs cálculo **no cliente** a partir de dados já carregados na página.

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Utilizador confia cegamente no número e descumpre o limite na realidade | Disclaimer + explicar base de cálculo; link para orientação fiscal. |
| Valor legal do teto muda | Config versionada; revisão anual documentada em release notes. |
| Diferença entre “receita bruta” fiscal e soma de notas | Texto explícito sobre o que a app soma; evitar termos ambíguos (“faturamento” vs “total de notas”). |
| Sobrecarga do hero (muitos KPIs) | Card colapsável, ou KPI secundário só em `overview` com link “ver detalhe”. |

---

## 9. Métricas / validação (leves)

- **Qualitativo:** teste de primeira impressão — “Consigo dizer se estou perto do limite MEI?” — objetivo **≤ 20 s** na primeira dobra.  
- **Produto (futuro):** cliques em “saber mais” / redução de pedidos de suporte sobre limite MEI (se houver canal).

---

## 10. Próximos passos

| Responsável | Ação |
|-------------|------|
| **PO** | Fechar escopo MVP (fonte do somatório, bloqueio sim/não, vigência dos tetos). |
| **@architect** | Esboço técnico: onde nasce o agregado, cache, e impacto em `GuidesMei.tsx` / API. |
| **@pm** | Atualizar ou criar **FR** no PRD Mei Infinito (ou PRD satélite) com IDs rastreáveis. |
| **@sm** | Story em `docs/stories/` com **AC-LIM-*** e *file list*. |
| **UX** | Wireframe do cartão/faixa (hero vs overview) alinhado a `ux-spec-meu-mei-ui-2026-03-30.md`. |

---

## 11. Referências rápidas de código

- Página principal: `frontend/src/pages/GuidesMei.tsx` — hero, tabs do fluxo MEI, painéis por `activeWorkspace`.  
- Especificação de KPIs hero: `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` §4.1 e §6.

---

— *Brief pronto para decisão de escopo e desdobramento em PRD/story; não fixa valores legais nem substitui orientação profissional.*
