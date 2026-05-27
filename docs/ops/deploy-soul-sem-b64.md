# Atualizar SOUL sem partes b64

O fluxo `part01` … `part09` existe **só** porque o console Easypanel corta colagens grandes (~4 KB). **Não é obrigatório** para a maioria das mudanças recentes.

## Você NÃO precisa do SOUL para `/pendentes` e `/aprovar`

Comandos com **barra** (`/pendentes`, `/aprovar email@…`) são tratados **no backend** (webhook Z-API). O texto **não** vai para o OpenClaw.

| O que quer | O que fazer |
|----------|-------------|
| Aprovar cadastro pelo WhatsApp | **Deploy do backend** + usar `/pendentes`, `/aprovar …` |
| Bot não confundir com transações | Já resolvido no backend (skip relay) |
| Mudar tom do Midas, DAS, NFSe, áudio | Aí sim atualiza o SOUL (métodos abaixo) |

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
