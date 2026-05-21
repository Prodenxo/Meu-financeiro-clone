#!/bin/sh
# Bootstrap OpenClaw no Easypanel SEM depender do Console (corre no arranque do contentor).
# Cola o conteúdo no campo "Command" / "Start command" do serviço OU monta este ficheiro e chama-o.
#
# Variáveis obrigatórias no Easypanel → Environment:
#   MF_API_URL=https://.../api/bot/openclaw/action
#   OPENCLAW_WEBHOOK_SECRET=...
#   OPENCLAW_PUBLIC_ORIGIN=https://auto-openclaw-gateway....easypanel.host
#
# Recomendado:
#   OPENCLAW_STATE_DIR=/tmp/openclaw-state
#
# Opcional:
#   OPENCLAW_GATEWAY_PORT=18789

set -e

STATE="${OPENCLAW_STATE_DIR:-/tmp/openclaw-state}"
ORIGIN="${OPENCLAW_PUBLIC_ORIGIN:-}"
MF_URL="${MF_API_URL:-}"
MF_SECRET="${OPENCLAW_WEBHOOK_SECRET:-}"
PORT="${OPENCLAW_GATEWAY_PORT:-18789}"

mkdir -p "$STATE/workspace"

if [ -z "$MF_URL" ] || [ -z "$MF_SECRET" ]; then
  echo "[mf-bootstrap] ERRO: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Easypanel"
  exit 1
fi

# mf-curl.sh com URL e token fixos (exec do agente não herda env)
node -e "
const fs = require('fs');
const path = require('path');
const dir = path.join(process.env.STATE, 'workspace');
const url = process.env.MF_URL;
const sec = process.env.MF_SECRET;
const sh = '#!/bin/sh\n'
  + 'exec curl -sS -X POST ' + JSON.stringify(url)
  + ' -H ' + JSON.stringify('Content-Type: application/json; charset=utf-8')
  + ' -H ' + JSON.stringify('Authorization: Bearer ' + sec)
  + ' -d \"\$1\"\n';
fs.writeFileSync(path.join(dir, 'mf-curl.sh'), sh, { mode: 0o755 });
fs.writeFileSync(path.join(dir, 'MF-API.md'),
  '# Meu Financeiro\n'
  + 'SEMPRE: ' + path.join(dir, 'mf-curl.sh') + ' {\"phone\":\"55...\",\"action\":\"...\"}\n'
  + 'NUNCA curl com \$MF_API_URL. NUNCA fetch url.\n'
);
" STATE="$STATE" MF_URL="$MF_URL" MF_SECRET="$MF_SECRET"

CFG="$STATE/openclaw.json"
node -e "
const fs = require('fs');
const cfgPath = process.env.CFG;
const origin = process.env.ORIGIN || '';
let c = {};
try { c = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) {}
c.gateway = c.gateway || {};
c.gateway.controlUi = c.gateway.controlUi || {};
const origins = new Set([
  ...(c.gateway.controlUi.allowedOrigins || []),
  'http://localhost:18789',
  'http://127.0.0.1:18789',
]);
if (origin) origins.add(origin);
c.gateway.controlUi.allowedOrigins = [...origins];
c.gateway.trustedProxies = c.gateway.trustedProxies || ['10.0.0.0/8', '172.16.0.0/12'];
c.tools = c.tools || {};
c.tools.exec = { host: 'gateway', security: 'full', ask: 'off' };
c.tools.profile = 'coding';
fs.writeFileSync(cfgPath, JSON.stringify(c, null, 2));
console.log('[mf-bootstrap] config:', cfgPath);
console.log('[mf-bootstrap] allowedOrigins:', c.gateway.controlUi.allowedOrigins);
" CFG="$CFG" ORIGIN="$ORIGIN"

echo "[mf-bootstrap] ping test..."
"$STATE/workspace/mf-curl.sh" '{"action":"ping"}' || echo "[mf-bootstrap] aviso: ping falhou (backend pode estar offline)"

echo "[mf-bootstrap] a iniciar gateway na porta $PORT..."
export OPENCLAW_STATE_DIR="$STATE"
exec openclaw gateway run --bind lan --port "$PORT"
