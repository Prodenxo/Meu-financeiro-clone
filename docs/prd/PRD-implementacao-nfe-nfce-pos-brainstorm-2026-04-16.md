# PRD — MEI: implementação NF-e / NFC-e **pós-brainstorm** (consolidação de backlog)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Tipo:** Brownfield — evolução do programa Guia MEI / `mei-notas` / Plugnotas  
**Fonte canónica deste documento:** `docs/brief/brief-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`

**Relação com outros artefatos (leitura obrigatória em conjunto):**

| Artefato | Papel |
|----------|--------|
| `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` | **Baseline de produto** — FR-GUIA-FISC-01 a **10**, NFRs e critérios de release para seletor, formulários, lista, erros e habilitação mínima (§6.2). Este PRD **não o revoga**; **complementa** com incrementos priorizados após brainstorm. |
| `docs/brief/brief-emissao-nfe-nfce-plugnotas-aba-emissao-2026-04-06.md` | Contexto original do pedido de emissão multi-documento. |
| `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` | Rotas, validação, integração Plugnotas. |
| `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md` | **D1** adoptado: documentação + bloqueio honesto; **D2/D3** como backlog documentado. |
| `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` | Smoke tests. |
| [Postman PlugNotas](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest), [NFC-e](https://docs.plugnotas.com.br/#tag/NFCe), [NF-e](https://docs.plugnotas.com.br/#tag/NFe) | Contrato público do integrador. |

**Princípio:** o produto **orquestra** dados e chamadas; o utilizador e o contador permanecem responsáveis pela conformidade fiscal.

---

## 1. Resumo executivo

O brainstorm consolidado no brief de 2026-04-16 produziu **nove temas** (A–I) de valor, risco e dependência distintos. Este PRD:

1. **Fixa o baseline obrigatório:** entregas alinhadas a `PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (em especial **FR-GUIA-FISC-01 a 07** como núcleo P0, mais **08–10** conforme acordo de release).  
2. **Adiciona requisitos rastreáveis incrementais** (**FR-GUIA-FISC-11** em diante) para capacidade fiscal sincronizada, eventual **D2** (habilitação guiada), catálogo, confiabilidade, observabilidade, pós-emissão, feature flag e regra de **limite MEI**.  
3. **Prioriza** com **MoSCoW** e esboço **RICE** (Reach, Impact, Confidence, Effort) para orientar o PO e o roadmap sem substituir decisão de sprint.  
4. **Delega** detalhe de story e file list ao **@sm** e contratos finos ao **@architect**, em linha com `AGENTS.md`.

---

## 2. Visão e objetivos deste incremento

| Objetivo | Descrição |
|----------|-----------|
| **O1 — Continuidade** | Não regressar NFS-e nem fluxos de certificado/empresa existentes. |
| **O2 — Honestidade do produto** | Distinguir limitação do **integrador/cadastro** de falha da aplicação (alinhado a **D1** e **FR-GUIA-FISC-07** do PRD baseline). |
| **O3 — Preparar escala** | Observabilidade e confiabilidade mínimas antes de abrir **D2** ou pós-emissão em larga escala. |
| **O4 — Clareza de limite MEI** | **NFE/NFCE** permanecem **fora** do somatório de limite de faturamento MEI na UI até decisão explícita futura (evitar regressão). |

---

## 3. Personas e stakeholders

Igual ao PRD baseline (MEI venda consumidor, MEI B2B, MEI só serviços, suporte). Stakeholders: PO, UX, Architect, Backend, Frontend, QA, Suporte.

---

## 4. Priorização dos temas do brainstorm (MoSCoW)

| Tema | Rótulo | MoSCoW | Nota |
|------|--------|--------|------|
| **A** | MVP emissão na UI (seletor + formulário + `documentType`) | **Must** | Coberto pelo PRD **2026-04-06**; este documento assume-o como pré-requisito de release do programa. |
| **B** | Bloqueio e orientação **D1** (callout + `GET …/empresa`) | **Must** | Baseline + **FR-GUIA-FISC-11** (sincronização explícita abaixo). |
| **D** | Catálogo / produtos para linhas NF-e/NFC-e | **Should** | Alinha a **FR-GUIA-FISC-09** (P1 no baseline) e **FR-GUIA-FISC-12** aqui. |
| **E** | Confiabilidade (`idIntegração`, retry sem fila obrigatória) | **Should** | **FR-GUIA-FISC-13**. |
| **F** | Observabilidade (métricas/logs por tipo) | **Should** | **NFR-POST-01**. |
| **C** | Habilitação guiada **D2** (PATCH controlado) | **Could** | Depende de ADR + arquitetura; **FR-GUIA-FISC-14**. |
| **G** | Pós-emissão (status, XML/PDF, cancelamento) | **Could** (épico próprio) | **FR-GUIA-FISC-15** — pode ser **Won’t** no mesmo release que A+B. |
| **H** | Feature flag **D3** | **Won’t** (salvo decisão PO explícita) | **FR-GUIA-FISC-16** opcional/desligado por defeito. |
| **I** | Limite MEI — exclusão NFE/NFCE | **Must** (regra de produto) | **FR-GUIA-FISC-17**. |

---

## 5. Esboço RICE (orientador — não substitui planning)

**Escala sugerida:** Reach 1–5 (utilizadores afectados), Impact 1–3, Confidence 0–100%, Effort 1–5 (person-dias ordem de grandeza). Score = (Reach × Impact × Confidence) / Effort.

| Tema | Reach | Impact | Conf. | Effort | Comentário |
|------|-------|--------|-------|--------|------------|
| A + B | 5 | 3 | 80% | 4 | Alto valor; maior parte já especificada no PRD 04-06. |
| D | 4 | 2 | 70% | 3 | Depende do estado do catálogo MEI no repo. |
| E | 3 | 2 | 75% | 2 | Baixo esforço relativo se só política + retries limitados. |
| F | 4 | 2 | 70% | 2 | Depende de stack de métricas existente. |
| C | 2 | 3 | 50% | 5 | Alto esforço/risco sem ADR de PATCH. |
| G | 4 | 3 | 60% | 5 | Épico; fatiar por consulta de status primeiro. |
| H | 2 | 1 | 80% | 1 | Só se rollout gradual for necessário. |
| I | 5 | 2 | 90% | 1 | Principalmente salvaguarda de UI/cálculo. |

---

## 6. Escopo

### 6.1 Dentro do escopo (este PRD + baseline)

- Cumprimento dos requisitos do **PRD 2026-04-06** aplicáveis ao release acordado.  
- Requisitos **FR-GUIA-FISC-11 a 17** e **NFR-POST-01** abaixo, **na prioridade MoSCoW** acordada com PO.  
- Manutenção de `docs/qa/plugnotas-multitipo-checklist.md` quando incrementos fecharem (ownership QA).

### 6.2 Fora do escopo

- Substituição do integrador Plugnotas ou motor fiscal próprio.  
- Fila assíncrona obrigatória ou sistema de workflow durável **sem** ADR/story dedicada.  
- Assessoria legal/tributária além do que o integrador e o contador exigem.  
- Requisitos não listados neste PRD nem no PRD baseline — **não implementar** sem novo artefato.

---

## 7. Requisitos funcionais incrementais (pós-brainstorm)

Numeração contínua face ao PRD `…-2026-04-06` (que termina em **FR-GUIA-FISC-10**).

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-GUIA-FISC-11** | O estado de **capacidade fiscal** apresentado ao utilizador (ex.: `MeiFiscalCapabilityCallout` ou equivalente) deve **alinhar-se** aos dados obtidos de `GET …/mei-notas/setup/emissao-fiscal/empresa` (ou rota canónica actual), **após** operações de cadastro/atualização relevantes, minimizando a necessidade de recarregar a página sem motivo documentado. | P0 |
| **FR-GUIA-FISC-12** | Quando o catálogo de **produtos** MEI estiver disponível para o utilizador, o sistema permite **pré-preencher** linhas de **NF-e** / **NFC-e** a partir de itens de catálogo **sem** quebrar fluxos **NFS-e** nem contratos existentes do catálogo (detalhe de mapeamento NCM/CFOP na story + architect). | P1 |
| **FR-GUIA-FISC-13** | A emissão utiliza **`idIntegração` único** por tentativa (já gerado no servidor quando ausente) e define **política explícita** de retry apenas para **falhas transitórias** reconhecíveis, **sem** introduzir fila obrigatória neste incremento (comportamento exacto na story, alinhado ao Plugnotas). | P1 |
| **FR-GUIA-FISC-14** | **(D2 — opcional)** Se o PO aprovar o incremento: existe **fluxo guiado** para o utilizador concluir requisitos e solicitar/reflectir a **activação** de NF-e e/ou NFC-e no cadastro Plugnotas (incl. feedback de sucesso/insucesso **legível**). A implementação técnica (PATCH/POST) deve seguir ADR e revisão **@architect**. | P2 |
| **FR-GUIA-FISC-15** | **(Pós-emissão — épico)** Consulta de **status**, disponibilização de **XML/PDF/DANFE** e **cancelamento** conforme capacidades Plugnotas — pode ser entregue em **ondas**; a primeira onda deve especificar na story o **mínimo** (ex.: só consulta de status **ou** só download PDF). | P2 / épico |
| **FR-GUIA-FISC-16** | **(D3 — opcional)** Visibilidade de NF-e/NFC-e por **feature flag** / ambiente — **desligado por defeito** até decisão PO; se activado, documentar variável e critério de rollout na story. | P3 |
| **FR-GUIA-FISC-17** | **Limite de faturamento MEI:** a UI e agregações de “limite” **não** incluem **NFE** nem **NFCE** no somatório **até** decisão explícita futura; não regressar comportamento actual documentado na arquitetura. | P0 |

---

## 8. Requisitos não funcionais incrementais

| ID | Requisito | Notas |
|----|-----------|-------|
| **NFR-POST-01** | **Observabilidade:** expor ou registar métricas agregadas de emissão por **`document_type`**, taxa de erro da integração Plugnotas e **latência** do caminho de emissão, **sem** PII em labels públicos; alinhar a logging existente no backend. | Should |
| **NFR-POST-02** | **Segurança / privacidade:** feature flag e telemetria respeitam política de dados do produto; sem gravar payload completo em logs de nível info em produção salvo necessidade de debug controlada. | Must |
| **NFR-POST-03** | **Qualidade:** `npm run lint`, `npm run typecheck`, `npm run test` por `AGENTS.md`; stories com file list. | Must |

---

## 9. Compatibilidade (brownfield)

| ID | Requisito |
|----|-----------|
| **CR-POST-01** | Cumprimento de **CR-GUIA-FISC-01 a 04** do PRD 2026-04-06. |
| **CR-POST-02** | Alterações em **D2** ou empresa Plugnotas são **aditivas** e reversíveis conforme ADR; não remover cadastro NFS-e existente. |

---

## 10. Métricas de sucesso (incrementais)

| Métrica | Alvo / evidência |
|---------|------------------|
| Sincronização capacidade | Redução de tickets “callout errado após salvar empresa” (qualitativo + QA). |
| Emissão multi-tipo | Taxa de erro pré-submit estável ou inferior (validação UI + servidor). |
| Observabilidade | Dashboard ou query interna com volume por tipo e erro Plugnotas (se stack o permitir). |
| Limite MEI | Zero incidentes de “limite errado por incluir NFE/NFCE” pós-release. |

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| **D2** aumenta superfície de PATCH indevido | ADR + code review + sandbox; feature atrás de flag se necessário. |
| **Pós-emissão (G)** dispersa equipa | Épico dedicado; primeira onda mínima em **FR-GUIA-FISC-15**. |
| Payload UI ↔ Plugnotas diverge | Testes de contrato, runbook smoke, checklist QA multitipo. |
| **Catálogo (12)** conflita com NFS-e | Mapeamento explícito de `documentType` por item ou passo de selecção na story. |

---

## 12. Epics e stories (proposta — @sm detalha)

**Epic 1 — Baseline Guia MEI multi-documento**  
Stories derivadas de `PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (seletor, formulário, lista, erros, FR-GUIA-FISC-07).

**Epic 2 — Consolidação pós-brainstorm (este PRD)**  
| Story sugerida | FR principal |
|----------------|--------------|
| S2.1 Capacidade fiscal sincronizada | FR-GUIA-FISC-11 |
| S2.2 Limite MEI — salvaguarda | FR-GUIA-FISC-17 |
| S2.3 Catálogo → linhas NF-e/NFC-e | FR-GUIA-FISC-12 |
| S2.4 Política idIntegração + retry | FR-GUIA-FISC-13 |
| S2.5 Telemetria emissão | NFR-POST-01 |
| S2.6 (Opcional) D2 habilitação | FR-GUIA-FISC-14 |
| S2.7 (Opcional) D3 flag | FR-GUIA-FISC-16 |
| S2.8 (Épico filho) Pós-emissão onda 1 | FR-GUIA-FISC-15 |

---

## 13. Definition of Done (produto) — incrementos deste PRD

- [ ] **FR-GUIA-FISC-11** e **FR-GUIA-FISC-17** satisfeitos quando o release incluir este pacote.  
- [ ] Itens **Should** (12, 13, NFR-POST-01) satisfeitos ou **adiados** com registo explícito no changelog da story e acordo PO.  
- [ ] Itens **Could** (14, 15, 16) apenas se entrarem no scope da sprint — caso contrário permanecem backlog documentado.  
- [ ] **NFR-POST-02** e **NFR-POST-03** verificados.  
- [ ] QA actualiza checklist multitipo quando aplicável.

---

## 14. Change log

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-16 | PM (Morgan — a partir do brief pós-brainstorm) | Versão inicial; complementa PRD 2026-04-06. |

---

*Próximo passo canónico AIOX: **@sm** — stories em `docs/stories/` com referência cruzada a **FR-GUIA-FISC-11+** e ao baseline; **@architect** — contratos D2, retry e pós-emissão; **@dev** — implementação com gates do `AGENTS.md`.*

— Morgan, planejando o futuro
