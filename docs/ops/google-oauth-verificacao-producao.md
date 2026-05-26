# Google OAuth — Caminho B (verificação em produção)

Playbook para remover a tela **“O Google não verificou este app”** para qualquer utilizador.

**Projeto Supabase:** `iqcupswgotsuncysagmj`  
**Redirect OAuth (fixo):** `https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback`  
**Scope usado pela app:** `https://www.googleapis.com/auth/calendar.events`  
**Domínio de produção (referência):** `meiinfinito.com.br` — ajuste se o marketing usar outro.

---

## Visão geral (4 fases)

| Fase | Quem | Objetivo |
|------|------|----------|
| 1 | Produto + Jurídico | Páginas públicas (privacidade, termos, homepage) |
| 2 | DevOps | Google Cloud + Supabase alinhados |
| 3 | Produto + Dev | Vídeo + formulário de verificação Google |
| 4 | DevOps | Publicar app + smoke test pós-aprovação |

Prazo típico após envio: **5–15 dias úteis** (pode ir além em escopos sensíveis).

---

## Fase 1 — Pré-requisitos no site (obrigatório)

O Google **rejeita** pedidos sem URLs HTTPS públicas e estáveis.

### 1.1 Política de Privacidade

Publicar em URL fixa, por exemplo:

- `https://meiinfinito.com.br/privacidade`

Deve mencionar explicitamente:

- Que a app acede ao **Google Calendar** (criar/ler/atualizar eventos do utilizador).
- Que tokens OAuth ficam armazenados de forma segura (Supabase / backend).
- Finalidade: sincronizar compromissos financeiros e lembretes na Agenda.
- Como pedir eliminação de dados e revogar acesso (desconectar em Configurações + apagar conta se existir).
- E-mail de contacto para privacidade (ex.: `privacidade@meiinfinito.com.br`).
- **Obrigatório para verificação Google (API):** secção explícita sobre **com quem compartilha, transfere ou divulga dados de utilizador do Google** (Supabase, Google API, hospedagem — e que **não** vende nem usa para ads/IA/credit scoring). Ver [App Privacy Policy](https://support.google.com/cloud/answer/13806988?hl=pt-BR).

> Rotas no `Site/frontend`: `/privacidade` e `/termos` (públicas, sem login). Fazer deploy do frontend antes do envio ao Google.

### 1.2 Termos de uso (recomendado)

- `https://meiinfinito.com.br/termos`

### 1.3 Página inicial da aplicação

- `https://meiinfinito.com.br/` (landing ou login público)
- O Google exige **link HTML** `<a href="/privacidade">Política de Privacidade</a>` visível na homepage (não só botão React). O App usa `LegalWebLink` + `LegalHomepageStrip` na landing.

### 1.4 Checklist Fase 1

- [ ] URLs abrem sem login em navegador anónimo
- [ ] HTTPS válido (certificado)
- [ ] Links no rodapé do login apontam para `/privacidade` e `/termos`
- [ ] Homepage (`/`) mostra **Política de Privacidade** como link clicável (hero + rodapé)

### 1.5 Verificação “em análise” — não há botão de reenviar

Quando o painel mostra **“Sua marca e acesso aos dados estão em análise”**:

1. **Não existe** botão “pedir análise de novo” no Console — é normal.
2. Se aparecer item vermelho (ex.: *Requisitos da página inicial*), **corrija o site**, faça deploy e só então **responda ao e-mail** da Equipe de Confiança e Segurança (thread que o Google enviou).
3. A reanálise continua **por e-mail** depois que todos os problemas listados em “Progresso da verificação” estiverem resolvidos.
4. Prazo típico: vários dias úteis após a resposta.

---

## Fase 2 — Google Cloud Console

### 2.1 Acesso

1. [Google Cloud Console](https://console.cloud.google.com/)
2. Selecionar o projeto que contém o **OAuth Client ID** usado em `GOOGLE_CLIENT_ID` no Supabase.

### 2.2 APIs

1. **APIs e serviços** → **Biblioteca**
2. Confirmar **Google Calendar API** = **Ativada**

### 2.3 Tela de consentimento OAuth

**APIs e serviços** → **Tela de consentimento OAuth**

| Campo | Valor sugerido |
|-------|----------------|
| Tipo de utilizador | **Externo** (qualquer Gmail) |
| Nome da app | Meu Financeiro |
| E-mail de suporte | suporte@… (caixa monitorizada) |
| Logótipo | PNG 120×120, fundo sólido |
| Domínio da app | `meiinfinito.com.br` |
| Página inicial | `https://meiinfinito.com.br/` |
| Política de privacidade | `https://meiinfinito.com.br/privacidade` |
| Termos de serviço | `https://meiinfinito.com.br/termos` |

**Domínios autorizados** (sem `https://`):

- `meiinfinito.com.br`
- `iqcupswgotsuncysagmj.supabase.co` (callback na edge)

### 2.4 Scopes

Em **Dados sensíveis** / editar scopes, manter **apenas**:

- `.../auth/calendar.events`  
  (descrição para o revisor: “Sincronizar eventos de pagamentos e compromissos na Agenda do utilizador.”)

Não pedir scopes extra (Gmail, Drive, etc.) — atrasa ou barra a verificação.

### 2.5 Credenciais OAuth

**APIs e serviços** → **Credenciais** → cliente **Aplicação Web**

**URIs de redirecionamento autorizados** (exatamente):

```
https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback
```

Opcional para dev (não substitui produção):

```
http://localhost:8081
```

Copiar **ID do cliente** e **Segredo** → atualizar secrets da edge no Supabase (Fase 2.6).

### 2.6 Supabase (secrets + deploy)

Dashboard → **Project Settings** → **Edge Functions** → `google-calendar`:

| Secret | Valor |
|--------|--------|
| `GOOGLE_CLIENT_ID` | do passo 2.5 |
| `GOOGLE_CLIENT_SECRET` | do passo 2.5 |
| `GOOGLE_REDIRECT_URI` | `https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/callback` |

Deploy:

```bash
cd Site/backend
supabase link --project-ref iqcupswgotsuncysagmj
supabase functions deploy google-calendar
```

Teste público:

`https://iqcupswgotsuncysagmj.supabase.co/functions/v1/google-calendar/test-public`  
→ deve retornar JSON, não `UNAUTHORIZED_NO_AUTH_HEADER`.

### 2.7 Checklist Fase 2

- [ ] Calendar API ativa
- [ ] Consent screen preenchida com URLs reais
- [ ] Redirect URI idêntica em Google + `GOOGLE_REDIRECT_URI`
- [ ] Edge deployada

---

## Fase 3 — Enviar verificação ao Google

### 3.1 Gravar vídeo (1–3 min, 720p+)

Roteiro sugerido (sem cortes confusos):

1. Abrir `https://meiinfinito.com.br` (ou app web Expo em produção).
2. Login com conta **real** (não conta de teste vazia).
3. Ir a **Configurações** → **Google Agenda** → **Autorizar com Google**.
4. Mostrar ecrã de consentimento Google (scope Calendar).
5. Concluir OAuth → mensagem de sucesso.
6. Abrir **Agenda** → mostrar evento Google ou criar um evento de teste.
7. (Opcional) **Desconectar** em Configurações.

Upload: YouTube **não listado** ou ficheiro no formulário Google.

### 3.2 Texto para o formulário (copiar/adaptar)

**Por que precisa do scope?**  
> O Meu Financeiro permite que o utilizador veja e gira compromissos financeiros na Agenda, incluindo eventos sincronizados com o Google Calendar (criar, editar e remover eventos no calendário principal do utilizador).

**Como os dados são usados?**  
> Os tokens OAuth são guardados de forma encriptada no nosso backend (Supabase). Usamos o acesso apenas para operações de calendário solicitadas pelo utilizador na app. Não vendemos nem partilhamos dados com terceiros para publicidade.

**Como revogar?**  
> O utilizador pode desconectar em Configurações → Google Agenda, ou revogar o acesso em https://myaccount.google.com/permissions

### 3.3 Submeter

1. Tela de consentimento → **Publicar app** / **Prepare for verification**
2. Preencher questionário (tipo de app: **Web** + **Mobile** se aplicável)
3. Anexar vídeo + URLs das Fases 1 e 2
4. Submeter e guardar o **ticket / case ID**

### 3.4 Enquanto aguarda

- Manter app em **Testing** + testadores para o time não ficar bloqueado.
- Responder e-mails do Google em **48h** (pedidos de esclarecimento são comuns).

### 3.5 Checklist Fase 3

- [ ] Vídeo gravado e acessível
- [ ] Formulário enviado
- [ ] Case ID anotado internamente

---

## Fase 4 — Após aprovação

1. Na Tela de consentimento → estado **Em produção** / **Published**.
2. Remover dependência só de “utilizadores de teste” (opcional manter lista vazia).
3. Smoke test com conta **fora** da lista de testadores:
   - Autorizar Google em Configurações
   - Ver eventos na Agenda
   - Desconectar
4. Monitorar erros na edge (logs Supabase) na primeira semana.

---

## Responsabilidades sugeridas (time)

| Papel | Tarefas |
|-------|---------|
| **PO / Produto** | Textos privacidade, roteiro do vídeo, respostas ao Google |
| **Jurídico** (se houver) | Revisão da política de privacidade |
| **Frontend Site** | Rotas `/privacidade` e `/termos` + links no login |
| **DevOps** | Google Cloud, secrets, deploy edge |
| **QA** | Smoke OAuth pós-aprovação com conta externa |

---

## Referências

- [Google verification requirements](https://support.google.com/cloud/answer/9110914)
- [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
- Callback/deploy: [google-calendar-oauth-callback.md](./google-calendar-oauth-callback.md)
