# PRD — Melhoria de UI/UX: área **Mei Infinito** (`/guias-mei`)

**Versão:** 1.0  
**Data:** 2026-03-30  
**Tipo:** Brownfield — evolução de experiência (frontend)  
**Fontes:** Brief de UI/UX Mei Infinito (analista / sessão produto 2026-03-30); implementação atual em `frontend/src/pages/GuidesMei.tsx`

**Relação com PRD principal:** complementa `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` (fluxos MEI, DAS, NFS-e). Não altera regras fiscais nem contratos de API por si só; **presentation layer** e clareza de navegação, desde que dados já expostos pela aplicação sejam reutilizados.

---

## 1. Resumo executivo

A página **Mei Infinito** concentra certificado digital, DAS, NFS-e e parcelamentos, mas a estrutura atual (hero com KPIs, separadores **Fluxo do MEI** e secção **Visão geral operacional**) gera **redundância numérica**, **hierarquia visual pouco clara** e **cartões com baixa densidade de informação**, com risco de o utilizador não perceber o que é clicável nem qual o próximo passo.

Este PRD define **objetivos de experiência**, **escopo por onda (P0–P2)**, **requisitos funcionais de interface**, **métricas** e **critérios de release**, para execução em `GuidesMei.tsx` (e estilos associados) com gates de qualidade do repositório.

---

## 2. Visão de produto (experiência)

O MEI e o contador devem **orientar-se em poucos segundos**, ver **cada métrica uma vez como fonte canónica** e encontrar **ações óbvias** (certificado, guias, notas) sem rolagem excessiva ou “caixas vazias”. A interface deve reforçar **segurança percebida** (estado claro de pendências e certificado) sem duplicar os mesmos números em múltiplos blocos.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Informação | Os mesmos contadores (períodos DAS, pendências, notas, certificado) repetem-se no topo e nos segmentos do fluxo. | Uma única fonte visível por métrica; nos separadores, estados textuais ou atalhos sem replicar dígitos. |
| Hierarquia | Vários títulos/subtítulos grandes em sequência; “Visão geral operacional” ocupa espaço com cartões pouco preenchidos. | Primeira dobra com resumo mínimo + valor imediato (estado ou CTA); cartões com conteúdo útil ou *empty state* explícito. |
| Affordance | Não fica claro se os cartões do hero são só leitura ou interativos; “Certificado do servidor” parece desligado do fluxo. | Padrão consistente clicável vs informativo; alinhar ação de certificado ao contexto (visão geral ou tab Certificado). |
| Navegação | Tab ativa (“Visão geral”) pode ser pouco distinguível em modo escuro. | Estado de seleção mais evidente e acessível (foco, `aria-selected`). |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo | Saber “onde estou”, “o que falta” e “para onde clicar” em 10–15 s. | Primeira visita simulada: localizar emissão NFS-e e pendências DAS. |
| Utilizador recorrente | Ir direto a certificado / DAS / NFS-e. | Reentrada: menos rolagem até ao primeiro CTA relevante. |
| Utilizador com ansiedade fiscal | Estado claro sem números contraditórios. | Comparar um único lugar para totais; mensagens de estado coerentes. |

**Stakeholders:** Produto (priorização), UX (protótipo opcional), Engenharia frontend, QA (acessibilidade e regressão de fluxo MEI).

---

## 5. Escopo

### 5.1 Dentro do escopo

- Reorganização de **layout e copy** na rota `/guias-mei` (componente principal `GuidesMei.tsx`).
- Redução de **redundância** entre bloco “Mei Infinito”, separadores “Fluxo do MEI” e “Visão geral operacional”.
- **Preenchimento** dos cartões da visão geral com estado resumido, CTAs e *empty states* onde não houver dados.
- Melhoria de **estado visual e acessibilidade** dos separadores tipo tab.
- Integração **coerente** do controlo “Certificado do servidor” (ou equivalente) no fluxo visual, sem mudar a semântica de negócio sem story técnica.

### 5.2 Fora do escopo

- Novos endpoints ou regras de negócio MEI/DAS/NFS-e não motivadas por limitação de dados já disponíveis na página.
- Redesign global do *design system* ou troca de tema.
- Funcionalidades novas de parcelamento ou integrações SERPRO além do que já existe.
- Alterações profundas em `AdminUserData` / “Mei Infinito (cliente)” além do necessário para **consistência de componentes reutilizados** (se aplicável).

---

## 6. Requisitos funcionais (UI/UX)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-UX-MEI-01 | Cada métrica numérica principal (ex.: períodos DAS, contagem de pendências, notas no filtro) tem **no máximo um** bloco “canónico” visível por viewport lógica; outros blocos não repetem o mesmo número sem nova informação (ex.: podem mostrar estado textual ou link). | P0 |
| FR-UX-MEI-02 | Os cartões em **Visão geral operacional** exibem, para Certificado/DAS e NFS-e (e demais eixos já presentes): **estado em 2–3 linhas**, **ação primária** (link/botão) quando aplicável, ou **empty state** com CTA quando não houver dados. | P0 |
| FR-UX-MEI-03 | Elementos interativos seguem **padrão visual único** (botão vs cartão clicável vs cartão só leitura); utilizador consegue distinguir sem *hover* obrigatório (pistas também em mobile). | P0 |
| FR-UX-MEI-04 | A ação relacionada a **certificado de servidor** / status está **alinhada** à secção de certificado ou à visão geral com rotulo que explique o destino (sem botão “órfão”). | P0 |
| FR-UX-MEI-05 | Separadores do **Fluxo do MEI** têm **estado selecionado** visível em modo escuro e **teclado**: foco visível; roles/atributos adequados (`aria-selected` ou padrão equivalente do componente). | P1 |
| FR-UX-MEI-06 | Microcopy dos subtítulos favorece **orientação de próximo passo** onde os dados o permitirem (ex.: mensagem quando há pendência), sem inventar estados não suportados pelo backend. | P1 |
| FR-UX-MEI-07 | (Opcional) Memorizar última tab ou última subárea relevante via `localStorage` **apenas** se não conflitar com políticas de privacidade e preferências do produto. | P2 |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-UX-01 | Acessibilidade | Contraste adequado (WCAG 2.1 AA objetivo) nos estados de tab; ordem de foco lógica. |
| NFR-UX-02 | Performance | Evitar re-renders desnecessários ao reestruturar; sem degradação mensurável no LCP da rota. |
| NFR-UX-03 | Qualidade | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados; testes existentes de rota `/guias-mei` (`App.mei-gate.test.tsx`, etc.) permanecem verdes. |
| NFR-UX-04 | Consistência | Reutilizar classes/tokens existentes (`admin-hero-title`, `admin-section-title`, padrões do tema atual) salvo decisão explícita de novo token. |

---

## 8. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Clareza de tarefa | Em teste moderado (5–8 participantes ou painel interno): ≥ 80 % identificam corretamente “onde emitir NFS-e” e “onde ver pendências DAS” em ≤ 30 s na primeira exposição à nova UI. |
| Eficiência | Menor rolagem média até ao primeiro CTA relevante na visão geral (baseline vs pós — medir em sessão gravada ou analytics de profundidade de scroll, se disponível). |
| Satisfação percebida | Redução de feedback qualitativo do tipo “número aparece duas vezes / não sei qual vale”. |
| Acessibilidade | Auditoria rápida: tabs e cartões interativos operáveis por teclado; sem regressões reportadas por leitor de ecrã nos fluxos principais. |

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| “Próximo passo” incorreto sem dados de backend | Utilizador orientado para ação impossível | FR-UX-MEI-06: só mensagens condicionadas a estado real; *fallback* neutro. |
| Refactor grande monolítico em `GuidesMei.tsx` | Regressões e atraso | Entregar por P0 → P1; PRs pequenos; QA focalizada em DAS/NFS-e/certificado. |
| Conflito com iniciativas paralelas na mesma página | Merge difícil | Coordenar com dono de stories MEI/NFS-e; extrair subcomponentes quando útil. |

---

## 10. Priorização (ondas)

| Onda | Conteúdo | IDs |
|------|----------|-----|
| **P0** | Métrica única; cartões da visão geral úteis; affordance; certificado integrado | FR-UX-MEI-01–04 |
| **P1** | Tabs e a11y; microcopy orientadora | FR-UX-MEI-05–06 |
| **P2** | Preferência de última tab | FR-UX-MEI-07 |

---

## 11. Critérios de release

1. Todos os requisitos **P0** cumpritos e demonstrados em *staging* ou ambiente de revisão.
2. Gates do repositório verdes nos ficheiros alterados.
3. Nenhuma regressão nos fluxos críticos MEI (acesso à rota, certificado, listagens DAS/NFS-e conforme casos de teste existentes).
4. Checklist de acessibilidade mínimo (teclado + estado de tab) validado por QA ou responsável designado.

---

## 12. Dependências e próximos passos

- **@sm:** gerar **story(ies)** em `docs/stories/` com checklist de aceite ligado a FR-UX-MEI-* e *file list* (`GuidesMei.tsx` + CSS/módulos tocados).
- **@dev:** implementação incremental; evitar mudanças de API salvo *gap* de dados para FR-UX-MEI-02 — nesse caso escalar a produto com spike curto.
- **@qa:** plano de regressão na rota `/guias-mei` e *smoke* mobile se aplicável.

---

## 13. Referências

- `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md` — contexto MEI/NFS-e  
- `frontend/src/pages/GuidesMei.tsx` — implementação alvo  
- `frontend/src/App.tsx` — rota `/guias-mei`  
- Brief analista (UI/UX Mei Infinito, 2026-03-30) — problemas, princípios e recomendações P0/P1/P2  

---

— *PRD pronto para desdobramento em backlog e stories.*
