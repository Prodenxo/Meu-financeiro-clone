# Base de conhecimento — Midas / Hermes ↔ Meu Financeiro (Site)

Ficheiro gerado a partir do **código do backend** (`hermes-bot`, `transactions.service`, migrations Supabase). Serve para colares no **Hermes** (`SOUL.md`, skills ou descrição da tool HTTP). **Atualiza** se mudares regras na BD ou no endpoint.

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
