# Cadastros no WhatsApp vs OpenClaw (DAS)

O OpenClaw trata mensagens com **`/`** como comandos dele (`/new`, etc.). **Não uses `/pendentes`.**

## Comando certo (copiar)

```text
mf pendentes
mf aprovar email@exemplo.com
mf rejeitar email@exemplo.com
```

Se o **Midas** ainda falou de **DAS** ao enviar isso, a mensagem **não passou pelo backend** (caminho duplo WhatsApp).

## Como deve funcionar

```
WhatsApp → Z-API → POST backend /api/webhooks/zapi/inbound
                        ├─ MF CADASTRO … → backend responde (cadastros)
                        └─ outras msgs → relay → OpenClaw (DAS, NFSe, …)
```

O OpenClaw **não** deve ver `MF CADASTRO …` (e o relay ignora isso no backend).

## 1. Confirmar deploy do backend (2 min)

No browser ou terminal:

```text
GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/webhooks/zapi/monitor
```

Tem de aparecer:

```json
"inboundBridgeVersion": 4
```

Se **não** existir esse campo → **redeploy/restart** do backend no Easypanel (o código novo ainda não está em produção).

## Silêncio total (OpenClaw e Z-API não respondem)

Isso quase sempre significa: a mensagem **não chegou** ao backend.

| O que funciona | O que falta |
|--------------|-------------|
| Aviso de nova solicitação (envio **saída** Z-API) | Webhook **entrada** “ao receber” → backend |

Confere no monitor:

```text
GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/webhooks/zapi/monitor
```

Precisas de `"zapiInboundReady": true` (token + outbound + access notify).

`npm run dev` no PC **não** recebe mensagens da Z-API em produção — só o backend no Easypanel.

---

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

1. Envia `mf pendentes` no WhatsApp (não `/pendentes`).
2. Logs do backend (Easypanel): deve aparecer  
   `[ZAPI] openclaw relay ignorado: mf_access_command`.
3. Resposta esperada: lista de **solicitações de cadastro**, não DAS.

Se o Midas **ainda** responder e o log **não** aparecer → a mensagem **não passou** pelo backend (passo 3).

## 5. n8n (se usares webhook DAS para entrada)

No fluxo que recebe mensagens Z-API, **antes** do OpenClaw:

- **IF** texto começa com `/` **OU** é `pendentes` / `aprovar` / `rejeitar` (case insensitive)  
  → **não** encaminhar ao OpenClaw; opcional: HTTP POST ao backend inbound (mesma URL do passo 2).

---

**Resumo:** deploy com `inboundBridgeVersion: 2` + **uma única entrada** de mensagens (backend) + sem WhatsApp duplicado no OpenClaw.
