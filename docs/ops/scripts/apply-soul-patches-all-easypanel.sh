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

const calendarBlock = `## Agenda — consultar e criar (Google Calendar + bot)

### Consultar (OBRIGATÓRIO — não inventar horários)

| Pedido do utilizador | action | payload |
|----------------------|--------|---------|
| **próximo compromisso** / próxima reunião / qual meu próximo | \`get_next_calendar_event\` | \`{}\` — **PROIBIDO** \`list_calendar_events\` com amanhã |
| o que tenho hoje / compromissos de hoje | \`list_calendar_events\` | \`{"data":"hoje"}\` |
| agenda amanhã / dia DD/MM | \`list_calendar_events\` | \`{"data":"amanhã"}\` ou data |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"get_next_calendar_event"}'
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_calendar_events","payload":{"data":"hoje"}}'
\`\`\`

- Resposta = **somente** o campo JSON \`message\` (já vem formatada). **PROIBIDO** reescrever horários.
- **Agenda ao vivo** — não há cache no servidor. Depois de **excluir**, chama \`list_calendar_events\` de novo; **PROIBIDO** citar reunião que já não veio na API.
- **Hora da reunião = \`time\` (início).** \`endTime\` é só o fim — **NUNCA** digas que a reunião é às endTime.
- \`[lançamento financeiro]\` = movimento da app, **não** é reunião Google.

### Excluir compromisso

| Pedido | action | payload |
|--------|--------|---------|
| cancela / exclui reunião | \`delete_calendar_event\` | \`{"eventId":"…"}\` da última \`list_calendar_events\` **ou** \`{"title":"…","data":"hoje"}\` |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE '{"action":"delete_calendar_event","payload":{"title":"Reunião com Arthur","data":"hoje"}}'
\`\`\`

- **PROIBIDO** dizer que excluiu sem \`delete_calendar_event\` com \`ok: true\`.
- Depois da exclusão: \`list_calendar_events\` na mesma data para confirmar.

### Gerar link Meet (reunião criada no Google **sem** Meet)

Quando a lista disser *Sem Google Meet* ou o utilizador pedir *link da reunião*, *gera Meet*, *videochamada*:

| Pedido | action | payload |
|--------|--------|---------|
| gera link / Meet / videochamada | \`add_calendar_event_meet\` | \`{"eventId":"…"}\` ou \`{"title":"Reunião com X","data":"hoje"}\` |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE '{"action":"add_calendar_event_meet","payload":{"title":"Reunião com Arthur","data":"hoje"}}'
\`\`\`

- **PROIBIDO** inventar URL meet.google.com — só enviar o link devolvido em \`message\` / \`meetLink\`.
- Se já tiver Meet, a API devolve o link existente.
- Compromisso **dia inteiro** → pedir horário no Google primeiro.

### Criar compromisso

Pedidos: *marca reunião*, *agenda*, *lembrar no calendário*:

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"create_calendar_event","payload":{"title":"Reunião","data":"amanha","time":"12:00"}}'
\`\`\`

- \`title\` ou \`com\`/\`participante\` (ex.: \`"title":"Reunião com Arthur"\`); **NUNCA** uses \`nome\` do utilizador como título.
- \`data\`: hoje/amanhã ou DD/MM/YYYY; \`time\`/\`hora\`: **início** HH:MM — **NÃO** envies \`endTime\` no lugar de \`time\`.
- \`endTime\`/\`horaFim\` = só término; duração default 1h se omitir fim.
- **Meet:** \`createMeetLink: true\` — exige \`time\`.

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

// Calendário — vários títulos antigos; força update se faltar get_next_calendar_event
const calMarkers = [
  '## Agenda — consultar e criar',
  '## Criar compromisso na agenda (texto ou áudio)',
  '## Criar compromisso na agenda',
];
let calIdx = -1;
for (const m of calMarkers) {
  const i = cur.indexOf(m);
  if (i >= 0 && (calIdx < 0 || i < calIdx)) calIdx = i;
}
const phoneIdx2 = cur.indexOf(phoneSection);
const needsAgendaV3 = !cur.includes('get_next_calendar_event') || !cur.includes('delete_calendar_event') || !cur.includes('add_calendar_event_meet');

if (calIdx >= 0) {
  const sliceEnd = phoneIdx2 > calIdx ? phoneIdx2 : cur.length;
  cur = cur.slice(0, calIdx) + calendarBlock + cur.slice(sliceEnd);
  changes.push(needsAgendaV3 ? 'calendário (substituído — faltava get_next)' : 'calendário (secção substituída)');
} else if (needsAgendaV3 || !cur.includes('create_calendar_event')) {
  const insertAt = phoneIdx2 >= 0 ? phoneIdx2 : 0;
  if (insertAt > 0) {
    cur = cur.slice(0, insertAt) + calendarBlock + cur.slice(insertAt);
  } else {
    cur = calendarBlock + cur;
  }
  changes.push('calendário (inserido)');
} else {
  changes.push('calendário (AVISO: já tem create_calendar_event mas sem secção Agenda — reveja SOUL)');
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

echo "--- Verificação (tem de aparecer get_next_calendar_event) ---"
grep -n "get_next_calendar_event\|delete_calendar_event\|add_calendar_event_meet\|SEGURANÇA" "$SOUL" | head -n 12
if ! grep -q "get_next_calendar_event" "$SOUL"; then
  echo "ERRO: SOUL sem get_next_calendar_event — secção agenda não aplicou"
  exit 1
fi
if ! grep -q "delete_calendar_event" "$SOUL"; then
  echo "ERRO: SOUL sem delete_calendar_event — secção excluir não aplicou"
  exit 1
fi
if ! grep -q "add_calendar_event_meet" "$SOUL"; then
  echo "ERRO: SOUL sem add_calendar_event_meet — secção Meet não aplicou"
  exit 1
fi
echo ""
echo "URGENTE: Redeploy BACKEND Easypanel + Restart OpenClaw + WhatsApp /new"
