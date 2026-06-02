# Atualizar SOUL sem partes b64

O fluxo `part01` … `part09` existe **só** porque o console Easypanel corta colagens grandes (~4 KB). **Não é obrigatório** para a maioria das mudanças recentes.

## Você NÃO precisa do SOUL para `/pendentes` e `/aprovar`

Comandos com **barra** (`/pendentes`, `/aprovar email@…`) são tratados **no backend** (webhook Z-API). O texto **não** vai para o OpenClaw.

| O que quer | O que fazer |
|----------|-------------|
| Aprovar cadastro pelo WhatsApp | **Deploy do backend** + usar `/pendentes`, `/aprovar …` |
| Bot não confundir com transações | Já resolvido no backend (skip relay) |
| Mudar tom do Midas, DAS, NFSe, áudio | Aí sim atualiza o SOUL (métodos abaixo) |
| Bot bloqueia finanças / só diz “outro canal” | **Deploy do backend** (`openclaw-chat-guard`) **+** SOUL atualizado |
| Lembretes 7h / 21h | **Backend** `AGENDA_WHATSAPP_REMINDERS_ENABLED=true` — ver `openclaw-agenda-cron.md` |

---

## Método 1 — Um comando no Easypanel (curl do Git) — recomendado

1. Edita `Site/docs/ops/openclaw-midas-SOUL.md` no PC e faz **commit + push**.
2. No GitHub: abre o ficheiro → **Raw** → copia a URL (`https://raw.githubusercontent.com/...`).
3. No PC:

```powershell
cd "Site\docs\ops\scripts"
node print-soul-deploy-one-liner.mjs --url="COLE_A_URL_RAW_AQUI"
```

4. Copia o bloco Bash que o script imprime.
5. Easypanel → OpenClaw → **Console** → cola **uma vez** → Enter.
6. WhatsApp: `/new`.

**Dica:** no Easypanel, variável `OPENCLAW_SOUL_RAW_URL` com a mesma URL (para documentar; o curl manual basta).

### Aviso `[Bootstrap truncation warning]` após `/new`

O OpenClaw **não injeta o SOUL inteiro** no modelo se passar do limite `bootstrapMaxChars` (no teu caso ~30 172 chars → só ~18 106 entram, **~40% cortado**, normalmente o **fim** do ficheiro).

**Sintoma:** Midas “esquece” DAS, agenda cron, NFSe, `mf-curl` 2 args — mesmo com `wc -c` correto no disco.

**Correção no Console OpenClaw** (ajusta `openclaw.json` e reinicia o serviço):

```bash
node -e "
const fs=require('fs');
const p=process.env.HOME+'/.openclaw/openclaw.json';
let c={};
try{c=JSON.parse(fs.readFileSync(p,'utf8'));}catch(e){}
c.agents=c.agents||{};
c.agents.defaults=c.agents.defaults||{};
c.agents.defaults.bootstrapMaxChars=45000;
c.agents.defaults.bootstrapTotalMaxChars=120000;
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('bootstrapMaxChars=',c.agents.defaults.bootstrapMaxChars);
"
```

Ou CLI (se existir): `openclaw config set agents.defaults.bootstrapMaxChars 45000`

Depois: reiniciar contentor → `/new` → no chat deve **deixar de aparecer** o aviso (ou `SOUL.md` com `injected` ≈ `raw` em `/context`).

**Alternativa:** enxugar o SOUL e deixar detalhes em `MF-API.md` / `midas-kb.md` (o agente lê com `read` quando precisa).

---

## Método 2 — `docker cp` (SSH no VPS)

Se tens SSH no servidor (não só o console web):

```bash
docker ps | grep -i openclaw
docker cp /caminho/openclaw-midas-SOUL.md NOME_DO_CONTAINER:/home/node/.openclaw/workspace/SOUL.md
docker exec NOME_DO_CONTAINER openclaw gateway restart
```

Zero base64, zero partes.

---

## Método 3 — Legado b64 (part01…partN)

Só se curl e docker cp não forem possíveis:

```powershell
node regenerate-soul-b64-parts.mjs
```

Ver `easypanel-console-deploy-soul.md`.

---

## Resumo

| Método | Colagens no Easypanel | Quando usar |
|--------|----------------------|-------------|
| **Backend `/comandos`** | 0 | Cadastros WhatsApp |
| **curl Git** | **1** | Atualizar SOUL com frequência |
| **docker cp** | 0 (SSH) | Tens acesso ao host |
| **b64 partes** | 9+ | Último recurso |
