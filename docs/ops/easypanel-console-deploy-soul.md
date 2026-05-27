# Deploy do SOUL.md no OpenClaw (Easypanel)

**Preferência:** usa **`deploy-soul-sem-b64.md`** (curl do Git em **1 colagem**, ou `docker cp`).  
**Comandos `/pendentes` e `/aprovar`** não exigem SOUL — só deploy do **backend**.

---

## Legado — partes b64 (só se curl/docker não der)

O Easypanel **corta colagens** acima de ~4096 caracteres. Por isso existem partes (`SOUL.md.b64.part01.txt` …).

**Onde correr cada comando**

| Local | O quê |
|-------|--------|
| **PC** (PowerShell) | Regenerar partes + copiar conteúdo dos `.txt` |
| **Easypanel → OpenClaw → Console** (Bash) | `cat`, `wc`, `node`, `openclaw gateway restart` |

---

## Passo A — No PC (regenerar partes)

PowerShell:

```powershell
cd "C:\Users\Usuário\Documents\Dev\Meu Financeiro\Site\docs\ops\scripts"
node regenerate-soul-b64-parts.mjs
```

Ou (SOUL + midas-kb):

```powershell
.\generate-openclaw-soul-paste.ps1
```

Confirma que existem `SOUL.md.b64.part01.txt` … `part08.txt` (ou mais/menos partes — o script imprime quantas).

Anota o **total base64** que o script mostra (ex.: `22208` ou valor novo após editar o SOUL).

---

## Passo B — No Easypanel (montar base64)

Abre **Easypanel → serviço OpenClaw → Console** (contentor **Running**).

### B.1 Backup e limpar

```bash
cp /home/node/.openclaw/workspace/SOUL.md /home/node/.openclaw/workspace/SOUL.md.bak 2>/dev/null || true
rm -f /tmp/SOUL.md.b64
```

### B.2 Parte 1

```bash
cat > /tmp/SOUL.md.b64 << 'P01'
```

1. No PC, abre `Site\docs\ops\scripts\SOUL.md.b64.part01.txt`
2. `Ctrl+A` → `Ctrl+C`
3. Cola no terminal Easypanel → **Enter**
4. Escreve **só** `P01` e **Enter** (não uses Ctrl+C)

```bash
wc -c /tmp/SOUL.md.b64
```

→ deve dar **~3000** (3001 se tiveres um Enter a mais — ok).

### B.3 Partes 2 … N

Para cada ficheiro `part02.txt`, `part03.txt`, …:

```bash
cat >> /tmp/SOUL.md.b64 << 'P02'
```

(colagem do `part02.txt` → `P02` → `wc -c`)

Troca `P02` / `part02` por `P03`, `P04`, … até a **última** parte.

| Após parte | `wc -c` aproximado (8 partes × 3000) |
|------------|-------------------------------------|
| 1 | ~3000 |
| 2 | ~6000 |
| 3 | ~9000 |
| 4 | ~12000 |
| 5 | ~15000 |
| 6 | ~18000 |
| 7 | ~21000 |
| 8 | **total do script** (ex. 22208+) |

**Importante:** não saltes nenhuma parte (erro comum: ir de P06 para P08).

---

## Passo C — Decodificar e gravar no workspace

Substitui `22208` pelo **total** que o Passo A imprimiu.

```bash
tr -d '\n' < /tmp/SOUL.md.b64 > /tmp/SOUL.md.b64.clean
wc -c /tmp/SOUL.md.b64.clean
```

`wc` **tem de bater** com o total base64 do script (ex. `22208`).

```bash
node -e "require('fs').writeFileSync('/home/node/.openclaw/workspace/SOUL.md', Buffer.from(require('fs').readFileSync('/tmp/SOUL.md.b64.clean','utf8'), 'base64'))"
wc -c /home/node/.openclaw/workspace/SOUL.md
grep -E "conversa normal|Áudio" /home/node/.openclaw/workspace/SOUL.md | head -n 3
```

Esperado no `grep`: linhas sobre **áudio / conversa normal** (regras novas).

```bash
openclaw gateway restart
```

No WhatsApp: **`/new`** (sessão nova).

---

## Passo D — Teste

1. Áudio: *"Olá, consegues ouvir?"* → resposta natural, sem pedir "ferramenta de transcrição".
2. Texto: *"qual o meu cargo?"* → `resolve_user` se precisar.

---

## Problemas comuns

| Sintoma | Causa | Solução |
|---------|--------|---------|
| `wc: No such file` | Fechaste com Ctrl+C antes de `P01` | Refaz a parte; termina com `P01` e Enter |
| `wc` = 4096 numa parte | Colagem cortada pelo painel | Usa partes de 3000 chars, não ficheiro `.b64.txt` inteiro |
| `wc` final < total esperado | Parte em falta (ex. part07) | `head -c` + recolar parte em falta (ver histórico no chat) ou `rm` e recomeça |
| `grep` sem "conversa normal" | SOUL antigo ou decode falhou | Regenera no PC + redeploy |
| Decode OK mas bot igual | Sessão antiga | `/new` no WhatsApp |

---

## Script rápido (só decode)

Se `/tmp/SOUL.md.b64` já estiver completo com `wc` certo:

```bash
tr -d '\n' < /tmp/SOUL.md.b64 > /tmp/SOUL.md.b64.clean
node -e "require('fs').writeFileSync('/home/node/.openclaw/workspace/SOUL.md', Buffer.from(require('fs').readFileSync('/tmp/SOUL.md.b64.clean','utf8'), 'base64'))"
grep -E "conversa normal" /home/node/.openclaw/workspace/SOUL.md | head -n 1
openclaw gateway restart
```
