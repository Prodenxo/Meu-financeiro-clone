# PRD — Acção **P0**: fechar cadastro empresa (400 `nfse.config.prefeitura` + cadeia 404 `GET`)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI / setup emissão fiscal (`POST` e `GET` `…/mei-notas/setup/emissao-fiscal/empresa`)  
**Prioridade:** **P0** — bloqueio funcional após certificado; melhorias de UX/copy **sozinhas** não resolvem.

**Fonte canónica do pedido:** [`docs/brief/brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md`](../brief/brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md)

**Relação com outros artefatos (este PRD não os substitui):**

| Artefacto | Papel |
|-----------|--------|
| [`PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](./PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) | Camada **SOL** — diagnóstico HTTP, encadeamento 400→404, playbook, **FR-SOL-***, **NFR-SOL-01**. |
| [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](./PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) | Camada **PREF** — IM vs `nfse.config.prefeitura`, trilhos B/C/D de payload, **FR-PREF-***. |
| [`PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](./PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Modo nacional no formulário; **NFR-N04**. |
| [`docs/brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](../brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md) | Brief de solução (playbook). |
| **Código:** `frontend/src/utils/nfEmissionCompany.ts`, `backend/src/services/plugnotas/empresa.service.js`, `GuidesMei.tsx`, `guiaMeiEmpresaGetCache.ts`, `meiNotasService.ts` | Implementação e fluxo pós-certificado. |

**Não substitui** orientação legal/tributária nem garantias do provedor Plugnotas.

---

## 1. Resumo executivo

O incidente **persiste**: o **`POST`** de cadastro de empresa continua a falhar com **400** (`fields.nfse.config.prefeitura: Preenchimento obrigatório`) e o **`GET`** subsequente devolve **404** porque **não há empresa criada** no Plugnotas. Trabalho já feito em classificação de erros e copy **não altera** o contrato remoto nem o corpo JSON enviado.

Este PRD fixa **entrega obrigatória de resultado**: **ou** o utilizador consegue completar o cadastro (**POST 2xx** e consulta coerente), **ou** o produto documenta **explicitamente** a impossibilidade naquela conta/ambiente e **não** sugere conclusão automática do fluxo. Para isso, a organização deve **fechar** um **trilho A–D** (conta vs. payload vs. UI vs. híbrido) após **spike de contrato** com Plugnotas — sem implementação “à tentativa” que viole **NFR-N04**.

---

## 2. Visão de produto (resultado)

1. **Fim do bloqueio silencioso:** deixa de ser aceitável que o fluxo Guia MEI fique preso após upload de certificado sem um **caminho de resolução** que produza **cadastro efectivo** ou **expectativa alinhada** (impossibilidade documentada).  
2. **Decisão explícita de trilho:** PO/arquitectura registam **qual** combinação **A** (+ eventual **B/C/D**) foi adoptada para o épico P0, com evidência **sem PII** no repositório.  
3. **Coerência com PRDs anteriores:** **FR-SOL-***, **FR-PREF-*** e **FR-NAT-*** permanecem válidos; este PRD acrescenta requisitos **FR-P0-*** focados em **fecho e mensurabilidade**.

---

## 3. Problema e oportunidade

| Dimensão | Situação | Oportunidade |
|----------|----------|--------------|
| **Estado actual** | 400 no `POST` é **determinístico** enquanto `nfse.config` não satisfaz o validador Plugnotas para a conta/CNPJ. | Fechar causa (A ou payload B/C/D) em prazo P0. |
| **404** | Efeito do POST falhado — já documentado em **PRD SOL**. | Garantir que **ninguém** trata como bug isolado de leitura durante o P0. |
| **Esforço já gasto** | UX/hints melhoram percepção mas **não** criam empresa. | Reorientar capacidade para spike + implementação ou operação **A**. |
| **Risco de produto** | Promessa implícita de “cadastro completo” com fluxo que **nunca** passa do 400. | Copy honesta + runbook quando **A** não for possível e **B/C** não estiverem prontos. |

---

## 4. Personas e cenários

| Persona | Cenário P0 |
|---------|------------|
| **MEI** | Após certificado, submete empresa; precisa de **conclusão** do setup (sucesso HTTP) ou mensagem **clara** de bloqueio externo e próximos passos. |
| **PO / Architect** | Decide e regista trilho **A–D** após spike; desbloqueia story única ou conjunto mínimo de stories. |
| **Dev / QA** | Implementa/testa conforme schema acordado; valida **POST→GET** no CNPJ de teste acordado. |
| **Operação** | Executa checklist painel Plugnotas / ambiente para **trilho A**; arquiva resposta de suporte redigida. |

**Stakeholders:** PO (decisão §6), Architect (spike/contrato), Backend, Frontend, QA, Operação, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo (P0)

1. **Spike bloqueante** (0,5–2 dias úteis alvo): obter formato mínimo de `nfse.config.prefeitura` e regra com `nfse.nacional: true` (doc/sandbox/ticket Plugnotas), conforme brief §4 e **NFR-PREF-EV-01** (**PRD PREF**).  
2. **Execução de um trilho principal** (brief §3): **A** e/ou **B/C/D** até satisfazer **§7** deste PRD.  
3. **Registo único de fecho:** trilho escolhido + schema ou ticket (sem PII) em ADR, `docs/operacao-mei-nfse.md` e/ou story fechada (**FR-P0-DOC-01**).  
4. **Verificação end-to-end:** `POST` 2xx e `GET` sem 404 para o mesmo CNPJ na mesma conta/ambiente de teste acordado, **ou** caminho documentado de impossibilidade + UX alinhada (**FR-P0-OUT-01**, **FR-P0-OUT-02**).  
5. **Gates de qualidade** do repositório (**NFR-P0-GATE-01**).

### 5.2 Fora do âmbito (neste PRD)

- Mudança de provedor fiscal.  
- Duplicar o texto integral de **PRD PREF** / **PRD SOL** — aplicam-se por referência.  
- Garantir emissão fiscal autorizada em todos os municípios ou contas.

---

## 6. Decisões de produto (obrigatórias para fechar P0)

1. **Antes** de merge de alteração de payload **B** ou **C**, deve existir **evidência** citável (mesmo critério **NFR-N04** / spike) — alinhado a **FR-SOL-PLAY-01** e **§6 PRD PREF**.  
2. Se **apenas A** resolver para o CNPJ de referência interna, **não** é obrigatório alterar `nfEmissionCompany` — mas **é** obrigatório **NFR-P0-REG-01** e registo **FR-P0-DOC-01**.  
3. Se **A** não resolver, PO escolhe **B**, **C** ou **D** com base no risco (município, manutenção, UX) e no **PRD PREF §6**.  
4. **Tensão com NAT:** se **C** introduzir campos de prefeitura na UI, isso constitui **decisão explícita** que **actualiza** ou **nota** o **PRD NAT** (não silencioso).

### 6.4 Trilho **B** sem UI **C/D** — ponteiro PRD NAT (alinhamento com aceites de story)

Quando o PO fechar **apenas B** (derivação `nfse.config.prefeitura` no BFF, sem campos novos de prefeitura no formulário), a **nota canónica** que alinha **FR-NAT-UX-01** com esse P0 está no [**PRD NAT** — secção 6.4](PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) (*«P0 cadastro `nfse.config.prefeitura` — trilhos C/D (UI) vs este PRD»*). Isto fecha a referência que algumas stories P0 fazem a «nota no PRD NAT» / tensão com copy nacional sem exigir um §6.4 duplicado no **PRD PREF**.

**Rastreio:** story UI C/D [`story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md) — **Cancelled**; spike [`NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md) §4.

---

## 7. Requisitos funcionais (camada **P0** — fecho)

| ID | Requisito |
|----|-----------|
| **FR-P0-OUT-01** | Para o **CNPJ de teste acordado** (conta/ambiente documentados na story), **`POST /api/mei-notas/setup/emissao-fiscal/empresa`** retorna **2xx** **ou** existe **documento de produto** (secção operacional + copy UI) que declare **impossibilidade** de cadastro automático naquela conta sem acção fora do app, **sem** prometer conclusão do fluxo que o código não consegue cumprir. |
| **FR-P0-OUT-02** | Quando **FR-P0-OUT-01** for satisfeito via sucesso de **POST**, **`GET …/emissao-fiscal/empresa?cpfCnpj=`** com o mesmo CNPJ **não** retorna **404** por “empresa inexistente” na mesma conta/ambiente (resposta **200** com dados ou semântica equivalente acordada com Architect). |
| **FR-P0-SPIKE-01** | Antes de implementar **B**, **C** ou **D** com novo JSON, conclui-se spike com **respostas** às perguntas do brief de acção §4 (formato `nfse.config.prefeitura`, condicionalidade com nacional, lookup, compatibilidade) — output arquivado **sem PII** (**NFR-P0-EV-01**). |
| **FR-P0-DEC-01** | PO (ou delegado registado) documenta **trilho principal** adoptado (**A**, **B**, **C**, **D** ou combinação) e data de fecho, com ligação ao artefacto de evidência. |
| **FR-P0-DOC-01** | Existe **registo único** actualizado (ADR, `docs/operacao-mei-nfse.md`, ou apêndice referenciado na story) com: trilho **A–D**, referência a schema/ticket **sem PII**, e ponteiro para este PRD. |

**Requisitos herdados (continuam aplicáveis):**

- **FR-SOL-DIAG-01**, **FR-SOL-DIAG-02**, **FR-SOL-PLAY-01**, **FR-SOL-ANT-01** — **PRD SOL**.  
- **FR-PREF-UX-01**, **FR-PREF-API-01**, **FR-PREF-DOC-01** — **PRD PREF**, quando houver UI/payload/doc.  
- **NFR-N04** — **PRD NAT** / **NFR-SOL-02**.

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-P0-EV-01** | Evidências de suporte Plugnotas ou payloads de exemplo **não** contêm PII/CNPJ real em ficheiros versionados; usar redacção ou armazenamento interno apropriado. |
| **NFR-P0-REG-01** | Contas/cenários onde **`POST`** já passava **sem** `nfse.config.prefeitura` (trilho nacional válido) **não** regredem após entrega P0 — testes de regressão na story. |
| **NFR-P0-GATE-01** | `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |
| **NFR-P0-TIME-01** | Spike **inicia** no prazo acordado pelo PO (alvo: brief §4 — 0,5–2 dias úteis após kickoff P0); atrasos documentados com causa. |

---

## 9. Milestones (sugeridos)

1. **M1 — Spike fechado:** saída **FR-P0-SPIKE-01** aprovada por Architect + PO.  
2. **M2 — Trilho A tentado** (em paralelo ao spike quando possível): checklist painel/ambiente + resultado documentado.  
3. **M3 — Implementação** (se B/C/D): código + testes **FR-PREF-API-01** / contrato.  
4. **M4 — Verificação:** **FR-P0-OUT-01**, **FR-P0-OUT-02**, **FR-P0-DOC-01**, **NFR-P0-REG-01**, gates **NFR-P0-GATE-01**.

---

## 10. Métricas de sucesso

- **Binário:** critérios **§11** verdes no CNPJ/ambiente de teste acordado.  
- **Operacional:** redução de tickets “GET 404 empresa” **sem** análise prévia do **POST** (alinhado a **PRD SOL**).  
- **Rastreabilidade:** 100% dos fechos P0 com **FR-P0-DOC-01** preenchido.

---

## 11. Critérios de aceite (release P0)

1. **FR-P0-OUT-01** e **FR-P0-OUT-02** demonstrados em QA **ou** caminho “impossibilidade + copy honesta” aprovado por PO com **FR-P0-DOC-01**.  
2. **FR-P0-SPIKE-01** cumprido antes de qualquer merge de **B/C/D** que altere `nfse.config.prefeitura`.  
3. **FR-P0-DEC-01** e **FR-P0-DOC-01** verificáveis no repositório ou sistema de gestão ligado na story.  
4. **NFR-P0-REG-01** e **NFR-P0-GATE-01** verdes.  
5. Requisitos **FR-SOL-***, **FR-PREF-*** aplicáveis permanecem satisfeitos (regressão documental/QA).

---

## 12. Dependências e riscos

- **Dependência externa:** Plugnotas (API, conta, plano, habilitação nacional).  
- **Dependência interna:** disponibilidade de Architect + conta de teste + CNPJ de teste **redigido** nos docs.  
- **Risco:** Spike prolonga P0 — mitigar com **M1** explícito e escalamento a suporte Plugnotas.  
- **Risco:** **A** impossível e **B** inviável por município — PO deve escolher **C** ou aceitar **FR-P0-OUT-01** modo “impossibilidade”.  
- **Risco:** Sobreposição de stories com **PRD correcao-cadastro** / console — coordenar num único sprint item ou dependência explícita na story.

---

## 13. Rastreabilidade brief → PRD

| Secção do brief de acção | Onde no PRD |
|--------------------------|-------------|
| §1 Evidência POST/GET | §1, §3 |
| §2 Porque persiste | §1, §3 |
| §3 Decisão trilho A–D | §5.1, §6, **FR-P0-DEC-01** |
| §4 Plano execução | §5.1, §9, **FR-P0-SPIKE-01** |
| §5 Definição de pronto | §7 **FR-P0-OUT-01/02**, §11 |
| §6 Riscos | §12 |

---

## 14. Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | PM (Morgan) | Versão inicial a partir de `brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md`; camada **P0** de entrega mensurável; complementa **PRD SOL**, **PRD PREF** e **PRD NAT**. |
| 2026-04-08 | Engenharia | **§6.4** — ponteiro ao PRD NAT §6.4 (trilho B vs UI C/D cancelada); rastreio QA/story. |
