#!/bin/sh
# Alias do agente: sempre entrega PDF via openclaw message send (mf-das-send.sh).
# Uso: mf-send-das.sh 5521996185328 04/2026
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
exec "$WS/mf-das-send.sh" "$@"
