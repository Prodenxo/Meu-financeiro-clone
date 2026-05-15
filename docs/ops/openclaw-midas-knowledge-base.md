# Base de conhecimento — Midas · Meu Financeiro (OpenClaw)

Ficheiro alinhado ao **código actual** do backend (`openclaw-bot.service.js`, `transactions.service.js`, `mei-guide-das-base64.service.js`). Cola no workspace do OpenClaw (ex.: `midas-kb.md` ao lado do `SOUL.md`) ou referencia no `SOUL.md`. **Atualiza** se mudares regras na BD ou no endpoint.

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

Em **todas** as respostas com `phone` válido (excepto `ping`), o JSON inclui **`data.actorContext`**:

- **`hasActiveMembership`:** `true` se existir pelo menos uma linha activa em `role_x_user_x_empresa` (`status = true`) para esse `user_id`.
- **`profileRole`:** papel em `profiles` (ex.: **superadmin**) quando preenchido — alinhado ao fallback da app quando o vínculo não diz tudo.
- **`hasSuperadminCapability`:** `true` se `profileRole === 'superadmin'` ou alguma `memberships[].role` for `superadmin`.
- **`memberships`:** lista de vínculos; cada item tem `role` (ex.: `admin`, `usuario`, `superadmin`, `outsider`), `empresaId`, `empresaNome`, `mei`, `linkId`.

Isto vem das **mesmas** tabelas que a app usa para RBAC. O agente deve **consultar** isto antes de prometer algo que só admin/superadmin faz na web; ver `openclaw-midas-SOUL.md` (fluxo número + cargo → pedido → permite ou recusa).

**DAS e admin da empresa:** conforme `SOUL`, um **Administrador** pode usar `get_das_current` com **`phone`** = telefone (**n8n_link**) de um **colaborador**, **desde que** `resolve_user` no remetente mostre papel **admin**, um segundo `resolve_user` no colaborador mostre **pelo menos um `membership.empresaId`** igual ao do admin (mesmo tenant); sem essa igualdade → **recusar** a consulta. O backend **ainda não aplica RBAC servidor** nesta rota Bot — por isso esta **disciplina do agente** é obrigatória por segurança.

---

## Chamada HTTP (única porta de entrada do robô)

- **Método:** `POST`
- **Caminho:** `/api/bot/openclaw/action` (URL completa = variável **`MF_API_URL`** no contentor OpenClaw, já com path).
- **Header:** `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>` (mesmo valor no **backend** Easypanel e nas **env** do serviço OpenClaw que faz o `curl`).
- **Header:** `Content-Type: application/json; charset=utf-8`
- **Corpo:** JSON com `action`; `phone` obrigatório exceto em `ping`.

Não passes chaves **Supabase** ao modelo: só este endpoint com Bearer.

---

## Ações suportadas (MVP)

| `action` | Precisa `phone`? | O que faz |
|----------|------------------|-----------|
| `ping` | Não | Teste de vida; não toca na BD de utilizador. |
| `resolve_user` | Sim | Confirma se o telefone está ligado a um `user_id`; devolve também **`actorContext`** (cargos / empresas). |
| `list_transactions` | Sim | Devolve até **40** lançamentos mais recentes (`criado_em` desc). |
| `create_transaction` | Sim | Insere uma linha em `lancamentos_id` para esse utilizador. |
| `delete_transaction` | Sim | Apaga por `id` (UUID), só se for **dono** do lançamento. |
| `get_das_current` | Sim | Lê **`DAS_mei`** por `user_id` + competência; devolve o PDF em **base64** (não envia WhatsApp). |

---

## DAS MEI (`get_das_current`)

- Tabela **`DAS_mei`**, campo **`DAS`** (base64 do PDF), filtro por **`user_id`** e **`periodo_apuracao`** (mesmo formato usado ao gravar: ver `mei-guide-das-base64.service.js`).
- **`payload.mes`:** opcional, string **`MM/YYYY`** (ex.: `05/2026`). Se omitir, usa o **mês corrente em UTC**.
- **Sucesso:** `data.fileName`, `data.mimeType` (`application/pdf`), `data.base64`, `data.mes`.
- **Não encontrado:** HTTP **404**, `success: false`, mensagem do tipo *Nenhum DAS encontrado para a competência MM/YYYY.*

---

## Criar lançamento (`create_transaction`)

**Campos obrigatórios no `payload`:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida`. O backend aceita também `saída` (com acento) e normaliza para `saida`. |
| `valor` | Número (ex.: `25.5` ou `3400`). |
| `classificacao` | Texto. Preferir o **mesmo nome** que a categoria na app (ex.: `Salário`, `Alimentação`). |
| `data` | String **ISO** `YYYY-MM-DD` (ex.: `2026-05-12`). |
| `status` | Texto livre na BD; na migração antiga o default é **`pago`**. Usa o que a app usa (ex.: `pago`, `pendente`). |
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
    "obs": "via OpenClaw"
  }
}
```

---

## Listar e apagar

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

- Rota: `backend/src/routes/openclaw.routes.js` → `POST /openclaw/action` sob `/api` + `/bot`.
- Lógica: `backend/src/services/openclaw-bot.service.js`, `transactions.service.js`.
- Guia operacional: `docs/ops/meu-financeiro-openclaw.md`, `docs/ops/whatsapp-n8n-openclaw-backend.md`.

---

## Como chamar a API a partir do OpenClaw (sem plugin)

No contentor, usa **`exec`** com **`curl`**, variáveis **`MF_API_URL`** e **`OPENCLAW_WEBHOOK_SECRET`** (env do Easypanel). O JSON do `-d` tem de ser **uma linha** válida ou escapado correctamente no shell.
ENDKB