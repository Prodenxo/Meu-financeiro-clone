# KNOWLEDGECERTO — Base de conhecimento Midas · Meu Financeiro

Alinhado ao backend (`openclaw-bot.service.js`, `transactions.service.js`, `categories.service.js`, `calendar-events.service.js`, `mei-guide-das-base64.service.js`). **Actualiza** este ficheiro se mudares regras na BD ou no endpoint.

**Hermes:** lê este ficheiro com ferramentas de ficheiro quando precisares de exemplos JSON completos, ou mantém trechos relevantes também em `AGENTSCERTO.md` (limite de contexto do Hermes).

---

## O que é o Meu Financeiro (neste contexto)

- Utilizadores registam **lançamentos** (entradas e saídas) na tabela **`lancamentos_id`**.
- Cada utilizador tem **categorias** na tabela **`categorias_id`** (nome + tipo). Quem se regista recebe cópia das categorias **globais** (`user_id` null na origem); podem existir nomes diferentes por conta.
- O campo **`classificacao`** no lançamento é **texto** — o ideal é coincidir com o **nome da categoria** que o utilizador vê na app (senão o insert pode falhar ou ficar inconsistente com relatórios, conforme regras da app).

---

## Como o bot sabe “quem é quem”

- Tabela **`n8n_link`**: liga **`user_number`** (telefone) ao **`user_id`** (Supabase).
- O utilizador **tem de ter o telefone guardado na app** (perfil) para existir essa linha.
- O backend **normaliza** o telefone: tira `@s.whatsapp.net` e deixa só dígitos; tenta **com e sem prefixo 55**.

### Cargos e empresas (`actorContext`)

Com `phone` válido, as respostas incluem **`data.actorContext`**: `hasActiveMembership`, **`profileRole`** (papel em `profiles`, ex. **superadmin**), **`hasSuperadminCapability`** (true se perfil ou alguma membership for superadmin), e **`memberships`** (vínculos `role_x_user_x_empresa` + `roles` + `empresas`: `role`, `empresaId`, `empresaNome`, `mei`, `linkId`). **Lançamentos** seguem o `user_id` do telefone; não há listagem automática “de toda a empresa” só por cargo admin neste endpoint. O bot deve usar `resolve_user`/`actorContext` **antes** de prometer algo que só **admin**/ **superadmin** faz na app; ver `openclaw-midas-SOUL.md` (telefone + cargo). **`get_das_current` pode usar `phone` do colaborador** quando o solicitante é **admin** e `empresaId` do admin e do colaborador coincidem (validação no agente; endpoint Bot não faz este RBAC servidor).

---

## Chamada HTTP (Hermes / n8n / qualquer cliente)

- **Método:** `POST`
- **URL:** valor da variável de ambiente **`MF_BOT_URL`** (URL completa até `/api/bot/openclaw/action`).
- **Header:** `Authorization: Bearer` + valor de **`MF_BOT_BEARER`** (o mesmo segredo que `OPENCLAW_WEBHOOK_SECRET` no backend Easypanel).
- **Header:** `Content-Type: application/json; charset=utf-8`
- **Corpo:** JSON com `action`; `phone` obrigatório excepto em `ping`.

Não passes chaves **Supabase** ao modelo em texto: só este endpoint com Bearer em ambiente.

### API REST (JWT Supabase)

| Método | Caminho | Uso |
|--------|---------|-----|
| `GET` | `/api/auth/roles` | Lista cargos e permissões (catálogo). |
| `GET` | `/api/auth/permissions` | Permissões do utilizador logado; ou `?role=admin` para um cargo. |
| `GET` | `/api/auth/permissions/check?permission=…` | Verifica permissão do utilizador logado. |

---

## Ações suportadas (MVP)

| `action` | Precisa `phone`? | O que faz |
|----------|------------------|-----------|
| `ping` | Não | Teste de vida; não toca na BD de utilizador. |
| `resolve_user` | Sim | Confirma `user_id` + devolve **`actorContext`** (cargos / empresas). |
| `list_roles` | Opcional (`phone`) | **Bot autorizado.** Catálogo de cargos/permissões; com `phone` + `actorContext`. |
| `get_permissions` | Sim | Permissões do utilizador (`phone`) ou de `payload.role`. |
| `check_permission` | Sim | `payload.permission` → permitido ou não. |
| `list_categories` | Sim | Lista categorias do utilizador; `payload.minimal: true` opcional (`id` + `nome` apenas). |
| `list_transactions` | Sim | Devolve até **40** lançamentos mais recentes (`criado_em` desc). |
| `create_transaction` | Sim | Insere uma linha em `lancamentos_id` para esse utilizador. |
| `delete_transaction` | Sim | Apaga por `id` (UUID), só se for **dono** do lançamento. |
| `get_das_current` | Sim | Lê **`DAS_mei`** por `user_id` + competência; devolve o PDF em **base64** (não envia WhatsApp sozinho). |
| `list_calendar_events` | Sim | Compromissos numa data: lançamentos, Google Calendar (se ligado), vencimento certificado MEI. |

---

## Agenda / calendário (`list_calendar_events`)

- **`payload.data`** ou **`payload.date`:** opcional. Formatos: **`YYYY-MM-DD`** (ex.: `2026-05-16`) ou **`DD/MM/YYYY`** (ex.: `16/05/2026`). Se omitir, usa **hoje** em `America/Sao_Paulo`.
- **Fontes agregadas:** transações com `data` igual ao dia; eventos do **Google Calendar** (tabela `google_tokens_id`); evento de **vencimento do certificado digital** MEI quando `cert_valid_to` cai nesse dia.
- **Sucesso com eventos:** `message` do tipo *N compromisso(s) em DD/MM/YYYY.*; `data.events[]` com `title`, `date`, `time`, `allDay`, `source` (`transaction` | `google` | `certificate`).
- **Sem eventos:** HTTP **200** (não é 404), `data.empty: true`, `data.events: []`, `message` *Nenhum compromisso ou atividade programada para DD/MM/YYYY.*
- **Google não conectado:** ainda devolve lançamentos/certificado; `data.googleCalendarNote` explica; `data.googleCalendarLinked: false`.
- **Data inválida:** HTTP **400**, mensagem pedindo `YYYY-MM-DD` ou `DD/MM/YYYY`.

**Exemplo**

```json
{
  "phone": "5548999999999",
  "action": "list_calendar_events",
  "payload": { "data": "2026-05-16" }
}
```

**Código:** `Site/backend/src/services/calendar-events.service.js`, acção em `openclaw-bot.service.js`.

---

## DAS MEI — status de pagamento (`get_das_payment_status`)

- Consulta `das_mensal_status` (valores: **`pago`**, **`pendente`**, **`erro`**).
- **`payload.mes`:** opcional, `MM/YYYY`. Se omitir, mês corrente UTC.
- **Sucesso:** `message` em português + `data.status`, `data.isPaid`, `data.isPending`, `data.hasPdf`.
- **`payload.refreshFromSerpro`:** `true` para revalidar na Receita (lento; opcional).

```json
{
  "phone": "5548999999999",
  "action": "get_das_payment_status",
  "payload": { "mes": "03/2026" }
}
```

---

## DAS MEI (`get_das_current`)

- Tabela **`DAS_mei`**, campo **`DAS`** (base64 do PDF), filtro por **`user_id`** e **`periodo_apuracao`**.
- **`payload.mes`:** opcional, string **`MM/YYYY`** (ex.: `05/2026`). Se omitir, usa o **mês corrente em UTC**.
- **Sucesso:** `data.fileName`, `data.mimeType` (`application/pdf`), `data.base64`, `data.mes`.
- **Não encontrado:** HTTP **404**, `success: false`, mensagem do tipo *Nenhum DAS encontrado para a competência MM/YYYY.*
- **OpenClaw / WhatsApp:** o endpoint **não envia** o ficheiro sozinho. O agente deve usar `mf-das.sh` (grava PDF em `/tmp`) + `openclaw message send --media …`. **Nunca** cole `base64` na conversa — só confunde o utilizador.

---

## Criar lançamento (`create_transaction`)

**Campos obrigatórios no `payload`:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida`. O backend aceita também `saída` (com acento) e normaliza para `saida`. |
| `valor` | Número (ex.: `25.5` ou `3400`). |
| `classificacao` | Texto. Preferir o **mesmo nome** que a categoria na app (ex.: `Salário`, `Alimentação`). |
| `data` | String **ISO** `YYYY-MM-DD` (ex.: `2026-05-12`). |
| `status` | Texto livre na BD; default comum **`pago`**. Usa o que a app usa (ex.: `pago`, `pendente`). |
| `obs` | Opcional; pode ser `null`. |

**Exemplo — saída**

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "saida",
    "valor": 15.9,
    "classificacao": "Alimentação",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "WhatsApp Midas"
  }
}
```

**Exemplo — entrada**

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
    "obs": "via Hermes"
  }
}
```

---

## Listar e apagar

- **`list_categories`:** mesmo `POST` que as outras acções; **não** uses `GET /api/categories` no Hermes (Bearer diferente / 401). Resposta: `data.categories`.
- **`list_transactions`:** resposta inclui objetos com pelo menos `id`, `tipo`, `valor`, `classificacao`, `data`, `status`, etc.
- **`delete_transaction`:** `payload` deve ter `{ "id": "<uuid>" }`. O utilizador **não sabe** o UUID — o fluxo seguro é: listar → identificar linha pela conversa → **pedir confirmação explícita** → só depois apagar.

---

## Comportamento que convém ao agente

1. Se faltar **valor**, **data**, **tipo** ou categoria ambígua, **pergunta** antes de chamar `create_transaction`.
2. Para **apagar**, nunca apagues sem o utilizador **confirmar**.
3. Se o backend responder que **não há utilizador** para aquele telefone, diz para a pessoa **abrir a app e guardar o telefone no perfil** (`n8n_link`).
4. **Moeda:** assume o que a app já usa.

---

## Onde está no código (dev)

- Rota: `Site/backend/src/routes/openclaw.routes.js` → `POST /openclaw/action` sob `/api` + `/bot`.
- Lógica: `Site/backend/src/services/openclaw-bot.service.js`, `transactions.service.js`, `calendar-events.service.js`.
- Guias: `Site/docs/ops/meu-financeiro-openclaw.md`, `Site/docs/ops/whatsapp-n8n-openclaw-backend.md`, `Site/docs/ops/hermes-midas-integracao.md`.

---

## Como chamar a partir do Hermes

Usa a ferramenta **HTTP** (ou equivalente configurada) com:

- URL = valor de **`MF_BOT_URL`**
- Header `Authorization` = palavra `Bearer`, espaço, e o valor de **`MF_BOT_BEARER`**
- Corpo JSON conforme as acções acima

Define **`MF_BOT_URL`** e **`MF_BOT_BEARER`** no ficheiro `.env` do Hermes (`%LOCALAPPDATA%\hermes\.env` no Windows) ou no Easypanel, **sem** commit no Git.
