# REC500 — Rollout controlado IBGE `5002704` (Epic 2 operação)

- **Data do registo:** 2026-04-15  
- **Story:** [`STORY-FR-REC500-P2-OPERACAO-ROLLOUT-CONTROLADO-5002704-2026-04-14`](../stories/story-fr-rec500-p2-operacao-rollout-controlado-5002704-2026-04-14.md)  
- **Política de evidência:** conteúdo redigido; sem segredos, credenciais, CNPJ completo nem payloads brutos sensíveis.

---

## 1. Resultado do rollout (estado fechado em 2026-04-15)

| Campo | Valor |
|-------|--------|
| **Resultado** | **N/A — sem ativação de exceção governada** |
| **Ambiente alvo do rollout (promoção técnica)** | **N/A** — não há ambiente (`producao` / `homologacao` / outro) a alvo de promoção neste encerramento; sem build ou feature distinta a deslocar. |
| **Motivo** | Decisão formal [**PRD §18**](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md): **`manter policy vigente`** para `5002704`. O Epic 2 técnico (regra governada no BFF) está [**cancelado**](../stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) — não existe alteração de motor a promover em ambientes. |
| **Postura operacional actual** | O cadastro continua a ser bloqueado com **`prefeitura_login_required_blocked`** no cenário híbrido (preflight nacional + auth municipal), alinhado a linhas `RTCAD-REC500-01` / `RTCAD-REC500-02` em [`qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](./qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md) e regressão automatizada. |
| **“Rollback” efectivo** | **N/A** — não houve mudança de comportamento em produção a reverter; o *fallback* permanece a **policy vigente** (bloqueio honesto). |
| **Responsável pela documentação deste encerramento** | `@dev` (Dex), conforme pedido de implementação da story |

Não foi efectuada validação operacional remota adicional neste registo: não há **sinal de entrada** técnico (feature/flag ou build) distinto do comportamento já descrito no PRD e na matriz.

---

## 2. Plano explícito de ativação e rollback *(referência futura)*

Este bloco satisfaz o modelo pedido por **AC-REC500-RO-01** / **RO-02** para quando (e só quando) **`correcao controlada`** estiver aprovada e o runtime governado estiver merged.

### 2.1 Activação (futuro)

| Item | Conteúdo |
|------|----------|
| **Âmbito** | Apenas **IBGE `5002704`**, apenas **ambiente(s)** explicitamente autorizados no PRD/arquitetura (ex.: `producao` e/ou `homologacao` conforme decisão). |
| **Pré-requisitos** | Story [`regra governada runtime`](../stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md) **concluída com código**; regressão [`P2 QA caso híbrido`](../stories/story-fr-rec500-p2-backend-qa-regressao-caso-hibrido-5002704-2026-04-14.md) verde; aprovação **`@po`** / checklist operacional. |
| **Sinal de entrada** | Deploy do backend com a regra governada + monitorização dos primeiros fluxos reais (sem dados sensíveis nos tickets). |
| **Validações obrigatórias** | Preflight coerente; `POST /empresa` só no caso governado; outros IBGEs permanecem com precedência login/senha vs nacional **inalterada**. |

### 2.2 Rollback (futuro)

| Item | Conteúdo |
|------|----------|
| **Gatilho** | Regressão de taxonomia, incidente de segurança, ou decisão **`@po`** de recuar. |
| **Caminho** | Reverter deploy / desactivar mecanismo governado conforme desenho técnico; voltar ao bloqueio **`prefeitura_login_required_blocked`** para o híbrido em `5002704` se a policy for restabelecida. |
| **Responsável pela aprovação de rollback** | **`@po`** + engenharia (owner BFF), conforme runbook interno da equipa. |

---

## 3. Alinhamento a escopo (AC-REC500-RO-02)

- Toda a actividade de **rollout** descrita no PRD para Epic 2 pressupõe **excepção aprovada** e restrita a **`5002704`**.  
- Com **`manter policy vigente`**, **não** se documenta capacidade global nem “modo especial” para outros municípios — ver também **Guardrail** no [runbook](../operacao-mei-nfse.md#rec500-ibge-5002704-caso-recorrente).

---

## 4. Ligações canónicas

- Preflight por ambiente: [`rec500-preflight-5002704-ambientes-2026-04-14.md`](./rec500-preflight-5002704-ambientes-2026-04-14.md)  
- Matriz RTCAD REC500: [`qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md`](./qa-matriz-rtcad-cadastro-empresa-plugnotas-2026-04-14.md)  
- Runbook: [`operacao-mei-nfse.md`](../operacao-mei-nfse.md) — âncora `#rec500-ibge-5002704-caso-recorrente`

---

## Change log

| Data | Nota |
|------|------|
| 2026-04-15 | Versão inicial: encerramento **N/A** (sem rollout técnico); plano futuro espelhado para reabertura condicional. |
| 2026-04-15 | Revisão `@qa`: linha explícita **Ambiente alvo do rollout** = **N/A** na tabela §1 (auditoria / AC-RO-03). |
