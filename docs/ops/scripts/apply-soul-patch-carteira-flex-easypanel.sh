#!/bin/bash
# Easypanel → serviço **OpenClaw** (NÃO backend) → Console → aba **Bash**
# O repo NÃO existe no container — NÃO uses: bash Site/docs/ops/...
# Cola ESTE FICHEIRO INTEIRO no Console (ou: bash -s < apply-soul-patch-carteira-flex-easypanel.sh)
#
# Teste que estás no container certo:
#   ls -la /home/node/.openclaw/workspace/SOUL.md
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

const marker = '### Carteiras, saldo e lançamentos — NÃO confundir';
const nextMarkers = [
  '### Mensagens de nota fiscal — utilizador final (OBRIGATÓRIO)',
  '### Escolher serviço ou produto antes de emitir (OBRIGATÓRIO)',
  '### Mensagens de nota fiscal',
];
const start = cur.indexOf(marker);
let end = -1;
for (const nm of nextMarkers) {
  const i = cur.indexOf(nm);
  if (i > start && (end < 0 || i < end)) end = i;
}
if (start < 0 || end < 0) {
  console.error('ERRO: secção de carteiras não encontrada no SOUL.md');
  console.error('Cola o bloco de openclaw-midas-SOUL.md do repo ou corre apply-soul-patches-all-easypanel.sh');
  process.exit(1);
}

const block = `### Carteiras, saldo e lançamentos — NÃO confundir

**Carteira/conta** (onde o dinheiro fica: Nubank, Poupança, Meu Financeiro) **≠ categoria** (classificação do lançamento: Salário, Alimentação). **Nunca** uses \`create_transaction\` nem \`classificacao\` para **criar carteira**.

| Pedido do utilizador | \`action\` correcta | Notas |
|----------------------|-------------------|--------|
| *cria carteira poupança* / *nova conta Nubank* | **\`create_conta\`** | \`payload\`: \`{ "nome": "Poupança" }\` — **sem** \`valor\`, **sem** \`tipo\` entrada/saída |
| *quanto tenho* / *meu saldo* | **\`get_saldo\`** | Opcional \`carteira\` no payload |
| *quais carteiras tenho* | **\`list_contas\`** | Lista com \`saldoAtual\` |
| *recebi 500 de salário* | **\`create_transaction\`** | \`classificacao\` = categoria; **2+ carteiras** → pergunta antes |
| *gastei 35 de remédio* / *paguei aluguel* | **\`create_transaction\`** | Status **pago** (saída) ou **recebido** (entrada) — **nunca pendente** |
| *recebi 500 no Nubank* / *lança na poupança* | **\`create_transaction\`** | **OBRIGATÓRIO** \`carteira\` com nome de \`list_contas\` |
| *muda para Nubank* | **\`update_transaction\`** | \`id\` + \`carteira\` |

**Escolha da carteira (CRÍTICO):**
1. Mencionou banco/carteira/poupança → **\`list_contas\`** + \`payload.carteira\` no JSON.
2. **2+ carteiras** e pedido sem destino → **pergunta** qual antes de lançar (a API **rejeita** \`create_transaction\` sem \`carteira\`).
3. **1 carteira** → pode lançar sem perguntar.
4. **PROIBIDO** usar só a padrão quando há várias carteiras.
5. Confirmação: valor + categoria + data + **carteira** (\`data.contaNome\`) + se já contabiliza (pago/recebido).

**Status (CRÍTICO — dashboard):**
- Gasto/receita **já feito** → \`pago\` (saída) ou \`recebido\` (entrada).
- **Nunca** \`pendente\` para compras/pagamentos já realizados — não aparecem no dashboard.
- Só use \`a_pagar\` / \`a_receber\` quando o utilizador disser que ainda vai pagar/receber.

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"list_contas"}'
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"create_transaction","payload":{"tipo":"saida","valor":35,"classificacao":"Despesas Diversas","data":"hoje","status":"pago","carteira":"Nubank"}}'
\`\`\`

`;

cur = cur.slice(0, start) + block + '\n' + cur.slice(end);
fs.writeFileSync(soulPath, cur);
console.log('[ok] SOUL carteiras actualizado em', soulPath);
NODE

echo "OK — Restart OpenClaw no Easypanel + /new no WhatsApp de teste."
