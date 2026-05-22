# OpenClaw no Easypanel — sem Console (contentor parado)

Quando o **Console do Serviço** mostra `container is not running`, não dá para colar comandos dentro do contentor. Configura tudo pelo **painel Easypanel** e por um **comando de arranque** que corre sozinho cada vez que o serviço sobe.

## Backend Site: `Validar` / `Criar guia` → 404

No repo actual existem `POST /api/mei-guide` e `POST /api/mei-guide/validate`. **404** na app = serviço **auto-back-meufinanceiro-site** com imagem antiga → **Redeploy** (Dockerfile.backend).

Confirma no browser: `GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/`

- **OK:** JSON com `"apiVersion": 2` e `"routes": { "meiGuide": "/api/mei-guide", ... }`
- **Antigo:** só `{ "status": "ok", "service": "backend" }` → falta redeploy

`POST .../api/mei-guide/validate` sem token deve dar **401**, não **404**.

Após redeploy: **Validar / Criar guia / Baixar** precisam das rotas `POST/GET /api/mei-guide*` (redeploy). Problema de PDF de **outra pessoa no WhatsApp** = telefone errado no `mf-das-send.sh` (ver secção DAS com nome errado).

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

**Variáveis:** só no Easypanel → serviço OpenClaw → **Environment** (`MF_API_URL`, `OPENCLAW_WEBHOOK_SECRET`). Depois **Restart**. No Console: `echo $MF_API_URL` tem de mostrar URL (não vazio).

Com o serviço **Running**, cola **todo** o bloco (evita o `node -e` gigante — quebra aspas e gera `/bin/sh: 1: phone`):

```sh
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

# 1) mf-curl (se ainda não existir)
if [ ! -x "$WS/mf-curl.sh" ]; then
  test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || { echo ERRO: falta MF_API_URL ou OPENCLAW_WEBHOOK_SECRET no Easypanel Environment; exit 1; }
  printf '%s\n' '#!/bin/sh' "exec curl -sS -X POST '$MF_API_URL' \\" \
    "-H 'Content-Type: application/json; charset=utf-8' \\" \
    "-H 'Authorization: Bearer $OPENCLAW_WEBHOOK_SECRET' \\" \
    '-d "$1"' > "$WS/mf-curl.sh"
  chmod +x "$WS/mf-curl.sh"
fi

# 2) parser PDF (ficheiro separado — sem aspas aninhadas)
cat > "$WS/mf-das-parse.js" << 'NODE_EOF'
const fs = require('fs');
const raw = fs.readFileSync(process.argv[1], 'utf8');
let r;
try { r = JSON.parse(raw); } catch (e) {
  console.error(raw.slice(0, 500));
  process.exit(1);
}
if (!r.success) {
  console.log(raw);
  process.exit(1);
}
const x = r.data || {};
if (!x.base64) {
  console.log(JSON.stringify({
    success: false,
    message: x.includeBase64 === false ? 'API sem base64 (falta includeBase64:true no mf-das.js)' : 'sem PDF na API',
    apiMessage: r.message,
    hint: x.execCommand || 'use mf-send-das.sh',
  }));
  process.exit(1);
}
const fn = String(x.fileName || 'DAS.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(x.base64, 'base64'));
console.log(JSON.stringify({ success: true, mes: x.mes, fileName: fn, file: p }));
NODE_EOF

# 3) mf-das.js (um ficheiro só — evita mf-das.sh corrompido)
cat > "$WS/mf-das.js" << 'NODE_EOF'
#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const phone = process.argv[2];
const mes = process.argv[3];
if (!phone || !mes) {
  console.error('uso: node mf-das.js 5521996185328 03/2026');
  process.exit(1);
}
const curl = path.join(dir, 'mf-curl.sh');
const body = JSON.stringify({ phone, action: 'get_das_current', payload: { mes, includeBase64: true } });
const raw = execFileSync(curl, [body], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let r;
try { r = JSON.parse(raw); } catch (e) {
  console.error(raw.slice(0, 500));
  process.exit(1);
}
if (!r.success) {
  console.log(raw);
  process.exit(1);
}
const x = r.data || {};
if (!x.base64) {
  console.log(JSON.stringify({
    success: false,
    message: x.includeBase64 === false ? 'API sem base64 (falta includeBase64:true no mf-das.js)' : 'sem PDF na API',
    apiMessage: r.message,
    hint: x.execCommand || 'use mf-send-das.sh',
  }));
  process.exit(1);
}
const fn = String(x.fileName || 'DAS.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(x.base64, 'base64'));
console.log(JSON.stringify({ success: true, mes: x.mes, fileName: fn, file: p }));
NODE_EOF
printf '#!/bin/sh\nexec node "%s/mf-das.js" "$@"\n' "$WS" > "$WS/mf-das.sh"
chmod +x "$WS/mf-das.js" "$WS/mf-das.sh"
rm -f "$WS/mf-das-parse.js"

ls -la "$WS/mf-curl.sh" "$WS/mf-das.sh" "$WS/mf-das.js"
head -n 3 "$WS/mf-das.sh"

# Uma linha por comando (Enter entre cada uma):
"$WS/mf-das.sh" 5521996185328 03/2026
"$WS/mf-das.sh" 5521996185328 04/2026
```

Se a última linha devolver JSON com `"file":"/tmp/DAS-03-2026.pdf"`, está pronto. No WhatsApp: `/new` e pede o DAS outra vez.

### `{"success":false,"message":"sem PDF"}` ao correr `mf-das.sh`

O backend em produção **já não manda base64** em `get_das_current` **sem** `"includeBase64":true`. O `mf-das.js` antigo no contentor pedia só `{ mes }` → a API responde OK mas **sem PDF** → o script diz `sem PDF` e **nada vai para o WhatsApp**.

**Correção rápida no Console (serviço OpenClaw):**

```sh
WS=/home/node/.openclaw/workspace
sed -i 's/payload: { mes }/payload: { mes, includeBase64: true }/' "$WS/mf-das.js"
grep includeBase64 "$WS/mf-das.js"
"$WS/mf-das.sh" 5521996185328 03/2026
"$WS/mf-das-send.sh" 5521996185328 03/2026
```

A segunda linha deve imprimir `{"success":true,...,"file":"/tmp/DAS-03-2026.pdf"}` e a terceira deve **entregar o PDF no WhatsApp**.

**Diagnóstico (primeiros 400 caracteres da API):**

```sh
"$WS/mf-curl.sh" '{"phone":"5521996185328","action":"get_das_current","payload":{"mes":"03/2026","includeBase64":true}}' | head -c 400
```

Se com `includeBase64:true` ainda falhar, o DAS não está na base para essa competência/utilizador (mensagem da API tipo *Nenhum DAS encontrado*).

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
| Agente | **Uma linha:** `mf-send-das.sh 5521996185328 03/2026` (tenta `send_das_whatsapp` no backend; se não houver n8n, usa `openclaw message send --media`) |
| Proibido | `curl` com `$MF_API_URL`, `fetch url`, `[[MEDIA:]]`, texto com nome do PDF, ou `get_das_current` via `mf-curl` |

Se `mf-das.sh` não existir, segue a secção **`mf-das.sh: not found`** acima antes de testar.

```sh
ls -la /home/node/.openclaw/workspace/mf-das.sh
/home/node/.openclaw/workspace/mf-das.sh 5521996185328 03/2026
```

Deve imprimir uma linha JSON curta com `"file":"/tmp/DAS-03-2026.pdf"` — não centenas de KB de base64.

### Período **Não Optante** (empresa aberta depois — ex. abertura em março/2026)

No PGMEI, meses anteriores à abertura aparecem como **Não Optante** (não há DAS válido). O backend passa a:

- Bloquear **Criar Guia**, **download** e **WhatsApp** com código `MEI_DAS_PERIODO_INDISPONIVEL` (mensagem SERPRO MSG_23008).
- Mostrar status **Indisponível** no histórico (não marcar como “pago”).
- **Não gravar** PDF aleatório de outra pessoa nesses meses.

Use DAS apenas a partir da primeira competência em que a empresa era MEI optante (ex.: **03/2026**).

### PDF com **nome de outra pessoa** mas `dasAccount` certo (ex. Fernando no JSON, Rodrigo no PDF)

O JSON mostra **a tua conta** (`dasAccount.displayName`); o **ficheiro** em `DAS_mei` para esse mês foi gravado errado (PDF de outra pessoa). O WhatsApp manda esse ficheiro — por isso o nome dentro do PDF não bate com o JSON.

**Corrigir no Console (após deploy com `refresh_das_pdf`):**

```sh
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"5521996185328","action":"refresh_das_pdf","payload":{"mes":"02/2026"}}'
/home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 02/2026
```

**Download 400 depois de apagar no Supabase:** o mês continua **“Pago”** na app, mas sem linha em `DAS_mei` o backend antigo respondia *“Período já consta como pago”*. Com o fix em `downloadGuide`, o **Baixar guia** volta a chamar a SERPRO e gravar o PDF de novo (precisa **deploy** do backend Site).

**Ou no Supabase** (apaga só fevereiro/2026 do teu `user_id`, depois gera de novo na app com Validar/Criar guia):

```sql
DELETE FROM "DAS_mei"
WHERE user_id = '5004fbfd-9b15-4a67-b16d-d2939a5a8df4'
  AND periodo_apuracao >= '2026-02-01' AND periodo_apuracao < '2026-03-01';
```

### DAS com **nome de outra pessoa** (ex. pediu o seu e veio “Rodrigo”)

| Causa | Correção |
|-------|----------|
| Agente usou **telefone de exemplo** (`5521996185328`) em vez do remetente do chat | No `exec` e no JSON, `phone` = número **de quem escreveu** (vês no painel OpenClaw). |
| Admin pediu DAS de colaborador sem `subjectPhone` explícito | Utilizador comum: só o próprio telefone. Admin: `subjectPhone` só após `resolve_user` e mesma empresa. |
| Backend antigo sem `dasAccount` | Faz **deploy** do backend; a API passa a devolver `dasAccount.displayName` — o bot deve confirmar antes de enviar. |

Teste no Console (troca pelo telefone **do remetente**):

```sh
# Obrigatório na MESMA sessão do console (senão dá /mf-curl.sh: not found)
WS=/home/node/.openclaw/workspace
test -x "$WS/mf-das-send.sh" || echo "ERRO: scripts em falta — cola openclaw-console-fix-das-agent.sh do PC (ver abaixo)"

# Troca 5521999999999 pelo teu número real (DDI 55, sem + e sem "SEU_")
"$WS/mf-curl.sh" '{"phone":"5521999999999","action":"resolve_user"}'
"$WS/mf-curl.sh" '{"phone":"5521999999999","action":"get_das_current","payload":{"mes":"02/2026","includeBase64":true}}'
```

Ou **sem variável** (copia/cola seguro):

```sh
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"5521999999999","action":"get_das_current","payload":{"mes":"02/2026","includeBase64":true}}'
```

| Erro no console | Causa |
|-----------------|--------|
| `/mf-curl.sh: not found` | `$WS` vazio — falta `WS=/home/node/.openclaw/workspace` **antes** do comando |
| `Instala scripts: openclaw-console-fix-das-agent.sh` | `mf-curl.sh` **não existe** no volume — instalação abaixo |

### Instalar `mf-curl.sh` e restantes scripts (Console OpenClaw)

**1.** Easypanel → serviço **OpenClaw** → **Environment** → confirma e **Restart**:

- `MF_API_URL` = URL do backend, ex. `https://auto-back-meufinanceiro-site....easypanel.host/api/bot/openclaw/action`
- `OPENCLAW_WEBHOOK_SECRET` = mesmo valor do backend

**2.** No Console, verifica se as variáveis chegaram ao contentor:

```sh
echo "URL=${MF_API_URL:-VAZIO}"
echo "SECRET=${OPENCLAW_WEBHOOK_SECRET:+definido}"
```

Se `VAZIO`, corrige no Easypanel e **Restart** antes de continuar.

**3.** Instalação mínima (só `mf-curl` — sem heredoc):

```sh
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"
printf '%s\n' '#!/bin/sh' "exec curl -sS -X POST '$MF_API_URL' \\" \
  "-H 'Content-Type: application/json; charset=utf-8' \\" \
  "-H 'Authorization: Bearer $OPENCLAW_WEBHOOK_SECRET' \\" \
  '-d "$1"' > "$WS/mf-curl.sh"
chmod +x "$WS/mf-curl.sh"
ls -la "$WS/mf-curl.sh"
```

**4.** Instalação completa (`mf-das.sh`, `mf-das-send.sh`, `DAS-WHATSAPP.md`): abre no PC o ficheiro `Site/docs/ops/openclaw-console-fix-das-agent.sh`, **copia tudo**, cola no Console **de uma vez** e Enter. No fim deve listar `mf-curl.sh mf-das.sh mf-das-send.sh`.

**5.** Teste — **qual é o MEU número?**

No painel OpenClaw, ao receberes uma mensagem no WhatsApp, vês algo como `Nome (+5521999999999)`. Esse `5521999999999` (sem `+`) é o que vais usar em **todos** os comandos — não o número do exemplo do script de instalação.

```sh
# 1) Quem é este telefone na app?
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"COLOCA_AQUI_O_TEU_55","action":"resolve_user"}'

# 2) DAS de fevereiro/2026 — confere dasAccount antes de enviar
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"COLOCA_AQUI_O_TEU_55","action":"get_das_current","payload":{"mes":"02/2026","includeBase64":true}}'
```

Se `resolve_user` disser **Rodrigo** mas tu és outra pessoa → o telefone no WhatsApp está ligado à conta errada em `n8n_link` (corrige no app/perfil ou pede ao admin).

Se `resolve_user` disser **o teu nome** mas o PDF aberto ainda for do Rodrigo → o ficheiro guardado em `DAS_mei` para **02/2026** está errado; gera de novo o DAS desse mês na app (ou suporte).

Se aparecer `column profiles.display_name does not exist`, o backend em produção está desatualizado — faz deploy da versão que lê o nome em `auth.users` (metadata), não em `profiles`.

Confirma `dasAccount.displayName` na resposta antes de `mf-das-send.sh`.

### Bot diz *“enviado com sucesso”* mas **PDF não chega** no WhatsApp

| Causa frequente | O que ver no painel |
|-----------------|---------------------|
| Agente correu **só** `mf-das.sh` ou `get_das_current` | Exec com **~16k tokens** ou `curl` — PDF fica na API/`/tmp`, **não** vai ao WhatsApp |
| Agente **não** leu `DAS-WHATSAPP.md` / `SOUL.md` | Responde texto bonito **sem** `"whatsapp":"sent"` no output do exec |
| `mf-send-das.sh` antigo | Tentava `send_das_whatsapp` e saía sem fallback; use versão nova (= `exec mf-das-send.sh`) |

**No Console (OpenClaw)** — se o heredoc partiu o terminal (`EOF$ > > >` ou path `/home/nod$ e/`), usa o script único do repo (cola **de uma vez** ou `wget`+`sh`):

```sh
# Opção A: colar o conteúdo de Site/docs/ops/openclaw-console-fix-das-agent.sh no console
# Opção B: uma linha por vez (sem heredoc aninhado):
WS=/home/node/.openclaw/workspace
printf '%s\n' 'DAS: só exec /home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 MM/YYYY' 'Proibido: curl, get_das_current, só mf-das.sh.' 'Só diga enviado se JSON tiver "whatsapp":"sent".' > "$WS/DAS-WHATSAPP.md"
printf '%s\n' 'DAS: /home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 03/2026' 'Confirmar só com "whatsapp":"sent".' > "$WS/MF-API.md"
printf '#!/bin/sh\nset -e\nWS="$(cd "$(dirname "$0")" && pwd)"\nexec "$WS/mf-das-send.sh" "$@"\n' > "$WS/mf-send-das.sh"
chmod +x "$WS/mf-send-das.sh"
cat "$WS/DAS-WHATSAPP.md"
```

Copia também `openclaw-midas-SOUL.md` → `$WS/SOUL.md` (secção DAS). WhatsApp: **`/new`**, pede o DAS, abre os **2 Exec** e confirma que o comando é `mf-das-send.sh` ou `mf-send-das.sh`.

### Agente diz “DAS gerado” mas **não manda PDF**

| O que o log mostra | O que acontece |
|--------------------|----------------|
| `Exec` com `curl … $MF_API_URL` + `get_das_current` | Variáveis `$MF_*` no `exec` costumam estar **vazias**; mesmo quando a API responde, o JSON traz **base64 gigante** — o modelo **não** corre `openclaw message send --media` e só escreve texto. |
| Resposta com `"message":"DAS encontrado"` + base64 | PDF **existe na API**, mas **não foi enviado** no WhatsApp. |

**Correção:** deploy do backend novo (`get_das_current` **sem** `includeBase64` por defeito) + no Console instalar `mf-send-das.sh` + no WhatsApp `/new` + pedir de novo. O agente deve fazer **só**:

```sh
/home/node/.openclaw/workspace/mf-send-das.sh 5521996185328 03/2026
```

**Segurança:** se o log do painel mostrou o `Bearer` completo, **roda** `OPENCLAW_WEBHOOK_SECRET` no backend e no Easypanel.

### Agente: `couldn't generate a response` ao pedir DAS

Mensagem do OpenClaw: *"agent couldn't generate a response. Some tool actions may have already been executed"*.

| Causa | O que fazer |
|-------|-------------|
| **Saída gigante no `exec`** | Agente usou `mf-curl` + `get_das_current` (base64) → estoura o modelo. **Proibido.** Usar só `mf-das.sh` ou `mf-das-send.sh`. |
| **WhatsApp desligado** | `message send` falha; ferramenta correu mas o modelo não gera texto. Confirma **Conectado: Sim** no painel. |
| **Sessão poluída** | No WhatsApp: **`/new`** e pede de novo. |
| **PDF já enviado** | Verifica o chat — a nota diz que tools **podem** ter corrido antes do erro. |

**Script recomendado para o agente** (uma linha, saída mínima — instala no Console):

```sh
WS=/home/node/.openclaw/workspace
cat > "$WS/mf-das-send.sh" << 'SEND_EOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone}"
MES="${2:?mes}"
TARGET="${3:-$PHONE}"
OUT="$("$WS/mf-das.sh" "$PHONE" "$MES")"
FILE="$(echo "$OUT" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).file")"
openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "DAS $MES"
echo "{\"success\":true,\"mes\":\"$MES\",\"file\":\"$FILE\"}"
SEND_EOF
chmod +x "$WS/mf-das-send.sh"
```

Atualiza `MF-API.md`:

```sh
cat > /home/node/.openclaw/workspace/MF-API.md << 'EOF'
# Meu Financeiro — OBRIGATÓRIO

## DAS = ficheiro PDF no WhatsApp (não texto com nome do ficheiro)
PROIBIDO responder: "DAS-03-2026.pdf", "segue em anexo", `[[MEDIA: DAS-04-2026.pdf]]`, ou linha `MEDIA:/tmp/...` no texto.
No WhatsApp do OpenClaw, **MEDIA: / [[MEDIA:]] na resposta do agente NÃO envia ficheiro** (bug conhecido). Só `exec` + script.
OBRIGATÓRIO: exec para CADA mês pedido (MM/YYYY que o utilizador disse):
  /home/node/.openclaw/workspace/mf-send-das.sh 5521996185328 04/2026
(`mf-send-das.sh` tenta `send_das_whatsapp` no backend; se `skipped_no_webhook`, chama `mf-das-send.sh` automaticamente.)
Pediu abril → 04/2026. Pediu março → 03/2026. Dois meses → duas linhas exec.
Só confirmar envio depois de `success:true` no JSON do script.

## Outras ações
  /home/node/.openclaw/workspace/mf-curl.sh '{"phone":"5521...","action":"..."}'

NUNCA: curl $MF_API_URL, fetch url, get_das_current via mf-curl, base64 no chat.
EOF
```

Teste manual:

```sh
/home/node/.openclaw/workspace/mf-das-send.sh 5521996185328 03/2026
```

### Testar o bot (Meu Financeiro)

1. **`/new`** na conversa (obrigatório após erro).
2. Pergunta: *"Envia o DAS de 03/2026 e 04/2026"*.
3. O agente deve correr **só** `mf-send-das.sh` (duas vezes), **não** `get_das_current` via `mf-curl`.
4. Deves receber **PDF no WhatsApp**, não JSON nem base64.

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
