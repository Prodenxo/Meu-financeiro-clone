#!/bin/bash
# Easypanel → OpenClaw → Console Bash — atualiza SOUL.md (cadastros + calendário).
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

node << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
const changes = [];

const cadastrosBlock = `## CRÍTICO — solicitações de cadastro (superadmin) — NÃO confundir com DAS/transações

Quando o utilizador pedir **cadastros pendentes**, **aprovar acesso**, **mf pendentes**, **aprovar email@…**, **recusar**:

1. **Uma só** chamada \`mf-curl.sh\` — \`list_access_requests\`, \`approve_access_request\` ou \`reject_access_request\`.
2. **PROIBIDO** no mesmo turno: \`get_das_current\`, \`list_transactions\`, NFSe.
3. Resposta = **somente** o JSON \`message\`. **Sem** “além disso”, DAS MEI ou lembretes extra.
4. Se existir \`data.agentInstructions\`, obedece — **não** mostres ao utilizador.

| Pedido | action | payload |
|--------|--------|---------|
| Listar | \`list_access_requests\` | \`{}\` |
| Aprovar | \`approve_access_request\` | \`{"email":"…"}\` ou \`{"userId":"uuid"}\` |
| Recusar | \`reject_access_request\` | \`{"email":"…"}\` |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"TELEFONE_REMETENTE_55","action":"list_access_requests"}'
\`\`\`

---

`;

const calendarBlock = `## Criar compromisso na agenda (texto ou áudio)

Pedidos: *marca reunião*, *agenda*, *lembrar no calendário*, *consulta dia X às 15h*:

1. \`resolve_user\` com telefone do remetente.
2. \`create_calendar_event\` via mf-curl (Google Calendar ligado na app).

Exemplo:
\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"TELEFONE_55","action":"create_calendar_event","payload":{"title":"Reunião","data":"28/05/2026","time":"15:00"}}'
\`\`\`

- \`title\` obrigatório; \`data\` opcional (hoje); \`time\` opcional (sem hora = dia inteiro).
- **Meet:** \`createMeetLink: true\` ou \`meet: "sim"\` — **exige** \`time\`; envia link Google Meet na resposta.
- Áudio: extrai título/data/hora/meet da transcrição.
- Sem Google Calendar: pede conectar em Configurações na app.
- Consultar dia: \`list_calendar_events\` com \`payload.data\`.

---

`;

const phoneSection = '## CRÍTICO — telefone = quem está a escrever';

// Cadastros
const cadStart = '## CRÍTICO — solicitações de cadastro (superadmin)';
const cadIdx = cur.indexOf(cadStart);
const phoneIdx = cur.indexOf(phoneSection);

if (cadIdx >= 0 && phoneIdx > cadIdx) {
  cur = cur.slice(0, cadIdx) + cadastrosBlock + cur.slice(phoneIdx);
  changes.push('cadastros (secção atualizada)');
} else if (!cur.includes('list_access_requests')) {
  cur = cadastrosBlock + cur;
  changes.push('cadastros (adicionado no topo)');
} else {
  changes.push('cadastros (já ok)');
}

// Calendário
const calStart = '## Criar compromisso na agenda (texto ou áudio)';
const calIdx = cur.indexOf(calStart);
const phoneIdx2 = cur.indexOf(phoneSection);

if (calIdx >= 0 && phoneIdx2 > calIdx) {
  cur = cur.slice(0, calIdx) + calendarBlock + cur.slice(phoneIdx2);
  changes.push('calendário (secção atualizada)');
} else if (!cur.includes('create_calendar_event')) {
  const insertAt = cur.indexOf(phoneSection);
  if (insertAt >= 0) {
    cur = cur.slice(0, insertAt) + calendarBlock + cur.slice(insertAt);
  } else {
    cur = calendarBlock + cur;
  }
  changes.push('calendário (adicionado)');
} else {
  changes.push('calendário (já ok)');
}

fs.writeFileSync(soulPath, cur);
console.log('SOUL:', fs.statSync(soulPath).size, 'bytes');
console.log('Alterações:', changes.join(', '));
NODE

grep -n "list_access_requests\|create_calendar_event" "$SOUL" | head -n 4
echo ""
echo "Restart OpenClaw no Easypanel + WhatsApp /new"
