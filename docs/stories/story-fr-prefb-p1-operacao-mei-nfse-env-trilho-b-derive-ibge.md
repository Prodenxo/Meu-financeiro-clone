# Story — FR-PREFB (P1): Documentação operacional, **`.env.example`** e encaminhamento — trilho B (`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`)

**ID:** STORY-FR-PREFB-P1-OPERACAO-MEI-NFSE-ENV-TRILHO-B  
**Prioridade:** P1  
**Depende de:** Nenhuma *(código do trilho B já entregue — ver [story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md](./story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md))*  
**Relaciona com:** [story-fr-prefb-p1-ci-regressao-trilho-b-plugnotas-empresa.md](./story-fr-prefb-p1-ci-regressao-trilho-b-plugnotas-empresa.md) — gates após doc  
**Fonte PRD:** [`docs/prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — **FR-PREFB-DOC-01**, **FR-PREFB-ENV-01**, **FR-PREFB-ESC-01**; **DP-PREFB-01**, **DP-PREFB-02**  
**UX:** [`docs/specs/ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../specs/ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — secção 5 (checklist conteúdo doc), secção 4.1 (sem UI obrigatória v1)  
**Arquitetura:** [`docs/technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) — §5–6, §9  
**Brief:** [`docs/brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | Revisão de links e conteúdo; `npm run lint` se tocar ficheiros sob lint de docs (geralmente N/A) |
| **revisão** | @po — tom “opt-in produção”; @architect — nomes de env e ordem diagnóstico alinhados à arquitetura |

---

## User story

**Como** membro da equipa (dev, operação ou suporte),  
**quero** documentação clara em `docs/operacao-mei-nfse.md` e comentários alinhados em `backend/.env.example` sobre o trilho B e a env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`,  
**para** configurar ambientes sem adivinhar nomes de variáveis, saber o pré-requisito de 7 dígitos no IBGE, entender POST falho → GET 404, e saber quando escalar para PRD PREF / P0.

---

## Contexto

- O **código** de derivação já existe; esta story fecha o **gap de governança e descoberta** (**FR-PREFB-DOC-01**, **FR-PREFB-ENV-01**).  
- **Não** introduzir UI obrigatória no Guia MEI nesta story (spec UX §4.1 v1).  
- **DP-PREFB-01:** produção continua opt-in — documentar explicitamente.  
- **FR-PREFB-ESC-01:** ligações a [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) e [`PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md) quando o erro persistir após trilho B + IBGE válido.

---

## Critérios de aceite

### Documentação (`docs/operacao-mei-nfse.md`)

- [x] Secção ou bullets que cubram: sintoma **400** `fields.nfse.config.prefeitura` / preenchimento obrigatório.  
- [x] Nome da env **`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`**, necessidade de **reiniciar** o API após alteração, distinção **dev/staging** vs **produção** (opt-in).  
- [x] Pré-requisito: **`endereco.codigoCidade`** com **7 dígitos** após normalização (alinhado ao brief e à arquitetura §3).  
- [x] Causalidade: **POST** falho → **GET** **404** esperado até empresa criada no emissor.  
- [x] Ligações para este PRD, ao brief, e **FR-PREFB-ESC-01** (PRDs PREF e P0).  
- [x] Referência opcional à spec UX e à arquitetura técnica (links relativos `docs/`).

### `backend/.env.example`

- [x] Comentário **legível** junto à linha comentada `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` explicando trilho B / derivação IBGE → `nfse.config.prefeitura.codigoIbge` (coerente com §3 do brief e **FR-PREFB-ENV-01**).

### Qualidade

- [x] Sem PII nem secrets nos ficheiros editados.  
- [x] Markdown válido; links relativos correctos.

---

## Tasks (indicativas)

1. [x] Mapear secção existente em `operacao-mei-nfse.md` ou adicionar subsecção “Trilho B / derivação prefeitura IBGE”.  
2. [x] Escrever bullets conforme critérios; inserir links PRD/brief/architecture/UX spec.  
3. [x] Rever e, se necessário, expandir comentário em `backend/.env.example`.  
4. [x] **File list** + **Dev Agent Record** + change log da story.

---

## File list (indicativo)

- `docs/operacao-mei-nfse.md`  
- `backend/.env.example`  
- *(opcional)* `docs/brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md` — link reverso “ver também operacao-mei-nfse” *(só se PO quiser paridade)*

---

## CodeRabbit Integration

- N/A para lógica de aplicação; se existir *markdownlint* ou link checker no CI, seguir avisos.

---

## Dev Agent Record

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md` — nova subsecção âncora `#prefb-trilho-b-env-derive-ibge` (FR-PREFB: sintoma 400, env, 7 dígitos, POST→GET 404, links PRD/brief/UX/architecture, **FR-PREFB-ESC-01**).
- `backend/.env.example` — comentário expandido junto a `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` (**FR-PREFB-ENV-01**).
- `docs/brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md` — link reverso para runbook (observação QA opcional).

### Notes

- **FR-PREFB-DOC-01 / FR-PREFB-ENV-01 / FR-PREFB-ESC-01 / DP-PREFB-01** cobertos em runbook + `.env.example`; sem PII/secrets.
- **Resposta ao QA (observação não bloqueante):** link reverso “ver também `operacao-mei-nfse`” acrescentado ao brief (topo + tabela §5 + change log do brief).

### Change Log

- 2026-04-09 — Story criada pelo SM a partir do PRD §14 e arquitetura PREFB.
- 2026-04-09 — @dev: doc operacional + comentário `.env.example`; status **Ready for Review**.
- 2026-04-09 — @dev: após QA **PASS**, implementado link reverso opcional no brief; **Ready for Review** mantido para integração.

---

## QA Results

**Revisor:** Quinn (@qa)  
**Data da revisão:** 2026-04-09  
**Decisão de gate:** **PASS**

### Resumo

A entrega cumpre **FR-PREFB-DOC-01**, **FR-PREFB-ENV-01** e **FR-PREFB-ESC-01**: runbook em `docs/operacao-mei-nfse.md` com âncora `#prefb-trilho-b-env-derive-ibge` e comentário alinhado em `backend/.env.example`. Âmbito doc-only; sem alteração de código de aplicação. **DP-PREFB-01** (produção opt-in) está explícito na nova subsecção.

### Rastreio de requisitos

| Requisito | Evidência |
|-----------|-----------|
| **FR-PREFB-DOC-01** | `docs/operacao-mei-nfse.md` — bullets para sintoma **400** (`fields.nfse.config.prefeitura` / ramo `nfse.config.prefeitura`), mitigação trilho B, **7 dígitos**, **POST** falho → **GET** **404**, links PRD PREFB + brief + UX + arquitetura + **FR-PREFB-ESC-01** (PRDs PREF e P0). |
| **FR-PREFB-ENV-01** | `backend/.env.example` — comentário multi-linha junto ao exemplo comentado `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`; derivação para `nfse.config.prefeitura.codigoIbge`, reinício, opt-in produção, ponteiro para runbook. |
| **FR-PREFB-ESC-01** | Mesma subsecção — ligações a `prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md` e `prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md` com condição de escalação explícita. |
| **DP-PREFB-01 / NFR-PREF-EV-01** | Produção **opt-in** e validação antes do primeiro uso real com `true` documentados; coerente com spike P0 imediatamente acima no mesmo ficheiro. |
| Qualidade (sem PII/secrets; links) | Ficheiros revistos: apenas texto e comentários de exemplo; links relativos `docs/` resolvidos para ficheiros presentes no repo (PRD/brief/spec UX/arquitetura/PRDs PREF e P0). |

### Verificações executadas

- Leitura estática da subsecção `#prefb-trilho-b-env-derive-ibge` e do bloco de comentários em `backend/.env.example`.
- Confirmação de existência dos destinos Markdown referenciados na nova subsecção (PRD PREFB, brief, spec UX, arquitetura, PRD PREF, PRD P0).

### Observações (não bloqueantes)

- **Link reverso no brief** (opcional na story, sujeito a PO): não implementado — aceitável conforme nota do @dev no Dev Agent Record.

### Conclusão

Aprovação para fecho da story de documentação **FR-PREFB** neste âmbito. Próximo passo operacional: integração via **@github-devops** quando o conjunto de alterações estiver pronto para PR/merge.

— Quinn, guardião da qualidade 🛡️
