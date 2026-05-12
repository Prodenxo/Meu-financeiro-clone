# Meu Financeiro + OpenClaw

O [OpenClaw](https://docs.openclaw.ai/) é um **gateway self-hosted** (Node) que liga WhatsApp, Telegram, Discord, etc. a um agente com ferramentas, memória e **SOUL/skills**. Documentação oficial: [Getting Started](https://docs.openclaw.ai/start/getting-started) e [llms.txt](https://docs.openclaw.ai/llms.txt).

O **backend Meu Financeiro** expõe um único endpoint HTTP que o OpenClaw (ou n8n) chama com **Bearer** + JSON estruturado.

---

## EasyPanel

No **EasyPanel** costumas ter o **backend** Node com URL pública.

### Backend (serviço Meu Financeiro)

- Define `OPENCLAW_WEBHOOK_SECRET` (string longa aleatória) nas variáveis de ambiente do serviço.
- Se já tinhas um segredo Bearer antigo no painel, **reutiliza o mesmo valor** nesta variável (só mudou o nome da env).
- Supabase e resto do `.env` como já tens.

### Onde corre o OpenClaw

- **Outro app no Easypanel** ou **na tua máquina** (`openclaw onboard --install-daemon`). O gateway precisa de **saída HTTPS** para  
  `https://<O-TEU-BACKEND>/api/bot/openclaw/action`  
  com `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>`.

Evita **dois** bridges WhatsApp no **mesmo** número (ex.: Z-API + OpenClaw a disputar a sessão).

---

## Instalação OpenClaw (resumo)

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

- Config: `~/.openclaw/openclaw.json`
- Dashboard típico: [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (`openclaw dashboard`)
- WhatsApp: [channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp.md) — `channels.whatsapp.allowFrom` para números autorizados
- Tools HTTP / gateway: [config-tools](https://docs.openclaw.ai/gateway/config-tools.md)
- Skill: [skill-format](https://docs.openclaw.ai/clawhub/skill-format.md) · SOUL: [soul](https://docs.openclaw.ai/concepts/soul.md)

---

## Endpoint do Meu Financeiro

| | |
|--|--|
| **Método** | `POST` |
| **Caminho** | `/api/bot/openclaw/action` (URL completa = backend + path) |
| **Header** | `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>` |
| **Header** | `Content-Type: application/json; charset=utf-8` |
| **Corpo** | JSON com `action`; `phone` obrigatório exceto em `ping`. |

Não passes chaves Supabase ao modelo: só este endpoint com Bearer.

### Ações

| `action` | `phone` | O que faz |
|----------|---------|-----------|
| `ping` | não | Teste de vida; resposta inclui mensagem “OpenClaw online”. |
| `resolve_user` | sim | Confirma vínculo telefone → `user_id` (`n8n_link`). |
| `list_transactions` | sim | Até **40** lançamentos recentes. |
| `create_transaction` | sim | Insere em `lancamentos_id`. |
| `delete_transaction` | sim | `payload.id` (UUID); só dono. |

### `create_transaction` — `payload`

**Obrigatórios:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida` (aceita `saída`, normaliza). |
| `valor` | Número. |
| `classificacao` | Texto; ideal = nome da categoria na app. |
| `data` | `YYYY-MM-DD`. |
| `status` | Ex.: `pago`, `pendente`. |
| `obs` | Opcional. |

Exemplo entrada:

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "entrada",
    "valor": 3400,
    "classificacao": "Salário",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "via OpenClaw"
  }
}
```

### Frase natural (quem interpreta)

O Express **não** lê “recebi 4599 de salário”. O **modelo no OpenClaw** (ou LLM no n8n) extrai campos, preenche `phone` com o **remetente** do canal, e chama `create_transaction`. O backend valida o segredo, resolve `phone` → `user_id` via `n8n_link`, grava na BD.

**Checklist:** telefone guardado no **perfil** da app (existe linha em `n8n_link`).

### Trecho para `SOUL.md` (Midas)

```text
És o Midas do Meu Financeiro. Quando alguém descrever um movimento em português
(ex.: "recebi 4599 de salário", "gastei 20 no café"), interpreta valor, tipo,
categoria e data; pergunta só se faltar algo essencial.
Usa sempre o número de WhatsApp DO REMETENTE desta conversa (só dígitos) no
campo "phone" do JSON ao chamares a API — nunca inventes telefones.
Depois de criar, confirma numa frase o que foi registado.
Segue o contrato HTTP: POST .../api/bot/openclaw/action com action e payload.
```

### “Sucesso” mas não na minha conta

1. **`userId` na resposta** de `create_transaction` — compara com o teu utilizador em Supabase `auth.users`.
2. **`matchedUserNumber` / `lookupCandidates`** — confirma `n8n_link.user_number`.
3. **Mesmo Supabase** no backend Easypanel e na app Expo.
4. **`data` em ISO** `YYYY-MM-DD`.
5. Refresh na app.

---

## Teste rápido (script)

Na pasta `Site/backend`:

```bash
npm run test:openclaw:salario -- 55489991234567
```

Requer `OPENCLAW_WEBHOOK_SECRET` no `.env`. Para remoto: `OPENCLAW_ACTION_URL=https://.../api/bot/openclaw/action`. Detalhes: `backend/scripts/test-openclaw-transaction.mjs`.

---

## Código (referência dev)

- Rota: `backend/src/routes/openclaw.routes.js` → `POST /openclaw/action` sob prefixo `/api` + `/bot`.
- Lógica: `backend/src/services/openclaw-bot.service.js`, `transactions.service.js`.
- Middleware Bearer: `backend/src/middlewares/openclawWebhook.js`.

---

## n8n + Z-API (sem OpenClaw no WhatsApp)

O mesmo endpoint serve automações **só n8n**: ver [`whatsapp-n8n-openclaw-backend.md`](./whatsapp-n8n-openclaw-backend.md).

---

## Referências externas

- [docs.openclaw.ai](https://docs.openclaw.ai/)
- Envio DAS / PDF (outro fluxo Z-API): `docs/ops/n8n-zapi-das-mei.md`
