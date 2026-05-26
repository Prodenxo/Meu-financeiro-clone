#!/bin/sh
# Alias: envia PDF da NFSe no WhatsApp (mf-nfse-send.sh).
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
exec "$WS/mf-nfse-send.sh" "$@"
