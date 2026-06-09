# Corrigir telefone errado no mf-curl (hook + script)

## Problema (confirmado no painel OpenClaw)

- Cabeçalho do chat: `+558393220844` (Angélica)
- `exec`: `mf-curl.sh **5521996185328**` → lançamento na conta **Leonardo de Lima**

O SOUL sozinho **não impede** o modelo de repetir o número antigo.

### Variante: dropdown Yasmim mas pin de outro utilizador

- Painel: `whatsapp:direct:+5521983992146` (Yasmim)
- `mf-curl` stderr: `agente (55) ignorado; usa 558788546305` → conta **CF ELIS**, catálogo vazio

**Causa:** `.mf-inbound-sender` ficou com o último WhatsApp **real** (outra pessoa); o modelo passou só `55` no 1º arg.

**Correção imediata:** `echo -n "5521983992146" > /home/node/.openclaw/workspace/.mf-inbound-sender`

**Correção permanente:** `apply-mf-curl-sender-fix-easypanel.sh` — número completo no 1º arg **ganha** sobre pin antigo.

## Solução

1. **Hook `mf-pin-sender`** — em cada `message:received`, grava o remetente em  
   `/home/node/.openclaw/workspace/.mf-inbound-sender`
2. **`mf-curl.sh` novo** — usa esse ficheiro (ou env) e **ignora** o 1º arg se for diferente

---

## Instalação no Easypanel (Console OpenClaw, Bash)

### 1) Atualizar `mf-curl.sh`

```bash
bash /caminho/no/repo/Site/docs/ops/scripts/install-mf-curl-secure-openclaw.sh
```

(ou cola o script do repo após `git pull` no contentor, se tiveres o repo lá)

### 2) Instalar o hook

```bash
HOOK_SRC="/home/node/.openclaw/workspace/hooks/mf-pin-sender"
# Se copiaste do Git para o workspace:
mkdir -p ~/.openclaw/hooks
cp -r "$HOOK_SRC" ~/.openclaw/hooks/mf-pin-sender 2>/dev/null || true

# Ou clone manual: copiar Site/docs/ops/hooks/mf-pin-sender → ~/.openclaw/hooks/mf-pin-sender
```

Confirma ficheiros: `~/.openclaw/hooks/mf-pin-sender/HOOK.md` e `handler.ts`.

### 3) Activar hooks internos + hook

```bash
node -e "
const fs=require('fs');
const p=(process.env.HOME||'/home/node')+'/.openclaw/openclaw.json';
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){}
c.hooks=c.hooks||{};
c.hooks.internal=c.hooks.internal||{};
c.hooks.internal.enabled=true;
c.hooks.internal.entries=c.hooks.internal.entries||{};
c.hooks.internal.entries['mf-pin-sender']={enabled:true};
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('hooks.internal.enabled=',c.hooks.internal.enabled);
"
openclaw hooks list 2>/dev/null | grep -i mf-pin || true
openclaw hooks enable mf-pin-sender 2>/dev/null || true
```

### 4) Restart contentor OpenClaw + WhatsApp `/new`

### 5) Teste

Angélica manda mensagem → no console:

```bash
cat /home/node/.openclaw/workspace/.mf-inbound-sender
# deve ser 558393220844 (só dígitos)

/home/node/.openclaw/workspace/mf-curl.sh 5521996185328 '{"action":"resolve_user"}'
# mesmo com arg errado, deve resolver Angélica se o pin estiver certo
```

---

## Z-API → backend → relay

O relay já envia `mandatorySenderPhone`. O hook cobre **WhatsApp nativo** no OpenClaw (painel com `+55…` no topo).

---

## Verificação

Resposta do bot deve incluir **Conta: {nome da pessoa no chat}**, não Leonardo quando outra pessoa escreve.
