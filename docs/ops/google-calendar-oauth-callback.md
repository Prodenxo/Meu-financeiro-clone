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

---

## Tela “O Google não verificou este app”

Isso é a **tela de consentimento OAuth** do Google Cloud. O Meu Financeiro pede o escopo sensível `calendar.events` — fora do modo **Testing** com utilizadores de teste, o Google exige **verificação da app** para publicar em produção.

### Caminho A — Agora (desenvolvimento / beta fechada)

1. Abra [Google Cloud Console](https://console.cloud.google.com/) → projeto onde estão `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
2. **APIs e serviços** → **Tela de consentimento OAuth**.
3. Tipo de utilizador:
   - **Interno** — só contas do teu Google Workspace (some o aviso para utilizadores da org).
   - **Externo** — qualquer conta Gmail (caso típico do produto).
4. Deixe o estado em **Em teste** (Testing).
5. Em **Utilizadores de teste**, adicione **cada e-mail** que vai conectar o Calendar (até 100).
6. Em **APIs e serviços** → **Credenciais** → cliente OAuth **Web**:
   - **URIs de redirecionamento autorizados** deve incluir exatamente:
     `https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback`
   - Para dev web local, se usar popup em `localhost`, inclua também a origem que o app usa (ex.: `http://localhost:8081`).
7. **APIs e serviços** → **Biblioteca** → ative **Google Calendar API**.

Quem **não** estiver na lista de testadores continua a ver o aviso. Quem está pode clicar **Avançado** → **Aceder a Meu Financeiro (não seguro)** e concluir o fluxo.

### Caminho B — Produção (sumir o aviso para todos)

1. Na mesma **Tela de consentimento OAuth**, preencha de forma pública e estável:
   - **Nome da app**, **e-mail de suporte**, **logótipo**
   - **Domínios autorizados** (ex.: domínio do site em produção)
   - **Política de privacidade** (URL HTTPS obrigatória)
   - **Termos de serviço** (recomendado)
   - **Página inicial da app** (URL HTTPS)
2. Em **Scopes**, confirme apenas o necessário (hoje: `https://www.googleapis.com/auth/calendar.events`).
3. Clique **Publicar app** / **Enviar para verificação**.
4. No formulário de verificação Google, envie em geral:
   - Vídeo curto (1–3 min) mostrando login no Meu Financeiro → Configurações → Autorizar Google → evento na Agenda.
   - Texto explicando **por que** precisam do Calendar (sincronizar compromissos / lembretes de pagamento).
   - Confirmação de que tokens ficam no Supabase (`google_tokens_id`) e não são vendidos a terceiros.
5. Prazo típico: **alguns dias úteis a várias semanas** (escopos sensíveis).

Referência oficial: [Verification requirements](https://support.google.com/cloud/answer/9110914).

### Checklist rápido se ainda falhar após “verificar”

| Sintoma | O que conferir |
|--------|----------------|
| `UNAUTHORIZED_NO_AUTH_HEADER` no callback | Deploy com `verify_jwt = false` (secção acima) |
| Redirect mismatch | `GOOGLE_REDIRECT_URI` = URI exata no Google Cloud |
| Aviso “não verificado” | App em Testing sem o e-mail na lista **ou** verificação ainda pendente |
| Conecta mas some no refresh | Deploy da edge + política DELETE em `google_tokens_id` |

### Secrets (relembrar)

No Supabase → **Edge Functions** → `google-calendar`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` = `https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback`
