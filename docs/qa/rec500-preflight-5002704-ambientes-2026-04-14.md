# Evidencia REC500 — preflight IBGE 5002704 por ambiente

- **Data da execucao:** 2026-04-15
- **Responsavel:** Consolidacao no repositorio (entrega dev AIOX); **coleta HTTP direta** em `homologacao` PlugNotas **pendente** de execucao pela operacao/QA com credenciais e base URL corretas (ver secao Homologacao).
- **Story ID:** STORY-FR-REC500-P1-OPERACAO-QA-EVIDENCIA-PREFLIGHT-5002704-AMBIENTE-2026-04-14
- **Origem da evidencia (producao) — ordem de precedencia:**
  1. **Rastreio primario (confirmacao operacional):** ver secao seguinte — invocacao do mesmo codigo de servico do BFF que executa `GET /nfse/cidades/5002704` no PlugNotas, com credenciais apenas em cofre / `backend/.env` (nao versionadas).
  2. **Corroboracao documental:** [`docs/prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md`](../prd/PRD-recorrencia-prefeitura-login-required-blocked-5002704-2026-04-14.md) §5.1 (*Achados do caso real*) — alinhada aos valores normalizados obtidos no passo (1).

**Sumario dos gates npm (recomendacao QA):** [`rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md`](./rec500-preflight-5002704-npm-gates-resumo-2026-04-15.md).

---

## Rastreio primario — confirmacao operacional (`producao`)

Criterio: cumpre o pedido de preflight «via caminho suportado pela operacao» com **mesmo** stack que o BFF em producao (`frontend -> BFF -> PlugNotas` na fronteira; aqui validado no **servico** que o BFF usa).

| Campo | Valor |
|-------|--------|
| **Data da verificacao tecnica** | 2026-04-15 |
| **Metodo** | Chamada a `consultarCidadePlugNotas({ codigoIbge: '5002704', environment: 'producao' })` em [`backend/src/services/plugnotas/plugnotas-cidades.service.js`](../../backend/src/services/plugnotas/plugnotas-cidades.service.js) (Node, `backend/.env` via `dotenv`). O servico executa `fetch` `GET` para `{PLUGNOTAS_API_BASE_URL}` + prefixo opcional + `/nfse/cidades/5002704` com `x-api-key`. |
| **Seguranca** | Nenhuma chave, URL completa nem corpo HTTP bruto versionados; apenas o **objeto normalizado** abaixo. |
| **Output normalizado (JSON)** | `{"consulted":true,"codigoIbge":"5002704","environment":"producao","padraoNacionalEnabled":true,"requiresLogin":true,"requiresSenha":false}` |

Este bloco fecha o gap de rastreabilidade «primaria» referido na revisao QA (confirmacao por execucao real do endpoint via codigo de producao, nao apenas citacao do PRD).

---

## Producao — preflight normalizado

Valores abaixo reproduzem a tabela de **retorno normalizado** apos `GET /nfse/cidades/5002704` (via servico acima) e coincidem com a verificacao primaria e com o PRD §5.1.

| Campo (normalizado BFF) | Valor |
|---------------------------|--------|
| codigoIbge | `5002704` |
| ambiente | `producao` |
| padraoNacionalEnabled | `true` |
| requiresLogin | `true` |
| requiresSenha | `false` |

**Nota de rastreabilidade:** o PRD §5.1 regista ainda metadados da decisao de runtime (`consultedMunicipio`, `upstreamCallSkipped`); estes **nao** substituem os booleans do preflight e aparecem na secao opcional abaixo.

---

## Homologacao — preflight normalizado ou impossibilidade

- **Estado:** **impedimento documentado**
- **Motivo:** Nesta entrega documental, nao foi possivel executar `GET /nfse/cidades/5002704` contra a instancia PlugNotas de **homologacao** a partir do ambiente de desenvolvimento do repositorio: credenciais (`x-api-key`), URL base e eventual prefixo de path sao **segredos de operacao** e nao estao disponiveis para chamada automatizada neste contexto.
- **Data:** 2026-04-15
- **Responsavel pelo registo:** mesma linha que «Responsavel» no cabecalho (handoff para QA/operacao repetir a consulta com o par homologacao autorizado).
- **Procedimento esperado para fechar o gap:** repetir a mesma consulta `GET /nfse/cidades/5002704` com `PLUGNOTAS_API_BASE_URL` / chave de **homologacao** conforme cofre interno e runbook; preencher os mesmos cinco campos normalizados neste artefato e atualizar a secao «Comparacao».

---

## Comparacao producao vs homologacao

- **Resultado:** **inconclusivo** — falta evidencia redigida de preflight em `homologacao` (impedimento acima).
- **Notas (sem semantica de produto inventada):** Com base apenas em `producao`, nao e possivel afirmar equivalencia ou divergencia entre ambientes. A story de decisao semantica deve considerar explicitamente o resultado de homologacao quando obtido.

---

## Correlacao opcional (BFF)

Fonte: metadados de decisao de runtime alinhados ao PRD §5.1 (resposta BFF / taxonomia estavel; **sem** payload bruto).

| Campo | Valor (quando aplicavel) |
|-------|---------------------------|
| consultedMunicipio | `true` (equiv. semantico a preflight consultado antes do `POST /empresa`) |
| upstreamCallSkipped | `true` |

**Esclarecimento:** no objeto normalizado do servico `consultarCidadePlugNotas`, o campo e `consulted`; na comunicacao de erro/classificacao ao cliente pode aparecer nomenclatura distinta. Aqui registam-se apenas valores redigidos compatíveis com o PRD.

---

## Redaction

- [x] Sem token PlugNotas, certificado, credenciais municipais ou payload sensivel em claro
- [x] Sem corpo HTTP bruto nem `x-api-key`
- [x] Referencias apenas a ficheiros versionados e caminhos de codigo

---

## Input para story de decisao semantica (nao decisao final)

- **classificacao preliminar:** **correcao controlada em avaliacao**

**Justificativa factual (sem fechar decisao):** Em `producao`, o preflight normalizado indica `padraoNacionalEnabled = true` com `requiresLogin = true`, o que reproduz o cenario **hibrido** descrito no PRD (precedencia do motor bloqueia antes do `POST /empresa`). A decisao formal (`manter policy`, `correcao controlada` ou `fase 2 municipal`) fica para [`story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md`](../stories/story-fr-rec500-p1-produto-validacao-semantica-caso-hibrido-5002704-2026-04-14.md), apos evidencia de homologacao quando existir.
