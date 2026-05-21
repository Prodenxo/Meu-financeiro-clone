#!/bin/sh
# Baixa DAS (PDF) via mf-curl.sh e grava em /tmp — NUNCA imprime base64 no stdout.
# Uso: ./openclaw-mf-das.sh 5521996185328 03/2026
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
MF_CURL="${MF_CURL:-$DIR/mf-curl.sh}"
PHONE="${1:?informe phone com DDI, ex. 5521996185328}"
MES="${2:?informe competencia MM/YYYY, ex. 03/2026}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

"$MF_CURL" "{\"phone\":\"$PHONE\",\"action\":\"get_das_current\",\"payload\":{\"mes\":\"$MES\"}}" > "$TMP"

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
const fn = String(d.fileName || 'DAS.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
const p = '/tmp/' + fn;
fs.writeFileSync(p, Buffer.from(b, 'base64'));
console.log(JSON.stringify({
  success: true,
  mes: d.mes,
  fileName: fn,
  file: p,
  message: r.message || 'DAS encontrado',
}));
" "$TMP"
