# OpenClaw no Easypanel — sem Console (contentor parado)

Quando o **Console do Serviço** mostra `container is not running`, não dá para colar comandos dentro do contentor. Configura tudo pelo **painel Easypanel** e por um **comando de arranque** que corre sozinho cada vez que o serviço sobe.

## 1. Variáveis no Easypanel (serviço OpenClaw → Environment)

| Variável | Valor (exemplo) |
|----------|-----------------|
| `MF_API_URL` | `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action` |
| `OPENCLAW_WEBHOOK_SECRET` | **igual** ao backend |
| `OPENCLAW_PUBLIC_ORIGIN` | `https://auto-openclaw-gateway.4tnf3f.easypanel.host` |
| `OPENCLAW_STATE_DIR` | **Não definir** (usa `/home/node/.openclaw` no volume) |

**Não uses** `OPENCLAW_STATE_DIR=/tmp/...` se quiseres WhatsApp estável: o QR grava credenciais num sítio e o gateway pode ler noutro → painel mostra **Vinculado: Sim** mas **not linked** / **Em execução: Não**.

Mantém as que o template já tinha (API keys, Gateway Token, etc.). Confirma **volume persistente** montado em `/home/node/.openclaw`.

## 2. Comando de arranque (substitui o CMD default)

No serviço OpenClaw, procura **Command**, **Start command**, **Docker command** ou **Override command** (nome varia no Easypanel).

### Comando com fix de `agentRuntime` (contentor em crash loop)

Se os logs repetem `Config invalid` + `agentRuntime`, cola **uma linha** em **Implantar → Comando**:

```sh
sh -c 'printf "%s\n" "const fs=require(\"fs\");const p=\"/home/node/.openclaw/openclaw.json\";if(!fs.existsSync(p))process.exit(0);const c=JSON.parse(fs.readFileSync(p,\"utf8\"));const k=\"openai/gpt-4o-mini\";const m=c.agents&&c.agents.defaults&&c.agents.defaults.models&&c.agents.defaults.models[k];if(m&&m.agentRuntime){delete m.agentRuntime;fs.writeFileSync(p,JSON.stringify(c,null,2));console.log(\"[fix] agentRuntime removido\");}" > /tmp/fix-openclaw.js && node /tmp/fix-openclaw.js; chown -R node:node /home/node/.openclaw 2>/dev/null; exec node dist/index.js gateway --bind lan --port 18789 --allow-unconfigured'
```

Depois do deploy, nos **Logs** deve aparecer `[fix] agentRuntime removido` e `[gateway] ready` (sem `Config invalid`).

### Comando único recomendado (fix + `mf-curl` + `mf-das` + gateway)

Substitui o CMD por **esta** linha (cria scripts em `/home/node/.openclaw/workspace` a cada arranque):

```sh
sh -c 'printf "%s\n" "const fs=require(\"fs\");const p=\"/home/node/.openclaw/openclaw.json\";if(!fs.existsSync(p))process.exit(0);const c=JSON.parse(fs.readFileSync(p,\"utf8\"));const k=\"openai/gpt-4o-mini\";const m=c.agents&&c.agents.defaults&&c.agents.defaults.models&&c.agents.defaults.models[k];if(m&&m.agentRuntime){delete m.agentRuntime;fs.writeFileSync(p,JSON.stringify(c,null,2));console.log(\"[fix] agentRuntime removido\");}" > /tmp/fix-openclaw.js && node /tmp/fix-openclaw.js; chown -R node:node /home/node/.openclaw 2>/dev/null; WS=/home/node/.openclaw/workspace; mkdir -p "$WS"; test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || { echo ERRO env MF; exit 1; }; export WS MF_URL="$MF_API_URL" MF_SEC="$OPENCLAW_WEBHOOK_SECRET"; node -e "const fs=require(\"fs\"),path=require(\"path\"),d=process.env.WS,u=process.env.MF_URL,s=process.env.MF_SEC,curl=path.join(d,\"mf-curl.sh\");fs.writeFileSync(curl,\"#!/bin/sh\\nexec curl -sS -X POST \"+JSON.stringify(u)+\" -H \"+JSON.stringify(\"Content-Type: application/json; charset=utf-8\")+\" -H \"+JSON.stringify(\"Authorization: Bearer \"+s)+\" -d \\\"\\\\$1\\\"\\n\",{mode:0o755});const das=\"#!/bin/sh\\nset -e\\nMF_CURL=\"+JSON.stringify(curl)+\"\\nPHONE=\\\"${1:?phone}\\\"\\nMES=\\\"${2:?mes}\\\"\\nTMP=\\\"$(mktemp)\\\";trap \\\"rm -f $TMP\\\" EXIT\\n\\\"$MF_CURL\\\" \\\"{\\\\\\\"phone\\\\\\\":\\\\\\\"$PHONE\\\\\\\",\\\\\\\"action\\\\\\\":\\\\\\\"get_das_current\\\\\\\",\\\\\\\"payload\\\\\\\":{\\\\\\\"mes\\\\\\\":\\\\\\\"$MES\\\\\\\"}}\\\"\\\" > \\\"$TMP\\\"\\nnode -e \\\"const fs=require(\\\\\\\"fs\\\\\\\");const r=JSON.parse(fs.readFileSync(process.argv[1],\\\\\\\"utf8\\\\\\\"));if(!r.success){console.log(JSON.stringify(r));process.exit(1);}const x=r.data||{};if(!x.base64)process.exit(1);const fn=String(x.fileName||\\\\\\\"DAS.pdf\\\\\\\").replace(/[^a-zA-Z0-9._-]/g,\\\\\\\"_\\\\\\\");const p=\\\\\\\"/tmp/\\\\\\\"+fn;fs.writeFileSync(p,Buffer.from(x.base64,\\\\\\\"base64\\\\\\\"));console.log(JSON.stringify({success:true,mes:x.mes,file:p}));\\\" \\\"$TMP\\\"\\n\";fs.writeFileSync(path.join(d,\"mf-das.sh\"),das,{mode:0o755});fs.writeFileSync(path.join(d,\"MF-API.md\"),\"# MF\\n\"+curl+\"\\n\"+path.join(d,\"mf-das.sh\")+\" PHONE MM/YYYY\\n\");console.log(\"[mf] scripts OK\");"; ORIGIN="${OPENCLAW_PUBLIC_ORIGIN}"; CFG=/home/node/.openclaw/openclaw.json; node -e "const fs=require(\"fs\");const p=process.env.CFG,o=process.env.ORIGIN||\"\";let c={};try{c=JSON.parse(fs.readFileSync(p,\"utf8\"))}catch(e){}c.gateway=c.gateway||{};c.gateway.controlUi=c.gateway.controlUi||{};const set=new Set([...(c.gateway.controlUi.allowedOrigins||[]),\"http://localhost:18789\",\"http://127.0.0.1:18789\"]);if(o)set.add(o);c.gateway.controlUi.allowedOrigins=[...set];c.tools={exec:{host:\"gateway\",security:\"full\",ask:\"off\"},profile:\"coding\"};fs.writeFileSync(p,JSON.stringify(c,null,2));" CFG="$CFG" ORIGIN="$ORIGIN"; exec node dist/index.js gateway --bind lan --port 18789 --allow-unconfigured'
```

Versão legível: [`easypanel-openclaw-bootstrap.sh`](./easypanel-openclaw-bootstrap.sh).

### `mf-das.sh: not found` — instalar agora no Console

Com o serviço **Running**, cola **todo** o bloco abaixo (uma vez). Usa as env `MF_API_URL` e `OPENCLAW_WEBHOOK_SECRET` do Easypanel:

```sh
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"
test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || { echo ERRO: falta MF_API_URL ou OPENCLAW_WEBHOOK_SECRET; exit 1; }
export WS MF_URL="$MF_API_URL" MF_SEC="$OPENCLAW_WEBHOOK_SECRET"
node -e "const fs=require('fs'),path=require('path'),d=process.env.WS,u=process.env.MF_URL,s=process.env.MF_SEC,curl=path.join(d,'mf-curl.sh');fs.writeFileSync(curl,'#!/bin/sh\nexec curl -sS -X POST '+JSON.stringify(u)+' -H '+JSON.stringify('Content-Type: application/json; charset=utf-8')+' -H '+JSON.stringify('Authorization: Bearer '+s)+' -d \"\$1\"\n',{mode:0o755});const das='#!/bin/sh\nset -e\nMF_CURL='+JSON.stringify(curl)+'\nPHONE=\"${1:?phone}\"\nMES=\"${2:?MM/YYYY}\"\nTMP=\"$(mktemp)\";trap \"rm -f \"$TMP\"\" EXIT\n\"$MF_CURL\" \"{\\\"phone\\\":\\\"$PHONE\\\",\\\"action\\\":\\\"get_das_current\\\",\\\"payload\\\":{\\\"mes\\\":\\\"$MES\\\"}}\" > \"$TMP\"\nnode -e \"const fs=require(\\\"fs\\\");const r=JSON.parse(fs.readFileSync(process.argv[1],\\\"utf8\\\"));if(!r.success){console.log(JSON.stringify(r));process.exit(1);}const x=r.data||{};if(!x.base64)process.exit(1);const fn=String(x.fileName||\\\"DAS.pdf\\\").replace(/[^a-zA-Z0-9._-]/g,\\\"_\\\");const p=\\\"/tmp/\\\"+fn;fs.writeFileSync(p,Buffer.from(x.base64,\\\"base64\\\"));console.log(JSON.stringify({success:true,mes:x.mes,file:p}));\" \"$TMP\"\n';fs.writeFileSync(path.join(d,'mf-das.sh'),das,{mode:0o755});console.log('OK',curl,path.join(d,'mf-das.sh'));"
ls -la "$WS/mf-curl.sh" "$WS/mf-das.sh"
"$WS/mf-das.sh" 5521996185328 03/2026
```

Se a última linha devolver JSON com `"file":"/tmp/DAS-03-2026.pdf"`, está pronto. No WhatsApp: `/new` e pede o DAS outra vez.

Ficheiro equivalente no repo: [`easypanel-console-install-mf.sh`](./easypanel-console-install-mf.sh).

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

### Painel: Vinculado Sim + **not linked** + Em execução Não

Isto significa: ficheiros de sessão existem, mas o **listener** (socket Baileys) não está ativo no gateway.

| Check | Ação |
|-------|------|
| Estado no mesmo path | Remove `OPENCLAW_STATE_DIR` das env; volume em `/home/node/.openclaw` |
| Um só comando de arranque | Usa o comando **fix `agentRuntime`** (secção 2); **não** mistures com bootstrap que faz `export OPENCLAW_STATE_DIR=/tmp` |
| Religar no contentor | Com serviço **Running** → Console: `openclaw channels login --channel whatsapp` → espera QR → `openclaw channels status` |
| Plugin | Se logs disserem plugin bloqueado: em `openclaw.json`, `plugins.allow` deve incluir o plugin WhatsApp (ex. `@openclaw/whatsapp`) |
| Reinício | **Deploy/Restart** no Easypanel (não `gateway restart` no console) |

Objetivo no painel **Canais → WhatsApp**: **Vinculado Sim**, **Em execução Sim**, **Conectado Sim** (sem caixa vermelha `not linked`).

Se continuar após 2–3 minutos, no Console (com volume montado):

```sh
rm -rf /home/node/.openclaw/credentials/whatsapp
openclaw channels login --channel whatsapp
```

Depois **Deploy** de novo. Só apaga `credentials/whatsapp` se aceitares novo QR.

### Bot despejou base64 / JSON gigante ao pedir DAS

A API **funcionou** (`"message":"DAS encontrado"`), mas o agente mostrou `data.base64` no chat em vez de enviar PDF.

| Correção | Ação |
|----------|------|
| Scripts | Deploy com bootstrap que cria `mf-curl.sh` + **`mf-das.sh`** + `MF-API.md` (ver `easypanel-openclaw-bootstrap.sh`) |
| Agente | Deve correr `mf-das.sh 5521996185328 03/2026` e depois `openclaw message send --channel whatsapp --target … --media /tmp/DAS-….pdf` |
| Proibido | `curl` com `$MF_API_URL`, `fetch url`, ou responder com o JSON completo |

Se `mf-das.sh` não existir, segue a secção **`mf-das.sh: not found`** acima antes de testar.

```sh
ls -la /home/node/.openclaw/workspace/mf-das.sh
/home/node/.openclaw/workspace/mf-das.sh 5521996185328 03/2026
```

Deve imprimir uma linha JSON curta com `"file":"/tmp/DAS-03-2026.pdf"` — não centenas de KB de base64.

### Testar o bot (Meu Financeiro)

1. `/new` na conversa com o bot.
2. Pergunta: *"Quais são minhas categorias?"*
3. O agente deve usar `exec` com `/home/node/.openclaw/workspace/mf-curl.sh` (ou o path do teu `mf-curl.sh` no workspace).
4. DAS: *"Manda o DAS de 03/2026"* → deve receber **ficheiro PDF**, não texto base64.

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
