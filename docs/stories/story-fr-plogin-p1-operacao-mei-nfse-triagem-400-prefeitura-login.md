# Story — FR-PLOGIN (P1): Runbook — triagem **400** `prefeitura.login` obrigatório (distinto IBGE / trilho B)

**ID:** STORY-FR-PLOGIN-P1-OPERACAO-MEI-NFSE-TRIAGEM-400-PREFEITURA-LOGIN  
**Prioridade:** P1  
**Estado:** Ready for Review — critérios de aceite e **QA mínimo** satisfeitos (2026-04-09); **Ready for Done** após **@po** (amostragem triagem).  
**Depende de:** Nenhuma  
**Relaciona com:** [story-fr-plogin-p2-ux-nfse-hints-plogin-ux-l1.md](./story-fr-plogin-p2-ux-nfse-hints-plogin-ux-l1.md) — hints na app após esta doc *(opcional, ordem recomendada: P1 doc → P2 UX)*  
**Fonte PRD:** [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — **FR-PLOGIN-01** (procedimento), **FR-PLOGIN-02**, **FR-PLOGIN-03**  
**UX:** [`docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — secção 8 (checklist runbook)  
**Arquitetura:** [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — §4, §7  
**Brief:** [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | Revisão de links e conteúdo; `npm run lint` se *markdown* integrar gates do repo (geralmente N/A) |
| **revisão** | @po — triagem distinta; @architect — alinhamento a nomes técnicos e ordem POST→GET |

---

## User story

**Como** membro da equipa (dev, operação ou suporte),  
**quero** secção clara em `docs/operacao-mei-nfse.md` que distinga o **400** com **`prefeitura.login` obrigatório** dos outros **400** (tabela IBGE, falta de `prefeitura` / trilho B), com link à documentação Plugnotas e procedimento seguro para **FR-PLOGIN-01**,  
**para** triar sem confundir causas e saber quando escalar (**FR-PLOGIN-06** / PRD PREF payload).

---

## Contexto

- **Não** exige decisão **DP-PLOGIN-01** ou **DP-PLOGIN-02** — é **documentação** e procedimento de evidência.  
- **NFR-PLOGIN-02:** runbook **não** inclui credenciais de exemplo.  
- Causalidade **POST → GET** mantém-se (**BRIEF-OP-05**).

---

## Critérios de aceite

### `docs/operacao-mei-nfse.md`

- [x] Subsecção ou âncora dedicada ao sintoma **400** com mensagem que indica **`prefeitura.login`** (ou **senha**) **obrigatório** — **distinto** de: (1) tabela IBGE / `codigoIBGECidade`; (2) falta `nfse.config.prefeitura` / trilho B (`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`).  
- [x] Link para [`PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md), [`ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md), [`architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md).  
- [x] Link externo para [documentação PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest) — contrato `prefeitura`, **sem** copiar credenciais. (**FR-PLOGIN-03**)  
- [x] Procedimento **FR-PLOGIN-01:** passos para registar evidência (payload redigido / mensagem analisada) em ticket interno ou acta **sem** secrets em canais públicos.  
- [x] Encaminhamento quando persistir: alinhar **FR-BRIEF-OP-06** / **FR-PREFB-ESC-01** → PRD PREF payload / P0 / suporte Plugnotas (uma linha com links já existentes no runbook).

### Qualidade

- [x] Sem PII nem secrets nos ficheiros editados.  
- [x] Links relativos `docs/` correctos.

---

## QA mínimo *(gate “Ready for Review” — owner @qa)*

- [x] Todos os links **internos** `docs/` desta entrega abrem no *preview* / IDE (caminhos relativos correctos).  
- [x] A **âncora** da nova subsecção é navegável (link directo ou TOC, conforme estrutura actual de `operacao-mei-nfse.md`).  
- [x] **NFR:** revisão rápida — nenhum exemplo com credenciais, tokens ou PII; texto alinhado a **NFR-PLOGIN-02**.  
- [x] *(Smoke)* Link externo Plugnotas (Postman) abre; se indisponível, runbook mantém URL legível e nota em **Dev Agent Record** *(não bloquear por falha transitória de rede)*.

---

## Tasks (indicativas)

1. [x] Adicionar âncora e bullets em `operacao-mei-nfse.md` conforme critérios.  
2. [x] Rever secções vizinhas (trilho B, TIBGE) para cross-links “ver também” sem duplicar parágrafos longos.  
3. [x] **File list** + **Dev Agent Record** + change log.  
4. [x] **@qa:** executar secção **QA mínimo** e preencher **QA Results**.

---

## File list (indicativo)

- `docs/operacao-mei-nfse.md`  
- `docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` — **se** existir tabela ou secção de relação “story / artefacto”: uma linha com link a esta story *(ID no topo)*; **se não existir** tabela aplicável, registar **N/A** em **Dev Agent Record** *(não é bloqueio para fecho da story)*.

---

## CodeRabbit Integration

- N/A código de aplicação; revisão de tom e ausência de secrets.

---

## Dev Agent Record

### Status

Ready for Review (2026-04-09) — **QA Results** com gate **PASS**; **Ready for Done** com **@po** (amostragem).

### File list

- `docs/operacao-mei-nfse.md`

### Notes

- **2026-04-09 — Refinamento @sm (feedback @po):** **Estado** no cabeçalho; secção **QA mínimo**; critério PRD com **sim/N/A** explícito; task QA; tabela **QA Results**.
- **2026-04-09 — @dev:** PRD [`PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) tem tabela «Relação com outros artefatos» (§ início); **não** há linha dedicada a esta story — **N/A** para acrescentar ID no PRD.
- **2026-04-09 — @dev (pós-QA):** fecho operacional — **Estado** / QA mínimo / task 4 alinhados ao **PASS** em **QA Results** (sem alterar o texto da revisão @qa).

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do PRD PLOGIN, UX spec e arquitetura.  
- 2026-04-09 — Refinamento @sm: estado explícito, gate QA, clarificação PRD opcional (tabela vs N/A).
- 2026-04-09 — @dev: runbook `operacao-mei-nfse.md` — âncora `#plogin-400-prefeitura-login-obrigatorio-triagem`, triagem FR-PLOGIN, cross-links DP01 / trilho B / briefing.
- 2026-04-09 — @dev: story — **Ready for Review** após QA PASS (checklist QA mínimo + task 4).

---

## QA Results

**Revisão @qa:** 2026-04-09 · HEAD referência: `c8af002e` (workspace no momento da revisão).

| Verificação | OK / N/A | Notas |
|-------------|----------|--------|
| Links internos `docs/` | OK | Caminhos relativos desde `docs/operacao-mei-nfse.md` verificados: `prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`, `specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`, `technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`, `prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`, `prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md` — ficheiros presentes no repo. |
| Âncora navegável | OK | `<a id="plogin-400-prefeitura-login-obrigatorio-triagem"></a>` presente; links internos `#plogin-400-prefeitura-login-obrigatorio-triagem`, `#programa-briefing-fr-brief-op`, `#prefb-trilho-b-env-derive-ibge` coerentes com IDs no runbook. |
| Sem secrets / PII em exemplos | OK | Texto novo usa `***` / marcadores; proíbe credenciais reais em canais públicos; sem tokens ou exemplos de senha reais. Alinhado a **NFR-PLOGIN-02**. |
| Smoke link Plugnotas | OK | `HEAD` a `https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest` → **HTTP 200** (2026-04-09). |

**Rastreio aos critérios de aceite (amostra):** subsecção PLOGIN distingue TIBGE/CID, trilho B e DP02; PRD/UX/architecture PLOGIN; Postman (FR-PLOGIN-03); passos FR-PLOGIN-01; escalação FR-BRIEF-OP-06 / FR-PREFB-ESC-01 com links ao briefing e PRDs PREF/P0.

**Decisão de gate (advisory):** **PASS** — QA mínimo satisfeito; entrega documental consistente com a story. **CodeRabbit:** N/A código de aplicação (conforme story).

**Follow-up (não bloqueante):** @po / @sm podem alinhar **Estado** no cabeçalho e task 4 após aceitar esta revisão; fora do âmbito de edição @qa nas secções não-QA Results.
