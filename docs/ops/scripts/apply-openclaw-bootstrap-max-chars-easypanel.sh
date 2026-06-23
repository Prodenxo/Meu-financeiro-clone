#!/bin/bash
# Easypanel → serviço **OpenClaw** (NÃO backend /app) → Console → Bash
# Aumenta bootstrapMaxChars para o SOUL.md inteiro entrar no contexto (sem truncar ~11%).
# NÃO coles JSON solto no bash — corre ESTE script.
set -e
CFG="${OPENCLAW_STATE_DIR:-${HOME:-/home/node}/.openclaw}/openclaw.json"
SOUL="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}/SOUL.md"

if [ ! -f "$CFG" ]; then
  echo "ERRO: $CFG não existe."
  echo "Prompt /app/backend = container ERRADO. Abre Easypanel → serviço OpenClaw → Console."
  exit 1
fi

NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -z "$NODE_BIN" ] && NODE_BIN=/usr/local/bin/node
[ -x "$NODE_BIN" ] || NODE_BIN=/usr/bin/node
[ -x "$NODE_BIN" ] || { echo "ERRO: node não encontrado"; exit 1; }

cp "$CFG" "${CFG}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

# 56000 cobre SOUL ~46k; 120000 total para outros ficheiros do bootstrap
export CFG
export BOOTSTRAP_MAX="${BOOTSTRAP_MAX:-56000}"
export BOOTSTRAP_TOTAL="${BOOTSTRAP_TOTAL:-120000}"

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const p = process.env.CFG;
const max = Number.parseInt(process.env.BOOTSTRAP_MAX || '56000', 10);
const total = Number.parseInt(process.env.BOOTSTRAP_TOTAL || '120000', 10);
let c = {};
try {
  c = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
  console.error('ERRO: openclaw.json inválido:', e.message);
  process.exit(1);
}
c.agents = c.agents || {};
c.agents.defaults = c.agents.defaults || {};
const prevMax = c.agents.defaults.bootstrapMaxChars;
const prevTotal = c.agents.defaults.bootstrapTotalMaxChars;
c.agents.defaults.bootstrapMaxChars = max;
c.agents.defaults.bootstrapTotalMaxChars = total;
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('[ok] openclaw.json atualizado:', p);
console.log('  bootstrapMaxChars:', prevMax, '→', max);
console.log('  bootstrapTotalMaxChars:', prevTotal, '→', total);
NODE

if [ -f "$SOUL" ]; then
  SOUL_BYTES="$(wc -c < "$SOUL" | tr -d ' ')"
  echo "SOUL.md: ${SOUL_BYTES} bytes (limite por ficheiro agora ${BOOTSTRAP_MAX})"
  if [ "$SOUL_BYTES" -gt "$BOOTSTRAP_MAX" ]; then
    echo "AVISO: SOUL ainda maior que bootstrapMaxChars — sobe BOOTSTRAP_MAX=64000 bash ..."
  fi
else
  echo "AVISO: $SOUL não encontrado (só openclaw.json foi alterado)"
fi

echo ""
echo "OK — Restart OpenClaw no Easypanel + /new no WhatsApp."
echo "O aviso «Bootstrap files were truncated» deve sumir se o SOUL couber no limite."
