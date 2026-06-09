#!/bin/bash
# Colar no Easypanel → OpenClaw → Console (atualiza mf-curl sem git no contentor).
# Corrige: pin de outro chat + agente passando só "55".
set -e
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
mkdir -p "$WS"
test -n "$MF_API_URL" && test -n "$OPENCLAW_WEBHOOK_SECRET" || {
  echo "ERRO: MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Environment + Restart"
  exit 1
}

cat > "$WS/mf-curl-resolve-sender.mjs" << 'RESOLVER_EOF'
import fs from 'node:fs';
import path from 'node:path';
const digits = (v) => String(v ?? '').replace(/\D/g, '');
const isValid = (v) => digits(v).length >= 10;
const parseChannel = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const m = s.match(/whatsapp:direct:\+?(\d{10,15})/i) || s.match(/\+(\d{10,15})/);
  return m ? digits(m[1]) : (digits(s).length >= 10 ? digits(s) : '');
};
const ws = process.argv[2] || process.env.OPENCLAW_WORKSPACE || '/home/node/.openclaw/workspace';
const agent = digits(process.argv[3] || '');
const pinPath = path.join(ws, '.mf-inbound-sender');
let pin = '';
try { if (fs.existsSync(pinPath)) pin = digits(fs.readFileSync(pinPath, 'utf8')); } catch {}
const envs = [
  process.env.OPENCLAW_INBOUND_PHONE,
  process.env.REMETENTE_WHATSAPP,
  process.env.MF_MANDATORY_SENDER,
  parseChannel(process.env.OPENCLAW_CHANNEL),
  parseChannel(process.env.OPENCLAW_SESSION_CHANNEL),
];
let sender = '';
if (isValid(agent)) {
  sender = agent;
  if (sender !== pin) {
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(pinPath, sender, 'utf8');
    if (pin) console.error(`mf-curl: pin actualizado ${pin} → ${sender}`);
  }
} else {
  for (const e of envs) {
    const d = parseChannel(e) || digits(e);
    if (isValid(d)) { sender = d; break; }
  }
  if (!sender && isValid(pin)) {
    sender = pin;
    console.error(
      `mf-curl: agente (${process.argv[3] || ''}) inválido; usa pin ${pin}. `
      + 'Mudaste de chat? Passa número COMPLETO (ex. 5521983992146) no 1º arg.',
    );
  }
}
if (!isValid(sender)) {
  console.error('mf-curl: remetente inválido — use número COMPLETO com DDI, não só "55".');
  process.exit(1);
}
process.stdout.write(sender);
RESOLVER_EOF

cat > "$WS/mf-curl.sh" << CURL_EOF
#!/bin/sh
set -e
WS_DIR="\$(cd "\$(dirname "\$0")" && pwd)"
AGENT_ARG="\${1:?mf-curl: falta telefone (1º arg, ex. 5521983992146)}"
shift
JSON="\${1:?mf-curl: falta JSON}"
MF_URL="\${MF_API_URL:-$MF_API_URL}"
MF_SEC="\${OPENCLAW_WEBHOOK_SECRET:-$OPENCLAW_WEBHOOK_SECRET}"
SENDER="\$(node "\$WS_DIR/mf-curl-resolve-sender.mjs" "\$WS_DIR" "\$AGENT_ARG")" || exit 1
BODY="\$(node -e "let j=JSON.parse(process.argv[2]);j.phone=process.argv[1];console.log(JSON.stringify(j))" "\$SENDER" "\$JSON")"
exec curl -sS -X POST "\$MF_URL" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -H "Authorization: Bearer \$MF_SEC" \\
  -H "X-WhatsApp-Sender: \$SENDER" \\
  -d "\$BODY"
CURL_EOF
chmod +x "$WS/mf-curl.sh"

echo "[ok] mf-curl v2 instalado em $WS"
echo "Teste Yasmim:"
echo "  echo -n 5521983992146 > $WS/.mf-inbound-sender"
echo "  $WS/mf-curl.sh 5521983992146 '{\"action\":\"list_nfse_produtos\"}'"
