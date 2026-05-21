# OpenClaw no Easypanel — sem Console (contentor parado)

Quando o **Console do Serviço** mostra `container is not running`, não dá para colar comandos dentro do contentor. Configura tudo pelo **painel Easypanel** e por um **comando de arranque** que corre sozinho cada vez que o serviço sobe.

## 1. Variáveis no Easypanel (serviço OpenClaw → Environment)

| Variável | Valor (exemplo) |
|----------|-----------------|
| `MF_API_URL` | `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action` |
| `OPENCLAW_WEBHOOK_SECRET` | **igual** ao backend |
| `OPENCLAW_PUBLIC_ORIGIN` | `https://auto-openclaw-gateway.4tnf3f.easypanel.host` |
| `OPENCLAW_STATE_DIR` | `/tmp/openclaw-state` |

Mantém as que o template já tinha (API keys, Gateway Token, etc.).

## 2. Comando de arranque (substitui o CMD default)

No serviço OpenClaw, procura **Command**, **Start command**, **Docker command** ou **Override command** (nome varia no Easypanel).

Cola **uma linha** (ajusta o URL em `OPENCLAW_PUBLIC_ORIGIN` nas env, não aqui):

```sh
sh -c 'STATE="${OPENCLAW_STATE_DIR:-/tmp/openclaw-state}"; ORIGIN="${OPENCLAW_PUBLIC_ORIGIN}"; MF_URL="${MF_API_URL}"; MF_SEC="${OPENCLAW_WEBHOOK_SECRET}"; PORT="${OPENCLAW_GATEWAY_PORT:-18789}"; mkdir -p "$STATE/workspace"; test -n "$MF_URL" && test -n "$MF_SEC" || { echo ERRO env; exit 1; }; node -e "const fs=require(\"fs\"),p=require(\"path\"),d=p.join(process.env.STATE,\"workspace\"),u=process.env.MF_URL,s=process.env.MF_SEC;fs.writeFileSync(p.join(d,\"mf-curl.sh\"),\"#!/bin/sh\\nexec curl -sS -X POST \"+JSON.stringify(u)+\" -H \"+JSON.stringify(\"Content-Type: application/json; charset=utf-8\")+\" -H \"+JSON.stringify(\"Authorization: Bearer \"+s)+\" -d \\\"\\\\$1\\\"\\n\",{mode:0o755});fs.writeFileSync(p.join(d,\"MF-API.md\"),\"# Meu Financeiro\\nSEMPRE: \"+p.join(d,\"mf-curl.sh\")+\"\\n\");" STATE="$STATE" MF_URL="$MF_URL" MF_SEC="$MF_SEC"; node -e "const fs=require(\"fs\");const p=process.env.CFG;const o=process.env.ORIGIN||\"\";let c={};try{c=JSON.parse(fs.readFileSync(p,\"utf8\"))}catch(e){}c.gateway=c.gateway||{};c.gateway.controlUi=c.gateway.controlUi||{};const set=new Set([...(c.gateway.controlUi.allowedOrigins||[]),\"http://localhost:18789\",\"http://127.0.0.1:18789\"]);if(o)set.add(o);c.gateway.controlUi.allowedOrigins=[...set];c.gateway.trustedProxies=c.gateway.trustedProxies||[\"10.0.0.0/8\",\"172.16.0.0/12\"];c.tools={exec:{host:\"gateway\",security:\"full\",ask:\"off\"},profile:\"coding\"};fs.writeFileSync(p,JSON.stringify(c,null,2));" CFG="$STATE/openclaw.json" ORIGIN="$ORIGIN"; export OPENCLAW_STATE_DIR="$STATE"; exec openclaw gateway run --bind lan --port "$PORT"'
```

Versão legível (ficheiro no repo): [`easypanel-openclaw-bootstrap.sh`](./easypanel-openclaw-bootstrap.sh).

**Importante:** não corras `openclaw gateway restart` no console — isso pode matar o contentor. Usa só **Restart/Deploy** no painel.

## 3. Deploy

1. **Save** nas env + command.
2. **Deploy** ou **Restart**.
3. Espera o serviço ficar **Running** (verde) 30–60 s.
4. Abre **Logs** — deve aparecer `[gateway] ready` e, se o bootstrap correu, sem `origin not allowed` ao abrir o dashboard.

## 4. Abrir o dashboard

URL: `https://auto-openclaw-gateway.4tnf3f.easypanel.host` (o teu domínio Easypanel).

Se ainda aparecer `origin not allowed`, confirma que `OPENCLAW_PUBLIC_ORIGIN` é **exatamente** o `https://...` da barra do browser (sem barra no fim).

## 5. WhatsApp

1. `/new` na conversa com o bot.
2. Pergunta: *"Quais são minhas categorias?"*
3. O agente deve usar `exec` com `/tmp/openclaw-state/workspace/mf-curl.sh`.

## 6. Se o contentor continuar a cair

| Tentativa | O quê |
|-----------|--------|
| A | Imagem Docker tag **`2026.4.14`** (evita bug `EPERM chmod` da 2026.5.12) |
| B | Imagem **`2026.5.19`** (update no log; pode incluir fix) |
| C | WhatsApp via **n8n** → `POST /api/bot/openclaw/action` — ver [`whatsapp-n8n-openclaw-backend.md`](./whatsapp-n8n-openclaw-backend.md) |

## 7. Console só quando estiver Running

O erro `container is not running` é normal **durante** restart. Abre o console **só** com status verde; se fechar de novo, lê **Logs** e envia as últimas linhas (sem segredos).

## Backend Meu Financeiro

O backend está OK se, noutra máquina, funcionar:

```bash
cd Site/backend && npm run test:openclaw:salario -- 5521996185328
```

O problema atual é **só** o contentor OpenClaw no Easypanel, não a API.
