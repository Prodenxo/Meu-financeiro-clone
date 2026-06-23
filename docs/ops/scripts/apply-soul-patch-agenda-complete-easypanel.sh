#!/bin/bash
# Easypanel → serviço **OpenClaw** (NÃO backend) → Console → aba **Bash**
# Fase 2 agenda — conclusão manual (complete_calendar_event) + nota lembretes ~30min.
# Requer deploy do backend com complete_calendar_event.
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

const completeBlock = `### Marcar compromisso como concluído (Fase 2)

| Pedido do utilizador | action | payload |
|----------------------|--------|---------|
| *feito 2* / *concluí item 2* | \`complete_calendar_event\` | \`{"index":2}\` |
| *concluí reunião 14h* | \`complete_calendar_event\` | \`{"title":"reunião","time":"14:00"}\` |
| *concluí stand-up* | \`complete_calendar_event\` | \`{"title":"stand-up"}\` |

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"complete_calendar_event","payload":{"index":2}}'
\`\`\`

Aliases: \`feito\`, \`concluir\`, \`concluir_compromisso\`, \`marcar_concluido\`, \`conclui_compromisso\`.

- Repete **APENAS** o JSON \`message\` (confirmação + checklist atualizada).
- Use o **número** da última \`list_agenda_checklist_today\`.
- Se ambíguo, mostre a lista da API e peça o número.
- Lembretes **~30 min antes** de cada compromisso chegam pelo backend (não inventar).

`;

const checklistTweak = `- ✅ = horário **já passou** **ou** marcado com \`complete_calendar_event\` (Fase 2).
- Lembretes **07:00** / **21:00** e **~30 min antes** usam checklist / aviso do backend.`;

const startMark = '### Marcar compromisso como concluído';
const endMarks = [
  '### Criar compromisso',
  '### Segurança e apagar',
  '- **Consultar:**',
  'Próximo compromisso (só futuro):',
];

if (cur.includes('complete_calendar_event')) {
  const start = cur.indexOf(startMark);
  if (start >= 0) {
    let end = cur.length;
    for (const m of endMarks) {
      const i = cur.indexOf(m, start + 10);
      if (i >= 0 && i < end) end = i;
    }
    cur = cur.slice(0, start) + completeBlock + '\n' + cur.slice(end);
    console.log('[ok] SOUL complete_calendar_event substituída');
  } else {
    const checklistIdx = cur.indexOf('### Agenda de hoje — checklist');
    if (checklistIdx < 0) {
      console.error('ERRO: secção checklist não encontrada — aplique Fase 1 primeiro');
      process.exit(1);
    }
    const insertAt = cur.indexOf('\n- **Consultar:**', checklistIdx);
    const at = insertAt >= 0 ? insertAt + 1 : cur.indexOf('\n### ', checklistIdx + 20);
    cur = cur.slice(0, at) + '\n' + completeBlock + cur.slice(at);
    console.log('[ok] SOUL complete inserida após checklist');
  }
} else {
  const checklistIdx = cur.indexOf('### Agenda de hoje — checklist');
  if (checklistIdx < 0) {
    console.error('ERRO: secção checklist não encontrada');
    process.exit(1);
  }
  const insertAt = cur.indexOf('\n- **Consultar:**', checklistIdx);
  const at = insertAt >= 0 ? insertAt + 1 : cur.indexOf('\n### ', checklistIdx + 20);
  cur = cur.slice(0, at) + '\n' + completeBlock + cur.slice(at);
  console.log('[ok] SOUL complete inserida');
}

if (cur.includes('Nesta fase:** utilizador **não** marca manualmente')) {
  cur = cur.replace(
    /- \*\*Nesta fase:\*\* utilizador \*\*não\*\* marca manualmente[^\\n]*\\n/g,
    checklistTweak + '\n',
  );
  console.log('[ok] SOUL checklist Fase 1 atualizada para Fase 2');
} else if (!cur.includes('complete_calendar_event') || !cur.includes('~30 min antes')) {
  const oldLine = '- Lembretes automáticos **07:00** / **21:00** usam o mesmo formato (backend).';
  if (cur.includes(oldLine)) {
    cur = cur.replace(oldLine, checklistTweak);
    console.log('[ok] SOUL linha de lembretes atualizada');
  }
}

fs.writeFileSync(soulPath, cur, 'utf8');

if (!cur.includes('complete_calendar_event')) {
  console.error('ERRO: patch não gravou complete_calendar_event');
  process.exit(1);
}
console.log('[ok] SOUL Fase 2 agenda em', soulPath);
NODE

echo "Teste: «minha agenda hoje» → «feito 1» — item deve virar ✅"
