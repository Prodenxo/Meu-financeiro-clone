#!/bin/bash
# Cola ISTO INTEIRO no Console Bash do OpenClaw (Easypanel).
# Não precisa de ficheiro no servidor — é autocontido.
# Atualiza só a secção FORMATO WHATSAPP no SOUL.md existente.
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

node << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';

const whatsappFormatBlock = `## CRÍTICO — FORMATO WHATSAPP (todas as respostas)

Canal = **WhatsApp no telemóvel**. **Nunca** envies relatório, LaTeX ou títulos \`###\`.

### CHECKLIST — antes de enviar
1. Sem \`\\[\`, \`\\]\`, \`\\times\`, \`\\frac\`
2. Sem \`#\`, \`##\`, \`###\`, \`####\`
3. Negrito = \`*texto*\` (1 asterisco), nunca \`**texto**\`
4. Máx. ~12 linhas; 1 resumo no topo; não repetir resumo no fim

### PROIBIDO
- \`### Cálculo do Total Investido:\` ou \`#### Exemplos\`
- \`\\[ R$ 7.440 * 0,06 = R$ 446 \\]\`
- Listas numeradas longas com sub-fórmulas LaTeX

### OBRIGATÓRIO
- \`*Resumo:*\` + \`*Entradas*\` (bullets •) + \`*Resultado*\` ou \`*Cenário X%*\`
- Cálculo numa linha: \`7.440 x 6% ≈ R$ 446\`
- Dois cenários (6% e 10%) → máx. 2 linhas cada, sem LaTeX

Exemplo FII (CORRECTO):
*Resumo:* R$ 620/mês x 12 = *R$ 7.440* aplicados.

*Entradas*
• Salário: R$ 3.100 | Aporte: 20% = R$ 620/mês

*Cenários (ilustrativos)*
• 6% a.a.: líquido ~*R$ 7.819*
• 10% a.a.: líquido ~*R$ 8.071*

_Estimativa; rentabilidade real varia._

---

`;

const startMarker = '## CRÍTICO — FORMATO WHATSAPP';
const endMarkers = [
  '## CRÍTICO — ESCOPO EXCLUSIVO',
  '## CRÍTICO — SEGURANÇA',
];

const startIdx = cur.indexOf(startMarker);
let endIdx = -1;
for (const m of endMarkers) {
  const i = cur.indexOf(m);
  if (i >= 0 && (endIdx < 0 || i < endIdx)) endIdx = i;
}

if (startIdx >= 0 && endIdx > startIdx) {
  cur = cur.slice(0, startIdx) + whatsappFormatBlock + cur.slice(endIdx);
  console.log('FORMATO WHATSAPP: secção substituída');
} else if (endIdx >= 0) {
  cur = cur.slice(0, endIdx) + whatsappFormatBlock + cur.slice(endIdx);
  console.log('FORMATO WHATSAPP: secção inserida');
} else {
  cur = whatsappFormatBlock + cur;
  console.log('FORMATO WHATSAPP: secção no topo');
}

fs.writeFileSync(soulPath, cur);
console.log('SOUL:', fs.statSync(soulPath).size, 'bytes');
NODE

grep -n "FORMATO WHATSAPP\|CHECKLIST\|ESCOPO EXCLUSIVO" "$SOUL" | head -n 6
echo ""
echo "OK — reinicia o OpenClaw e usa /new no WhatsApp"
