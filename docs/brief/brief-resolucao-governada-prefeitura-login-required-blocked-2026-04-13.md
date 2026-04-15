# Brief: resolucao governada para `prefeitura_login_required_blocked`

**Data:** 2026-04-13  
**Origem:** consolidacao da recomendacao do master (tratativa operacional imediata + escalonamento condicional) para o incidente de cadastro fiscal MEI com `HTTP 400` e `plugnotasCode = prefeitura_login_required_blocked`.  
**Produto:** Meu Financeiro - Guia MEI (fluxo NFS-e Nacional como padrao).

## Referencias canonicas

- `docs/brief/brief-tratativa-operacional-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/operacao-mei-nfse.md#tro-protocolo-operacional-prefeitura-login-required-blocked`
- `docs/architecture/project-decisions/tro-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/stories/story-fr-tro-p1-operacao-qa-protocolo-triagem-evidencia-prefeitura-login-required-blocked-2026-04-13.md`
- `docs/stories/story-fr-tro-p1-produto-operacao-governanca-gatilhos-escalonamento-prefeitura-login-required-blocked-2026-04-13.md`

---

## 1) Resumo executivo

O erro atual nao representa "endpoint errado".  
Ele representa um caso em que o emissor exige credencial municipal fora da politica padrao do fluxo nacional.

A melhor resolucao para o contexto atual e:

1. **Trilho A (agora):** tratar como operacao, com classificacao canonica e evidencia redigida.
2. **Trilho B (quando houver gatilho):** abrir iniciativa nova dedicada para cobertura municipal, sem remendar o fluxo nacional atual.

---

## 2) Diagnostico consolidado da ocorrencia

| Campo | Valor |
|---|---|
| Rota app | `POST /api/mei-notas/setup/emissao-fiscal/empresa` |
| HTTP | `400 Bad Request` |
| Codigo | `errors.plugnotasCode = prefeitura_login_required_blocked` |
| Request upstream | `errors.plugnotasRequest.method = POST`, `errors.plugnotasRequest.path = /empresa` |
| Leitura operacional | excecao municipal bloqueada no fluxo nacional vigente |

---

## 3) Decisao recomendada

### 3.1 Curto prazo (obrigatorio)

1. Classificar a ocorrencia como **`nao suportado no fluxo nacional`**.
2. Encerrar com decisao binaria: **`esperado pela politica vigente`** ou **`regressao tecnica a corrigir`**.
3. Registrar evidencia minima FR-TRO-03 (sem segredo/sensivel).
4. Nao abrir bug tecnico de "rota/endpoint" quando o contrato de erro estiver presente.

### 3.2 Medio prazo (condicional)

Escalar para iniciativa nova apenas se houver gatilho FR-TRO-08 ativo.  
Sem gatilho, manter politica vigente e apenas atualizar governanca/evidencia por ocorrencia.

---

## 4) Plano de acao recomendado por frente

### Operacao/QA

- Executar o protocolo TRO no runbook.
- Registrar ticket interno por ocorrencia com evidencia redigida.
- Preservar causalidade: `POST` falho -> `GET` negativo como consequencia.

### Produto

- Validar decisao formal do cluster: manter politica vigente ou abrir PRD dedicado.
- Reavaliar gatilhos FR-TRO-08 a cada recorrencia relevante.

### Engenharia

- Nao alterar comportamento do endpoint atual sem decisao de produto para iniciativa nova.
- Atuar em codigo apenas quando houver regressao tecnica comprovada.

---

## 5) Gatilhos canonicos para escalonamento (FR-TRO-08)

Somente estes gatilhos podem abrir iniciativa nova:

1. Volume recorrente com impacto operacional.
2. Demanda comercial explicita.
3. Decisao estrategica de ampliar cobertura municipal.

Regra: nao criar gatilhos extras fora desta lista.

---

## 6) Entregaveis esperados por cenario

| Cenario | Entregavel minimo |
|---|---|
| Sem gatilho ativo | ticket + artefato `docs/qa/tro-...` + decisao formal "manter politica vigente" |
| Com gatilho ativo | abertura de PRD dedicado da iniciativa nova + atualizacao do artefato de governanca com link cruzado |

---

## 7) Riscos se a estrategia nao for seguida

1. Retrabalho ciclico entre suporte, QA e engenharia.
2. Classificacao incorreta como erro de endpoint.
3. Escalonamento precoce sem base de governanca.
4. Escalonamento tardio com perda de oportunidade comercial.

---

## 8) Criterios de sucesso deste brief

- Ocorrencias do codigo `prefeitura_login_required_blocked` passam a ter decisao padronizada.
- Evidencia minima FR-TRO-03 fica rastreavel por ticket e artefato local.
- Equipe diferencia claramente "tratativa operacional" de "iniciativa nova".
- Escalonamentos futuros seguem apenas os gatilhos FR-TRO-08.

---

## 9) Proximos passos imediatos

1. Registrar a ocorrencia atual no artefato `docs/qa/tro-...` com redaction.
2. Confirmar no artefato de governanca que o cluster atual permanece sem gatilho ativo.
3. Formalizar decisao do ciclo: `manter politica vigente`.
4. Se houver nova recorrencia relevante, reavaliar gatilhos e decidir sobre PRD dedicado.

---

## Change log

| Data | Nota |
|---|---|
| 2026-04-13 | Brief criado com base na recomendacao do master: trilho operacional imediato + escalonamento condicional por gatilhos FR-TRO-08. |

