#!/bin/bash
# Colar TUDO de uma vez no Easypanel → OpenClaw → Console → Bash
set -e
WS="/home/node/.openclaw/workspace"
mkdir -p "$WS"
test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
  echo "ERRO: MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Environment"
  exit 1
}
node -e '
const fs = require("fs");
const path = require("path");
const ws = "/home/node/.openclaw/workspace";
const mfUrl = process.env.MF_API_URL || "";
const mfSec = process.env.OPENCLAW_WEBHOOK_SECRET || "";
if (!mfUrl || !mfSec) { console.error("ERRO: env vazia"); process.exit(1); }
const resolver = `import fs from "node:fs";
import path from "node:path";
const digits = (v) => String(v ?? "").replace(/\\D/g, "");
const isValid = (v) => digits(v).length >= 10;
const ws = process.argv[2] || "/home/node/.openclaw/workspace";
const agent = digits(process.argv[3] || "");
const pinPath = path.join(ws, ".mf-inbound-sender");
let pin = "";
try { if (fs.existsSync(pinPath)) pin = digits(fs.readFileSync(pinPath, "utf8")); } catch {}
let sender = "";
if (isValid(agent)) {
  sender = agent;
  if (sender !== pin) {
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(pinPath, sender, "utf8");
    if (pin) console.error("mf-curl: pin actualizado " + pin + " -> " + sender);
  }
} else if (isValid(pin)) {
  sender = pin;
  console.error("mf-curl: passa numero COMPLETO no 1o arg, ex: 5521983992146");
} else {
  console.error("mf-curl: remetente invalido");
  process.exit(1);
}
process.stdout.write(sender);
`;
const curlSh = "#!/bin/sh\nset -e\nWS_DIR=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nAGENT_ARG=\"${1:?mf-curl: falta telefone}\"\nshift\nJSON=\"${1:?mf-curl: falta JSON}\"\nMF_URL=\"" + mfUrl + "\"\nMF_SEC=\"" + mfSec + "\"\nSENDER=\"$(node \"$WS_DIR/mf-curl-resolve-sender.mjs\" \"$WS_DIR\" \"$AGENT_ARG\")\" || exit 1\nBODY=\"$(node -e \"let j=JSON.parse(process.argv[2]);j.phone=process.argv[1];console.log(JSON.stringify(j))\" \"$SENDER\" \"$JSON\")\"\nexec curl -sS -X POST \"$MF_URL\" -H \"Content-Type: application/json; charset=utf-8\" -H \"Authorization: Bearer $MF_SEC\" -H \"X-WhatsApp-Sender: $SENDER\" -d \"$BODY\"\n";
fs.writeFileSync(path.join(ws, "mf-curl-resolve-sender.mjs"), resolver);
fs.writeFileSync(path.join(ws, "mf-curl.sh"), curlSh, { mode: 0o755 });
console.log("[ok] mf-curl reparado em", ws);
'
echo "--- teste list_nfse_produtos ---"
"$WS/mf-curl.sh" 5521983992146 '{"action":"list_nfse_produtos"}' | head -c 500
echo ""
