# Story — FR-PLOGIN (P2): UX — hints **PLOGIN-UX-L1** (`prefeitura.login` obrigatório) em `nfseNacionalPlugnotasErrorHints`

**ID:** STORY-FR-PLOGIN-P2-UX-NFSE-HINTS-PLOGIN-UX-L1  
**Prioridade:** P2  
**Estado:** Ready for Review — **QA mínimo** satisfeito (2026-04-09, ver **QA Results**); *sign-off* **@ux-design-expert** (§5.2) pendente para **Ready for Done** / merge conforme processo da equipa.  
**Depende de:** Recomendado: [story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md](./story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md) *(runbook alinhado — não bloqueante se PO priorizar UX)*  
**Fonte PRD:** [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — encadeamento triagem; **DP-PLOGIN-03** (sem formulário de credenciais até decisão PO + evidência **FR-PLOGIN-01**)  
**UX:** [`docs/specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../specs/ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — secções 5 (heurísticas), 5.2 (microcopy base **L1**), 9–10 (A11y, QA)  
**Arquitetura:** [`docs/technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../technical/architecture-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) — §5 (FE técnico)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | `npm run lint`, `npm run typecheck`, `npm test` |
| **revisão** | @ux-design-expert — copy **PLOGIN-UX-L1**; @architect — precedência de hints vs TIBGE/PREFB |

---

## User story

**Como** MEI que recebe **400** no cadastro da empresa com mensagem que exige **login** (ou **senha**) da prefeitura no NFS-e,  
**quero** ver uma camada de ajuda que **não** confunda este erro com “cidade IBGE” nem com “falta só trilho B”, e que **não** peça credenciais em canais públicos,  
**para** entender o bloqueio e o próximo passo seguro até haver decisão de produto sobre recolha de credenciais (**DP-PLOGIN-01**).

---

## Contexto

- **Escopo:** heurísticas + *hint* / variante em `nfseNacionalPlugnotasErrorHints.ts` + testes; ajustes mínimos em `GuidesMei.tsx` / alertas **só** se necessário para propagar o hint **sem** segundo `role="alert"` redundante.  
- **Fora:** campos de formulário para `login`/`senha` — **DP-PLOGIN-01** (story à parte).  
- **Compatibilidade:** **FR-PREFB-QA-01** — variantes **prefeitura-config** existentes permanecem verdes.  
- **SOL / BRIEF-OP-05:** narrativa cadastro antes de consulta preservada.

---

## Pré-condições *(gate “Ready for Dev”)*

- [ ] Microcopy **PLOGIN-UX-L1** alinhado à UX spec **secção 5.2** — *sign-off* **@ux-design-expert** (comentário no PR, acta curta, ou aprovação assíncrona referenciada nesta story). *(Implementação segue §5.2; *sign-off* formal em **QA Results**.)*  
- [x] *(Recomendado, não bloqueante)* [P1 runbook](./story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md) concluído ou em curso — evita divergência entre texto de suporte e hint na app.

---

## Critérios de aceite

### Detecção e copy

- [x] Heurística que identifica mensagens alinhadas a **PLOGIN-UX-L1** (ex.: `prefeitura` + `login` + obrigatoriedade, ou caminho `prefeitura.login` na string) — nome interno acordado (ex. `prefeitura-login-required`).  
- [x] Microcopy base conforme UX spec secção 5.2: serviço pediu dados de acesso ao sistema da prefeitura; distinção explícita vs IBGE vs trilho B **numa** frase de apoio.  
- [x] **NFR-PLOGIN-02:** texto **não** solicita colar senhas em chats públicos.  
- [x] **A11y** *(se `GuidesMei` / `FiscalIntegrationErrorAlert` forem tocados):* sem segundo `role="alert"` redundante; alterações relevantes alinhadas a UX spec **§9–10** *(ou nota no PR se o âmbito for só o utilitário de hints)*.

### Regressão e gates

- [x] Testes em `nfseNacionalPlugnotasErrorHints.test.ts` (casos positivos + falsos positivos vs TIBGE / PREF-L1 genérico se sobrepostos).  
- [x] `npm run lint`, `npm run typecheck`, `npm test` na raiz.

### Documentação

- [x] `docs/operacao-mei-nfse.md`: **se** a story [P1](./story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md) já estiver **Ready for Done** (ou runbook equivalente no mesmo *sprint*), adicionar **uma linha** a referir que a app pode mostrar hint alinhado a **PLOGIN-UX-L1** *(cross-link opcional ao utilitário / variante)*. **Se** P1 ainda não fechou e o PO aceita *defer*: registar **N/A** + data em **Dev Agent Record** *(não bloqueia fecho desta story)*; abrir *follow-up* ou story de doc se o PO exigir paridade estrita.

---

## QA mínimo *(gate “Ready for Review” — owner @qa)*

- [x] **FR-PREFB-QA-01:** variantes **prefeitura-config** existentes permanecem verdes nos testes automatizados.  
- [x] Casos novos em `nfseNacionalPlugnotasErrorHints.test.ts` cobrem positivo **L1** e **falsos positivos** (TIBGE / PREF-L1) conforme AC.  
- [x] *(Manual breve)* Percurso no **Guia MEI** ou nota de repro em **QA Results** — hint **L1** visível quando a heurística dispara *(ou justificativa se só testes unitários neste PR)*.  
- [x] Sem **PII** nem credenciais reais em *fixtures* / *snapshots*.  
- [ ] **@ux-design-expert:** confirma paridade com UX **§5.2** ou regista delta aceitável em **QA Results** / PR.

---

## Tasks (indicativas)

1. [x] Acordar nome interno da variante + *sign-off* microcopy **L1** com **@ux-design-expert** (pré-condição). *(Variante `prefeitura-login-required`; *sign-off* formal pendente.)*  
2. [x] Implementar detecção + *hint* / variant em `nfseNacionalPlugnotasErrorHints.ts`.  
3. [x] Integrar no fluxo existente de erros fiscais / `GuidesMei` conforme padrão actual.  
4. [x] Escrever testes (positivo + falsos positivos).  
5. [x] Documentação `operacao-mei-nfse.md` conforme AC **sim/N/A** ou N/A registado.  
6. [x] **File list** + **Dev Agent Record** + *gates*.  
7. [x] **@qa:** executar **QA mínimo** e preencher **QA Results** (2026-04-09).  
8. [ ] **@ux-design-expert:** fechar *sign-off* copy §5.2 em **QA Results** ou PR *(pendente — ver tabela **QA Results**)*.

---

## File list (indicativo)

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`  
- `frontend/src/pages/GuidesMei.tsx` *(se necessário)*  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` *(se necessário)*  
- `docs/operacao-mei-nfse.md` *(linha PLOGIN-UX-L1 — **sim** se P1 fechado / política PO; **N/A** com nota se *defer* aceite)*

---

## CodeRabbit Integration

- Focar: precedência de regras de *string*, ausência de PII em exemplos de teste, duplicação de `role="alert"`.  
- **Alto:** *copy* **L1** sem evidência de alinhamento à UX **§5.2** (comentário de **@ux-design-expert** ou *gap* explícito).

---

## Dev Agent Record

### Status

Ready for Review (2026-04-09) — *gates* OK; **QA mínimo** e **QA Results** @qa OK; aguarda *sign-off* **@ux-design-expert** (§5.2) para fecho operacional **Ready for Done** se aplicável.

### File list

- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.test.ts`
- `frontend/src/components/PlugnotasMunicipalRequirementOperacaoCopy.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx`
- `frontend/src/components/FiscalIntegrationErrorAlert.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`

### Notes

- **2026-04-09 — Refinamento @sm (feedback @po):** **Estado**; **Pré-condições** (*sign-off* L1); **QA mínimo**; AC **A11y**; documentação **sim/N/A**; tasks **@qa** / **@ux**; tabela **QA Results**.
- **2026-04-09 — @dev:** AC documentação `operacao-mei-nfse.md`: [P1](./story-fr-plogin-p1-operacao-mei-nfse-triagem-400-prefeitura-login.md) está **Ready for Done**? **Não** (Ready for Review). **N/A** + data — sem linha extra no runbook; *follow-up* doc opcional se PO exigir paridade após P1 **Ready for Done**.
- **2026-04-09 — @dev:** Heurística `isPlugnotasPrefeituraLoginRequiredMessage`; variante de UX `prefeitura-login-required` (prioridade sobre `prefeitura-config`); exclusão mensagem BFF DP-PLOGIN-01 (*credenciais não activas*). **CodeRabbit CLI:** não executado neste turno (opcional antes de merge / CI).
- **2026-04-09 — @dev (pós-QA):** follow-up do bloco **QA Results** — `npm run test` na **raiz** do repo → **exit 0** (workspaces frontend + backend); alinhamento checklists **QA mínimo** / task 7 (parte @qa). Secção **QA Results** não editada (canónica @qa).

### Change Log

- 2026-04-09 — Story criada pelo @sm a partir do PRD PLOGIN, UX spec §5 e arquitetura §5.  
- 2026-04-09 — Refinamento @sm: estado, pré-condições, QA mínimo, operação sim/N/A, A11y, *sign-off* UX.
- 2026-04-09 — @dev: PLOGIN-UX-L1 — detecção, copy §5.2, `FiscalIntegrationErrorAlert` + painel retry `GuidesMei`, testes; lint/typecheck/test OK.
- 2026-04-09 — @dev: pós-revisão @qa — `npm run test` raiz OK; checklists QA mínimo (exc. linha @ux).

---

## QA Results

**Revisão @qa:** 2026-04-09 · Estado do repo: alterações **não** consolidadas num único commit no momento da revisão; validação por **execução de testes** + leitura estática de copy e heurísticas.

| Verificação | OK / N/A | Notas |
|-------------|----------|--------|
| FR-PREFB-QA-01 / regressão variantes | OK | Teste `DP-PLOGIN-01 regressão … prefeitura-config` mantém variante; `getPlugnotasEmpresaCadastroErrorUxVariant` para PREF genérico inalterado; suite focada `nfseNacionalPlugnotasErrorHints.test.ts` + `FiscalIntegrationErrorAlert.test.tsx` — **87** testes OK (execução local). |
| Testes L1 + falsos positivos | OK | Positivos: mensagens com `prefeitura.login` / path + obrigatoriedade; híbrido TIBGE+login → `prefeitura-login-required`. Negativos: TIBGE só; DP-PLOGIN-01 BFF → continua `prefeitura-config`. |
| Smoke manual Guia MEI *(ou justificativa)* | N/A | Cobertura por teste RTL `FiscalIntegrationErrorAlert` (região `aria-label="Acesso ao portal da prefeitura no NFS-e"`, copy visível); painel retry `GuidesMei` segue a mesma variante via `getPlugnotasEmpresaCadastroErrorUxVariant` — smoke manual **não** obrigatório face aos AC com esta justificativa. |
| Sem PII/credenciais em fixtures | OK | Strings de teste são mensagens de erro genéricas; copy de UI sem dados reais. |
| *Sign-off* copy L1 **@ux-design-expert** | Pendente | **Paridade estática @qa** com UX **secção 5.2:** título (acesso sistema prefeitura / cadastro NFS-e), corpo (distinção tabela IBGE vs credencial municipal), NFR (não partilhar senhas em chats públicos) — alinhado em `PlugnotasMunicipalRequirementOperacaoCopy.tsx`. **Sign-off formal humano** (@ux-design-expert) ainda não registado nesta story. |

**Rastreio UX §5.2 (amostra):** `PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle` / `…Body` espelham objectivos da tabela 5.2 (clareza, distinção de narrativas, encaminhamento sem pedir credenciais em canais abertos).

**Decisão de gate (advisory):** **PASS com ressalva** — critérios técnicos e QA mínimo satisfeitos; **ressalva:** obter **sign-off @ux-design-expert** (ou delta explícito em PR) antes de **Ready for Done** / merge se a equipa exigir aprovação nominal de copy.

**Follow-up:** após commit/PR, repetir `npm run test --workspace frontend` em CI; opcional smoke Guia MEI com mensagem de erro simulada se PO quiser evidência visual.
