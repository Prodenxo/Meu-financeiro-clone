# PRD — Cadastro empresa Plugnotas: **`nfse.config.prefeitura`** e paridade com **`inscricaoMunicipal`**

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI / `POST`/`PATCH` empresa no Plugnotas (certificado A1 + payload `nfse`)  
**Fonte canónica do pedido:** [`docs/brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`** — modo NFS-e Nacional sem IM/prefeitura **no formulário**; **FR-NAT-ERR-01**, **NFR-N04**. Este PRD **não** revoga o NAT: clarifica e desbloqueia o caso em que a **API** exige **`nfse.config.prefeitura`** independentemente de **`inscricaoMunicipal`** na raiz.  
- **`docs/brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`** — contexto de produto “nacional”.  
- **`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`** — `nfse.nacional`; qualquer extensão de `nfse.config.prefeitura` deve ser registada no ADR após evidência (**FR-NA02** / **NFR-NAT-01**).  
- **`docs/operacao-mei-nfse.md`** — operação e erros municipais.  
- **`frontend/src/utils/nfEmissionCompany.ts`**, **`backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`** — montagem actual de `nfse.config`.  
- **`frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`** — classificação de mensagens com `nfse.config.prefeitura`.  
- **Não substitui** orientação legal/tributária nem garantias do provedor.

---

## 1. Resumo executivo

Em produção, o Plugnotas pode responder **400** com validação do tipo **`fields.nfse.config.prefeitura: Preenchimento obrigatório`**. O utilizador pode preencher **inscrição municipal** no site (`inscricaoMunicipal` na raiz do JSON de empresa), mas isso **não satisfaz** a regra que exige **`prefeitura` dentro de `nfse.config`** — são **campos distintos** no contrato da API.

Este PRD define **objectivos de produto**, **caminhos de resolução** (conta vs. payload vs. UX híbrida), **requisitos** para fechar o gap sem contradizer o PRD NAT (formulário “só nacional” continua válido quando a conta aceitar; quando não aceitar, o produto **explica** e **orienta** ou **colecta** dados mínimos **com decisão explícita de PO**).

---

## 2. Visão de produto (experiência)

- O utilizador **não** deve concluir que “faltou inscrição municipal” quando o erro citar **`nfse.config.prefeitura`**.  
- Copy e documentação interna **distinguem** IM na raiz vs. configuração de prefeitura no bloco **`nfse`**.  
- Consoante a **decisão §6**, o produto **ou** mantém fluxo nacional e resolve bloqueio via conta/suporte Plugnotas, **ou** oferece caminho para fornecer **`nfse.config.prefeitura`** (automático ou manual) **sem** misturar com o campo opcional de IM.  
- O **404** em `GET /empresa` após falha de `POST` é tratado como **esperado** até cadastro bem-sucedido; mensagens de retry não devem culpar o utilizador por “empresa inexistente” sem contexto.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Expectativa** | Utilizador preenche IM opcional e ainda vê 400 `prefeitura`. | Mensagens e hints que **nomeiam o campo certo** (`nfse.config.prefeitura`). |
| **Contrato API** | Payload actual: `nfse.config` com `{ producao: true }` **sem** `prefeitura`. | Evidência + ADR + implementação alinhada ao schema oficial. |
| **Paridade painel ↔ API** | `nacional: true` no JSON mas validação municipal na ponta (**NFR-N04**). | Trilho operacional (A) em paralelo com engenharia (B/C/D). |
| **Suporte** | Erros genéricos e confusão IM vs. prefeitura. | `operacao-mei-nfse.md` + hints já mapeados estendidos se necessário. |

---

## 4. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI — cadastro Guia MEI** | Após certificado, submete dados mínimos; recebe 400 `nfse.config.prefeitura` → vê explicação **accionável** (**FR-PREF-UX-01**). |
| **MEI — conta nacional válida** | Mesmo fluxo; `POST /empresa` **aceite** sem `prefeitura` em `config` (baseline actual preservada) — regressão zero. |
| **Operação / suporte interno** | Reproduz erro com payload redigido; segue checklist em doc operacional (**FR-PREF-DOC-01**). |
| **PO / Architect** | Fecha schema mínimo de `prefeitura` ou confirmação Plugnotas de dispensa com nacional (**NFR-PREF-EV-01**). |

**Stakeholders:** PO (§6), UX (copy), Architect (contrato, ADR), Backend/Frontend, QA, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo

1. **Descoberta:** obter resposta citável (doc Plugnotas, sandbox ou ticket) às perguntas do brief §4 — formato de `nfse.config.prefeitura`, condições com `nacional: true`, lookup opcional, compatibilidade (**NFR-PREF-EV-01**).  
2. **UX / copy:** quando a mensagem de erro indicar `nfse.config.prefeitura` (ou equivalente normalizado pelo backend), o utilizador vê texto que **não** atribui falha só à “falta de inscrição municipal” (**FR-PREF-UX-01**).  
3. **Payload (consoante decisão §6):**  
   - **Trilho A:** sem alteração de código além de copy/doc se a resolução for **só** conta/suporte Plugnotas; **ou**  
   - **Trilhos B/C/D:** implementar derivação, campos explícitos ou fluxo híbrido **após** schema validado — com testes de contrato (**FR-PREF-API-01**).  
4. **Documentação:** actualizar `docs/operacao-mei-nfse.md` com secção ou bullets sobre 400 `nfse.config.prefeitura`, IM vs. `prefeitura`, e ligação a este PRD (**FR-PREF-DOC-01**).  
5. **Rastreabilidade:** ADR ou apêndice ao ADR nacional quando o JSON `nfse` mudar.

### 5.2 Fora de escopo

- Mudança de provedor fiscal.  
- Catálogo completo nacional de prefeituras **salvo** se PO escolher trilho C com MVP limitado explicitamente noutra story.  
- Garantia legal de emissão ou homologação em todos os municípios.  
- Revogação do **`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`** — este PRD é **complementar**.

---

## 6. Decisões de produto

### 6.1 Prioridade de trilhos (recomendação do brief)

1. **Paralelo:** **Trilho A** (painel Plugnotas + suporte + ambiente) **enquanto** corre descoberta §4.  
2. **Após evidência:** escolher **um** entre **B** (derivação IBGE), **C** (UI explícita), **D** (híbrido retry) — registar decisão neste PRD (change log) e no ADR se houver mudança de contrato.

### 6.2 Obrigatoriedade de novos campos no formulário

**Decisão em aberto (PO):** Só **C** ou **D** podem introduzir campos novos no Guia MEI. **B** não deve exigir UI se a derivação for 100% servidor e aceite pelo Architect. Qualquer campo novo deve ser rotulado como **“só quando o emissor exigir”** ou equivalente, para não violar o espírito **FR-NAT-UX-01** para contas estritamente nacionais.

### 6.3 Compatibilidade com `inscricaoMunicipal` opcional

**Decisão:** Manter **`inscricaoMunicipal`** opcional na raiz quando já implementado; **não** documentar nem sugerir ao utilizador que IM substitui **`nfse.config.prefeitura`**.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-PREF-UX-01** | Erros Plugnotas que mencionem **`nfse.config.prefeitura`** (ou mensagem mapeada equivalente) são apresentados com copy que distingue **configuração de prefeitura no bloco NFS-e** de **inscrição municipal na ficha da empresa**, e indicam **próximo passo** (painel, ambiente, suporte, ou preenchimento adicional se o trilho B/C/D estiver activo). |
| **FR-PREF-API-01** | Se PO aprovar trilho **B**, **C** ou **D**, o `POST /empresa` (e `PATCH` quando aplicável na mesma política) envia **`nfse.config.prefeitura`** conforme schema **documentado no ADR**; testes de contrato actualizados. |
| **FR-PREF-DOC-01** | `docs/operacao-mei-nfse.md` inclui orientação para o erro `nfse.config.prefeitura` obrigatório e referência a este PRD. |
| **FR-PREF-HINT-01** | `nfseNacionalPlugnotasErrorHints` (ou painel de retry) permanece alinhado: mensagens do tipo `fields.nfse.config.prefeitura` disparam fluxo de ajuda municipal/nacional coerente com **FR-NAT-ERR-01** (sem regressão de classificação). |

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-PREF-01** | Não adicionar chaves em `nfse.config` **sem** evidência Plugnotas alinhada a **FR-NA02** / **NFR-NAT-01** do ecossistema ADR. |
| **NFR-PREF-02** | Regressão: política “apenas NFS-e” (**ADR-plugnotas-empresa-payload-apenas-nfse**) e `documentosAtivos` **intactos** salvo alteração explícita aprovada. |
| **NFR-PREF-EV-01** | Registar evidência redigida (schema ou confirmação de dispensa) antes de considerar fechado o trilho de payload **B/C/D**. |
| **NFR-PREF-03** | Gates do repo: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |

---

## 9. Métricas de sucesso (proposta)

- Redução de tickets onde o utilizador reporta “cadastro falhou após preencher IM” quando o log mostra **`prefeitura`** em `nfse.config`.  
- **100%** das respostas 400 analisadas (amostra QA) com `prefeitura` em `nfse.config` → utilizador vê **FR-PREF-UX-01** ou equivalente aprovado em story.  
- Se **B/C/D** for activado: taxa de sucesso de `POST /empresa` no cenário de reprodução interna (sandbox) **≥** baseline definido após implementação.

---

## 10. Critérios de aceite (release)

1. **Descoberta:** resposta documentada (doc/ticket/sandbox) às perguntas do brief §4 **ou** decisão explícita PO de prosseguir **apenas** com trilho **A** (sem mudança de payload), com registo em ADR/nota operacional.  
2. **UX:** utilizador que receber erro `nfse.config.prefeitura` vê mensagem conforme **FR-PREF-UX-01** (conteúdo fino na story + QA).  
3. **Payload:** se **FR-PREF-API-01** aplicável, testes de contrato e CI verdes; ADR actualizado.  
4. **Doc:** **FR-PREF-DOC-01** cumprido.  
5. **Rastreabilidade:** story(ies) ligam este PRD e o brief; não regressão dos critérios **FR-NAT-*** que permanecem válidos para contas só nacionais.

---

## 11. Dependências e riscos

- **Dependência externa:** Plugnotas (schema, conta, ambiente).  
- **Risco:** Implementar **B** sem schema confirmado → 400 diferentes ou dados incorrectos por município.  
- **Risco de copy:** prometer “basta preencher X” sem validar trilho escolhido.  
- **Risco de escopo:** **C** pode crescer para “produto municipal completo” — conter em MVP por story derivada.

---

## 12. Rastreabilidade brief → PRD

| Secção do brief | Onde no PRD |
|-----------------|-------------|
| Resumo executivo | §1 |
| Sintoma / evidência | §3 |
| Análise técnica | §3, §5.1 |
| Perguntas §4 | §5.1 item 1, **NFR-PREF-EV-01** |
| Opções A–D | §6.1 |
| Critérios sugeridos §6 brief | §7, §10 |
| Fora de escopo brief | §5.2 |

---

## 13. Change log

| Data | Autor | Nota |
| --- | --- | --- |
| 2026-04-08 | PM (Morgan) | PRD inicial derivado do brief `brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`. |
| 2026-04-08 | @dev | Resposta a QA story P1: modelo de evidência **NFR-PREF-EV-01** em [`docs/evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`](../evidence/NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md) (preenchimento pendente PO); trilho **B/C/D** continua em aberto em §6.2 até decisão PO. |
