#!/bin/bash
# Easypanel → openclaw-gateway → Console → Bash
# Diagnóstico quando mf-curl.sh: Cannot fork
set -e

echo "=== Host / container ==="
hostname
pwd
echo "OPENCLAW_WORKSPACE=${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
echo "MF_API_URL=${MF_API_URL:-VAZIO}"
echo "SECRET=${OPENCLAW_WEBHOOK_SECRET:+definido}${OPENCLAW_WEBHOOK_SECRET:-VAZIO}"

echo ""
echo "=== Memória ==="
free -h 2>/dev/null || cat /proc/meminfo | head -5

echo ""
echo "=== Processos ==="
echo "Total:" $(ps aux 2>/dev/null | wc -l)
echo "ulimit -u (max user processes):" $(ulimit -u 2>/dev/null || echo N/A)
echo "Top 10 por RAM:"
ps aux --sort=-%mem 2>/dev/null | head -11 || ps aux | head -11

echo ""
echo "=== mf-curl ==="
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
for f in "$WS/mf-curl.sh" /home/node/.openclaw/mf-curl.sh; do
  if [ -f "$f" ]; then
    LINES=$(wc -l < "$f")
    BYTES=$(wc -c < "$f")
    echo "FOUND $f ($BYTES bytes, $LINES lines)"
    head -3 "$f"
    file "$f" 2>/dev/null || true
    if [ "$LINES" -lt 5 ] || [ "$BYTES" -lt 400 ]; then
      echo ">>> QUEBRADO: rode easypanel-console-fix-mf-curl-now.sh <<<"
    fi
  fi
done

echo ""
echo "=== Teste fork mínimo ==="
/bin/sh -c 'echo fork_ok' || echo "FALHOU: shell não consegue fork"

echo ""
echo "=== Teste curl direto (sem script) ==="
if [ -n "$MF_API_URL" ] && [ -n "$OPENCLAW_WEBHOOK_SECRET" ]; then
  curl -sS --connect-timeout 8 --max-time 15 -X POST "$MF_API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENCLAW_WEBHOOK_SECRET" \
    -H "X-WhatsApp-Sender: 5521996185328" \
    -d '{"phone":"5521996185328","action":"ping"}' || echo "curl falhou"
else
  echo "Pulei curl — env incompleta"
fi

echo ""
echo "=== WhatsApp ==="
command -v openclaw >/dev/null && openclaw channels status 2>/dev/null || echo "openclaw CLI indisponível"

echo ""
echo "=== SOUL size ==="
SOUL="$WS/SOUL.md"
[ -f "$SOUL" ] && echo "SOUL.md: $(wc -c < "$SOUL") bytes" || echo "SOUL.md não encontrado"

echo ""
echo "=== agents/ sessions ==="
AG="$HOME/.openclaw/agents"
[ -d "$AG" ] && du -sh "$AG" 2>/dev/null || true
