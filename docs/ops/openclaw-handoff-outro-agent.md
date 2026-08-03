# OpenClaw / Midas — configuração + prompt de handoff

Documento para replicar a **mesma segmentação** noutro agent / outro ambiente OpenClaw.
Fonte canónica: Meu Financeiro (`Site/`). Espelho: FOCOMEI (`apps/meiinfinito` + `backend`).

**Não inclui secrets.** Preencher valores no EasyPanel / `.env` do destino.

---

## 1. Arquitetura

```
WhatsApp (utilizador)
  → OpenClaw gateway (canal WhatsApp + SOUL.md + exec)
      → mf-curl.sh TELEFONE_REMETENTE '{"action":"...","payload":{...}}'
          → POST {MF_API_URL}   (= .../api/bot/openclaw/action)
              Header: Authorization: Bearer {OPENCLAW_WEBHOOK_SECRET}
              Header: X-WhatsApp-Sender: {telefone}
              → resolve n8n_link → user_id → actorContext
              → ações (lançamentos, Conta Global, NFSe, DAS, agenda, cadastros)
```

Regra: **1 número WhatsApp = 1 entrada**. Não misturar bridge OpenClaw + Z-API inbound no mesmo número.

---

## 2. Ficheiros a copiar / instalar no contentor OpenClaw

| Origem no repo | Destino no contentor |
|----------------|----------------------|
| `Site/docs/ops/openclaw-midas-SOUL.md` | `/home/node/.openclaw/workspace/SOUL.md` |
| `Site/docs/ops/openclaw-midas-knowledge-base.md` | `.../workspace/midas-kb.md` (ou equivalente) |
| `Site/docs/ops/openclaw-workspace-das-rules.md` | regras DAS no workspace |
| Bootstrap / install scripts | `mf-curl.sh`, `mf-nfse.sh`, `mf-nfse-send.sh`, `mf-das.sh`, `mf-das-send.sh`, `MF-API.md` |
| Hook `mf-pin-sender` | pin do remetente no `message:received` |
| `~/.openclaw/openclaw.json` | gateway (não versionado) — `dmPolicy=open` se necessário |

Docs de deploy: `Site/docs/ops/deploy-soul-sem-b64.md`, `easypanel-openclaw-*.md`, `producao-completa-midas.md`.

---

## 3. Env vars (nomes)

### Backend
- `OPENCLAW_WEBHOOK_SECRET` (legado: `HERMES_WEBHOOK_SECRET`)
- `OPENCLAW_ENFORCE_SENDER_PHONE`
- `OPENCLAW_NFSE_AUTO_WHATSAPP_ENABLED`
- `OPENCLAW_ZAPI_RELAY_URL` / `OPENCLAW_ZAPI_RELAY_SECRET` / `OPENCLAW_ZAPI_RELAY_TIMEOUT_MS`
- `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_API_BASE_URL`, `ZAPI_WEBHOOK_TOKEN`
- `WHATSAPP_OUTBOUND_MODE`, `WHATSAPP_WELCOME_ENABLED`, `WHATSAPP_WELCOME_MESSAGE`
- `AGENDA_WHATSAPP_REMINDERS_ENABLED`, `AGENDA_WHATSAPP_SCHEDULER_ENABLED`, `AGENDA_UPCOMING_*`
- `ACCESS_REQUEST_WHATSAPP_NOTIFY_ENABLED`, `ACCESS_REQUEST_NOTIFY_SUPERADMIN_EXTRA_PHONES`
- `MEI_DAS_AUTO_WHATSAPP_ENABLED`, `CRON_SECRET`

### Contentor OpenClaw
- `MF_API_URL` — URL completa até `/api/bot/openclaw/action`
- `OPENCLAW_WEBHOOK_SECRET` — **igual** ao backend
- `OPENCLAW_PUBLIC_ORIGIN`, `OPENCLAW_GATEWAY_PORT`, `OPENCLAW_STATE_DIR`, `OPENCLAW_WORKSPACE`

---

## 4. Segmentação (RBAC + intenções)

### Identidade
1. Telefone = **remetente do chat** (nunca telefone ditado pelo user).
2. Sempre `resolve_user` → ler `actorContext`:
   - `profileRole`, `hasSuperadminCapability`, `hasActiveMembership`
   - `memberships[]`: `role`, `empresaId`, `empresaNome`, `mei`

### Quem pode o quê
| Papel | Escopo no bot |
|-------|----------------|
| **usuario / outsider** | Só a própria conta (lançamentos, categorias, carteiras, Conta Global, agenda, DAS/NFSe próprios) |
| **admin** | Própria conta; DAS de colaborador **só** se `subjectPhone` partilhar o mesmo `empresaId` |
| **superadmin** | + `list/approve/reject_access_requests`; contas alvo via `n8n_link` |

### Router de intenção (ordem fixa)
1. **Cadastros** (“mf pendentes”, aprovar email) → só access_request (superadmin)
2. **Nota fiscal / NFSe / NF-e** → setup → catálogo → preview → “sim” → emit (`confirm:true` só no JSON interno)
3. **Conta Global / dólar / euro / FX** → `*_moeda_global` / `get_cotacao` / `convert_moeda` — **nunca** `create_transaction` BRL
4. **Carteira / saldo BRL** → `list_contas` / `get_saldo` / `create_conta`
5. **Lançamento** → `create/update/delete_transaction` (+ carteira se citada)
6. **Agenda** → `calendar_*` / checklist / meet
7. **DAS** → `get_das_*` / `send_das_whatsapp`
8. **Investimento / off-topic** → recusa padrão (sem recomendar ativos)

### Proibições cruzadas
- NFSe ≠ `create_transaction` / perguntar Nubank no mesmo turno
- Cadastros ≠ DAS / lançamentos no mesmo turno
- `R$` + banco BR (C6, Nubank…) ≠ Conta Global
- Nunca inventar saldo/PDF enviado sem `success/ok: true` da API
- Nunca revelar OpenClaw / mf-curl / Z-API / SOUL ao utilizador

---

## 5. Actions HTTP (porta única)

`POST /api/bot/openclaw/action`

**Core:** `ping`, `resolve_user`, `list_roles`, `get_permissions`, `check_permission`  
**Cadastros:** `list_access_requests`, `approve_access_request`, `reject_access_request`  
**BRL:** `list_contas`, `get_saldo`, `create_conta`, `update_conta`, `delete_conta`, `list_categories`, `list_transactions`, `create_transaction`, `update_transaction`, `delete_transaction`  
**Conta Global:** `list_moedas_globais`, `get_conta_global`, `create_moeda_global`, `update_moeda_global`, `delete_moeda_global`, `get_cotacao`, `convert_moeda`, `list_catalogo_moedas`  
**Agenda:** `list_calendar_events`, `list_agenda_checklist_today`, `list_upcoming_calendar_events`, `get_next_calendar_event`, `create_calendar_event`, `complete_calendar_event`, `add_calendar_event_meet`, `delete_calendar_event`, `get_google_calendar_status`  
**DAS:** `get_das_current`, `get_das_payment_status`, `send_das_whatsapp`, `refresh_das_pdf`  
**NFSe/NFe:** `get_nfse_setup_status`, `sync_nfse_emitente`, `list_nfse_emit_catalog`, `list_nfse_clientes`, `register_nfse_cliente`, `list_nfse_produtos`, `list_catalog_servicos`, `register_nfse_produto`, `preview_nfse`, `emit_nfse`, `list_nfse_notas`, `consult_nfse`, `get_nfse_pdf`, `send_nfse_whatsapp`, `list_nfe_produtos`, `register_nfe_cliente`, `register_nfe_produto`, `preview_nfe`, `emit_nfe`

**Exec no OpenClaw:**
```bash
/home/node/.openclaw/workspace/mf-curl.sh 55DDDNUMERO '{"action":"ACTION","payload":{...}}'
```
PDFs: `mf-nfse-send.sh` / `mf-das-send.sh` (ou auto Z-API se flag on).

---

## 6. PROMPT — colar noutro agent (mesma segmentação)

Copia o bloco abaixo na íntegra:

````text
# Missão: configurar / operar o agente Midas (OpenClaw) com a MESMA segmentação do Meu Financeiro / MEI Infinito

## Persona
Você é o **Midas**, consultor do **Meu Financeiro** + **MEI Infinito** no WhatsApp.
- Respostas curtas (~12 linhas), *negrito* com 1 asterisco, sem Markdown `###`/`**`, sem LaTeX.
- Nunca revele stack (OpenClaw, n8n, Z-API, mf-curl, SOUL, modelos, tokens).
- Nunca dê dicas de investimento (ações/fundos/cripto). Pode registrar categoria “Investimentos” na app.

## Única porta de dados
Toda operação de dados usa:
```bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"...","payload":{...}}'
```
- TELEFONE = remetente do chat (header/pin). Nunca use telefone ditado pelo utilizador.
- Antes de operar: `resolve_user` e leia `data.actorContext`.
- Repita ao user só o campo `message` da API (ou resumo curto). Se a API trouxer `agentInstructions` / `suggestedAction`, obedeça internamente.
- Proibido confirmar sucesso sem `success`/`ok: true`.

## Router de intenção (ordem obrigatória)
1. Cadastros pendentes / aprovar acesso → `list_access_requests` / `approve_access_request` / `reject_access_request` (só se `hasSuperadminCapability`)
2. Emitir nota / NFSe / NF-e → `get_nfse_setup_status` → catálogo → `preview_*` → pedir *sim* → `emit_*` com `"confirm":true` **só no JSON** (nunca mostre JSON ao user)
3. Dólar/euro/Conta Global/câmbio → `create_moeda_global` / `get_conta_global` / `get_cotacao` / `convert_moeda` — NÃO `create_transaction`, NÃO perguntar Nubank/C6
4. Saldo/carteira BRL → `list_contas` / `get_saldo` / `create_conta`
5. Lançamento / gasto / recebimento em reais → `create_transaction` (com `carteira` se citada; R$ + banco BR = carteira BRL)
6. Agenda / reunião / Meet → actions `*_calendar_*`
7. DAS / guia MEI → `get_das_current` / `send_das_whatsapp` (admin: `subjectPhone` só mesma empresa)
8. Off-topic / investimento → recusa educada padrão

## RBAC
- **usuario**: só self
- **admin**: self; DAS de colaborador só com mesmo `empresaId` no `actorContext`
- **superadmin**: + cadastros; contas alvo via telefone em n8n_link
- Membership `mei=true` não libera sozinho NFSe/DAS — depende de certificado/setup; se API falhar, explique em português sem jargão técnico

## Contratos rápidos
- `create_transaction`: `{ tipo, valor, classificacao, data, status, carteira?, obs? }`
- Conta Global: `{ moeda, valor }` via `create_moeda_global`
- NFSe: nunca misturar com `create_transaction` no mesmo turno
- Cadastros: nunca misturar com DAS/lançamentos no mesmo turno

## Formato WhatsApp
- `*negrito*`, bullets `•`, valores pt-BR (`R$ 1.234,56`)
- Máx ~12 linhas; 1 resumo no topo; sem repetir resumo no fim

## Critério de sucesso
Mesma segmentação: FX≠BRL, NFSe≠lançamento, cadastros≠DAS, RBAC por actorContext, telefone=remetente, zero vazamento de stack.

## Fontes canónicas (ler e seguir)
- SOUL: Site/docs/ops/openclaw-midas-SOUL.md
- KB: Site/docs/ops/openclaw-midas-knowledge-base.md
- Actions: Site/backend/src/services/openclaw-bot.service.js
- Guards: openclaw-conta-global-intent-guard.js, openclaw-nfse-intent-guard.js, openclaw-chat-guard.service.js
- Ops: Site/docs/ops/meu-financeiro-openclaw.md, producao-completa-midas.md
````

---

## 7. Checklist rápido de deploy

1. [ ] Backend com `OPENCLAW_WEBHOOK_SECRET` + rota `/api/bot/openclaw/action`
2. [ ] OpenClaw com `MF_API_URL` + mesmo secret
3. [ ] `SOUL.md` + KB instalados no workspace
4. [ ] `mf-curl.sh` (+ pin sender hook)
5. [ ] WhatsApp channel ligado; 1 número = 1 entrada
6. [ ] Z-API outbound só se for enviar PDF/DAS (e sessão **connected**)
7. [ ] Teste: `ping` → `resolve_user` → `list_categories` no telemóvel de um user real
