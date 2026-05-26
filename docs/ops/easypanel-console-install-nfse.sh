#!/bin/sh
# Console Easypanel — OpenClaw (Bash do contentor, NÃO Git Bash no PC).
# Pré-requisito: backend com commit get_nfse_pdf / send_nfse_whatsapp já em produção.
# Pré-requisito: mf-curl.sh no workspace (easypanel-console-install-mf.sh ou restore).

set -e
WS=/home/node/.openclaw/workspace
mkdir -p "$WS"

if [ ! -x "$WS/mf-curl.sh" ]; then
  echo "ERRO: falta $WS/mf-curl.sh — corre antes easypanel-console-install-mf.sh"
  exit 1
fi

cat > "$WS/mf-nfse.js" << 'NODE_EOF'
#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const phone = process.argv[2];
const notaId = process.argv[3];
if (!phone || !notaId) {
  console.error('uso: node mf-nfse.js TELEFONE_55 UUID_NOTA');
  process.exit(1);
}
const curl = path.join(dir, 'mf-curl.sh');
const body = JSON.stringify({
  phone,
  action: 'get_nfse_pdf',
  payload: { id: notaId, sync: true, includeBase64: true },
});
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
    message: r.message || 'sem PDF na API',
    hint: x.execCommand || null,
    nota: x.nota || null,
  }));
  process.exit(1);
}
const fn = String(x.fileName || 'NFSe.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(x.base64, 'base64'));
console.log(JSON.stringify({
  success: true,
  notaId: (x.nota && x.nota.id) || notaId,
  status: (x.nota && x.nota.status) || '',
  fileName: fn,
  file: p,
}));
NODE_EOF

printf '#!/bin/sh\nexec node "%s/mf-nfse.js" "$@"\n' "$WS" > "$WS/mf-nfse.sh"
chmod +x "$WS/mf-nfse.js" "$WS/mf-nfse.sh"

cat > "$WS/mf-nfse-send.sh" << 'SEND_EOF'
#!/bin/sh
set -e
WS="$(cd "$(dirname "$0")" && pwd)"
PHONE="${1:?phone 55...}"
NOTA_ID="${2:?uuid da nota}"
TARGET="${3:-$PHONE}"
OUT="$("$WS/mf-nfse.sh" "$PHONE" "$NOTA_ID")" || {
  echo '{"success":false,"step":"mf-nfse.sh"}'
  exit 1
}
FILE="$(echo "$OUT" | node -e "let j=JSON.parse(require('fs').readFileSync(0,'utf8'));if(!j.file)process.exit(1);process.stdout.write(j.file)")" || {
  echo "$OUT"
  echo '{"success":false,"step":"parse"}'
  exit 1
}
if ! openclaw message send --channel whatsapp --target "$TARGET" --media "$FILE" --message "Segue a NFSe emitida." 2>/tmp/mf-nfse-send.err; then
  echo '{"success":false,"step":"openclaw message send"}'
  head -c 200 /tmp/mf-nfse-send.err 2>/dev/null || true
  exit 1
fi
echo "{\"success\":true,\"notaId\":\"$NOTA_ID\",\"file\":\"$FILE\",\"whatsapp\":\"sent\"}"
SEND_EOF
chmod +x "$WS/mf-nfse-send.sh"

printf '#!/bin/sh\nset -e\nWS="$(cd "$(dirname "$0")" && pwd)"\nexec "$WS/mf-nfse-send.sh" "$@"\n' > "$WS/mf-send-nfse.sh"
chmod +x "$WS/mf-send-nfse.sh"

cat > "$WS/NFSE-WHATSAPP.md" << 'EOF'
# NFSe PDF no WhatsApp
1. emit_nfse com confirm:true → guardar data.nota.id
2. Se processando: consult_nfse com mesmo id até pdfReady
3. Enviar PDF (um comando):
   /home/node/.openclaw/workspace/mf-nfse-send.sh TELEFONE_55 UUID_NOTA
Só diga "enviei" se JSON tiver "whatsapp":"sent".
EOF

echo "OK: mf-nfse.sh, mf-nfse-send.sh, mf-send-nfse.sh"
echo "Teste (nota CONCLUIDA):"
echo "  $WS/mf-nfse-send.sh 5521996185328 UUID_DA_NOTA"
echo "Depois: openclaw gateway restart  e  /new  no WhatsApp"
