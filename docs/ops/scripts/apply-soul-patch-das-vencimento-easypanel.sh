#!/bin/bash
# Easypanel → OpenClaw → Console → Bash — patch SOUL (DAS vencimento dia 20).
# Não colar SOUL inteiro nem markdown solto — só este script.
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -z "$NODE_BIN" ] && NODE_BIN=/usr/local/bin/node
[ -x "$NODE_BIN" ] || NODE_BIN=/usr/bin/node
[ -x "$NODE_BIN" ] || { echo "ERRO: node não encontrado (corre no contentor OpenClaw)"; exit 1; }

cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';

const dasBlock = `### DAS MEI — competência × vencimento (dia 20) — **CRÍTICO**

O DAS **vence dia 20** de cada mês. A **competência** é sempre o **mês anterior** ao vencimento:

| Pedido do cliente (em junho/2026) | Competência correta | Vencimento |
|-----------------------------------|---------------------|------------|
| *"Manda o DAS do vencimento dia 20"* | **05/2026** | 20/06/2026 |
| *"DAS que vence este mês"* | **05/2026** | 20/06/2026 |
| *"DAS de maio"* | **05/2026** | 20/06/2026 |
| *"DAS de junho"* (competência explícita) | **06/2026** | 20/07/2026 |

- **Sem \`mes\` no payload** → backend envia a competência do **vencimento dia 20 corrente** (mês anterior ao calendário).
- **PROIBIDO** enviar \`06/2026\` quando o cliente pede *"vencimento dia 20"* estando em **junho** — isso é **maio** (\`05/2026\`).
- Para competência explícita, passa \`payload.mes":"MM/YYYY"\` (ex.: \`"06/2026"\`).
- Na resposta, usa \`data.vencimentoDisplay\` e \`data.mes\` se existirem — explica: *"Competência 05/2026, vence 20/06."*
- *"vencimento dia 20"* → \`mf-das-send.sh TELEFONE\` **sem** 2º arg **ou** \`send_das_whatsapp\` **sem** \`mes\` no JSON.

`;

const startMark = '### DAS MEI — competência × vencimento';
const endMark = '### DAS MEI — **está pago?**';

if (cur.includes(startMark)) {
  const i0 = cur.indexOf(startMark);
  const i1 = cur.indexOf(endMark, i0);
  if (i1 > i0) {
    cur = cur.slice(0, i0) + dasBlock + '\n' + cur.slice(i1);
    console.log('[ok] secção DAS vencimento substituída');
  } else {
    console.log('[aviso] marcador fim não encontrado — a inserir antes de está pago?');
    const i2 = cur.indexOf('### DAS MEI — **está pago?**');
    if (i2 >= 0) {
      cur = cur.slice(0, i2) + dasBlock + '\n' + cur.slice(i2);
      console.log('[ok] secção DAS vencimento inserida');
    } else {
      cur += '\n\n' + dasBlock;
      console.log('[ok] secção DAS vencimento acrescentada no fim');
    }
  }
} else {
  const i2 = cur.indexOf('### DAS MEI — **está pago?**');
  if (i2 >= 0) {
    cur = cur.slice(0, i2) + dasBlock + '\n' + cur.slice(i2);
    console.log('[ok] secção DAS vencimento inserida (nova)');
  } else {
    cur += '\n\n' + dasBlock;
    console.log('[ok] secção DAS vencimento acrescentada');
  }
}

const sendHint = '*"vencimento dia 20"* / *"DAS deste vencimento"* **sem mês** → `mf-das-send.sh TELEFONE` (sem 2º arg)';
if (!cur.includes('mf-das-send.sh TELEFONE` (sem 2º arg)')) {
  const enviar = cur.indexOf('### DAS MEI — enviar **ficheiro PDF**');
  if (enviar >= 0) {
    const after = cur.indexOf('\n', enviar);
    const insertAt = cur.indexOf('\n**PROIBIDO:**', enviar);
    if (insertAt > enviar) {
      const extra = '\nQuando pedirem *"emita / manda / envia o DAS"*:\n\n- ' + sendHint + ' — backend resolve (ex.: junho → `05/2026`).\n- Mês explícito (`MM/YYYY`) → 2º arg do script ou `payload.mes`.\n';
      cur = cur.slice(0, insertAt) + extra + cur.slice(insertAt);
      console.log('[ok] hint mf-das-send sem mes adicionado');
    }
  }
}

fs.writeFileSync(soulPath, cur, 'utf8');
const n = (cur.match(/vencimento dia 20/g) || []).length;
console.log('[ok] SOUL gravado — menções "vencimento dia 20":', n);
console.log('wc -c:', fs.statSync(soulPath).size);
NODE

grep -n "vencimento dia 20" "$SOUL" | head -n 3 || true
echo "--- Depois: WhatsApp /new ou reiniciar gateway ---"
