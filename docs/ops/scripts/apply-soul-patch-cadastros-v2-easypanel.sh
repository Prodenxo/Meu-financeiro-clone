#!/bin/bash
# OpenClaw Easypanel — reforça regra "cadastros sem DAS" (colar no Console Bash).
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
PATCH=/tmp/soul-patch-cadastros-v2.md

cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

cat > "$PATCH" << 'ENDPATCH'

## CRÍTICO — solicitações de cadastro (superadmin) — NÃO confundir com DAS/transações

Quando o utilizador pedir **cadastros pendentes**, **aprovar acesso**, **mf pendentes**, **aprovar email@…**, **recusar**:

1. **Uma só** chamada `mf-curl.sh` — `list_access_requests`, `approve_access_request` ou `reject_access_request`.
2. **PROIBIDO** no mesmo turno: `get_das_current`, `get_das_payment_status`, `send_das_whatsapp`, `list_transactions`, NFSe.
3. Resposta no WhatsApp = **somente** o JSON **`message`** (formatar lista ok). **Sem** “além disso”, DAS MEI, contas de terceiros ou lembretes.
4. Se existir **`data.agentInstructions`**, obedece — **não** mostres ao utilizador.

| Pedido | action | payload |
|--------|--------|---------|
| Listar | `list_access_requests` | `{}` |
| Aprovar | `approve_access_request` | `{"email":"…"}` ou `{"userId":"uuid"}` |
| Recusar | `reject_access_request` | `{"email":"…"}` |

```bash
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"TELEFONE_REMETENTE_55","action":"list_access_requests"}'
```

---

ENDPATCH

node << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
const patchPath = '/tmp/soul-patch-cadastros-v2.md';
const patch = fs.readFileSync(patchPath, 'utf8');
let cur = fs.readFileSync(soulPath, 'utf8');

const startRe = /## CRÍTICO — solicitações de cadastro \(superadmin\)[^\n]*\n/;
const endRe = /\n---\n\n## CRÍTICO — telefone = quem está a escrever/;

if (startRe.test(cur) && endRe.test(cur)) {
  cur = cur.replace(startRe, '').replace(endRe, '\n---\n\n## CRÍTICO — telefone = quem está a escrever');
  fs.writeFileSync(soulPath, patch + cur);
  console.log('Secção cadastros substituída (v2).');
} else if (!cur.includes('list_access_requests')) {
  fs.writeFileSync(soulPath, patch + cur);
  console.log('Patch v2 prepend (secção antiga não encontrada).');
} else if (cur.includes('data.agentInstructions')) {
  console.log('SOUL já tem regras v2 (agentInstructions) — nada alterado.');
  process.exit(0);
} else {
  fs.writeFileSync(soulPath, patch + cur);
  console.log('Patch v2 prepend (marcadores não encontrados).');
}

const out = fs.readFileSync(soulPath, 'utf8');
if (!out.includes('data.agentInstructions')) {
  console.error('ERRO: patch v2 não aplicado corretamente.');
  process.exit(1);
}
console.log('SOUL:', fs.statSync(soulPath).size, 'bytes');
NODE

grep -n "agentInstructions\|list_access_requests" "$SOUL" | head -n 3
echo "Restart OpenClaw + WhatsApp /new"
