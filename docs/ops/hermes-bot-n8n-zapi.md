# Hermes (WhatsApp Z-API + n8n) — guia bem simples

Este guia explica **em blocos pequenos** o que é cada coisa e o que tens de clicar/copiar. O backend já expõe um endpoint que o **n8n** chama em segurança (com um **segredo**), e ele descobre o utilizador pelo **telefone** na tabela `n8n_link` (o app já grava isso quando o utilizador mete o telefone).

---

## 1. O que são as peças (sem buzzword)

| Peça | O que faz |
|------|-----------|
| **WhatsApp** | O utilizador manda texto para o teu número. |
| **Z-API** | Empresa que liga o WhatsApp à internet: recebe a mensagem e avisa o **n8n** (webhook). |
| **n8n** | Automação: recebe o JSON da Z-API, trata, chama o **teu backend**, manda resposta outra vez pela Z-API. |
| **Backend (este repo)** | Onde estão as **transações na base de dados**. Só altera dados se o pedido trouxer o **segredo** certo + **telefone** ligado a um `user_id`. |

Nada disto “adivinha” o utilizador: o telefone **tem** de estar guardado na app (perfil) para existir linha em `n8n_link`.

---

## 2. O que tens de configurar **uma vez** no servidor (backend)

1. Gera uma password **longa e aleatória** (pode ser no gestor de passwords). Exemplo de formato: `h3rm3s_` + 32 caracteres aleatórios.  
2. No ambiente onde corre o backend (Easypanel, Vercel env, `.env` local, etc.) define:

```bash
HERMES_WEBHOOK_SECRET=a_tua_string_longa_secreta
```

3. Reinicia o backend.

4. Testa se o endpoint responde (troca URL e o valor do segredo). O header **tem** de ser `Authorization: Bearer <segredo>` (com a palavra `Bearer` e um espaço), igual ao valor de `HERMES_WEBHOOK_SECRET`.

**Git Bash / macOS / Linux**

```bash
curl -s -X POST "https://O-TEU-BACKEND/api/bot/hermes/action" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a_tua_string_longa_secreta" \
  -d '{"action":"ping"}'
```

**Windows PowerShell** — aqui `curl` **não** é o mesmo do Linux; usa `curl.exe` **ou** `Invoke-RestMethod`:

```powershell
curl.exe -s -X POST "https://O-TEU-BACKEND/api/bot/hermes/action" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer a_tua_string_longa_secreta" `
  -d '{"action":"ping"}'
```

```powershell
Invoke-RestMethod -Uri "https://O-TEU-BACKEND/api/bot/hermes/action" -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer a_tua_string_longa_secreta" } `
  -Body '{"action":"ping"}'
```

Se usares só `Authorization: 96185328` sem `Bearer`, ou passares `-H` como string no `Invoke-WebRequest`, o PowerShell dá erro: os headers têm de ser **dicionário** (`@{ ... }`), e o backend espera **Bearer**.

Deves ver JSON com `success: true` e mensagem tipo “Hermes online”.

---

## 3. URL e formato do pedido (para colares no n8n)

- **Método:** `POST`  
- **URL:** `https://O-TEU-BACKEND/api/bot/hermes/action`  
- **Header:** `Authorization: Bearer <o mesmo HERMES_WEBHOOK_SECRET>`  
- **Header:** `Content-Type: application/json`  
- **Body (JSON):** sempre com `action`. O `phone` é obrigatório exceto em `ping`.

### Ações disponíveis (MVP)

| `action` | `phone` | `payload` |
|----------|---------|-----------|
| `ping` | não precisa | — |
| `resolve_user` | sim | — (só testa se o telefone está ligado a alguém) |
| `list_transactions` | sim | — |
| `create_transaction` | sim | Objeto igual ao da API normal: `tipo`, `valor`, `classificacao`, `data`, `status`, `obs` opcional |
| `delete_transaction` | sim | `{ "id": "<uuid da transação>" }` |

Exemplo **criar** uma entrada (salário 3400 — ajusta `classificacao` ao nome/código que a tua app usa nas categorias):

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
    "obs": "via Hermes WhatsApp"
  }
}
```

Exemplo **apagar**:

```json
{
  "phone": "5548999999999",
  "action": "delete_transaction",
  "payload": { "id": "UUID-DA-TRANSACAO" }
}
```

O utilizador **não sabe** o UUID. Por isso, no n8n, o fluxo normal é: `list_transactions` → o modelo de IA escolhe o `id` certo com base na mensagem (“apaga o gasto de 50 reais de ontem no ifood”) → **pede confirmação** numa segunda mensagem → só então `delete_transaction`.

---

## 4. Fluxo mínimo no n8n (passo a passo)

1. **Workflow novo** (ex.: `hermes-whatsapp-inbound`).  
2. **Nó 1 — Webhook**  
   - Método POST.  
   - Copia a URL de produção que o n8n te dá (ex.: `https://teu-n8n/.../webhook/hermes-in`).  
3. **Na Z-API** (painel da instância): em “Webhook” / “Received message” (ou equivalente), cola **essa** URL do n8n para cada mensagem recebida.  
4. **Nó 2 — Set** (ou Code): extrair o telefone e o texto da mensagem. O JSON da Z-API varia; tipicamente há campo de telefone do remetente e `text.message`. Ajusta expressões a partir de **uma mensagem real** (executa o workflow uma vez e vê o JSON no nó Webhook).  
5. **Nó 3 — HTTP Request** (chama o teu backend):  
   - URL: `https://O-TEU-BACKEND/api/bot/hermes/action`  
   - Authentication: None (usa header manual).  
   - Header `Authorization`: `Bearer {{ $env.HERMES_WEBHOOK_SECRET }}` (ou cola o valor numa Credential do n8n).  
   - Body JSON: montas `phone`, `action`, `payload` conforme a lógica (ver secção 6).  
6. **Nó 4 — HTTP Request Z-API** `send-text` (igual ao doc `n8n-zapi-das-mei.md`): envia para o mesmo `phone` o texto da resposta (ex.: `{{ $json.message }}` vindo do backend ou de um nó AI que resume `list_transactions`).

Importante: o **telefone** no body do backend deve ser o **mesmo formato** que está em `n8n_link` (com ou sem `55` — o backend tenta as duas variantes).

---

## 5. Onde entra a “inteligência” (ler a frase do gajo)

O backend **não** lê “adiciona salário 3400” sozinho. Quem lê é:

- um nó **OpenAI** / **OpenRouter** no n8n com *function calling*, ou  
- um nó **Code** teu com `if` (só para testes).

Fluxo recomendado: **mensagem → LLM com JSON fixo** → validas o JSON → **HTTP Request** para `/api/bot/hermes/action` com `action` + `payload` que o LLM devolveu.

---

## 6. Ordem para não fazer asneira com dinheiro

1. Só `delete_transaction` depois de mostrar ao utilizador **o que** vai apagar (valor, data, descrição).  
2. Limita quem pode falar com o bot (lista de números ou só clientes com `n8n_link`).  
3. **Nunca** coloques `HERMES_WEBHOOK_SECRET` em workflow exportado para o GitHub.

---

## 7. Se der erro “Nenhum utilizador ligado a este telefone”

O utilizador tem de abrir a app, **meter o telefone no perfil** e guardar (isso preenche `n8n_link`). Depois volta a testar.

---

## Referência cruzada

- Envio DAS / PDF pela mesma Z-API: `docs/ops/n8n-zapi-das-mei.md`  
- Variável de ambiente no código: `HERMES_WEBHOOK_SECRET` em `Site/backend/src/config/env.js`  
- Base de conhecimento para o agente (Midas / Hermes): `docs/ops/hermes-midas-knowledge-base.md`

---

## 8. Hermes Agent (Nous Research) vs Z-API — o que a doc oficial diz

Isto é **outro produto** do endpoint `/api/bot/hermes/action` deste repositório.

Segundo a documentação oficial do **Hermes Agent** — [WhatsApp | Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/whatsapp):

- O WhatsApp no Hermes liga-se por um **bridge integrado (Baileys)**, ou seja, **sessão tipo WhatsApp Web** (QR code, sessão guardada sob `~/.hermes/platforms/whatsapp/session`).
- **Não** é a WhatsApp Cloud API oficial da Meta; na mesma página **não** aparece **Z-API**.

A **Z-API** é um serviço à parte (REST HTTP, instância na cloud deles). **Na doc do Hermes Agent não existe integração nativa Hermes ↔ Z-API.**

**Na prática:**

| Abordagem | WhatsApp |
|-----------|----------|
| Só **Hermes Agent** (Nous) | Número + `hermes whatsapp` (QR) + `hermes gateway`; **sem** Z-API. |
| Só **Z-API + n8n** (fluxos deste projeto) | Mantém-se como está. |
| **Os dois no mesmo número** | Em geral **não** — dois stacks a disputar o mesmo canal. Dois números / duas instâncias é mais limpo. |

Para o Hermes Agent aceder a dados do **Meu Financeiro**, o caminho genérico na doc deles é **ferramentas** (HTTP, MCP, etc.), não substituir o bridge WhatsApp pela Z-API.

---

## 9. Testar criação de dados **antes** de produção (checklist)

Objetivo: validar fluxo **telefone → utilizador → transações** sem abrir o robô a todo o mundo.

1. **Backend de teste**  
   Usa URL do backend **staging/dev** (ex. Easypanel de teste), **não** o domínio de produção. Define `HERMES_WEBHOOK_SECRET` **só** nesse ambiente (segredo diferente do prod).

2. **Conta e telefone na base de teste**  
   Cria um utilizador de teste na app, mete o **mesmo número** com que vais escrever no WhatsApp. Confirma que existe linha em **`n8n_link`** (`user_id` + `user_number`).

3. **Hermes só para ti (ou beta)**  
   No `.env` do Hermes (`%LOCALAPPDATA%\hermes\.env`):  
   `WHATSAPP_ALLOWED_USERS=` **só o teu número** (e mais algum se for equipa). Assim **ningém aleatório** recebe respostas do Midas enquanto testas.

4. **Ferramenta HTTP no Hermes**  
   Configura um tool (HTTP/MCP) a fazer `POST` ao teu endpoint, por exemplo  
   `https://<BACKEND-TESTE>/api/bot/hermes/action`  
   com header `Authorization: Bearer <HERMES_WEBHOOK_SECRET>` e body com `phone`, `action`, `payload` (ver secção 3 deste doc). Sem isto o Hermes **só conversa**; não grava na BD.

5. **Instruções do Midas**  
   Em `SOUL.md` ou personalidade: “Só criar transação após confirmar valor e categoria; nunca apagar sem o utilizador confirmar o ID”, etc.

6. **Só depois → produção**  
   Troca URL para backend prod, segredo prod, alarga `WHATSAPP_ALLOWED_USERS` ou ativa **pairing** / regras de onboarding, e rever limites de custo do modelo na OpenRouter.

**Resumo:** teste = **backend de teste + segredo de teste + 1 telefone na allowlist + tool para a API + `n8n_link`**. Produção = mesma ideia com outro URL, outro segredo e política de quem pode falar.
