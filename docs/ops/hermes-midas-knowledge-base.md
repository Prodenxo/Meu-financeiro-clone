# Base de conhecimento — Midas / Hermes ↔ Meu Financeiro (Site)

Ficheiro gerado a partir do **código do backend** (`hermes-bot`, `transactions.service`, migrations Supabase). Serve para colares no **Hermes** (`SOUL.md`, skills ou descrição da tool HTTP). **Atualiza** se mudares regras na BD ou no endpoint.

---

## O que o utilizador quer (WhatsApp + frase natural)

Exemplo: *“recebi 4599 de salário”* → deve **criar um lançamento** na conta do **número que está a falar**, com `tipo` entrada, `valor` 4599, `classificacao` alinhada a **Salário**, `data` hoje, `status` pago.

Isto **não** é feito pelo Express sozinho: o **modelo no Hermes** (ou um nó LLM no n8n) **lê a frase**, extrai valor/categoria, escolhe o **`phone` do remetente**, e chama `POST /api/bot/hermes/action` com `create_transaction`. O backend só valida o segredo, resolve `phone` → `user_id` via `n8n_link`, e insere na tabela.

**Checklist para funcionar em produção**

1. Telefone do WhatsApp **guardado no perfil** da app (para existir `n8n_link`).
2. No Hermes: **skill** `meu-financeiro-midas` (ou tool HTTP) + variáveis `MEU_FINANCEIRO_API_URL` / segredo; ver `docs/ops/hermes-skill-meu-financeiro/INSTALAR.md`.
3. No `SOUL.md` (ou personalidade): obrigar o agente a **sempre** usar o número do remetente no JSON e a seguir a secção de português da skill (frases tipo “recebi X de salário”).
4. Se o Hermes **não** injetar o número no contexto, o fluxo natural quebra — aí o caminho é **Z-API → n8n** (o webhook traz o telefone no JSON) ou melhorar o bridge.

### Trecho para colar no `SOUL.md` (Midas)

```text
És o Midas do Meu Financeiro. Quando alguém descrever um movimento em português
(ex.: "recebi 4599 de salário", "gastei 20 no café"), interpreta valor, tipo
(entrada/saída), categoria e data; pergunta só se faltar algo essencial.
Usa sempre o número de WhatsApp DO REMETENTE desta conversa (só dígitos) no
campo "phone" do JSON ao chamares a API do Meu Financeiro — nunca inventes
telefones. Depois de criar, confirma numa frase o que foi registado.
Segue a skill "meu-financeiro-midas" para o formato exacto do pedido HTTP.
```

### Rever se o número chega ao modelo (debug Hermes)

1. **Mensagem de teste** ao agente (sem criar lançamento): *"Na secção **Current Session Context** desta sessão, que identificador de utilizador ou JID aparece para este chat? Copia literalmente a linha **User** / **User ID** / descrição da fonte."* — Deves ver dígitos ou algo como `...@s.whatsapp.net`; isso normaliza-se para o `phone` da API.
2. **`privacy.redact_pii`:** se estiver `true` no `config.yaml` do Hermes, o gateway pode **substituir** IDs por hashes (`user_` + hex) no prompt ([privacidade no Hermes Agent](https://github.com/NousResearch/hermes-agent/pull/1542)). Esse valor **não** serve como `phone` no Meu Financeiro. Para esta integração mantém **redação desligada** (`privacy.redact_pii: false` ou omite a secção `privacy`).
3. **OpenAI / `custom_providers`:** o campo `key_env` deve ser o **nome** da variável de ambiente (ex.: `OPENAI_API_KEY`), **nunca** a chave em texto. A chave fica só no `.hermes/.env`.

Se, mesmo assim, o modelo não tiver um telefone utilizável no contexto, o caminho estável é **Z-API → n8n** (o webhook traz o número no JSON) e o n8n chama o mesmo backend.

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

---

## Chamada HTTP (única porta de entrada do robô)

- **Método:** `POST`
- **Caminho:** `/api/bot/hermes/action` (URL completa = o teu backend + este path).
- **Header:** `Authorization: Bearer <HERMES_WEBHOOK_SECRET>` (o mesmo valor definido no servidor).
- **Header:** `Content-Type: application/json; charset=utf-8`
- **Corpo:** JSON com `action`; `phone` obrigatório exceto em `ping`.

Não passes chaves **Supabase** ao modelo: só este endpoint com Bearer.

---

## Ações suportadas (MVP)

| `action` | Precisa `phone`? | O que faz |
|----------|------------------|-----------|
| `ping` | Não | Teste de vida; não toca na BD de utilizador. |
| `resolve_user` | Sim | Confirma se o telefone está ligado a um `user_id`. |
| `list_transactions` | Sim | Devolve até **40** lançamentos mais recentes (`criado_em` desc). |
| `create_transaction` | Sim | Insere uma linha em `lancamentos_id` para esse utilizador. |
| `delete_transaction` | Sim | Apaga por `id` (UUID), só se for **dono** do lançamento. |

---

## Criar lançamento (`create_transaction`)

**Campos obrigatórios no `payload`:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida`. O backend aceita também `saída` (com acento) e normaliza para `saida`. |
| `valor` | Número (ex.: `25.5` ou `3400`). |
| `classificacao` | Texto. Preferir o **mesmo nome** que a categoria na app (ex.: `Salário`, `Alimentação`). |
| `data` | String tipo **ISO data** `YYYY-MM-DD` (ex.: `2026-05-12`). |
| `status` | Texto livre na BD; na migração antiga o default é **`pago`**. Usa o que a app usa (ex.: `pago`, `pendente`) para não estragar filtros. |
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

- **`list_transactions`:** resposta inclui objetos com pelo menos `id`, `tipo`, `valor`, `classificacao`, `data`, `status`, etc. (select `*` da tabela).
- **`delete_transaction`:** `payload` deve ter `{ "id": "<uuid>" }`. O utilizador **não sabe** o UUID — o fluxo seguro é: listar → identificar linha pela conversa → **pedir confirmação explícita** → só depois apagar.

---

## Comportamento que convém ao agente

1. Se faltar **valor**, **data**, **tipo** ou categoria ambígua, **pergunta** antes de chamar `create_transaction`.
2. Para **apagar**, nunca apagues sem o utilizador **confirmar** (ex.: repetir valor + data ou dizer “sim, apaga esse”).
3. Se o backend responder que **não há utilizador** para aquele telefone, diz para a pessoa **abrir a app e guardar o telefone no perfil** (para criar/atualizar `n8n_link`).
4. **Moeda:** o sistema não está descrito no código como multi-moeda neste endpoint; assume o que a app já usa (ex.: EUR se for o caso da conta).

---

## “Criou com sucesso” mas não aparece na minha conta (app)

1. **`userId` na resposta:** em `create_transaction`, o JSON de sucesso inclui `userId` (além de `transaction`). Compara esse UUID com o teu utilizador na app (ou em Supabase `auth.users`). Se for **diferente**, o `phone` que o Hermes mandou está ligado a **outra** linha em `n8n_link` — corrige o telefone no perfil / `n8n_link` para o número certo.
2. **Mesmo projeto Supabase:** confirma que o backend onde o Hermes chama (`HERMES_ACTION_URL` / Easypanel) usa o **mesmo** Supabase que a app Expo (URL/chave no `.env` da app).
3. **Data no payload:** usa sempre **`data` em ISO `YYYY-MM-DD`**. Datas tipo `12/05/2026` no payload podiam falhar filtros antigos no dashboard; a app foi ajustada para interpretar DD/MM/AAAA e cair para `criado_em` quando a `data` é inválida.
4. **Atualizar a lista:** na app, puxa para baixo no Início (refresh) ou reabre o ecrã.

---

## Onde está no código (para ti ou para outro dev)

- Rotas: `backend/src/routes/hermes.routes.js` → `POST /hermes/action` sob o prefixo `/api` + `/bot`.
- Lógica: `backend/src/services/hermes-bot.service.js`, `transactions.service.js`.
- Guia operacional (curl, n8n, Z-API): `docs/ops/hermes-bot-n8n-zapi.md`.

---

## Como usar isto no Hermes (zero drama)

1. Copia este ficheiro (ou só as secções que interessam) para a pasta de dados do Hermes, **ou** cola o resumo no `SOUL.md`.
2. **Recomendado (Windows):** instala a skill versionada no repositório — pasta `docs/ops/hermes-skill-meu-financeiro/` com `INSTALAR.md` e a skill `meu-financeiro-midas` (scripts PowerShell + `curl.exe` para o mesmo endpoint e Bearer). Evita JSON partido no PowerShell e mantém o segredo fora do prompt do modelo.
3. Na **tool HTTP** (se usares uma em vez da skill), na descrição, indica: “Corpo JSON com `phone`, `action`, `payload` conforme doc interna; Bearer obrigatório.”
4. Se quiseres categorias **sempre certas** por utilizador, mais tarde podes acrescentar no backend uma action tipo `list_categories` — até lá, usa `list_transactions` para ver **que nomes** o utilizador já usou ou pergunta qual categoria da lista dele.
