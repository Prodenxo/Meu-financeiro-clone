# QA — Matriz manual **endpoint × sintoma** (tríade Guia MEI / FR-CONS)

**Story:** [`story-fr-cons-p2-qa-matriz-triade-endpoints.md`](../stories/story-fr-cons-p2-qa-matriz-triade-endpoints.md)  
**PRD:** [`PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — Épico 3, **FR-CONS-EVID-01**, critérios de release [**§8**](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md#8-critérios-de-aceite-de-release-consolidados)  
**Arquitectura (matriz rastreio):** [`architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — §4  
**Brief consola:** [`brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md)  
**Runbook (tríade):** [`operacao-mei-nfse.md`](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei)  
**Stories de implementação:** [CONS P0 Serpro 503](../stories/story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md) · [CONS P1 Guia MEI / SOL](../stories/story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md)

**Objectivo:** matriz **executável** para QA assinar o pacote **FR-CONS** com evidência rastreável. **Sem PII real** na evidência (usar CNPJ mascarado, ex.: `12.***.***/****-**`).

---

## 1. Matriz — cenários (mínimo tríade + caminho feliz)

| ID | Endpoint BFF (típico) | Pré-condição | Resposta HTTP (BFF / rede) | Copy / UI esperada | Ref. spec / notas |
| --- | --- | --- | --- | --- | --- |
| **QA-CONS-01** | `POST /api/mei-notas/setup/emissao-fiscal/empresa` | Certificado A1 válido na conta; payload MEI válido; ambiente Plugnotas alinhado (sandbox/prod). | **2xx** (`success: true` ou contrato actual de sucesso). | Mensagem de sucesso no fluxo DAS / empresa; painel de retry âmbar **não** visível por este erro; seguir para consulta GET opcional. | Caminho feliz; [operacao § cadastro](../operacao-mei-nfse.md#plugnotas-empresa-payload-apenas-nfse). |
| **QA-CONS-02** | `POST …/emissao-fiscal/empresa` | Conta/validador exige `nfse.config.prefeitura` (cenário PREF). | **400**, `success: false`, mensagem citando `nfse.config.prefeitura` / `fields.nfse.config.prefeitura`. | Variante **PREF-L1**: copy municipal / prefeitura (`PlugnotasPrefeituraConfigNfseOperacao*` ou corpo municipal conforme `getPlugnotasEmpresaCadastroErrorUxVariant`); **não** atribuir a Serpro. | [UX PREF](../specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md); `nfseNacionalPlugnotasErrorHints.ts`. |
| **QA-CONS-03** | `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=` | **Após** falha do POST empresa (ex. cenário QA-CONS-02) **ou** empresa ainda não criada no Plugnotas. | **404** (ou equivalente app com `success: false`). | **CONS-B:** mensagem **não** sugere apenas “CNPJ errado”; com painel retry **SOL-L1** ou, com `guiaMeiEmpresaFase2FailFlag`, prefixo **§5.4 SOL** / `withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable` + painel SOL compacto quando aplicável. | [UX SOL](../specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md); [UX CONS §5.4](../specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md). |
| **QA-CONS-04** | `GET …/emissao-fiscal/empresa?cpfCnpj=` | Sem falha recente de POST fase 2 na sessão (flag expirada ou nunca falhou); CNPJ sem empresa no provedor (primeira visita). | **404**. | **SOL-L3** (estado neutro): mensagem de “não encontrado” **sem** prefixo de cadastro pendente; sem misturar com CONS-C. | Comparar com QA-CONS-03 para regressão **FR-CONS-UX-01**. |
| **QA-CONS-05** | `POST /api/mei-guide/validate` | Serpro devolve **5xx** (staging, ou mock `emitirServico` / teste local conforme [P0](../stories/story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md)). | **503**, `errors.code: MEI_GUIDE_SERPRO_UNAVAILABLE`, `integration: serpro`, `upstreamStatus` numérico. | **CONS-C:** título + corpo da spec UX §6 (`mapMeiGuideValidateErrorToUserMessage`); **não** reutilizar copy de `GuiaMeiEmpresaCadastroErrorPanel` / NFS-e Nacional / prefeitura; `role="region"` + `aria-labelledby` quando aplicável. | [UX CONS §6](../specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md). |
| **QA-CONS-06** | `POST /api/mei-guide/validate` | CNPJ inválido ou validação **antes** de chamar Serpro (regra de negócio local). | **400**, sem `errors.code` Serpro **ou** mensagem de validação de formulário. | Erro de validação **local** (não CONS-C); texto orienta corrigir CNPJ/dados; **não** mostrar copy de indisponibilidade Receita. | Diferenciar de QA-CONS-05 pelo `httpStatus` e corpo. |

**Staging / Serpro:** se **503** não for reproduzível em ambiente partilhado, usar **DEV** com testes backend (`emitir-servico-serpro-503.test.js`) como evidência técnica complementar e registar limitação na tabela de execução.

---

## 2. Registo de execução *(preencher por @qa)*

| ID | Data (YYYY-MM-DD) | Ambiente | Executor | Resultado (PASS / FAIL / SKIP) | Notas (sem PII) |
| --- | --- | --- | --- | --- | --- |
| QA-CONS-01 | | | | | |
| QA-CONS-02 | | | | | |
| QA-CONS-03 | | | | | |
| QA-CONS-04 | | | | | |
| QA-CONS-05 | | | | | |
| QA-CONS-06 | | | | | |

---

## 3. Bugs / stories filhas

*(IDs de issue ou links a stories filhas; substituir a linha **Nenhum** quando existir defeito registado.)*

- **Nenhum** *(baseline antes da execução documentada em §2)*

---

## 4. Rodapé — rastreio **FR-CONS-EVID-01** (release **§8** PRD)

- **PRD CONS** (objectivos, Épico 3, §8): ficheiro citado no cabeçalho.  
- **Brief consola:** ficheiro citado no cabeçalho.  
- **Stories:** [P0](../stories/story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md), [P1 Guia MEI](../stories/story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md), [P1 operação runbook](../stories/story-fr-cons-p1-operacao-mei-nfse-triade-erros-consola.md).  
- **PO (@pm):** após preencher §2, vincular a comentário MR ou anexo interno para **Story 3.2** checklist de release.

---

## Change log

| Data | Nota |
| --- | --- |
| 2026-04-08 | Versão inicial: matriz QA-CONS-01…06, template de evidência, ligações PRD/brief/stories/P0/P1. |
| 2026-04-08 | §3: linha **Nenhum** por defeito (sugestão QA revisão matriz). |
