#!/bin/bash
# Colar no Console Bash do OpenClaw (Easypanel). Instala mf-agenda-cron.sh no workspace.
set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

cat > "$WS/mf-agenda-cron.sh" << 'ENDSCRIPT'
#!/bin/sh
set -e
SLOT="${1:-manha}"
case "$SLOT" in manha|noite) ;; *) echo '{"ok":false,"error":"slot: manha|noite"}' >&2; exit 1 ;; esac
MF_URL="${MF_API_URL:-}"
CRON_SEC="${CRON_SECRET:-}"
if [ -z "$MF_URL" ] || [ -z "$CRON_SEC" ]; then
  echo '{"ok":false,"error":"MF_API_URL e CRON_SECRET"}' >&2
  exit 1
fi
BASE="${MF_URL%/api/bot/openclaw/action}"
CRON_URL="${BASE}/api/cron/agenda-lembretes?slot=${SLOT}&sync=1"
exec curl -sS -f -G "$CRON_URL" -H "Authorization: Bearer ${CRON_SEC}" -H "Accept: application/json"
ENDSCRIPT

chmod +x "$WS/mf-agenda-cron.sh"
ls -la "$WS/mf-agenda-cron.sh"
echo "Teste (só se CRON_SECRET e MF_API_URL estiverem no env do contentor):"
echo "  $WS/mf-agenda-cron.sh manha | head -c 400"
echo ""
echo "Cron OpenClaw (America/Sao_Paulo):"
echo "  07:00 → exec $WS/mf-agenda-cron.sh manha"
echo "  21:00 → exec $WS/mf-agenda-cron.sh noite"
echo "Desactive os 2 jobs no cron-job.org."
