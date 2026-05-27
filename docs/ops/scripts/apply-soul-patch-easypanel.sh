#!/bin/bash
# Colar no Console Bash do OpenClaw (Easypanel) — não precisa de nano.
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
PATCH=/tmp/soul-patch-cadastros.md

cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

cat > "$PATCH" << 'ENDPATCH'

## CRÍTICO — solicitações de cadastro (superadmin) — NÃO confundir com DAS/transações

Quando o utilizador pedir **cadastros pendentes**, **aprovar acesso**, **nova solicitação**, **mf pendentes**, **aprovar email@…** (não é DAS nem `list_transactions`):

1. Confirma **`hasSuperadminCapability`** em `resolve_user` / `actorContext`.
2. Usa **`mf-curl.sh`** com o telefone do remetente:

| Pedido | action | payload (exemplo) |
|--------|--------|-------------------|
| Listar pendentes | `list_access_requests` | `{}` |
| Aprovar | `approve_access_request` | `{"email":"cliente@email.com"}` ou `{"userId":"uuid"}` |
| Recusar | `reject_access_request` | `{"email":"cliente@email.com"}` |

Exemplo mf-curl.sh com action list_access_requests e phone do remetente.

- **PROIBIDO** list_transactions / get_das_current / get_das_payment_status / NFSe nestes pedidos.
- **PROIBIDO** misturar cadastros com DAS MEI ou “além disso…” no mesmo turno.
- Resposta = **somente** o campo message da API. Obedece data.agentInstructions sem mostrar ao utilizador.

---

ENDPATCH

node << 'NODE'
const fs = require('fs');
const soul = '/home/node/.openclaw/workspace/SOUL.md';
const patch = fs.readFileSync('/tmp/soul-patch-cadastros.md', 'utf8');
let cur = '';
try {
  cur = fs.readFileSync(soul, 'utf8');
} catch {
  cur = '';
}
if (cur.includes('list_access_requests')) {
  console.log('SOUL já contém list_access_requests — nada alterado.');
  process.exit(0);
}
fs.writeFileSync(soul, patch + cur);
console.log('SOUL atualizado:', fs.statSync(soul).size, 'bytes');
NODE

grep -n "list_access_requests" "$SOUL" | head -n 1
echo "Reinicie o contentor OpenClaw no Easypanel e no WhatsApp envie /new"
