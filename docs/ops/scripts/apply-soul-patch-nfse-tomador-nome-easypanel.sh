#!/bin/bash
# Easypanel → OpenClaw (NÃO backend) → Console → aba **Bash** — patch NFSe.
# Use quando raw.githubusercontent.com der 404 (ficheiro não publicado ou repo privado).
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ]; then
  for c in /usr/local/bin/node /usr/bin/node; do
    if [ -x "$c" ]; then NODE_BIN="$c"; break; fi
  done
fi
if [ -z "$NODE_BIN" ]; then
  echo "ERRO: node não encontrado. Corre isto no contentor **OpenClaw**, aba Bash (não no backend)."
  exit 1
fi
cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';

const nfseBlock = `### NFSe (nota fiscal de serviço) pelo WhatsApp

Quando pedirem *"emite nota"*, *"nota fiscal para o cliente X"*, *"NFSe"* (texto ou áudio transcrito):

1. **\`get_nfse_setup_status\`** — se \`data.setup.ready\` for \`false\`, orienta a completar cadastro na **app** (certificado A1, dados fiscais MEI → Notas). **Não** digas que não tens capacidade se a API existir.
2. **Tomador por nome (obrigatório):** se o utilizador disser *"nota para o Rafael Reis"* (ou áudio com nome), **NUNCA** peças CPF/CNPJ de imediato — o catálogo já tem o documento.
   - **Primeiro:** \`list_nfse_clientes\` com \`payload.q\` = nome (ex.: \`"Rafael Reis"\`), **ou** \`preview_nfse\` / \`emit_nfse\` com \`payload.tomadorNome\` (mesmo nome).
   - O backend resolve o CPF/CNPJ no catálogo. Só pede documento se **zero** clientes ou **vários** homónimos (\`NFSE_TOMADOR_AMBIGUOUS\`).
3. **Serviço/produto (catálogo — NÃO confundir com cliente):**
   - *"quais produtos/serviços tenho?"* → **\`list_nfse_produtos\`** (nunca \`list_nfse_clientes\`).
   - Catálogo já tem código municipal e CNAE — **NUNCA** peça CNAE se o serviço está cadastrado.
   - Emissão: \`descricao\` ou \`produtoNome\` igual ao catálogo — backend resolve código e CNAE.
   - **PROIBIDO** \`register_nfse_produto\` durante emissão se o catálogo já tem serviços (duplica na app).
   - Novo serviço: **\`register_nfse_produto\`** só se pedirem cadastrar ou catálogo vazio.
4. Coleta: **valor** (e serviço só se houver vários no catálogo).
5. **\`preview_nfse\`** ou **\`emit_nfse\` sem \`confirm\`** — mostra resumo e pede confirmação explícita.
6. Só emite com **\`emit_nfse\`** e **\`"confirm":true\`** após *sim* / *pode emitir*.

Exemplo (após confirmação do utilizador):

\`\`\`bash
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"preview_nfse","payload":{"tomadorNome":"Rafael Reis","valor":1200,"descricao":"consultoria"}}'
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"emit_nfse","payload":{"tomadorNome":"Rafael Reis","valor":1200,"descricao":"consultoria","confirm":true}}'
\`\`\`

`;

const markers = [
  '### NFSe (nota fiscal de serviço) pelo WhatsApp',
  '## NFSe — cliente no catálogo (obrigatório)',
  '## NFSe — emitir',
];
let idx = -1;
for (const m of markers) {
  const i = cur.indexOf(m);
  if (i >= 0 && (idx < 0 || i < idx)) idx = i;
}

if (idx < 0) {
  const insertBefore = cur.indexOf('## DAS MEI');
  if (insertBefore >= 0) {
    cur = cur.slice(0, insertBefore) + nfseBlock + '\n' + cur.slice(insertBefore);
    console.log('NFSe: secção inserida antes de DAS MEI');
  } else {
    cur += '\n\n' + nfseBlock;
    console.log('NFSe: secção acrescentada no fim');
  }
} else {
  const nextH2 = cur.indexOf('\n## ', idx + 5);
  const nextH3 = cur.indexOf('\n### ', idx + 5);
  let end = cur.length;
  if (nextH2 > idx) end = Math.min(end, nextH2);
  if (nextH3 > idx && nextH3 !== idx) end = Math.min(end, nextH3);
  // Mantém subsecções após NFSe (PDF, áudio…) se existirem após bloco antigo curto
  const tailMarkers = ['- **Uma conversa = uma nota**', '- **Áudio / nota de voz'];
  let tailStart = -1;
  for (const tm of tailMarkers) {
    const ti = cur.indexOf(tm, idx);
    if (ti > idx && (tailStart < 0 || ti < tailStart)) tailStart = ti;
  }
  const sliceEnd = tailStart > idx ? tailStart : end;
  const tail = tailStart > idx ? cur.slice(tailStart) : '';
  cur = cur.slice(0, idx) + nfseBlock + tail;
  console.log('NFSe: secção substituída (tomadorNome)');
}

fs.writeFileSync(soulPath, cur);
console.log('SOUL bytes:', fs.statSync(soulPath).size);
if (!cur.includes('tomadorNome')) {
  console.error('ERRO: patch não aplicou tomadorNome');
  process.exit(1);
}
console.log('OK — grep tomadorNome:');
console.log(cur.split('\n').filter((l) => l.includes('tomadorNome') || l.includes('Tomador por nome')).slice(0, 4).join('\n'));
NODE

echo "--- Verificação SOUL ---"
grep -n "list_nfse_produtos\|tomadorNome\|Tomador por nome" "$SOUL" | head -n 8 || true
echo "--- Teste mf-curl (caminho completo) ---"
test -x /home/node/.openclaw/workspace/mf-curl.sh && echo "mf-curl.sh OK" || echo "AVISO: mf-curl.sh ausente — corre easypanel-console-install-mf-pin-and-curl.sh"
echo ""
echo "Reinicia o serviço OpenClaw no painel Easypanel (Restart), não 'openclaw gateway restart'."
echo "Depois no WhatsApp: /new"
