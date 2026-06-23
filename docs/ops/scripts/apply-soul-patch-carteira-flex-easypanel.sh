#!/bin/bash
# Easypanel → serviço **OpenClaw** → Console → Bash
# Reforça escolha de carteira em lançamentos (Nubank, Poupança, etc.)
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
if [ ! -f "$SOUL" ]; then
  echo "ERRO: $SOUL não existe — abre o Console do serviço OpenClaw."
  exit 1
fi
NODE_BIN="$(command -v node 2>/dev/null || echo /usr/local/bin/node)"
cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.readFileSync(soulPath, 'utf8');

const marker = '### Carteiras, saldo e lançamentos — NÃO confundir';
const nextMarker = '### Mensagens de nota fiscal — utilizador final (OBRIGATÓRIO)';
const start = cur.indexOf(marker);
const end = cur.indexOf(nextMarker);
if (start < 0 || end < 0 || end <= start) {
  console.error('ERRO: secção de carteiras não encontrada — copia openclaw-midas-SOUL.md do repo.');
  process.exit(1);
}

const block = `### Carteiras, saldo e lançamentos — NÃO confundir

**Carteira/conta** (onde o dinheiro fica: Nubank, Poupança, Meu Financeiro) **≠ categoria** (classificação do lançamento: Salário, Alimentação). **Nunca** uses \`create_transaction\` nem \`classificacao\` para **criar carteira**.

| Pedido do utilizador | \`action\` correcta | Notas |
|----------------------|-------------------|--------|
| *cria carteira poupança* / *nova conta Nubank* | **\`create_conta\`** | \`payload\`: \`{ "nome": "Poupança" }\` — **sem** \`valor\`, **sem** \`tipo\` entrada/saída |
| *quanto tenho* / *meu saldo* | **\`get_saldo\`** | Opcional \`carteira\` no payload |
| *quais carteiras tenho* | **\`list_contas\`** | Lista com \`saldoAtual\` |
| *recebi 500 de salário* | **\`create_transaction\`** | \`classificacao\` = categoria; carteira opcional → padrão |
| *recebi 500 no Nubank* / *lança na poupança* | **\`create_transaction\`** | **OBRIGATÓRIO** \`carteira\` com nome de \`list_contas\` |
| *muda para Nubank* | **\`update_transaction\`** | \`id\` + \`carteira\` |

**Escolha da carteira (CRÍTICO):**
1. Mencionou banco/carteira/poupança → **\`list_contas\`** + \`payload.carteira\` no JSON.
2. **2+ carteiras** e pedido sem destino → **pergunta** qual antes de lançar.
3. **PROIBIDO** usar só a padrão quando pediu outra carteira.
4. Confirmação: valor + categoria + data + **carteira** (\`data.contaNome\`).

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_contas"}'
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"create_transaction","payload":{"tipo":"entrada","valor":400,"classificacao":"Aluguel","data":"hoje","status":"recebido","carteira":"Nubank"}}'
\`\`\`

`;

cur = cur.slice(0, start) + block + '\n' + cur.slice(end);
fs.writeFileSync(soulPath, cur);
console.log('[ok] SOUL carteiras actualizado em', soulPath);
NODE

echo "Reinicia OpenClaw + WhatsApp /new nos chats de teste."
