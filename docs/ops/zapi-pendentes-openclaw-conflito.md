# `/pendentes` e o OpenClaw responde DAS — como corrigir

Se enviaste **`/pendentes`** e o **Midas** falou de **DAS MEI** ou transações, a mensagem **chegou ao OpenClaw por outro caminho** (ou o backend em produção ainda é antigo).

## Como deve funcionar

```
WhatsApp → Z-API → POST backend /api/webhooks/zapi/inbound
                        ├─ /pendentes → backend responde (cadastros)
                        └─ outras msgs → relay → OpenClaw (DAS, NFSe, …)
```

O OpenClaw **não** deve ver `/pendentes`, `PENDENTES`, `/aprovar`, etc.

## 1. Confirmar deploy do backend (2 min)

No browser ou terminal:

```text
GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/webhooks/zapi/monitor
```

Tem de aparecer:

```json
"inboundBridgeVersion": 2
```

Se **não** existir esse campo → **redeploy/restart** do backend no Easypanel (o código novo ainda não está em produção).

## 2. Z-API — webhook “ao receber”

No painel Z-API, URL de recebimento:

```text
https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/webhooks/zapi/inbound?token=SEU_ZAPI_WEBHOOK_TOKEN
```

- `ZAPI_WEBHOOK_TOKEN` no Easypanel = mesmo token na URL.
- **Não** uses só o webhook do n8n para mensagens gerais se quiseres `/pendentes` no backend.

## 3. Caminho duplo (causa mais comum)

Se o **mesmo número** tiver:

| Caminho | Efeito |
|---------|--------|
| OpenClaw **WhatsApp directo** (`channels.whatsapp` no `openclaw.json`) | OpenClaw vê **tudo**, incluindo `/pendentes` |
| n8n recebe Z-API e manda ao OpenClaw | Igual — OpenClaw responde DAS |

**Escolhe um:**

- **Recomendado:** Z-API → **só backend** → relay OpenClaw só para mensagens normais. **Desliga** o canal WhatsApp nativo do OpenClaw no mesmo número.
- **Ou:** mantém OpenClaw directo e **não** uses comandos `/pendentes` pelo WhatsApp (só app).

Para desligar WhatsApp no OpenClaw (console do contentor):

- Edita `~/.openclaw/openclaw.json` e remove/desactiva `channels.whatsapp`, **ou**
- Usa outro número só para o bot financeiro.

## 4. Teste após deploy

1. Envia `/pendentes` no WhatsApp.
2. Logs do backend (Easypanel): deve aparecer  
   `[ZAPI] openclaw relay ignorado: slash_reserved` (ou `access_management_command`).
3. Resposta esperada: lista de **solicitações de cadastro**, não DAS.

Se o Midas **ainda** responder e o log **não** aparecer → a mensagem **não passou** pelo backend (passo 3).

## 5. n8n (se usares webhook DAS para entrada)

No fluxo que recebe mensagens Z-API, **antes** do OpenClaw:

- **IF** texto começa com `/` **OU** é `pendentes` / `aprovar` / `rejeitar` (case insensitive)  
  → **não** encaminhar ao OpenClaw; opcional: HTTP POST ao backend inbound (mesma URL do passo 2).

---

**Resumo:** deploy com `inboundBridgeVersion: 2` + **uma única entrada** de mensagens (backend) + sem WhatsApp duplicado no OpenClaw.
