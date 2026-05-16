# WhatsApp (Z-API + n8n) → backend OpenClaw

Este guia explica **em blocos pequenos** o que é cada coisa e o que tens de clicar/copiar. O backend expõe `POST /api/bot/openclaw/action` que o **n8n** chama em segurança (com um **segredo**); o utilizador é identificado pelo **telefone** na tabela `n8n_link` (a app grava quando o utilizador mete o telefone no perfil).

---

## 1. O que são as peças

| Peça | O que faz |
|------|-----------|
| **WhatsApp** | O utilizador manda texto para o teu número. |
| **Z-API** | Recebe a mensagem e avisa o **n8n** (webhook). |
| **n8n** | Automação: recebe o JSON, trata, chama o **backend**, manda resposta pela Z-API. |
| **Backend (este repo)** | Transações na BD. Só altera dados com **segredo** certo + **telefone** em `n8n_link`. |

---

## 2. Configurar **uma vez** no servidor (backend)

1. Gera uma password **longa e aleatória**.
2. No Easypanel / `.env` do backend:

```bash
OPENCLAW_WEBHOOK_SECRET=a_tua_string_longa_secreta
```

(Reutiliza o mesmo valor se já tinhas um segredo Bearer no backend; só atualiza o **nome** da variável no painel.)

3. Reinicia o backend.

4. Testa o endpoint (troca URL e segredo). Header: `Authorization: Bearer <segredo>` (com a palavra `Bearer` e um espaço).

### 2b. Webhook Z-API no próprio backend (relay)

- **URL no painel Z-API:** `https://O-TEU-BACKEND/api/webhooks/zapi/inbound?token=<ZAPI_WEBHOOK_TOKEN>` (HTTPS obrigatório na Z-API).
- **Env:** `ZAPI_WEBHOOK_TOKEN` (obrigatório para activar o POST). Opcional: `OPENCLAW_ZAPI_RELAY_URL` + `OPENCLAW_ZAPI_RELAY_SECRET` — o servidor reencaminha JSON `{ source: "zapi", phone, text, messageId, instanceId, receivedAt }` para n8n ou qualquer URL que alimente o OpenClaw.
- **Monitor:** `GET /api/webhooks/zapi/monitor` — indica se o relay está configurado (sem token).

**Git Bash / macOS / Linux**

```bash
curl -s -X POST "https://O-TEU-BACKEND/api/bot/openclaw/action" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a_tua_string_longa_secreta" \
  -d '{"action":"ping"}'
```

**Windows PowerShell** — usa `curl.exe` ou `Invoke-RestMethod`:

```powershell
curl.exe -s -X POST "https://O-TEU-BACKEND/api/bot/openclaw/action" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer a_tua_string_longa_secreta" `
  -d '{"action":"ping"}'
```

Resposta esperada: `success: true` e mensagem tipo “OpenClaw online”.

### Atalho: lançamento de salário (script)

Na pasta `Site/backend`, com segredo no `.env`. Remoto: `OPENCLAW_ACTION_URL=https://…/api/bot/openclaw/action`.

```bash
cd Site/backend
npm run test:openclaw:salario -- 55489991234567
npm run test:openclaw:salario -- 55489991234567 5000
```

Ficheiro: `backend/scripts/test-openclaw-transaction.mjs`.

---

## 3. URL e formato do pedido (n8n)

- **Método:** `POST`
- **URL:** `https://O-TEU-BACKEND/api/bot/openclaw/action`
- **Header:** `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>`
- **Header:** `Content-Type: application/json`
- **Body:** JSON com `action`. `phone` obrigatório exceto em `ping`.

### Ações (MVP)

| `action` | `phone` | `payload` |
|----------|---------|-----------|
| `ping` | não precisa | — |
| `resolve_user` | sim | — |
| `list_transactions` | sim | — |
| `list_calendar_events` | sim | `payload.data` ou `date` opcional (`YYYY-MM-DD` ou `DD/MM/YYYY`) |
| `create_transaction` | sim | `tipo`, `valor`, `classificacao`, `data`, `status`, `obs` opcional |
| `delete_transaction` | sim | `{ "id": "<uuid>" }` |

Exemplo criar entrada:

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
    "obs": "via n8n WhatsApp"
  }
}
```

Para apagar: fluxo típico `list_transactions` → confirmação → `delete_transaction`.

Contrato completo e SOUL: [`meu-financeiro-openclaw.md`](./meu-financeiro-openclaw.md).

---

## 4. Fluxo mínimo no n8n

1. **Workflow novo** (ex.: `whatsapp-inbound`).
2. **Webhook** POST — URL que colas na Z-API.
3. **Set** / **Code**: extrair telefone e texto (JSON Z-API varia; testa com uma mensagem real).
4. **HTTP Request** → URL `https://O-TEU-BACKEND/api/bot/openclaw/action`, header `Authorization: Bearer …`, body JSON com `phone`, `action`, `payload`.
5. **HTTP Request Z-API** `send-text` — resposta ao utilizador (ver `n8n-zapi-das-mei.md` como referência de envio).

O **telefone** no body deve bater com `n8n_link` (o backend tenta com/sem prefixo `55`).

### nó HTTP Request (resumo)

| Campo | Valor |
|-------|--------|
| **Method** | `POST` |
| **URL** | `https://O-TEU-BACKEND/api/bot/openclaw/action` |
| **Authentication** | `None` (segredo no header) |
| **Header** | `Authorization` → `Bearer SEU_SEGREDO` |
| **Header** | `Content-Type` → `application/json; charset=utf-8` |
| **Body** | JSON |

**Segredo:** usa **Credential** no n8n; não commits workflows com segredo em texto.

---

## 5. Inteligência (ler a frase)

O backend **não** interpreta linguagem natural sozinho. Usa nó **LLM** no n8n (ou outro) → JSON válido → HTTP Request para `/api/bot/openclaw/action`.

---

## 6. Segurança

1. Só `delete_transaction` após confirmação explícita.
2. Limita números (allowlist / `n8n_link`).
3. Nunca `OPENCLAW_WEBHOOK_SECRET` no GitHub.

---

## 7. Erro “Nenhum utilizador ligado a este telefone”

O utilizador abre a app, **mete o telefone no perfil** e guarda (`n8n_link`).

---

## 8. OpenClaw vs Z-API no **mesmo** número

Em geral **não** uses dois stacks (ex. sessão OpenClaw WhatsApp + Z-API) no mesmo número — conflito de sessão. Preferir **um** canal: ou OpenClaw (bridge próprio) ou Z-API → n8n → backend.

---

## 9. Testar antes de produção

1. Backend **staging** + `OPENCLAW_WEBHOOK_SECRET` só nesse ambiente.
2. Utilizador de teste com telefone real em `n8n_link`.
3. Workflows n8n apontam para URL de **teste**.
4. Produção: troca URL, segredo, política de quem pode falar.

---

## Referência cruzada

- Contrato + OpenClaw self-hosted: [`meu-financeiro-openclaw.md`](./meu-financeiro-openclaw.md)
- Env no código: `OPENCLAW_WEBHOOK_SECRET` em `Site/backend/src/config/env.js`
- DAS / PDF: `docs/ops/n8n-zapi-das-mei.md`
