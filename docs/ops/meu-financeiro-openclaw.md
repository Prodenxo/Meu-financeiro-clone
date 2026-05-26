# Meu Financeiro + OpenClaw

O [OpenClaw](https://docs.openclaw.ai/) é um **gateway self-hosted** (Node) que liga WhatsApp, Telegram, Discord, etc. a um agente com ferramentas, memória e **SOUL/skills**. Documentação oficial: [Getting Started](https://docs.openclaw.ai/start/getting-started) e [llms.txt](https://docs.openclaw.ai/llms.txt).

O **backend Meu Financeiro** expõe um único endpoint HTTP que o OpenClaw (ou n8n) chama com **Bearer** + JSON estruturado.

---

## Testar em localhost primeiro (Windows / dev)

O OpenClaw que criaste no **Easypanel** corre **dentro do VPS**: o `localhost` desse contentor **não é** o teu PC. Para o bot na nuvem chamar o backend no teu `localhost:3333` precisavas de um **túnel** (ngrok, Cloudflare Tunnel, etc.) — evita isso na fase inicial.

**Fluxo simples: tudo na mesma máquina (o teu PC)**

1. **`Site/backend/.env`** — É **este** ficheiro que o backend usa quando corres `npm run dev` **dentro de** `Site/backend` (`dotenv.config()` lê o `.env` do *current working directory*). Aí já tens Supabase, `PORT`, etc.; só precisas de acrescentar **`OPENCLAW_WEBHOOK_SECRET`** (se ainda não estiver). O **`.env` na raiz** do repo (`Meu Financeiro/.env`) é **outro** ficheiro (Expo, ferramentas na raiz, etc.): **não** substitui o do backend para o Express.
2. **Arranca o API** — `cd Site/backend` → `npm run dev`.
3. **Só API, sem OpenClaw** — Confirma o endpoint:  
   `npm run test:openclaw:salario -- 5548…`  
   (o script lê o mesmo `Site/backend/.env` e usa `http://127.0.0.1:<PORT>/api/bot/openclaw/action` por defeito).

   **NFSe (nota fiscal)** — mesmo backend local, sem WhatsApp:

   ```powershell
   cd Site\backend
   npm run dev
   # noutro terminal:
   node scripts/test-openclaw-nfse.mjs setup 5521996185328
   node scripts/test-openclaw-nfse.mjs preview 5521996185328
   # só depois de validar o preview:
   node scripts/test-openclaw-nfse.mjs emit 5521996185328
   ```

   Ajusta `TEST_NFSE_*` em `Site/backend/.env` (tomador, valor, descrição). O telefone tem de existir em `n8n_link`.
4. **OpenClaw no PC** — Instalação na secção **Instalação OpenClaw (resumo)** abaixo, com `openclaw onboard` (não precisas do serviço Easypanel para isto). Na tool HTTP / skill, URL do Meu Financeiro:  
   `http://127.0.0.1:3333/api/bot/openclaw/action`  
   (ajusta à tua `PORT`) e o **mesmo** `Authorization: Bearer` que **`OPENCLAW_WEBHOOK_SECRET`** em `Site/backend/.env`.
5. **Instância no Easypanel** — **Para** o serviço OpenClaw ou deixa-o desligado até passares a testes em produção; assim não tens dois gateways nem confusão de sessão WhatsApp no mesmo número.

Quando quiseres testar **backend local** mas **OpenClaw só na nuvem**, aí sim precisas de túnel para o URL do backend ser público (`https://…ngrok…`).

---

## EasyPanel

No **EasyPanel** costumas ter o **backend** Node com URL pública.

### Backend (serviço Meu Financeiro)

- Define `OPENCLAW_WEBHOOK_SECRET` nas variáveis de ambiente do serviço (equivalente ao que tens em **`Site/backend/.env`** em local).
- Se já tinhas um segredo Bearer antigo no painel, **reutiliza o mesmo valor** nesta variável (só mudou o nome da env).
- Replica o resto das variáveis críticas alinhadas ao teu `.env` local (Supabase, `PORT` se aplicável, etc.).

### Onde corre o OpenClaw

- **Outro app no Easypanel** ou **na tua máquina** (`openclaw onboard --install-daemon`). O gateway precisa de **saída HTTPS** para  
  `https://<O-TEU-BACKEND>/api/bot/openclaw/action`  
  com `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>`.

Evita **dois** bridges WhatsApp no **mesmo** número (ex.: Z-API + OpenClaw a disputar a sessão).

### Template OpenClaw no Easypanel (campos do assistente)

| Campo | O que fazer |
|-------|----------------|
| **Gateway Token** | Gera uma string longa (gestor de passwords) e cola aqui **ou** deixa vazio se o template disser que gera sozinho. Se gerar automaticamente, **guarda o valor** quando o Easypanel o mostrar (precisas dele para o dashboard / clientes do gateway). |
| **Gateway Bind** | `lan` é razoável no VPS: o processo escuta na interface de rede interna. O proxy do Easypanel encaminha para a porta publicada. |
| **Gateway Port** | `18789` é o valor típico do [Control UI / dashboard](https://docs.openclaw.ai/cli/dashboard.md) OpenClaw. Mantém se não houver conflito com outro serviço no mesmo host. |
| **Bridge Port** | `18790` — mantém o default do template salvo choque com `n8n` ou outro serviço. |
| **Claude AI / Web Session Key** | Opcional; só preenche se fores usar esse caminho de auth. Na prática muita gente configura **OpenAI** ou outro provider no **onboarding** (passo seguinte). |

**Depois do deploy**

1. Abre o serviço OpenClaw no Easypanel → **Console / Exec** (shell dentro do contentor).
2. Corre o comando que o próprio template indica (ajusta o directório se o erro disser que não encontrou o ficheiro):
   ```bash
   node dist/index.js onboard --no-install-daemon
   ```
   Se esse path não existir, tenta na raiz do projecto do contentor: `ls` e procura `package.json` / `openclaw`; em alternativa equivalente à CLI global: `npx openclaw@latest onboard --no-install-daemon`.
3. Completa o assistente: modelo (API key), workspace, **canais** (ex.: WhatsApp conforme [channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp.md)), `allowFrom` só com o teu número enquanto testas.
4. **Persistência:** confirma no template Easypanel se há **volume** para dados do OpenClaw (config + sessão WhatsApp). Sem volume, um redeploy pode apagar a sessão e voltas a fazer QR.

**Aceder ao dashboard**

- Com portas publicadas: `https://<subdomínio-que-o-easypanel-te-deu>:18789` ou o URL que o painel mostrar para o serviço. Se o gateway exigir token, usa o **Gateway Token** que definiste ou o gerado.

**Ligar ao backend `back_meufinanceiro`**

- No onboarding ou depois em [config-tools](https://docs.openclaw.ai/gateway/config-tools.md) / skill: HTTP `POST` para  
  `https://<URL-pública-do-back_meufinanceiro>/api/bot/openclaw/action`  
  com header `Authorization: Bearer <o mesmo OPENCLAW_WEBHOOK_SECRET>` que está no serviço do backend. Não coloques esse segredo no repositório.

---

## Instalação OpenClaw (resumo)

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

- Config: `~/.openclaw/openclaw.json`
- Dashboard típico: [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (`openclaw dashboard`)
- WhatsApp: [channels/whatsapp](https://docs.openclaw.ai/channels/whatsapp.md) — `channels.whatsapp.allowFrom` para números autorizados
- Tools HTTP / gateway: [config-tools](https://docs.openclaw.ai/gateway/config-tools.md)
- Skill: [skill-format](https://docs.openclaw.ai/clawhub/skill-format.md) · SOUL: [soul](https://docs.openclaw.ai/concepts/soul.md)

---

## Endpoint do Meu Financeiro

| | |
|--|--|
| **Método** | `POST` |
| **Caminho** | `/api/bot/openclaw/action` (URL completa = backend + path) |
| **Header** | `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>` |
| **Header** | `Content-Type: application/json; charset=utf-8` |
| **Corpo** | JSON com `action`; `phone` obrigatório exceto em `ping`. |

Não passes chaves Supabase ao modelo: só este endpoint com Bearer.

### Ações

| `action` | `phone` | O que faz |
|----------|---------|-----------|
| `ping` | não | Teste de vida; resposta inclui mensagem “OpenClaw online”. |
| `resolve_user` | sim | Confirma vínculo telefone → `user_id` (`n8n_link`). |
| `list_transactions` | sim | Até **40** lançamentos recentes. |
| `list_calendar_events` | sim | Compromissos numa data (`payload.data` / `date`; ver `calendar-events.service.js`). |
| `create_transaction` | sim | Insere em `lancamentos_id`. |
| `delete_transaction` | sim | `payload.id` (UUID); só dono. |
| `get_nfse_setup_status` | sim | Prontidão para NFSe (certificado + prestador). |
| `list_nfse_clientes` | sim | Catálogo de tomadores. |
| `preview_nfse` / `emit_nfse` | sim | Pré-visualização / emissão NFSe (`confirm: true` para emitir). |
| `list_nfse_notas` / `consult_nfse` | sim | Listar / consultar notas emitidas. |

### `create_transaction` — `payload`

**Obrigatórios:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida` (aceita `saída`, normaliza). |
| `valor` | Número. |
| `classificacao` | Texto; ideal = nome da categoria na app. |
| `data` | `YYYY-MM-DD`. |
| `status` | Ex.: `pago`, `pendente`. |
| `obs` | Opcional. |

Exemplo entrada:

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "entrada",
    "valor": 3400,
    "classificacao": "Salário",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "via OpenClaw"
  }
}
```

### Frase natural (quem interpreta)

O Express **não** lê “recebi 4599 de salário”. O **modelo no OpenClaw** (ou LLM no n8n) extrai campos, preenche `phone` com o **remetente** do canal, e chama `create_transaction`. O backend valida o segredo, resolve `phone` → `user_id` via `n8n_link`, grava na BD.

**Checklist:** telefone guardado no **perfil** da app (existe linha em `n8n_link`).

### Trecho para `SOUL.md` (Midas)

```text
És o Midas do Meu Financeiro. Quando alguém descrever um movimento em português
(ex.: "recebi 4599 de salário", "gastei 20 no café"), interpreta valor, tipo,
categoria e data; pergunta só se faltar algo essencial.
Usa sempre o número de WhatsApp DO REMETENTE desta conversa (só dígitos) no
campo "phone" do JSON ao chamares a API — nunca inventes telefones.
Depois de criar, confirma numa frase o que foi registado.
Segue o contrato HTTP: POST .../api/bot/openclaw/action com action e payload.
```

### “Sucesso” mas não na minha conta

1. **`userId` na resposta** de `create_transaction` — compara com o teu utilizador em Supabase `auth.users`.
2. **`matchedUserNumber` / `lookupCandidates`** — confirma `n8n_link.user_number`.
3. **Mesmo Supabase** no backend Easypanel e na app Expo.
4. **`data` em ISO** `YYYY-MM-DD`.
5. Refresh na app.

---

## Teste rápido (script)

Na pasta `Site/backend`:

```bash
npm run test:openclaw:salario -- 55489991234567
```

Requer `OPENCLAW_WEBHOOK_SECRET` no `.env`. Para remoto: `OPENCLAW_ACTION_URL=https://.../api/bot/openclaw/action`. Detalhes: `backend/scripts/test-openclaw-transaction.mjs`.

---

## Código (referência dev)

- Rota: `backend/src/routes/openclaw.routes.js` → `POST /openclaw/action` sob prefixo `/api` + `/bot`.
- Lógica: `backend/src/services/openclaw-bot.service.js`, `transactions.service.js`.
- Middleware Bearer: `backend/src/middlewares/openclawWebhook.js`.

---

## Multi-utilizador (toda a app)

- **Mensagens que o utilizador manda:** já é por conta — o campo `phone` no JSON é o WhatsApp **de quem escreveu**; o backend resolve `user_id` via `n8n_link` (telefone no perfil).
- **Um número WhatsApp Midas** para todos (modelo habitual): cada cliente fala com o mesmo número; nunca uses o telefone de exemplo da documentação no lugar do remetente.
- **Lembretes automáticos (07h / 21h):** cron OpenClaw com telefone fixo serve **só para testes contigo**. Para toda a base, o caminho certo é cron no **backend** (ou n8n) que percorre todos os `n8n_link` e só envia quem tiver compromissos — ver [`openclaw-agenda-cron.md`](./openclaw-agenda-cron.md) secção 0.

---

## n8n + Z-API (sem OpenClaw no WhatsApp)

O mesmo endpoint serve automações **só n8n**: ver [`whatsapp-n8n-openclaw-backend.md`](./whatsapp-n8n-openclaw-backend.md).

---

## Referências externas

- [docs.openclaw.ai](https://docs.openclaw.ai/)
- Envio DAS / PDF (outro fluxo Z-API): `docs/ops/n8n-zapi-das-mei.md`

### Midas (base + SOUL para colar no OpenClaw)

- [`openclaw-midas-knowledge-base.md`](./openclaw-midas-knowledge-base.md) — contrato da API, exemplos JSON, `exec`+`curl`.
- [`openclaw-midas-SOUL.md`](./openclaw-midas-SOUL.md) — personalidade + regras + modelo de comando `curl`.
