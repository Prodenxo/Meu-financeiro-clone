# API — GET /api/categories

Liste as categorias do utilizador autenticado (**mesmo `user_id` do token JWT ou fluxo válido por `requireAuth`**).

## Autenticação

- Header: `Authorization: Bearer <access_token>`
- Ou `Bearer <API_SECRET>` se o projeto tiver configurado **`API_SECRET`** e o cliente usar esse token (automações).

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
