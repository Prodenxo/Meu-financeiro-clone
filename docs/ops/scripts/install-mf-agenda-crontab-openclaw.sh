#!/bin/bash
# OpenClaw 2026.4.x sem `openclaw cron` — agenda via crontab do Linux (se existir).
# Colar no Console Bash. NÃO dispara agora; só agenda 07:00 e 21:00 (America/Sao_Paulo).
set -e
WS=/home/node/.openclaw/workspace
SCRIPT="$WS/mf-agenda-cron.sh"

if [ ! -x "$SCRIPT" ]; then
  echo "ERRO: falta $SCRIPT — corre primeiro install-mf-agenda-cron-openclaw.sh"
  exit 1
fi

if ! command -v crontab >/dev/null 2>&1; then
  echo "crontab não encontrado neste contentor."
  echo "Usa cron-job.org (ver openclaw-agenda-cron.md secção 'Sem openclaw cron')."
  exit 1
fi

# Cron do utilizador node — TZ para horário de Brasília
(
  crontab -l 2>/dev/null | grep -v 'mf-agenda-cron.sh' || true
  echo 'CRON_TZ=America/Sao_Paulo'
  echo '0 7 * * * /home/node/.openclaw/workspace/mf-agenda-cron.sh manha >>/tmp/mf-agenda-cron.log 2>&1'
  echo '0 21 * * * /home/node/.openclaw/workspace/mf-agenda-cron.sh noite >>/tmp/mf-agenda-cron.log 2>&1'
) | crontab -

echo "Crontab instalado:"
crontab -l
echo ""
echo "Nada foi executado agora. Próximo disparo nos horários acima."
echo "Log: /tmp/mf-agenda-cron.log"
echo "Desactive os jobs no cron-job.org para não duplicar."
