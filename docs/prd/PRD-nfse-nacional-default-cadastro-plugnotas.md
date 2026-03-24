# PRD — NFS-e Nacional ativa por padrão no cadastro da empresa (Plugnotas / Guia MEI)

| Campo | Valor |
| --- | --- |
| **Produto** | Meu Financeiro |
| **Tipo** | Brownfield (extensão do payload `nfse` no cadastro Plugnotas) |
| **Versão do documento** | 1.0 |
| **Data** | 2026-03-24 |
| **Autor** | Morgan (PM) |
| **Brief de entrada** | [`docs/brief/brief-nfse-nacional-default-cadastro.md`](../brief/brief-nfse-nacional-default-cadastro.md) |
| **PRDs relacionados** | [`PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md`](./PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md) (escopo apenas NFS-e); [`PRD-guia-mei-plugnotas-jornada-fiscal.md`](./PRD-guia-mei-plugnotas-jornada-fiscal.md) |

## Status

**Proposto** — depende de **spike técnico** (nome e semântica do campo na API Plugnotas equivalente ao toggle *“Ativar emissão de NFS-e Nacional”* do painel) e de **validação @architect** para não conflitar com [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md). Após gate, priorizar com @po / backlog.

---

## 1. Goals and Background Context

### 1.1 Goals

- **G1 — Default nacional:** Cadastros de empresa realizados pelo aplicativo (fluxo **Guia MEI** → certificado → dados mínimos → `POST`/`PATCH` empresa no Plugnotas) devem resultar, por padrão, na **configuração de emissão no ambiente da NFS-e Nacional** no provedor, alinhada ao comportamento esperado quando o usuário consulta o painel Plugnotas.
- **G2 — Paridade painel × API:** Reduzir discrepâncias do tipo *“cadastrei pelo app e no Plugnotas a opção NFS-e Nacional está desligada”*.
- **G3 — Sem regressão do escopo apenas NFS-e:** Manter **nfe** / **nfce** inativos conforme ADR; alterações restritas ao bloco **nfse** (e documentação associada).
- **G4 — Observabilidade e suporte:** Documentar o default em `docs/operacao-mei-nfse.md` (ou nota vinculada) e facilitar diagnóstico quando o provedor rejeitar ativação da nacional (município, credenciamento, etc.).

### 1.2 Background Context

A **NFS-e Nacional** é o arranjo federal de emissão de notas de serviço; o **Plugnotas** expõe, na UI do painel, um controle explícito (*“Ativar emissão de NFS-e Nacional”*) com efeito declarado de enviar notas ao ambiente nacional.

Hoje o repositório monta o bloco `nfse` com `ativo: true`, `tipoContrato: 0` e `config: { producao: true }` em `buildNfEmissionCompanyPayload` (`frontend/src/utils/nfEmissionCompany.ts`), com normalização no backend. **Não há** campo nomeado no código que mapeie de forma documentada ao toggle “Nacional”; o brief assume que a API aceita um parâmetro adicional em `nfse` ou `nfse.config` — **a confirmar** antes da implementação.

### 1.3 Decisões de produto (PM) — registro explícito

| ID | Decisão | Detalhe |
| --- | --- | --- |
| **D-N01** | Valor padrão | **Ligado (ON)** para NFS-e Nacional no **primeiro cadastro** da empresa via este app, salvo impossibilidade técnica comprovada no sandbox ou decisão @po de feature flag. |
| **D-N02** | Público | Mesmo público do fluxo Guia MEI fiscal já definido no PRD “apenas NFS-e” (MEI prestador de serviços usando integração Plugnotas). |
| **D-N03** | PATCH vs POST | **Preferência:** aplicar default ON no **POST** de criação. Para **PATCH** (atualização cadastral pelo app), **não sobrescrever** intenção já persistida no Plugnotas **salvo** se @architect/@po definirem regra segura (ex.: só preencher chave quando ausente no remoto). |
| **D-N04** | UI opcional | **Could:** checkbox na Guia MEI “Usar NFS-e Nacional” espelhando o default ON, permitindo opt-out explícito **se** o contrato API suportar e o risco de suporte for aceitável. **Must (MVP):** apenas default no payload, sem novo campo de formulário, a menos que spike mostre obrigatoriedade de opt-in legal. |
| **D-N05** | Admin | Emissão/admin que depende do mesmo cadastro Plugnotas deve **herdar** a mesma política de default no **cadastro/atualização** feito pelo app (alinhamento com brief). |

### 1.4 Change Log

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 2026-03-24 | 1.0 | Versão inicial a partir do brief `brief-nfse-nacional-default-cadastro.md` | PM |

---

## 2. Requirements

### 2.1 Funcionais

- **FR-N01:** O payload de **cadastro de empresa** enviado ao Plugnotas pelo fluxo suportado (Guia MEI e, se aplicável, rotas admin equivalentes) deve incluir o parâmetro acordado pós-spike que **ativa** a emissão no ambiente **NFS-e Nacional**, com valor **ON por padrão** para novos cadastros (**D-N01**).
- **FR-N02:** Após cadastro bem-sucedido em ambiente de homologação, verificação no painel Plugnotas (checklist manual ou evidência de teste) deve mostrar a opção **NFS-e Nacional** **ativada** (ou equivalente API), coerente com **G2**.
- **FR-N03:** Testes automatizados (unitários com mock ou integração controlada) devem assegurar que o objeto `nfse` (ou sub-objeto documentado) contém o par default **ON** após a implementação.
- **FR-N04:** `docs/operacao-mei-nfse.md` deve descrever: que o produto envia **default NFS-e Nacional ON** no cadastro; link ou referência à documentação Plugnotas do campo; e nota sobre exceções (rejeição por município/provedor).
- **FR-N05:** Em caso de **400** ou mensagem do provedor indicando indisponibilidade da nacional para aquele CNPJ/município, a mensagem exibida ao usuário deve ser **compreensível** (reuso de pipeline de erro Plugnotas existente; copy mínima se necessário — **Should** para primeira iteração).

### 2.2 Não funcionais

- **NFR-N01:** Não reativar **NF-e** / **NFC-e** nem enviar `config` nfe/nfce que viole [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md).
- **NFR-N02:** Gates do monorepo mantidos (`npm run lint`, `typecheck`, `npm test`) após alterações.
- **NFR-N03:** Não logar PII completa; manter redação de logs alinhada às práticas já usadas em `empresa.service.js`.
- **NFR-N04:** Comportamento **sandbox** vs **produção** documentado se o Plugnotas diferenciar o campo ou o default.

### 2.3 Requisitos condicionados a arquitetura / spike (gate)

- **FR-NA01:** **Spike obrigatório (≤ 1 dia útil sugerido):** identificar na documentação oficial Plugnotas (ou canal de suporte) o **nome do campo**, **tipo**, **valores** e **obrigatoriedade** para “NFS-e Nacional” no `POST/PATCH /empresa`. Registrar em ADR curto ou apêndice em `operacao-mei-nfse.md`.
- **FR-NA02:** Se o provedor **não** expuser o controle via API e apenas via painel, este PRD deve ser **rebaselined**: @po decide entre (a) encerrar com documentação de limitação, (b) integração manual operacional, ou (c) nova integração — **não** inventar campo no payload.
- **FR-NA03:** Se `PATCH` com nacional ON **sobrescrever** configuração válida feita no painel, a implementação deve seguir **D-N03** (comportamento seguro documentado em código e testes).

---

## 3. User Interface Design Goals

### 3.1 Visão de UX (MVP)

Sem mudança obrigatória de UI: o usuário **beneficia** do default no cadastro. Se **D-N04 (Could)** for priorizado numa segunda onda, expor controle explícito com default ligado e texto curto alinhado ao painel Plugnotas.

### 3.2 Paradigmas de interação

- Fluxo existente: certificado → dados mínimos → envio empresa; possível mensagem de erro mais clara se nacional falhar.

### 3.3 Telas / vistas nucleares

- `GuidesMei.tsx` (fluxo cadastro empresa).
- Opcional: `AdminUserData.tsx` se o mesmo payload for reutilizado para cadastro em nome do usuário.

### 3.4 Acessibilidade

Se **D-N04** produzir checkbox, manter rótulo associado e descrição (WCAG 2.1 AA).

### 3.5 Plataformas

Web (Vite + React).

---

## 4. Technical Assumptions

| Decisão | Escolha | Racional |
| --- | --- | --- |
| Ponto de montagem do payload | `nfEmissionCompany.ts` + normalização `empresa.service.js` | Consistência com cadastro atual |
| Provedor | Plugnotas API existente | Sem troca de emissor |
| Gate | Spike **FR-NA01** antes de merge de payload | Evita campo incorreto em produção |

**Arquivos nucleares (implementação prevista):**  
`frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfEmissionCompany.test.ts`, `backend/src/services/plugnotas/empresa.service.js`, testes backend de empresa Plugnotas existentes, `docs/operacao-mei-nfse.md`, possível `docs/adr/ADR-plugnotas-nfse-nacional-default.md` (nome sugerido).

---

## 5. Epic List (alto nível)

1. **Épico N1 — Spike contrato API (Must):** Documentar campo “NFS-e Nacional”; decisão POST/PATCH (**D-N03**); cenários sandbox.
2. **Épico N2 — Implementação payload + testes (Must):** Default ON em código; regressão apenas NFS-e.
3. **Épico N3 — Documentação e QA (Should):** Operacional + checklist manual painel Plugnotas; evidência em story.

**MoSCoW:** N1 = **Must** antes de código de produção; N2 = **Must** para entrega PRD; N3 = **Should**; UI opt-out **D-N04** = **Could**.

---

## 6. User Stories (semente para @sm)

1. **Como** MEI que cadastra a empresa pelo Guia MEI, **quero** que a integração já deixe **NFS-e Nacional ativa** no Plugnotas, **para** emitir no ambiente nacional sem configurar manualmente o painel.
2. **Como** operação/suporte, **quero** documentação do default e do campo API, **para** explicar comportamento e erros de município/provedor.
3. **Como** desenvolvedor, **quero** testes que fixem o payload `nfse` com nacional ON, **para** evitar regressão silenciosa.

**Critérios transversais:** ADR apenas NFS-e preservado; testes verdes; evidência sandbox ou mock alinhado a **FR-NA01**.

---

## 7. Success Metrics

| Métrica | Alvo (direção) | Notas |
| --- | --- | --- |
| Tempo até primeira emissão NFSe em ambiente nacional (usuário novo) | ↓ vs. baseline | Medir após release, coorte Guia MEI |
| Tickets “cadastrei pelo app e nacional está off” | ↓ | Monitorar suporte |
| Falhas de cadastro 400 atribuíveis a campo nacional | Estável ou ↓ | Após ajuste de copy/tratamento (**FR-N05**) |

---

## 8. Risks and Mitigations

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| API não expõe nacional | Alto | **FR-NA02** — rebaseline do PRD |
| Município sem adesão plena → 400 | Médio | **FR-N05** + doc operacional |
| PATCH sobrescreve preferência manual | Médio | **D-N03** + testes |
| Sandbox ≠ produção para o campo | Alto | **NFR-N04** + validação dupla |

---

## 9. Out of Scope

- Definir **regras fiscais** de elegibilidade à NFS-e Nacional (competência exclusiva de contador/legislação).
- Migração em massa de empresas já cadastradas **antes** desta entrega (podem exigir ação manual no painel ou story futura de “sincronizar nacional”).
- Substituir o Plugnotas ou implementar emissão fora do conector atual.

---

## 10. Open Questions

1. O Plugnotas exige **opt-in** explícito no primeiro uso (implica **D-N04** Must em vez de Could)?
2. Há **UFs ou municípios** que o produto **não** deve enviar com nacional ON por política comercial?
3. Empresas **já existentes** no Plugnotas com nacional **desligada** devem ser atualizadas em massa? (provável **fora** do MVP.)

---

## 11. References

- Brief: [`docs/brief/brief-nfse-nacional-default-cadastro.md`](../brief/brief-nfse-nacional-default-cadastro.md)
- ADR apenas NFS-e: [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md)
- PRD escopo NFS-e: [`docs/prd/PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md`](./PRD-guia-mei-apenas-nfse-sem-nfce-nfe-ie.md)
- Épico (referência): [`docs/stories/epic-guia-mei-apenas-nfse-prd.md`](../stories/epic-guia-mei-apenas-nfse-prd.md)

---

*Documento de requisitos de produto; estimativas e fatiamento em stories ficam com @sm após gate **FR-NA01**.*
