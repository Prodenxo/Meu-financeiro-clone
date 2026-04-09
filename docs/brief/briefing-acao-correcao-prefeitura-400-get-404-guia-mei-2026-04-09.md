# Briefing de ação — correção **400** `nfse.config.prefeitura` e **404** no `GET` empresa (Guia MEI)

**Data:** 2026-04-09  
**Origem:** brainstorm operacional (stack `apiClient` → `cadastrarEmpresaEmissaoNf` / `consultarEmpresaEmissaoNf` → Guia MEI).  
**PRD formal (programa briefing — FR-BRIEF-OP):** [`PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md)  
**Documento canónico (detalhe técnico):** [`brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](./brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md)

---

## 1. Resumo executivo

O Plugnotas rejeita o cadastro com **400** quando falta configuração de **prefeitura** em **`nfse.config`**. O **404** no **`GET` empresa** aparece **depois** porque a empresa **não chegou a ser criada** no emissor — **não** tratar o 404 como causa isolada nem como falha “só da consulta”.

---

## 2. Sintomas típicos (consola / rede)

1. `POST …/api/mei-notas/setup/emissao-fiscal/empresa` → **400**, mensagem citando `fields.nfse.config.prefeitura` (preenchimento obrigatório).
2. `GET …/api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=` → **404** (empresa inexistente na conta até existir **POST** com sucesso).

---

## 3. Checklist de correção (ordem obrigatória)

1. **Backend — env real** (`backend/.env`, não só `.env.example`):  
   `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`
2. **Reiniciar** o processo Node do API após alterar a variável.
3. **Dados — IBGE:** garantir **`endereco.codigoCidade`** com **7 dígitos** após normalização (cidade correta para o município).
4. **Repetir o fluxo** (certificado → POST empresa). Esperado: **POST 2xx**; só então o **GET** deixa de devolver **404** para esse CNPJ.
5. **Produção:** manter **opt-in** — validar com operação / evidência (**NFR-PREF-EV-01**) antes de activar em massa.

---

## 4. Se ainda falhar após o checklist

| Hipótese | Próximo passo |
|----------|----------------|
| Flag activa mas payload sem `prefeitura` | Logs do BFF (`PLUGNOTAS_DEBUG` em não-prod, conforme política) — confirmar corpo enviado ao Plugnotas (redigido). |
| IBGE correcto mas 400 mantém-se | Possível exigência **extra** do município (credenciais, etc.) — ver brief canónico §4 e escalação PRD PREF / P0. |
| Dúvida de contrato JSON | Comparar com documentação oficial do emissor — ex.: [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest). |

---

## 5. Onde está documentado no repositório

- Runbook de equipa: [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — âncora [Trilho B / `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`](../operacao-mei-nfse.md#prefb-trilho-b-env-derive-ibge).
- Variável de exemplo: `backend/.env.example` (comentários junto a `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`).

---

## 6. Handoff sugerido

- **Configuração / ambiente:** devops ou dev com acesso ao `.env` do backend.  
- **Persistência do 400 com trilho B + IBGE válidos:** **@architect** / produto — PRDs PREF e P0 (encaminhamento **FR-PREFB-ESC-01** no PRD PREFB).
