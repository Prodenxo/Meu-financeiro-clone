#!/bin/sh
# Baixa DAS (PDF) via mf-curl.sh seguro (2 args) e grava em /tmp.
# Uso: ./openclaw-mf-das.sh TELEFONE_DO_REMETENTE_55 03/2026
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
MF_CURL="${MF_CURL:-$DIR/mf-curl.sh}"
PHONE="${1:?informe o telefone de quem pediu (DDI 55, sem +)}"
MES="${2:?informe competencia MM/YYYY, ex. 03/2026}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

"$MF_CURL" "$PHONE" "{\"action\":\"get_das_current\",\"payload\":{\"mes\":\"$MES\",\"includeBase64\":true}}" > "$TMP"

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
const acc = d.dasAccount || {};
console.log(JSON.stringify({
  success: true,
  mes: d.mes,
  fileName: fn,
  file: p,
  dasAccount: acc.displayName ? acc : null,
  message: (r.message || 'DAS encontrado') + (acc.displayName ? ' Conta: ' + acc.displayName + (acc.empresaNome ? ' (' + acc.empresaNome + ')' : '') + '.' : ''),
}));
" "$TMP"
