# API — GET /api/categories

Liste as categorias do utilizador autenticado (**mesmo `user_id` do token JWT ou fluxo válido por `requireAuth`**).

## Variáveis de ambiente (OpenClaw / integrações)

- **`MF_API_URL`** — usar para **`POST`** a **`/api/bot/openclaw/action`**. O Bearer deve ser **`OPENCLAW_WEBHOOK_SECRET`**.

- **`MF_API_BASE`** — URL base do backend **sem** barra no fim (ex.: `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host`). Para categorias: **`GET /api/categories?minimal=true`** (prefixo **`/api`** obrigatório). Lista completa: **`GET /api/categories`** (sem `minimal`).

- **`OPENCLAW_WEBHOOK_SECRET` em GET categorias** — **apenas** nesta rota (**`GET /api/categories`** ou **`GET /api/categories?…`**), o backend aceita o **mesmo** Bearer do webhook **desde que** envie **`X-MeuFinanceiro-User-Id`** (UUID) ou **`userId`** na query — igual ao fluxo `API_SECRET`. **Não** aplica a outros paths (ex.: `/api/transactions`).

- **JWT** — deve ser um **access token** válido do Supabase (**sessão não expirada**). Header: `Authorization: Bearer <access_token>`.

- **`API_SECRET` ou `API_SECRET_OP` (alternativa)** — se estiver configurada no backend (Easypanel / `.env`), pode usar **`Authorization: Bearer <valor>`** para chamadas servidor‑a‑servidor **sem** JWT. **`API_SECRET_OP`** é opcional: mesmo contrato que `API_SECRET` (útil quando já existe outro `API_SECRET` para outra integração). É **obrigatório** indicar o utilizador: header **`X-MeuFinanceiro-User-Id: <uuid>`** ou query **`userId=<uuid>`** ou **`user_id=<uuid>`**. Quem possui o segredo pode consultar categorias desse `user_id` — proteja os segredos.

## Autenticação

**Para `/api/categories`:**

- Header: `Authorization: Bearer <access_token Supabase válido>`
- Ou `Bearer <API_SECRET>` ou **`Bearer <API_SECRET_OP>`** — sempre com **`X-MeuFinanceiro-User-Id: <uuid>`**, **`userId`** ou **`user_id`** na query.
- Ou **`Bearer <OPENCLAW_WEBHOOK_SECRET>`** — **só** para **`GET /api/categories`** (qualquer query como `minimal=true`), com o mesmo header/query de utilizador-alvo.

## Método e URL

`GET /api/categories`

## Query opcional

| Parâmetro | Descrição |
|-----------|-----------|
| `type` ou `tipo` | Filtra por tipo de categoria: `entrada` ou `saída` / `saida` (alinha ao normalizador existente no serviço). |
| `minimal` | Se `true`, `1` ou `yes`, a lista em `data` contém apenas **`id`** e **`nome`** por item (contrato compacto para integrações). Omitir para o formato completo (`id`, `nome`, `tipo`, `user_id`) usado pelo frontend. |

## Resposta — sucesso (200)

Envelope padrão do backend:

```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "nome": "Alimentação"
    }
  ],
  "message": "Categorias listadas",
  "errors": null
}
```

Com `minimal` omitido ou falso, cada elemento de `data` inclui também `tipo` e `user_id`.

## Resposta — erro

`401` se token inválido/ausente; `400`/outros conforme `errorHandler` (ex.: erro Supabase ligado ao `badRequest`).

## Exemplo minimizado

```http
GET /api/categories?minimal=true HTTP/1.1
Authorization: Bearer <token>
Host: ...
```

### Exemplo com `API_SECRET`

```http
GET /api/categories?minimal=true HTTP/1.1
Authorization: Bearer <API_SECRET>
X-MeuFinanceiro-User-Id: 550e8400-e29b-41d4-a716-446655440000
```

(Equivalente: `GET /api/categories?minimal=true&userId=<uuid>` com o mesmo Bearer.)
