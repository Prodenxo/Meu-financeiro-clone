# Relatório — solicitações de acesso

Histórico **sem tabela nova** e **sem alterar RLS** no Supabase.

## Como funciona

O app chama a API do backend (Easypanel), que usa **service role** no servidor:

`GET /api/admin/access-requests/report?limit=200`

Autenticação: JWT do usuário logado + papel **superadmin** (`requireSuperAdmin`).

## Onde ver no app

**Configurações → Solicitações de acesso → Histórico**

## Teste em localhost

1. Terminal — backend:

```bash
cd Site/backend
npm run dev
```

(API em `http://localhost:3333` por padrão.)

2. No `App/frontend/.env` (mantenha o Easypanel em `EXPO_PUBLIC_MEI_API_URL`):

```env
EXPO_PUBLIC_MEI_API_URL_DEV=http://localhost:3333
```

3. Reinicie o Expo (`npx expo start --clear`).

4. Confirme `CORS_ORIGIN` no `Site/backend/.env` incluindo `http://localhost:8081` (ou `*`).

Se a API apontar para o Easypanel **sem deploy** da rota nova, aparece `Cannot GET /api/admin/access-requests/report`.

## Deploy produção

Atualizar o **backend** no Easypanel. Variável do app: `EXPO_PUBLIC_MEI_API_URL` = URL do backend.

Opcional: deploy da Edge `manage-access-requests` (fallback do histórico se a rota GET ainda não existir na API).

## Dados exibidos

| Campo | Fonte |
|-------|--------|
| Solicitado em | `user_metadata.access_requested_at` ou data do vínculo |
| Aprovado em / Por quem | `access_approved_at` / `access_approved_by_email` (após deploy, nas novas aprovações) |
| Aprovações antigas | Aparecem como aprovadas; data exata de aprovação pode faltar |

## Limitações

- **Negados** não aparecem (usuário e empresa pendentes são removidos).
- Histórico vazio com API antiga: faça deploy do backend com a rota `/admin/access-requests/report`.

## WhatsApp (Z-API) — sem tabela nova

Com `ACCESS_REQUEST_WHATSAPP_NOTIFY_ENABLED=true` e Z-API já usada no DAS/NFSe:

| Evento | Quem recebe | Origem do telefone |
|--------|-------------|-------------------|
| Nova solicitação (`submit`) | **Todos** com cargo superadmin | `profiles.role = superadmin` **ou** vínculo activo em `role_x_user_x_empresa` com role superadmin → `n8n_link` / metadata |
| Aprovação (`approve` na app ou WhatsApp) | Solicitante | `n8n_link` / metadata do cadastro |

### Aprovar pelo WhatsApp (superadmin)

**Com webhook Z-API no n8n (sem mudar painel):** o **OpenClaw (Midas)** aprova via API  
`POST /api/bot/openclaw/action` — actions `list_access_requests`, `approve_access_request`, `reject_access_request` (só superadmin).  
No WhatsApp: *"lista cadastros pendentes"*, *"aprovar acesso milena@email.com"*, *"mf pendentes"*.

**Com webhook no backend** (opcional): comandos `mf pendentes` / `mf aprovar` no inbound Z-API.

O telefone do remetente tem de estar em `n8n_link` ligado a um utilizador **superadmin**.

| Comando | Ação |
|---------|------|
| `/aprovar <e-mail ou CNPJ>` | Aprova o cadastro pendente (mesma lógica da app) |
| `/rejeitar <e-mail ou CNPJ>` | Recusa e remove utilizador pendente |
| `mf pendentes` | Lista pendentes com linha `mf aprovar …` para copiar |
| `mf ajuda` | Mostra comandos |

**Formato recomendado:** `mf pendentes`, `mf aprovar email@…` (sem `/` — o OpenClaw trata `/` como comando dele).

Na notificação de nova solicitação já vem o texto pronto, por exemplo:

```
mf aprovar milenapaes779@gmail.com
```

Também aceita CNPJ só com dígitos ou UUID do utilizador. Áudio transcrito com o mesmo texto funciona.

**SOUL OpenClaw:** **opcional** para estes comandos (o backend já bloqueia `/` no relay). Para outras regras do bot: `docs/ops/deploy-soul-sem-b64.md` (curl Git, 1 colagem — sem partes b64).

Opcional: `ACCESS_REQUEST_NOTIFY_SUPERADMIN_EXTRA_PHONES` (vírgula) para números fixos além da BD.

Cada superadmin precisa ter **telefone no perfil da app** (grava em `n8n_link`) para receber o aviso.

Falha no WhatsApp **não** bloqueia submit/approve (só log `[access-request-whatsapp]`).

Deploy: reinicie o backend no Easypanel após alterar env.

## Erro «Não autenticado» (401) na tela Pendentes

A app chama a Edge `manage-access-requests`, que valida o **JWT do utilizador** (não é causado pelo envio Z-API).

| Causa | O que fazer |
|-------|-------------|
| Sessão expirada | Sair e entrar de novo na app |
| Edge sem segredos | Supabase → Edge Functions → Secrets: `ACCESS_REQUEST_INTERNAL_SECRET` **igual** ao backend; `MEU_FINANCEIRO_API_URL` = URL do backend |
| Token não ia no invoke (web) | App usa `lib/manage-access-requests.ts` com `Authorization` explícito — atualize o frontend |

Se após login continuar 401: no Supabase Dashboard → Functions → `manage-access-requests` → Logs.
