# PRD — Solução end-to-end: **400** `nfse.config.prefeitura` e **404** `GET` empresa (Guia MEI / Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI / setup emissão fiscal (`POST` e `GET` empresa via BFF `mei-notas/setup/emissao-fiscal/empresa`)  
**Fonte canónica do pedido:** [`docs/brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](../brief/brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`** — requisitos **FR-PREF-***, trilhos B/C/D de payload, IM vs `nfse.config.prefeitura`. Este PRD **complementa** o PREF ao fixar **diagnóstico HTTP**, **encadeamento 400→404**, **critérios de “problema resolvido”** e **política de playbook** derivados directamente do brief de solução.  
- **`docs/brief/brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`** — análise detalhada payload e opções A–D.  
- **`docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`** — modo nacional no formulário; **NFR-N04**.  
- **`docs/operacao-mei-nfse.md`** — operação, âncoras `#nfse-config-prefeitura-cadastro-pref`, nacional vs municipal.  
- **Código:** `frontend/src/utils/nfEmissionCompany.ts`, `backend/src/services/plugnotas/empresa.service.js`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`.

**Não substitui** orientação legal/tributária nem garantias do provedor Plugnotas.

---

## 1. Resumo executivo

Utilizadores e equipa interna observam **dois erros HTTP** em sequência no cadastro de empresa fiscal: **`POST …/emissao-fiscal/empresa`** devolve **400** com validação **`fields.nfse.config.prefeitura: Preenchimento obrigatório`**, seguido de **`GET …/empresa?cpfCnpj=`** com **404** (*«Não localizamos qualquer Empresa…»*).

Este PRD estabelece que o **404 não é um defeito autónomo da leitura**: é **consequência esperada** quando o **POST não cria** a empresa no Plugnotas. A **solução de produto** não é um patch genérico único: exige **playbook** (conta/ambiente + descoberta de contrato + eventual alteração de payload **após** evidência), alinhado ao brief de solução e coerente com **PRD PREF** e **PRD NAT**.

---

## 2. Visão de produto (experiência e narrativa)

1. **Transparência causal:** quem usa o produto ou opera suporte **entende** que, sem **POST** bem-sucedido, o **GET** por CNPJ pode continuar a devolver **404** — não se trata de “API de consulta partida” isolada.  
2. **Mensagens accionáveis:** erros que citam **`nfse.config.prefeitura`** não são confundidos com “basta preencher inscrição municipal” (detalhe em **FR-PREF-UX-01** / variante `prefeitura-config`).  
3. **Playbook priorizado:** primeiro **trilho A** (painel Plugnotas, ambiente, suporte) **em paralelo** com **descoberta** do schema oficial; só depois **B/C/D** conforme **PRD PREF §6**.  
4. **Definição de sucesso clara:** cadastro “fechado” implica **POST 2xx** e capacidade de **consultar** empresa para o mesmo CNPJ com resposta coerente (**GET 200** ou política documentada equivalente).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Diagnóstico** | Dois códigos HTTP parecem dois bugs distintos. | Documentação e UX explicam **encadeamento** 400 → 404. |
| **Contrato remoto** | Plugnotas exige `nfse.config.prefeitura` em contas/ambientes onde o payload actual não envia `prefeitura`. | Trilho **A** ou payload **B/C/D** após evidência (**PRD PREF**). |
| **Expectativa** | Utilizador repete **GET** ou preenche só IM na raiz. | Antipadrões explícitos no runbook (**brief §3**). |
| **Operação** | Tempo perdido a caçar “404” sem olhar para o **POST**. | Checklist único: validar POST → depois GET. |

---

## 4. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI** | Submete empresa; vê 400; tenta “actualizar” ou consultar → 404; precisa de **orientação** que una os dois sintomas. |
| **Dev / QA** | Reproduz fluxo local; documenta Network tab; precisa de **critérios de aceite HTTP** alinhados ao negócio. |
| **Operação / suporte** | Abre ticket “GET empresa falha”; precisa de **primeiro passo**: verificar **POST** e logs Plugnotas. |
| **PO / Architect** | Decide trilho **A** vs **B/C/D** após evidência; regista decisão (**NFR-SOL-01**). |

**Stakeholders:** PO, UX, Architect, Backend, Frontend, QA, Operação.

---

## 5. Escopo

### 5.1 Dentro do escopo

1. **Narrativa e critérios** de resolução que ligam **400** (`prefeitura`) e **404** (empresa inexistente), conforme brief §1–§4.  
2. **Política de playbook:** ordem **A** + **descoberta** antes de implementação agressiva **B/C/D** (alinhado ao brief §2 e **PRD PREF §6.1**).  
3. **Documentação operacional** e, quando aplicável, **copy UI** para **404** de consulta **no contexto** de cadastro ainda não concluído (**FR-SOL-404-01**), sem contradizer **FR-PREF-DOC-01** / **FR-NAT-ERR-01**.  
4. **Registo de trilho adoptado** e schema mínimo de `prefeitura` quando houver mudança de payload (**NFR-SOL-01**, **FR-PREF-API-01**).  
5. **Antipadrões** do brief §3 reflectidos em `docs/operacao-mei-nfse.md` ou apêndice citado (**FR-SOL-ANT-01**).

### 5.2 Fora de âmbito

- Mudança de provedor fiscal.  
- Garantir emissão fiscal autorizada em todos os municípios ou contas.  
- Duplicar integralmente o **PRD PREF**: requisitos de payload e copy específica `nfse.config.prefeitura` permanecem no **PRD PREF**; aqui apenas **referenciamos** e acrescentamos camada **SOL** (HTTP, 404, playbook).

---

## 6. Decisões de produto

1. **Encadeamento causal** entre **POST** falhado e **GET** 404 é **canónico** na documentação interna e na orientação ao utilizador quando o produto expuser mensagens sobre “empresa não encontrada” após tentativa de cadastro.  
2. **Não** prometer que `nfse.nacional: true` **dispensa** `prefeitura` em **todas** as contas sem evidência (**NFR-N04**).  
3. **Prioridade:** **Trilho A** + descoberta em paralelo; **B/C/D** só após fecho **PRD PREF §6** e **NFR-PREF-EV-01** quando aplicável.  
4. **Compatibilidade:** **FR-NAT-*** e **FR-PREF-*** permanecem válidos; este PRD **não** revoga formulário “sem prefeitura obrigatória” para contas estritamente nacionais quando a API aceitar.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-SOL-DIAG-01** | Documentação de produto/operacional (mínimo: `docs/operacao-mei-nfse.md` ou secção ligada) explica que **404** em `GET …/emissao-fiscal/empresa?cpfCnpj=` **pode** ocorrer porque **não houve** cadastro bem-sucedido no Plugnotas (**POST** falhou ou ainda não foi feito), e que a **causa raiz** típica precedente é investigar o **POST** (incl. 400 `nfse.config.prefeitura`). |
| **FR-SOL-DIAG-02** | Critério de “cadastro empresa resolvido para o CNPJ” inclui **POST** com sucesso (**2xx**) **e** consulta subsequente que confirme existência de cadastro (**GET 200** com dados ou semântica equivalente acordada com Architect), alinhado ao brief §4. |
| **FR-SOL-PLAY-01** | Playbook de resolução segue a **ordem** do brief §2: **(1)** trilho **A**, **(2)** descoberta obrigatória antes de **B/C/D** “à tentativa”; implementação técnica de **B/C/D** segue **PRD PREF** após decisão PO. |
| **FR-SOL-404-01** | Quando a UI apresentar erro ou estado vazio após **GET 404** **no fluxo de setup** de empresa, a copy **não** sugere apenas “empresa inexistente” **sem** contexto de “conclua ou corrija o cadastro (POST)” quando aplicável — sem duplicar trabalho já coberto por stories **FR-PREF** / consulta 404 contextual, desde que o critério mínimo deste ID fique verificável em QA. |
| **FR-SOL-ANT-01** | Runbook ou doc operacional lista **explicitamente** os antipadrões do brief §3: IM na raiz **não** satisfaz `nfse.config.prefeitura`; repetir só **GET** não cria empresa; `nacional: true` **não** garante ausência de exigência de `prefeitura` em todas as contas. |

**Requisitos reutilizados (fonte PRD PREF, aplicam-se ao mesmo problema):**

- **FR-PREF-UX-01**, **FR-PREF-API-01** (se trilho B/C/D), **FR-PREF-DOC-01**, **FR-PREF-HINT-01** — ver **`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`**.

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-SOL-01** | Fica **registado** (change log deste PRD, ADR, ticket interno ou nota operacional com data) **qual** trilho **A–D** foi adoptado para fechar o incidente tipo “400 prefeitura + 404 GET”; se houver alteração de JSON, **schema mínimo** de `nfse.config.prefeitura` referenciado. |
| **NFR-SOL-02** | Alterações de código ou copy **não** contradizem **PRD NAT** nem política “apenas NFS-e” (**ADR-plugnotas-empresa-payload-apenas-nfse**) salvo decisão explícita e ADR actualizado. |
| **NFR-SOL-03** | Gates do repositório: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |

---

## 9. Métricas de sucesso (proposta)

- Redução de incidentes internos onde **404 GET** é tratado como bug **antes** de verificar **POST** e corpo de erro **400**.  
- Em revisão de tickets/amostra QA: utilizador que experiencia **400** `prefeitura` vê copy **FR-PREF-UX-01** / variante `prefeitura-config` e doc **FR-SOL-DIAG-01** acessível.  
- Após fecho de trilho: reprodução interna com CNPJ de teste → **POST 2xx** e **GET** com dados (**FR-SOL-DIAG-02**).

---

## 10. Critérios de aceite (release)

1. **FR-SOL-DIAG-01** e **FR-SOL-ANT-01** verificáveis em `docs/operacao-mei-nfse.md` (ou documento operacional ligado com link a partir do guia MEI, se PO aprovar).  
2. **FR-SOL-DIAG-02** demonstrado em QA (cenário de teste documentado na story) ou, em modo só **trilho A**, registo **NFR-SOL-01** de que a resolução foi **conta/ambiente** sem mudança de código.  
3. **FR-SOL-PLAY-01** reflectido na documentação de entrega ou story (não saltar descoberta antes de B/C/D).  
4. **FR-SOL-404-01** verificável em UI quando o fluxo de setup expuser **404** (story pode referenciar componentes existentes **FR-PREF** se já cumprirem o critério).  
5. Requisitos **FR-PREF-*** aplicáveis continuam a ser satisfeitos conforme **PRD PREF §10**.  
6. **NFR-SOL-03** verde no pipeline.

---

## 11. Dependências e riscos

- **Dependência:** Plugnotas (API, conta, ambiente); **PRD PREF** para qualquer mudança de payload.  
- **Risco:** Sobreposição de copy entre **FR-SOL-404-01** e painéis já entregues em **FR-PREF** — coordenar numa única story ou revisão UX.  
- **Risco:** PO não fechar trilho → permanência de 400 em contas específicas; produto deve manter mensagens **honestas** e runbook (**NFR-N04**).

---

## 12. Rastreabilidade brief → PRD

| Secção do brief | Onde no PRD |
|-----------------|-------------|
| Sintomas POST/GET | §1, §3 |
| §1 Diagnóstico 400 | §1, §3, **FR-PREF-*** (PREF) |
| §1.2 404 consequência POST | §1, §2, **FR-SOL-DIAG-01**, **FR-SOL-404-01** |
| §2 Playbook A–D | §5.1, §6, **FR-SOL-PLAY-01** |
| §3 Antipadrões | **FR-SOL-ANT-01** |
| §4 Critérios resolvido | §2, **FR-SOL-DIAG-02**, §10 |
| §5 Suporte UX | §2, referência **FR-PREF-UX-01** / código citado |

---

## 13. Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-08 | PM (Morgan) | Versão inicial derivada do brief `brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`; complementa **PRD PREF** com camada SOL (HTTP, 404, playbook, antipadrões). |
