# Especificação de front-end e UX — Limite de faturamento MEI (Mei Infinito)

**Versão:** 1.0  
**Data:** 2026-04-02  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md`  
**Alinhamento canónico:** `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md` (L1 hero como fonte de KPIs; **FR-UX-MEI-01**)  
**Implementação de referência:** `frontend/src/pages/GuidesMei.tsx`; persistência em `frontend/src/pages/guidesMeiWorkspaceStorage.ts`  

---

## 1. Objetivo deste documento

Contrato de experiência e implementação para **um único bloco canónico** de acompanhamento do **limite anual de referência** do MEI: progresso (valor e/ou percentagem), período, base de cálculo MVP, vigência do teto, estados de proximidade, *empty state*, disclaimer e acessibilidade. Mapeia **FR-LIM-01** a **FR-LIM-08** e **NFR-LIM-01** a **NFR-LIM-05** do PRD.

Não substitui stories em `docs/stories/`; alimenta critérios de aceite e *file list*.

---

## 2. Princípios de experiência (herdados do PRD e da spec Mei Infinito)

| Princípio | Implicação na UI |
|-----------|------------------|
| **Compreensão em ≤ 15–20 s** | Estado (conforto / atenção / crítico) perceptível à primeira vista; barra ou percentagem + rótulo curto. |
| **FR-UX-MEI-01** | O **valor monetário principal** do progresso face ao limite e a **percentagem** (se ambos existirem) vivem **numa única zona canónica** — o bloco desta spec. Não repetir o mesmo número em hero KPIs existentes, tabs e cartões da visão geral **sem valor acrescentado** (ex.: não duplicar “R$ X / Y” em três sítios). |
| **Tom calmo e acionável** | Mensagens de proximidade com CTA útil (*Ir para NFS-e*, *Saber mais*) — não alarmismo. |
| **Informativo, não oficial** | Disclaimer sempre visível (§6). |

---

## 3. Arquitetura de informação

### 3.1 Colocação do bloco (decisão de produto — fechar com PO)

| Opção | Prioridade sugerida no PRD | Quando usar |
|-------|----------------------------|-------------|
| **A — Hero (L1)** | Preferida | Bloco integrado na área `admin-hero`, **após** ou **em extensão** da `admin-stat-grid` atual (5.º KPI ou faixa dedicada), **ou** substituindo layout se o *grid* passar a 2 linhas controladas. |
| **B — Visão geral (L3)** | Alternativa se o hero saturar | Único bloco canónico **só** em `activeWorkspace === 'overview'`, no topo da “Visão geral operacional”, com link no hero *“Ver limite de faturamento”* que faz *scroll* ou troca de workspace — **sem** segundo bloco com os mesmos números no hero. |

**Regra:** em qualquer opção, existe **apenas um** bloco que mostra **utilizado / limite / %** para o indicador de limite.

### 3.2 Relação com KPIs existentes do hero

- Os quatro *stat cards* atuais (Períodos DAS, Pendências, Notas exibidas, Certificado) **mantêm** a regra da spec de 2026-03-30.  
- O indicador de **limite de faturamento** é um **KPI distinto**: rótulos e significado diferentes (“Faturamento no ano” / “Limite de referência” — *copy* final sujeita a PO).  
- Se o utilizador estiver em **overview** e o bloco canónico for **só** em L3, o hero **não** deve mostrar o mesmo par valor/% do limite (evitar duplicação).

---

## 4. Wireframes lógicos (baixa fidelidade)

### 4.1 Desktop — opção Hero (extensão)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [L1 HERO] Mei Infinito                         [Badge certif.]   │
│ Subtítulo                                                        │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  (KPIs existentes)           │
│ │ …    │ │ …    │ │ …    │ │ …    │                             │
│ └──────┘ └──────┘ └──────┘ └──────┘                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ LIMITE DE FATURAMENTO (ano civil 20XX)          [estado]     │ │
│ │ ████████████░░░░░░░░  68 %                                   │ │
│ │ R$ 54.320 de R$ 81.000 · referência vigência 20XX            │ │
│ │ Base: soma das NFS-e emitidas nesta conta no ano. [ⓘ]        │ │
│ │ Aviso legal (1 linha) — ver §6                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Desktop — opção apenas Overview (L3)

```text
Hero: linha opcional sem valores duplicados: “Acompanhe o limite na visão geral.”
[L3] Visão geral operacional
┌─────────────────────────────────────────────────────────────────┐
│ (cartão / faixa LIMITE — mesmo conteúdo que §4.1 corpo)           │
└─────────────────────────────────────────────────────────────────┘
… restantes cartões Certificado, NFS-e, Parcelamentos …
```

### 4.3 Mobile

- Bloco em **coluna única**; barra de progresso com altura mínima tocável se houver controlo (ex.: *Saber mais* ≥ 44×44 px).  
- Disclaimer pode colapsar para “Ler aviso legal” expandível **desde que** o texto completo esteja acessível (SR + teclado) — preferência: **sempre uma linha visível** + detalhe.

---

## 5. Componente: bloco “Limite de faturamento”

### 5.1 Estrutura de conteúdo (ordem de leitura)

| # | Elemento | Obrigatório | Notas |
|---|----------|-------------|-------|
| 1 | **Título** + **período** | Sim | Ex.: “Limite de faturamento · Ano 2026” ou “Ano civil 2026”. |
| 2 | **Estado de proximidade** | Sim | Etiqueta textual curta + estilo (§5.3): *Confortável* / *Atenção* / *Crítico* (rótulos finais a validar com PO). |
| 3 | **Progresso** | Sim | Percentagem 0–100 % **e/ou** barra; valor utilizado em R$ **e** limite de referência em R$ (**FR-LIM-01**). |
| 4 | **Vigência do limite** | Sim | Etiqueta tipo “Referência vigência 2026” ou data de atualização da tabela (**FR-LIM-03**). |
| 5 | **Base de cálculo** | Sim | Uma linha: MVP *“Baseado em NFS-e emitidas nesta conta no ano civil”* (ou equivalente aprovado) (**FR-LIM-02**). Tooltip ou `popover` acessível para detalhe sem esconder a linha base. |
| 6 | **Disclaimer** | Sim | Texto curto §6 (**FR-LIM-05**). |
| 7 | **CTAs secundários** | Condicional | Link *Ir para NFS-e* (se `canViewNfse`), *Ajuda* / reenquadramento genérico — sem poluir o título. |

### 5.2 Estados de dados

| Estado | Condição | UI |
|--------|----------|-----|
| **Com dados** | Soma no ano > 0 e limite configurado | Barra + valores + estado de proximidade (§5.3). |
| **Empty (sem notas no ano)** | Soma = 0 ou sem notas aplicáveis | Mensagem honesta: ex. *“Ainda não há NFS-e emitidas neste ano para calcular o progresso.”* + CTA *Emitir NFS-e* se aplicável (**FR-LIM-07**, alinhado **FR-UX-MEI-02**). Mostrar **mesmo assim** limite de referência e vigência se útil ao utilizador. |
| **Erro / indisponível** | Falha de carga ou config em falta | `role="alert"`; mensagem neutra; retry se existir padrão na página. |

### 5.3 Estados visuais de proximidade (**FR-LIM-04**)

Limiares **configuráveis** (ex.: ≥ 80 % atenção, ≥ 95 % crítico — valores finais em config).

| Faixa | Token / padrão sugerido | Comportamento |
|-------|-------------------------|----------------|
| **Seguro** | `admin-badge-success` ou borda/`bg` neutro compatível com `planner-*` | Mensagem neutra ou positiva leve. |
| **Atenção** | `admin-badge-warning` / `admin-alert-warning` | Reforçar leitura “aproximação”; sem pânico. |
| **Crítico** | `admin-badge-danger` / `admin-alert-danger` | Mensagem calma + CTA; não bloquear emissão na V1 (PRD §5.2). |

**Contraste:** cumprir **NFR-LIM-01** (WCAG 2.1 AA) nos textos e na barra (não só cor).

### 5.4 Barra de progresso

- **Semântica:** `role="progressbar"` com `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}` **ou** valores em centavos se a percentagem for derivada — documentar na implementação de forma consistente.  
- **Valor textual** repetido para SR: já coberto por `aria-valuetext` se necessário.  
- Percentagem > 100 % (edge case): tratar como “acima do limite de referência” com *copy* clara e estado crítico — não truncar barra de forma ambígua (ex.: barra cheia + texto explícito).

---

## 6. Disclaimer e linguagem (obrigatório)

Texto orientador (ajustar com jurídico/PO; manter **curto**):

- O indicador é **informativo**.  
- **Não substitui** contabilidade, obrigações legais nem conferência com a Receita Federal.  
- O valor do limite é **referência configurável** com **vigência** indicada na UI.

**Colocação:** rodapé do bloco ou linha imediatamente abaixo dos valores; pode partilhar *tooltip* com “base de cálculo” desde que o disclaimer permaneça **descobrível** sem *hover* obrigatório.

---

## 7. Microcopy — rascunhos (aprovação PO)

| Contexto | Texto sugerido |
|----------|----------------|
| Base MVP | *“Total das NFS-e emitidas por esta conta no ano civil, comparado ao limite de referência.”* |
| Título | *“Limite de faturamento (MEI)”* + subtítulo com ano. |
| Empty | *“Quando emitir NFS-e, o progresso aparece aqui.”* (variante conforme §5.2). |
| Atenção (80 %) | *“Você já utilizou grande parte do limite de referência do ano.”* |
| Crítico (95 %) | *“Próximo do limite de referência — planeje próximos passos e consulte um contador se necessário.”* |
| Link ajuda | *“Entenda o limite MEI”* (destino: doc interno existente, se houver). |

Evitar afirmações do tipo “valor oficial da Receita”.

---

## 8. Atualização e dados (**FR-LIM-08**, **NFR-LIM-02**)

- Após **emissão** ou **cancelamento** de NFS-e que altere o somatório do ano, o bloco **atualiza** sem recarregar a página (revalidação de estado / *refetch* conforme arquitetura).  
- Evitar *polling* agressivo; preferir invalidação no sucesso da ação ou subscrição ao mesmo estado que alimenta a lista NFS-e.  
- Se existir **endpoint** `GET …/mei/limit-progress`, a spec de UX assume **loading** discreto (esqueleto ou *spinner* inline no bloco) sem deslocar o layout do hero.

---

## 9. Acessibilidade (**FR-LIM-06**, **NFR-LIM-01**)

- **Anúncio SR:** título do bloco + valor utilizado + limite + percentagem + estado de proximidade + período (ano civil) — `aria-live="polite"` em atualizações **ou** região semântica com heading.  
- **Foco:** links *Saber mais* / *Ir para NFS-e* com foco visível (`focus-visible` / *ring* alinhado à spec Mei Infinito).  
- **Teclado:** ordem = título → progresso → base → disclaimer → CTAs.  
- **Tooltip/popover** da base de cálculo: activável por teclado, `aria-expanded`, fechar com `Esc`.

---

## 10. Design tokens e CSS (**NFR-LIM-04**)

Reutilizar:

- Contentor: `admin-section-card`, `planner-card` ou extensão de `admin-hero` com mesma linguagem de sombra/borda.  
- Tipografia: `admin-section-title`, `admin-section-subtitle`, `admin-stat-label`, `admin-stat-value` onde fizer sentido.  
- Alertas/estados: `admin-alert-*`, `admin-badge-*` coerentes com §5.3.  
- Barra: componente existente se houver; caso contrário, `bg` + `rounded` com cor de preenchimento tokenizada (evitar hex solto).

**Proibido** neste *slice:* novo tema global; **permitido** variante local (ex.: `.admin-limit-progress-track`).

---

## 11. Responsividade

- Bloco **full width** dentro do hero ou da coluna overview.  
- Em *viewport* estreita, empilhar: título → estado → barra → valores em duas linhas máximo (R$ utilizado / R$ limite).  
- Não esconder disclaimer atrás de gesto não óbvio.

---

## 12. Matriz de rastreio PRD ↔ UI

| ID PRD | Secção desta spec |
|--------|-------------------|
| **FR-LIM-01** | §3, §4, §5.1 item 3 |
| **FR-LIM-02** | §5.1 item 5, §7 |
| **FR-LIM-03** | §5.1 item 4 |
| **FR-LIM-04** | §5.3 |
| **FR-LIM-05** | §6 |
| **FR-LIM-06** | §9 |
| **FR-LIM-07** | §5.2 |
| **FR-LIM-08** | §8 |
| **NFR-LIM-01** | §5.3, §9 |
| **NFR-LIM-02** | §8 |
| **NFR-LIM-03** | Gates repo (fora do texto UX) |
| **NFR-LIM-04** | §10 |
| **NFR-LIM-05** | §5.1 item 4, §6 |

---

## 13. Checklist de aceite (réplica para story)

- [ ] Um único bloco canónico (hero **ou** overview, nunca dois com os mesmos números) — **FR-LIM-01**, **FR-UX-MEI-01**.  
- [ ] Período (ano civil) e base de cálculo MVP visíveis — **FR-LIM-02**.  
- [ ] Vigência ou data de referência do limite visível — **FR-LIM-03**.  
- [ ] Três níveis de proximidade com mensagem + estilo distintos — **FR-LIM-04**.  
- [ ] Disclaimer informativo presente — **FR-LIM-05**.  
- [ ] SR e teclado conforme §9 — **FR-LIM-06**.  
- [ ] Empty state quando não há notas no ano — **FR-LIM-07**.  
- [ ] Atualização após emitir/cancelar NFS-e — **FR-LIM-08**.  
- [ ] `npm run lint`, `npm run typecheck`, `npm test` nos pacotes tocados — **NFR-LIM-03**.  
- [ ] Sem regressão em `/guias-mei` e fluxos NFS-e cobertos por testes.

---

## 14. Abertas para PO / arquitetura

| Tema | Owner |
|------|--------|
| Hero (A) vs Overview (B) | PO + UX |
| Valores exatos dos limiares (80 / 95) | PO / config |
| Endpoint vs cálculo cliente | @architect + @dev |
| *Copy* final disclaimer e microcopy §7 | PO |

---

## 15. Referências

- `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md`  
- `docs/brief/brief-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md`  
- `docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`  
- `docs/prd/PRD-meu-mei-ui-ux-melhoria-2026-03-30.md` (**FR-UX-MEI-01**, **FR-UX-MEI-02**)  
- `frontend/src/pages/GuidesMei.tsx`  
- `frontend/src/pages/guidesMeiWorkspaceStorage.ts`  

---

— *Especificação pronta para story, spike técnico de agregado e implementação P0.*
