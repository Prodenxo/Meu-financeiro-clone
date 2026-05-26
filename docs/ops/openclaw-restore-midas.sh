#!/bin/sh
# Restaura integração Meu Financeiro no OpenClaw (Easypanel / VPS).
# Uso: defina MF_API_URL e OPENCLAW_WEBHOOK_SECRET no ambiente, depois:
#   sh openclaw-restore-midas.sh
#   sh openclaw-restore-midas.sh 5521999999999   # opcional: testa resolve_user

set -e
OC="${HOME}/.openclaw"
WS="${OC}/workspace"
MF_URL="${MF_API_URL:?Defina MF_API_URL}"
MF_SECRET="${OPENCLAW_WEBHOOK_SECRET:?Defina OPENCLAW_WEBHOOK_SECRET}"

mkdir -p "$WS"
cp -f "$WS/SOUL.md" "$WS/SOUL.md.bak-restore-$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

cat > "${OC}/mf-curl.sh" << EOF
#!/bin/sh
exec curl -sS -X POST '${MF_URL}' \\
  -H 'Content-Type: application/json; charset=utf-8' \\
  -H 'Authorization: Bearer ${MF_SECRET}' \\
  -d "\$1"
EOF
chmod 700 "${OC}/mf-curl.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/openclaw-mf-das.sh" ]; then
  sed "s|\${MF_CURL:-\$DIR/mf-curl.sh}|${OC}/mf-curl.sh|" "${SCRIPT_DIR}/openclaw-mf-das.sh" > "${WS}/mf-das.sh"
  chmod 755 "${WS}/mf-das.sh"
fi
if [ -f "${SCRIPT_DIR}/openclaw-mf-nfse.sh" ]; then
  sed "s|\${MF_CURL:-\$DIR/mf-curl.sh}|${OC}/mf-curl.sh|" "${SCRIPT_DIR}/openclaw-mf-nfse.sh" > "${WS}/mf-nfse.sh"
  chmod 755 "${WS}/mf-nfse.sh"
fi
if [ -f "${SCRIPT_DIR}/openclaw-mf-nfse-send.sh" ]; then
  cp -f "${SCRIPT_DIR}/openclaw-mf-nfse-send.sh" "${WS}/mf-nfse-send.sh"
  chmod 755 "${WS}/mf-nfse-send.sh"
fi
if [ -f "${SCRIPT_DIR}/openclaw-mf-send-nfse.sh" ]; then
  cp -f "${SCRIPT_DIR}/openclaw-mf-send-nfse.sh" "${WS}/mf-send-nfse.sh"
  chmod 755 "${WS}/mf-send-nfse.sh"
fi

cat > "${WS}/MF-API.md" << 'EOF'
# Meu Financeiro — OBRIGATÓRIO (ler antes de qualquer tool)

Para dados da app (cargo, categorias, lançamentos, DAS):

1. Usa **exec** com: `~/.openclaw/mf-curl.sh '{"phone":"55...","action":"..."}'`
2. JSON numa linha. `phone` = só dígitos do WhatsApp cadastrado na app (55 + DDD + número).
3. **Nunca** GET /api/categories, /api/auth/roles ou rotas da app web (dá 401 — não é "sem permissão" do utilizador).
4. Actions: resolve_user, list_roles, list_categories, list_transactions, create_transaction, delete_transaction, get_das_current, ping.
5. Se curl falhar, mostra o output completo ao utilizador. Não inventes "erro de permissão".
6. WhatsApp @lid: pergunta o telefone 55... ou usa o confirmado pelo utilizador.

## DAS (PDF no WhatsApp)
- **Nunca** mostres `data.base64` ao utilizador.
- `~/.openclaw/workspace/mf-das.sh 5521996185328 03/2026` → grava PDF em `/tmp/...`
- Depois: `openclaw message send --channel whatsapp --target 5521996185328 --media /tmp/DAS-03-2026.pdf --message "DAS 03/2026"`
EOF

node -e "
const fs = require('fs');
const p = process.env.HOME + '/.openclaw/openclaw.json';
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.error('openclaw.json:', e.message); process.exit(1); }
cfg.tools = cfg.tools || {};
cfg.tools.profile = 'coding';
fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
console.log('OK: tools.profile=coding');
"

if ! grep -q 'MF-API.md' "$WS/SOUL.md" 2>/dev/null; then
  cat >> "$WS/SOUL.md" << 'EOF'

## PRIORIDADE MÁXIMA — Meu Financeiro
Segue **MF-API.md** no workspace. Toda chamada à API: `~/.openclaw/mf-curl.sh` + JSON. Nunca digas que não tens permissão sem mostrar o stderr/stdout do curl.
EOF
fi

if ! grep -q 'Lembretes automáticos de agenda' "$WS/SOUL.md" 2>/dev/null; then
  cat >> "$WS/SOUL.md" << 'EOF'

## Lembretes automáticos de agenda (cron 07:00 e 21:00 America/Sao_Paulo)
- Cron com tz America/Sao_Paulo (7h UTC sem tz = 4h BRT — errado).
- Job: phone fixo do destinatário no mf-curl; list_calendar_events para hoje.
- Com eventos: uma mensagem curta com a lista. Sem eventos ou erro API: NÃO enviar nada (sem pedir telefone).
- Ver openclaw-agenda-cron.md no repo Meu Financeiro.
EOF
fi

echo "--- Teste ping ---"
"${OC}/mf-curl.sh" '{"action":"ping"}' | head -c 400
echo ""

if [ -n "$1" ]; then
  echo "--- Teste resolve_user ($1) ---"
  "${OC}/mf-curl.sh" "{\"phone\":\"$1\",\"action\":\"resolve_user\"}" | head -c 800
  echo ""
fi

echo "Reinicia: openclaw gateway restart"
echo "No WhatsApp: /new depois teste."
