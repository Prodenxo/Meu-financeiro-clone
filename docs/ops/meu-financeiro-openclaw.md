# Meu Financeiro + OpenClaw (em vez de Hermes)

O [OpenClaw](https://docs.openclaw.ai/) é um **gateway self-hosted** (Node) que liga WhatsApp, Telegram, Discord, etc. a um agente com ferramentas, memória e **SOUL/skills** — filosofia parecida ao Hermes, com ecossistema e docs em `docs.openclaw.ai`.

**Boa notícia:** o teu backend **não precisa** do Hermes. O contrato é só HTTP:

- `POST /api/bot/hermes/action` (o nome “hermes” no path é legado; serve para **qualquer** cliente)
- Header `Authorization: Bearer <HERMES_WEBHOOK_SECRET>`
- JSON: `phone`, `action`, `payload` — ver [`hermes-midas-knowledge-base.md`](./hermes-midas-knowledge-base.md)

Ou seja: **OpenClaw substitui o “quem recebe o WhatsApp e chama o modelo”**; o Meu Financeiro continua igual.

---

## 1. Instalar o OpenClaw (resumo oficial)

Documentação: [Getting Started](https://docs.openclaw.ai/start/getting-started) e índice [llms.txt](https://docs.openclaw.ai/llms.txt).

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

- Config por defeito: `~/.openclaw/openclaw.json`
- Dashboard local típico: [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (`openclaw dashboard`)
- Node: preferir **Node 24** ou **22.16+** (LTS), conforme a doc

---

## 2. WhatsApp (ou outro canal)

- WhatsApp: [channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp.md)
- Pairing / allowlist: no JSON, `channels.whatsapp.allowFrom` (números autorizados), análogo ao que fazias no Hermes

Exemplo mínimo (adaptar números):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+5548999123456"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

---

## 3. Ligar o agente ao Meu Financeiro

### Opção A — Tools HTTP / config do gateway

- [Configuration — tools and custom providers](https://docs.openclaw.ai/gateway/config-tools.md)
- [Tools invoke API](https://docs.openclaw.ai/gateway/tools-invoke-http-api.md) (se fores orquestrar por fora)

Define um tool (ou script) que faça `POST` para:

`https://<TEU-BACKEND>/api/bot/hermes/action`

com `Authorization: Bearer …` e corpo JSON. O segredo deve ficar em **secrets** do OpenClaw, não no repositório.

### Opção B — Skill + SOUL (comportamento “Midas”)

- Formato de skill: [skill-format](https://docs.openclaw.ai/clawhub/skill-format.md)
- Personalidade: [SOUL.md / soul format](https://docs.openclaw.ai/concepts/soul.md)

Copia as regras de negócio de [`hermes-midas-knowledge-base.md`](./hermes-midas-knowledge-base.md) (ações, exemplos de JSON, `userId` / `matchedUserNumber` na resposta para debug).

Instruções úteis no SOUL:

- Interpretar português (“recebi X de salário”) → `create_transaction` com `data` em **`YYYY-MM-DD`**
- Preencher `phone` com o **remetente** do canal (E.164 / só dígitos conforme o backend espera)
- Nunca apagar sem confirmação; usar `resolve_user` se quiseres validar o vínculo antes

---

## 4. Checklist (os mesmos problemas do Hermes)

1. **`n8n_link`:** telefone na app = telefone que o OpenClaw manda no JSON.
2. **Mesmo Supabase:** backend Easypanel e app apontam para o **mesmo** projeto.
3. **Resposta de `create_transaction`:** usa `userId`, `phoneDigits`, `matchedUserNumber` para confirmar que bate com a tua conta (ver doc do Hermes/Midas).

---

## 5. Hermes vs OpenClaw (decisão rápida)

| | Hermes (Nous) | OpenClaw |
|---|----------------|----------|
| Doc do projeto | `hermes-bot-n8n-zapi.md`, skills em `docs/ops/hermes-skill-*` | Este ficheiro + [docs.openclaw.ai](https://docs.openclaw.ai/) |
| Backend Meu Financeiro | Mesmo `POST /api/bot/hermes/action` | Idem |

Podes manter **n8n + Z-API** só para clientes e usar **OpenClaw** só para ti; evita dois bridges no **mesmo** número WhatsApp.

---

## Referências cruzadas

- Contrato da API e exemplos: [`hermes-midas-knowledge-base.md`](./hermes-midas-knowledge-base.md)
- curl / n8n genérico: [`hermes-bot-n8n-zapi.md`](./hermes-bot-n8n-zapi.md)
- Script de teste no backend: `npm run test:hermes:salario` em `Site/backend` (continua válido para validar URL + segredo)
