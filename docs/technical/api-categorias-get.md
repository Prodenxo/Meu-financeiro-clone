# API — GET /api/categories

Liste as categorias do utilizador autenticado (**mesmo `user_id` do token JWT ou fluxo válido por `requireAuth`**).

## Variáveis de ambiente (OpenClaw / integrações)

- **`MF_API_URL`** — usar **apenas** para chamadas **`POST`** a **`/api/bot/openclaw/action`**. O header **`Authorization: Bearer`** deve ser **`OPENCLAW_WEBHOOK_SECRET`** (o mesmo valor definido no backend). **Não** usar este URL nem este Bearer para `GET /api/categories`.

- **`MF_API_BASE`** — URL base do backend **sem** barra no fim (ex.: `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host`). Para listagem compacta de categorias, o path recomendado é **`/api/categories?minimal=true`** (prefixo **`/api`** obrigatório). Lista completa: **`GET /api/categories`** (sem `minimal`).

- **JWT** — deve ser um **access token** válido do Supabase (**sessão não expirada**). Header: `Authorization: Bearer <access_token>`.

- **`API_SECRET` (alternativa)** — se estiver configurada no backend (Easypanel / `.env`), pode usar **`Authorization: Bearer <API_SECRET>`** para chamadas servidor‑a‑servidor **sem** JWT. É **obrigatório** indicar de qual utilizador são os dados: header **`X-MeuFinanceiro-User-Id: <uuid>`** (UUID Supabase do utilizador) ou query **`userId=<uuid>`**. Quem possui o segredo pode consultar categorias desse `user_id` — proteja o `API_SECRET`.

## Autenticação

**Para `/api/categories`:**

- Header: `Authorization: Bearer <access_token Supabase válido>`
- Ou `Bearer <API_SECRET>` (variável **`API_SECRET`** no backend) — sempre com **`X-MeuFinanceiro-User-Id: <uuid>`** ou **`userId`** na query, para definir o utilizador-alvo.

**(Estas opções não substituem o Bearer `OPENCLAW_WEBHOOK_SECRET` — esse só vale para `POST /api/bot/openclaw/action`.)**

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
