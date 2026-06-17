#!/bin/bash
# Easypanel → serviço **OpenClaw** (NÃO backend) → Console → aba **Bash**
# Caminho esperado: /home/node/.openclaw/workspace/SOUL.md
# Se estiver em /app/backend → container errado; abra o Console do serviço OpenClaw.
# Use quando o bot inventar descricao/servico ou ignorar a lista numerada do catálogo.
set -e
SOUL=/home/node/.openclaw/workspace/SOUL.md
if [ ! -d "$(dirname "$SOUL")" ]; then
  echo "ERRO: $(dirname "$SOUL") não existe neste container."
  echo "Estás no BACKEND (/app/backend). Abre Easypanel → serviço OpenClaw → Console → Bash."
  echo "Teste no container certo: ls -la /home/node/.openclaw/workspace/SOUL.md"
  exit 1
fi
NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -z "$NODE_BIN" ] && NODE_BIN=/usr/local/bin/node
[ -x "$NODE_BIN" ] || NODE_BIN=/usr/bin/node
[ -x "$NODE_BIN" ] || { echo "ERRO: node não encontrado (corre no contentor OpenClaw)"; exit 1; }

cp "$SOUL" "${SOUL}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

"$NODE_BIN" << 'NODE'
const fs = require('fs');
const soulPath = '/home/node/.openclaw/workspace/SOUL.md';
let cur = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';

const servicoBlock = `### NFSe — escolha do serviço (\`servicoIndice\`) — **CRÍTICO**

Com **vários** serviços no catálogo, o backend **não aceita** \`descricao\` inventada (ex.: *"prestação de serviços"*, *"nota fiscal de serviços"*). Escolha explícita obrigatória:

1. **\`list_catalog_servicos\`** → lista **numerada** (1, 2, 3…).
2. Utilizador escolhe pelo **número** ou **nome exato** do catálogo.
3. **\`preview_nfse\`** / **\`emit_nfse\`** com **\`servicoIndice\`** (ex.: \`1\`) + \`tomadorNome\` + \`valor\`.
4. Alternativas válidas: **\`codigoServico\`** (do catálogo) ou **\`produtoId\`**.
5. Se \`NFSE_SERVICO_CHOICE_REQUIRED\` → repete o \`message\` e **não** chames \`emit_nfse\` até haver escolha.
6. **Mesmo cliente e mesmo valor** são permitidos — emite quantas notas precisar; numeração RPS é automática no backend.

\`\`\`bash
# Após utilizador escolher "1" na lista:
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"preview_nfse","payload":{"tomadorNome":"Rafael Reis","valor":1200,"servicoIndice":1}}'
/home/node/.openclaw/workspace/mf-curl.sh TELEFONE_REMETENTE_55 '{"action":"emit_nfse","payload":{"tomadorNome":"Rafael Reis","valor":1200,"servicoIndice":1,"confirm":true}}'
\`\`\`

`;

const startMark = '### NFSe — escolha do serviço (`servicoIndice`)';
const endMark = '### NFSe (nota fiscal de serviço) pelo WhatsApp';

if (cur.includes(startMark)) {
  const i0 = cur.indexOf(startMark);
  const i1 = cur.indexOf(endMark, i0 + 10);
  if (i1 > i0) {
    cur = cur.slice(0, i0) + servicoBlock + '\n' + cur.slice(i1);
    console.log('[ok] secção servicoIndice substituída');
  } else {
    const nextH3 = cur.indexOf('\n### ', i0 + 10);
    const end = nextH3 > i0 ? nextH3 : cur.length;
    cur = cur.slice(0, i0) + servicoBlock + cur.slice(end);
    console.log('[ok] secção servicoIndice substituída (até próximo H3)');
  }
} else {
  const insertBefore = cur.indexOf(endMark);
  if (insertBefore >= 0) {
    cur = cur.slice(0, insertBefore) + servicoBlock + '\n' + cur.slice(insertBefore);
    console.log('[ok] secção servicoIndice inserida antes de NFSe');
  } else {
    cur += '\n\n' + servicoBlock;
    console.log('[ok] secção servicoIndice acrescentada no fim');
  }
}

const escolherOld = /4\. \*\*Serviço:\*\* `list_catalog_servicos`[\s\S]*?7\. Só há \*\*um\*\* serviço\/produto/;
const escolherNew = `4. **Serviço:** \`list_catalog_servicos\` → mostra lista **numerada** → espera escolha (número ou nome exato) → só então \`preview_nfse\` com **\`servicoIndice\`** = número da lista (ex.: \`1\`). **\`descricao\` sozinha não conta** se há mais de um serviço — o backend ignora texto inventado pelo modelo.
5. **Produto:** \`list_nfe_produtos\` → idem → \`preview_nfe\` com **\`produtoIndice\`** ou \`produtoNome\` = nome exato do catálogo.
6. Se a API responder \`NFSE_SERVICO_CHOICE_REQUIRED\`, \`NFE_PRODUTO_CHOICE_REQUIRED\` ou lista de escolha → repete **só** o \`message\` (já é a lista) e **espera** a escolha.
7. Só há **um** serviço/produto no catálogo → podes usar esse automaticamente, mas o resumo de confirmação deve mostrar o **nome real** do catálogo.`;

if (cur.includes('### Escolher serviço ou produto antes de emitir')) {
  if (escolherOld.test(cur)) {
    cur = cur.replace(escolherOld, escolherNew);
    console.log('[ok] bloco "Escolher serviço" atualizado');
  } else if (!cur.includes('`descricao` sozinha não conta')) {
    console.log('[aviso] bloco "Escolher serviço" não encontrado no formato esperado — secção servicoIndice já aplicada');
  }
}

const exampleOld = /"descricao":"consultoria"/g;
if (exampleOld.test(cur)) {
  cur = cur.replace(exampleOld, '"servicoIndice":1');
  console.log('[ok] exemplos mf-curl: descricao → servicoIndice');
}

const naEmissaoOld = /Na emissão: `preview_nfse` \/ `emit_nfse` com `descricao` ou `produtoNome` igual ao catálogo/;
if (naEmissaoOld.test(cur)) {
  cur = cur.replace(
    naEmissaoOld,
    'Na emissão: `preview_nfse` / `emit_nfse` com **`servicoIndice`** (preferido) ou `codigoServico` do catálogo — o backend resolve discriminação, código e CNAE. **`descricao` sozinha não basta** com vários serviços'
  );
  console.log('[ok] bullet "Na emissão" atualizado');
}

fs.writeFileSync(soulPath, cur);
if (!cur.includes('servicoIndice')) {
  console.error('ERRO: patch não aplicou servicoIndice');
  process.exit(1);
}
console.log('SOUL bytes:', fs.statSync(soulPath).size);
console.log('OK — grep servicoIndice:');
console.log(cur.split('\n').filter((l) => l.includes('servicoIndice')).slice(0, 5).join('\n'));
NODE

echo "--- Verificação SOUL ---"
grep -n "servicoIndice\|descricao sozinha" "$SOUL" | head -n 10 || true
echo ""
echo "Reinicia o serviço OpenClaw no Easypanel (Restart), depois no WhatsApp: /new"
