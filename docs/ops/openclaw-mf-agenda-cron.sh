#!/bin/sh
# Lembretes de agenda para TODOS os utilizadores (07h / 21h BRT).
# Correr no cron do OpenClaw — substitui cron-job.org.
#
# Env no Easypanel (serviço OpenClaw):
#   MF_API_URL=https://SEU_BACKEND/api/bot/openclaw/action
#   CRON_SECRET=mesmo valor do backend
#
# Uso:
#   mf-agenda-cron.sh manha
#   mf-agenda-cron.sh noite

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
SCRIPT="$WS/mf-agenda-cron.sh"

SLOT="${1:-manha}"
case "$SLOT" in
  manha|noite) ;;
  *) echo '{"ok":false,"error":"slot deve ser manha ou noite"}' >&2; exit 1 ;;
esac

MF_URL="${MF_API_URL:-}"
CRON_SEC="${CRON_SECRET:-}"

if [ -z "$MF_URL" ] || [ -z "$CRON_SEC" ]; then
  echo '{"ok":false,"error":"MF_API_URL e CRON_SECRET obrigatórios"}' >&2
  exit 1
fi

BASE="${MF_URL%/api/bot/openclaw/action}"
BASE="${BASE%/api/bot/openclaw/action}"
CRON_URL="${BASE}/api/cron/agenda-lembretes?slot=${SLOT}&sync=1"

exec curl -sS -f -G "$CRON_URL" \
  -H "Authorization: Bearer ${CRON_SEC}" \
  -H "Accept: application/json"
