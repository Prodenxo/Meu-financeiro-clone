# Google Calendar OAuth — callback e deploy

## Erro `UNAUTHORIZED_NO_AUTH_HEADER` no callback

O Google redireciona o navegador para:

`https://<project-ref>.supabase.co/functions/v1/google-calendar/callback?code=...&state=...`

Essa requisição **não** traz JWT do Supabase. Com `verify_jwt = true` (padrão), o gateway bloqueia antes do código da função rodar.

### Correção

A função `google-calendar` deve ser publicada com **`verify_jwt = false`** (já configurado em `Site/backend/supabase/functions/google-calendar/config.toml`).

Rotas protegidas (`/auth`, `/events`, `/check-auth`, etc.) continuam exigindo `Authorization: Bearer <jwt>` **dentro** do código da edge.

### Deploy (pasta canônica)

```bash
cd Site/backend
supabase link --project-ref iqcupswgotsuncysagmj
supabase functions deploy google-calendar
```

Alternativa explícita (se o `config.toml` não for aplicado):

```bash
supabase functions deploy google-calendar --no-verify-jwt
```

### Secrets obrigatórios (Dashboard → Edge Functions → google-calendar)

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` = `https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback`

### Desconectar (`DELETE /disconnect`)

O app chama `DELETE .../google-calendar/disconnect`. A edge precisa expor `DELETE` no CORS e implementar a rota (revoga token no Google + apaga `google_tokens_id`).

### Teste rápido

Abra no navegador (sem estar logado no Supabase):

`https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/test-public`

Deve retornar JSON, **não** `UNAUTHORIZED_NO_AUTH_HEADER`.

Depois do deploy:

- **Web (`localhost` / produção):** redirect HTTP 302 para `/configuracoes?googleCalendar=connected` (popup fecha sozinho).
- **App nativo:** página mínima “Voltando ao app…” + deep link `financas-pessoais://google-callback` (não deve aparecer HTML cru no popup).
