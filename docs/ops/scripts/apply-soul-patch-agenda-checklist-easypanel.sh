#!/bin/bash
# Easypanel → serviço **OpenClaw** (NÃO backend) → Console → aba **Bash**
# Fase 1 agenda checklist — action list_agenda_checklist_today (requer deploy do backend).
# O repo NÃO existe no container — cola ESTE FICHEIRO INTEIRO no Console.
#
# Teste no container certo:
#   ls -la /home/node/.openclaw/workspace/SOUL.md
#   grep -q list_agenda_checklist_today /home/node/.openclaw/workspace/SOUL.md && echo OK
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
if [ ! -f "$SOUL" ]; then
  echo "ERRO: $SOUL não existe neste container."
  echo "Estás no BACKEND? Abre Easypanel → serviço OpenClaw → Console → Bash."
  exit 1
fi
NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -z "$NODE_BIN" ] && NODE_BIN=/usr/local/bin/node
[ -x "$NODE_BIN" ] || NODE_BIN=/usr/bin/node
[ -x "$NODE_BIN" ] || { echo "ERRO: node não encontrado"; exit 1; }

cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.readFileSync(soulPath, 'utf8');

const checklistBlock = `### Agenda de hoje — checklist (☐ / ✅) — Fase 1

| Pedido do utilizador | action |
|----------------------|--------|
| *minha agenda hoje* / *tarefas de hoje* / *o que tenho hoje* | \`list_agenda_checklist_today\` |
| *agenda da semana* / *próximos dias* | \`list_calendar_events\` com \`{"scope":"agenda"}\` |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_agenda_checklist_today"}'
\`\`\`

Aliases: \`agenda_hoje\`, \`minha_agenda_hoje\`, \`tarefas_hoje\`, \`checklist_agenda\`.

- Repete **APENAS** o campo JSON \`message\` (☐ pendente / ✅ já realizada **pelo horário**).
- **NÃO** reformates nem omitas o resumo (\`X concluídas · Y pendentes\`).
- **Nesta fase:** utilizador **não** marca manualmente *"concluí"* — ✅ = compromisso cujo horário **já passou**.
- Detalhes (Meet, link Google): \`list_calendar_events\` com \`{"data":"hoje"}\`.
- Lembretes automáticos **07:00** / **21:00** usam o mesmo formato (backend).

`;

const startMark = '### Agenda de hoje — checklist';
const endMarks = [
  '### Excluir compromisso',
  '### Gerar link Meet',
  '### Criar compromisso',
  '### Criar compromisso (`create_calendar_event`)',
  '## DAS MEI',
  '## CRÍTICO — telefone',
];

const findEnd = (from) => {
  let end = -1;
  for (const m of endMarks) {
    const i = cur.indexOf(m, from + 5);
    if (i > from && (end < 0 || i < end)) end = i;
  }
  return end;
};

const start = cur.indexOf(startMark);
if (start >= 0) {
  const end = findEnd(start);
  if (end < 0) {
    console.error('ERRO: secção checklist encontrada mas sem marcador de fim');
    process.exit(1);
  }
  cur = cur.slice(0, start) + checklistBlock + '\n' + cur.slice(end);
  console.log('[ok] SOUL checklist agenda substituída');
} else {
  const agendaHdr = '## Agenda — consultar e criar';
  const agendaIdx = cur.indexOf(agendaHdr);
  const excluirIdx = cur.indexOf('### Excluir compromisso');
  if (agendaIdx >= 0 && excluirIdx > agendaIdx) {
    cur = cur.slice(0, excluirIdx) + checklistBlock + '\n' + cur.slice(excluirIdx);
    console.log('[ok] SOUL checklist inserida na secção Agenda');
  } else {
    const proximoLine = '- **Próximo compromisso**';
    const proximoIdx = cur.indexOf(proximoLine);
    const consultarIdx = cur.indexOf('- **Consultar:**');
    if (proximoIdx >= 0 && consultarIdx > proximoIdx) {
      cur = cur.slice(0, consultarIdx) + checklistBlock + '\n' + cur.slice(consultarIdx);
      console.log('[ok] SOUL checklist inserida após próximo compromisso');
    } else {
      console.error('ERRO: não achei secção Agenda nem marcadores para inserir checklist');
      console.error('Corre apply-soul-patches-all-easypanel.sh ou cola bloco de openclaw-midas-SOUL.md');
      process.exit(1);
    }
  }
}

fs.writeFileSync(soulPath, cur);
if (!cur.includes('list_agenda_checklist_today')) {
  console.error('ERRO: patch não gravou list_agenda_checklist_today');
  process.exit(1);
}
console.log('[ok] SOUL checklist agenda em', soulPath);
NODE

echo "OK — 1) Redeploy BACKEND Easypanel  2) Restart OpenClaw  3) /new no WhatsApp de teste"
echo "Teste: pedir «minha agenda hoje» — deve vir checklist com ☐ e ✅"
