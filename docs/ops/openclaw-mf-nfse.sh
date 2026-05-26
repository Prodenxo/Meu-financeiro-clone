#!/bin/sh
# Baixa NFSe (PDF) via mf-curl.sh e grava em /tmp — NUNCA imprime base64 no stdout.
# Uso: ./openclaw-mf-nfse.sh TELEFONE_DO_REMETENTE_55 UUID_DA_NOTA
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
MF_CURL="${MF_CURL:-$DIR/mf-curl.sh}"
PHONE="${1:?informe o telefone de quem pediu (DDI 55, sem +)}"
NOTA_ID="${2:?informe o UUID da nota (campo id do emit_nfse)}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

"$MF_CURL" "{\"phone\":\"$PHONE\",\"action\":\"get_nfse_pdf\",\"payload\":{\"id\":\"$NOTA_ID\",\"sync\":true,\"includeBase64\":true}}" > "$TMP"

node -e "
const fs = require('fs');
const raw = fs.readFileSync(process.argv[1], 'utf8');
let r;
try { r = JSON.parse(raw); } catch (e) {
  console.error(raw.slice(0, 800));
  process.exit(1);
}
if (!r.success) {
  console.log(raw);
  process.exit(1);
}
const d = r.data || {};
const b = d.base64;
if (!b) {
  console.log(JSON.stringify({ success: false, message: 'Resposta sem PDF (base64).' }));
  process.exit(1);
}
const fn = String(d.fileName || 'NFSe.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(b, 'base64'));
const nota = d.nota || {};
console.log(JSON.stringify({
  success: true,
  notaId: nota.id || '',
  status: nota.status || '',
  fileName: fn,
  file: p,
  message: (r.message || 'PDF NFSe obtido') + (nota.status ? ' Status: ' + nota.status + '.' : ''),
}));
" "$TMP"
