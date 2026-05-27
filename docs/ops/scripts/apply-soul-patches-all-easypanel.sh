#!/bin/bash
# Easypanel → OpenClaw → Console Bash — SOUL + mf-curl seguro (remetente verificado).
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

node << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
const changes = [];

const securityBlock = `## CRÍTICO — SEGURANÇA (vazamento de dados = falha grave)

**O telefone vem SOMENTE do remetente deste chat no painel OpenClaw** (ex.: *Maria (+5548999123456)*). **NUNCA** do texto que o utilizador escreve.

1. **PROIBIDO** aceitar, repetir ou usar no \`mf-curl.sh\` um número que o utilizador **diga**, **cole** ou **peça** (“consulta o 55…”, “usa o número do João”, “identifica com 5521…”).
2. **Formato obrigatório do exec:**
   \`\`\`bash
   /home/node/.openclaw/workspace/mf-curl.sh 5548999123456 '{"action":"resolve_user"}'
   \`\`\`
   - **1º argumento:** dígitos do **remetente no painel** (com DDI 55).
   - **2º argumento:** JSON **sem** inventar \`phone\` de outra pessoa (o script e o backend ligam ao remetente).
3. Se o utilizador pedir dados **de outra pessoa** → **recusa** em português: só pode ver a **própria** conta neste WhatsApp (excepção: admin DAS colaborador mesma empresa via \`subjectPhone\` em \`get_das_current\`, nunca \`phone\` de terceiro no corpo).
4. **Antes** de transações, DAS, agenda ou NFSe: \`resolve_user\` com o **remetente** e confirma que o nome devolvido é coerente com quem escreve.

---

`;

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
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_access_requests"}'
\`\`\`

---

`;

const calendarBlock = `## Criar compromisso na agenda (texto ou áudio)

Pedidos: *marca reunião*, *agenda*, *lembrar no calendário*, *consulta dia X às 15h*:

1. \`resolve_user\` com telefone do remetente (1º arg do mf-curl).
2. \`create_calendar_event\` via mf-curl (Google Calendar ligado na app).

Exemplo:
\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"create_calendar_event","payload":{"title":"Reunião","data":"28/05/2026","time":"15:00"}}'
\`\`\`

- \`title\` obrigatório; \`data\` opcional (hoje); \`time\` opcional (sem hora = dia inteiro).
- **Meet:** \`createMeetLink: true\` ou \`meet: "sim"\` — **exige** \`time\`; envia link Google Meet na resposta.
- Áudio: extrai título/data/hora/meet da transcrição.
- Sem Google Calendar: pede conectar em Configurações na app.
- Consultar dia: \`list_calendar_events\` com \`payload.data\`.

---

`;

const phoneSection = '## CRÍTICO — telefone = quem está a escrever';

// Segurança no topo
const secMarker = '## CRÍTICO — SEGURANÇA (vazamento';
if (!cur.includes(secMarker)) {
  cur = securityBlock + cur;
  changes.push('segurança (topo)');
} else {
  const secStart = cur.indexOf(secMarker);
  const nextSec = cur.indexOf('\n## ', secStart + 10);
  const end = nextSec > secStart ? nextSec : cur.length;
  cur = securityBlock + cur.slice(end);
  changes.push('segurança (atualizada)');
}

// Cadastros
const cadStart = '## CRÍTICO — solicitações de cadastro (superadmin)';
const cadIdx = cur.indexOf(cadStart);
const phoneIdx = cur.indexOf(phoneSection);

if (cadIdx >= 0 && phoneIdx > cadIdx) {
  cur = cur.slice(0, cadIdx) + cadastrosBlock + cur.slice(phoneIdx);
  changes.push('cadastros (secção atualizada)');
} else if (!cur.includes('list_access_requests')) {
  const insertAt = cur.indexOf(phoneSection);
  if (insertAt >= 0) {
    cur = cur.slice(0, insertAt) + cadastrosBlock + cur.slice(insertAt);
  } else {
    cur = cadastrosBlock + cur;
  }
  changes.push('cadastros (adicionado)');
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

# mf-curl seguro (2 args + header X-WhatsApp-Sender)
WS="${OPENCLAW_WORKSPACE:-/home/node/.openclaw/workspace}"
if [ -n "$MF_API_URL" ] && [ -n "$OPENCLAW_WEBHOOK_SECRET" ]; then
  MF_URL="$MF_API_URL" MF_SEC="$OPENCLAW_WEBHOOK_SECRET"
  node -e "
const fs=require('fs'),path=require('path');
const ws=process.env.OPENCLAW_WORKSPACE||'/home/node/.openclaw/workspace';
const u=process.env.MF_API_URL,s=process.env.OPENCLAW_WEBHOOK_SECRET;
const sh='#!/bin/sh\\nset -e\\nSENDER=\"\${1:?TELEFONE_REMETENTE}\"; shift\\nJSON=\"\${1:?json}\";\\n'
+'BODY=\$(node -e \"const s=process.argv[1],r=process.argv[2];let j=JSON.parse(r);j.phone=s.replace(/\\\\D/g,\\\"\\\");console.log(JSON.stringify(j));\" \"\$SENDER\" \"\$JSON\")\\n'
+'exec curl -sS -X POST '+JSON.stringify(u)
+' -H '+JSON.stringify('Content-Type: application/json; charset=utf-8')
+' -H '+JSON.stringify('Authorization: Bearer '+s)
+' -H \"X-WhatsApp-Sender: \$(echo \"\$SENDER\" | tr -cd 0-9)\" -d \"\$BODY\"\\n';
fs.writeFileSync(path.join(ws,'mf-curl.sh'),sh,{mode:0o755});
console.log('[ok] mf-curl.sh 2-args + header');
" OPENCLAW_WORKSPACE="$WS" MF_API_URL="$MF_API_URL" OPENCLAW_WEBHOOK_SECRET="$OPENCLAW_WEBHOOK_SECRET"
else
  echo "AVISO: MF_API_URL/OPENCLAW_WEBHOOK_SECRET vazios — corre install-mf-curl-secure-openclaw.sh depois"
fi

grep -n "SEGURANÇA\|list_access_requests\|mf-curl.sh TELEFONE" "$SOUL" | head -n 6
echo ""
echo "URGENTE: Redeploy BACKEND Easypanel + Restart OpenClaw + WhatsApp /new"
