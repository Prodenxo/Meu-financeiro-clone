# Produção completa — Backend + OpenClaw (Midas) para todos

Ordem **obrigatória**. Arquitetura alvo:

```text
WhatsApp (utilizador)
    → OpenClaw (Midas, dmPolicy open)
        → mf-curl.sh → POST /api/bot/openclaw/action
            → Supabase / Z-API saída / Google Calendar

Backend (paralelo, sem n8n):
    • Lembretes agenda 7h/21h (scheduler interno)
    • Notificações cadastro (Z-API)
    • Opcional: Z-API inbound → relay (só se NÃO usares WhatsApp nativo no OpenClaw)
```

**Regra de ouro:** um número = **uma** entrada de mensagens. Com OpenClaw WhatsApp ligado, **desliga** o webhook Z-API “ao receber” para o n8n (e evita relay duplicado).

---

## Fase 0 — Git + deploy backend (10 min)

1. Commit + push do `Site/` para a branch do Easypanel (`Master`).
2. Easypanel → serviço **back_meufinanceiro** → **Redeploy**.
3. Confirma API nova:

```text
GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/
```

Deve ter `"apiVersion": 2` e rotas `meiGuide`, etc.

```text
GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/webhooks/zapi/monitor
```

Deve ter `"inboundBridgeVersion": 4`.

---

## Fase 1 — Variáveis backend (Easypanel)

Copia/valida **todas**:

| Variável | Valor |
|----------|--------|
| `OPENCLAW_WEBHOOK_SECRET` | Segredo longo (igual ao OpenClaw) |
| `ACCESS_REQUEST_WHATSAPP_NOTIFY_ENABLED` | `true` |
| `AGENDA_WHATSAPP_REMINDERS_ENABLED` | `true` |
| `AGENDA_WHATSAPP_SCHEDULER_ENABLED` | omitir ou `true` |
| `ZAPI_INSTANCE_ID` | Painel Z-API |
| `ZAPI_TOKEN` | Painel Z-API |
| `ZAPI_CLIENT_TOKEN` | Painel Z-API |
| `WHATSAPP_OUTBOUND_MODE` | `zapi` ou `auto` |
| `ZAPI_WEBHOOK_TOKEN` | Só se usares inbound Z-API → backend (opcional com OpenClaw directo) |
| `OPENCLAW_ZAPI_RELAY_URL` | **Vazio** se OpenClaw recebe WhatsApp directo |
| `OPENAI_API_KEY` ou `GROQ_API_KEY` | STT áudio (se um dia usares inbound Z-API) |

Opcional:

| Variável | Uso |
|----------|-----|
| `ACCESS_REQUEST_WHATSAPP_SUPPORT_GROUP_URL` | Link grupo na aprovação |
| `OPENCLAW_NFSE_AUTO_WHATSAPP_ENABLED` | `true` se quiseres PDF NFSe automático após emitir |

**Restart** backend → logs:

```text
[agenda-reminders] Scheduler interno ativo (7h e 21h America/Sao_Paulo)
```

---

## Fase 2 — Desligar duplicados

| O quê | Acção |
|-------|--------|
| **n8n** workflow `financas` / WhatsApp inbound | **Desactivar** (toggle off) |
| **cron-job.org** MF agenda manhã/noite | **Apagar/pausar** |
| **Z-API** webhook “ao receber” → n8n | **Remover** ou apontar para vazio |

Se mantiveres Z-API “ao receber” **e** OpenClaw WhatsApp no **mesmo** número, podes ter respostas duplicadas ou sessão instável.

---

## Fase 3 — OpenClaw (Easypanel)

### 3.1 Environment

| Variável | Valor |
|----------|--------|
| `MF_API_URL` | `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action` |
| `OPENCLAW_WEBHOOK_SECRET` | **Igual** ao backend |
| `OPENCLAW_PUBLIC_ORIGIN` | `https://auto-openclaw-gateway.4tnf3f.easypanel.host` (o teu) |

**Não** uses `OPENCLAW_STATE_DIR=/tmp`. Volume em `/home/node/.openclaw`.

### 3.2 Scripts no workspace

Com serviço **Running** → Console:

1. Cola o **comando de arranque** de [`easypanel-openclaw-sem-console.md`](./easypanel-openclaw-sem-console.md) (secção 2) **ou** instala scripts com [`easypanel-console-install-mf.sh`](./easypanel-console-install-mf.sh).
2. SOUL completo:

```bash
bash /caminho/no/container/apply-soul-patches-all-easypanel.sh
```

(ou cola o conteúdo de `Site/docs/ops/scripts/apply-soul-patches-all-easypanel.sh` no Console.)

### 3.3 Liberar **todos** os utilizadores (DM aberto)

No Console OpenClaw:

```bash
bash -s << 'SCRIPT'
# ou: wget/cola Site/docs/ops/scripts/openclaw-allow-all-dms.sh
CFG="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}/openclaw.json"
node -e "
const fs=require('fs');
const p=process.env.CFG||'/home/node/.openclaw/openclaw.json';
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){console.error('Sem openclaw.json:',e.message);process.exit(1)}
c.channels=c.channels||{};
c.channels.whatsapp=c.channels.whatsapp||{};
c.channels.whatsapp.dmPolicy='open';
c.channels.whatsapp.allowFrom=['*'];
if(c.channels.whatsapp.accounts&&typeof c.channels.whatsapp.accounts==='object'){
  for(const id of Object.keys(c.channels.whatsapp.accounts)){
    const a=c.channels.whatsapp.accounts[id];
    if(a&&typeof a==='object'){a.dmPolicy='open';a.allowFrom=['*']}
  }
}
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('[ok] WhatsApp dmPolicy=open allowFrom=[*] →',p);
"
SCRIPT
```

**Restart** do serviço OpenClaw no Easypanel (não `gateway restart` no console).

### 3.4 WhatsApp ligado

Painel OpenClaw → Canais → WhatsApp:

- **Vinculado: Sim**
- **Em execução: Sim**
- **Conectado: Sim**

Se `not linked`: [`easypanel-openclaw-sem-console.md`](./easypanel-openclaw-sem-console.md) secção 5.

### 3.5 Teste API a partir do contentor

```bash
/home/node/.openclaw/workspace/mf-curl.sh '{"action":"ping"}'
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"55SEUTELEFONE","action":"resolve_user"}'
```

---

## Fase 4 — Pré-requisito utilizadores (`n8n_link`)

Cada pessoa precisa do **telefone no perfil** da app (grava em `n8n_link`).

Sem isso o Midas responde: *“Nenhum utilizador ligado a este telefone”*.

Comunicação sugerida: “Atualiza o telefone no perfil Meu Financeiro para usar o assistente no WhatsApp.”

---

## Fase 5 — Testes de fumo (15 min)

Depois de **`/new`** no chat do Midas:

| # | Quem | Mensagem | Esperado |
|---|------|----------|----------|
| 1 | Utilizador comum | `qual o meu saldo` / lista transações | `list_transactions` / resposta da API |
| 2 | Superadmin | `mf pendentes` | Lista cadastros (sem DAS) |
| 3 | Com Google Calendar | `Marca teste amanhã 16h` | Evento criado |
| 4 | Com Google Calendar | `Reunião sexta 10h com Meet` | Link Meet |
| 5 | — | Esperar 7h ou 21h **ou** ver log scheduler | Lembretes só quem tem eventos (sem spam) |

PowerShell (API directa):

```powershell
curl.exe -s -X POST "https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer SEU_OPENCLAW_WEBHOOK_SECRET" `
  -d "{\"phone\":\"55SEUTELEFONE\",\"action\":\"ping\"}"
```

---

## Alternativa: entrada só via Z-API (sem WhatsApp no OpenClaw)

Se o número **só** existir na Z-API (sem sessão Baileys no OpenClaw):

1. **Desliga** `channels.whatsapp` no OpenClaw.
2. Z-API “ao receber” → `https://.../api/webhooks/zapi/inbound?token=ZAPI_WEBHOOK_TOKEN`
3. Backend env: `OPENCLAW_ZAPI_RELAY_URL` = URL HTTP do gateway OpenClaw que aceita `{ phone, text }`
4. n8n continua **off**; o relay substitui o n8n.

Não mistures esta alternativa com a Fase 3 (OpenClaw WhatsApp directo).

---

## Rollback

| Problema | Acção |
|----------|--------|
| Bot estranho | Restaurar `SOUL.md.bak.*` |
| Spam agenda | Pausar cron-job.org + confirmar scheduler único nos logs |
| Silêncio total | Reactivar n8n **ou** religar WhatsApp OpenClaw |
| Todos bloqueados | `dmPolicy` voltou a `pairing` — repetir script allow-all |

---

## Checklist final (copiar)

- [ ] Backend redeploy + `apiVersion` 2 + `inboundBridgeVersion` 4
- [ ] Env backend (tabela Fase 1)
- [ ] Log scheduler agenda
- [ ] n8n inbound **off**
- [ ] cron-job.org agenda **off**
- [ ] Z-API não aponta para n8n
- [ ] OpenClaw env `MF_API_URL` + secret
- [ ] SOUL patch aplicado
- [ ] `dmPolicy: open` + `allowFrom: ["*"]`
- [ ] WhatsApp Conectado Sim
- [ ] `/new` + testes Fase 5
