# Guia Rápido de Configuração

## ⚠️ IMPORTANTE: Configurações Necessárias

Para que a recuperação de senha funcione corretamente, você precisa configurar **DOIS** serviços:

### 1. Supabase (OBRIGATÓRIO)1

**Acesse**: [Painel do Supabase](https://app.supabase.com) > Seu Projeto > Authentication > URL Configuration

**Configure**:
- **Site URL**: `https://meu-financeiro-frontend.vercel.app`
- **Redirect URLs** (adicione uma por linha):
  ```
  https://meu-financeiro-frontend.vercel.app/reset-password
  https://meu-financeiro-frontend.vercel.app/**
  http://localhost:5173/reset-password
  http://localhost:5173/**
  ```

**Por quê?**: O Supabase precisa saber para onde redirecionar após o usuário clicar no link de recuperação.

📖 **Documentação completa**: Veja `CONFIGURACAO_SUPABASE.md`

### 2. Vercel (Frontend - produção)

**No projeto do frontend (Vercel)** configure as variáveis:
- `VITE_API_URL=https://meu-financeiro-backend.vercel.app`
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` conforme o Supabase

**Por quê?**: o frontend usa `VITE_API_URL` para decidir qual backend chamar em produção.

### 3. Render.com (se ainda estiver em uso)

**Acesse**: [Painel do Render](https://dashboard.render.com) > Seu Serviço > Settings

**Verifique**:
- ✅ Tipo: **Static Site**
- ✅ Build Command: `npm run build`
- ✅ Publish Directory: `dist`
- ✅ Environment: **Static**

**Se o `render.yaml` não estiver funcionando, configure manualmente**:
1. Vá em **Settings** > **Headers & Redirects**
2. Adicione uma regra:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Type**: Rewrite

**Por quê?**: O Render precisa redirecionar todas as rotas para `index.html` para que o React Router funcione.

📖 **Documentação completa**: Veja `DEPLOY.md`

## ✅ Checklist de Verificação

Antes de testar a recuperação de senha:

- [ ] Supabase: Site URL configurado
- [ ] Supabase: Redirect URLs configuradas
- [ ] Render: Tipo de serviço é "Static Site"
- [ ] Render: Publish Directory é "dist"
- [ ] Render: Rotas configuradas (via `render.yaml` ou manualmente)
- [ ] Build local funciona: `npm run build && npm run preview`
- [ ] Arquivo `dist/_redirects` existe após o build

## 🧪 Como Testar

1. Acesse: `https://meu-financeiro-frontend.vercel.app/forgot-password`
2. Digite um email cadastrado
3. Verifique o email recebido
4. Clique no link do email
5. **Deve redirecionar para**: `https://meu-financeiro-frontend.vercel.app/reset-password#access_token=...`

## ❌ Problemas Comuns

### Erro 404 ao acessar `/reset-password`

**Causa**: Render não está redirecionando rotas para `index.html`

**Solução**:
1. ⚠️ **IMPORTANTE**: O problema NÃO é no Supabase, é no Render!
2. Configure manualmente no painel do Render (veja `CORRIGIR_404_RENDER.md` para instruções detalhadas)
3. Vá em Settings > Headers & Redirects > Adicione Rewrite: `/*` → `/index.html`
4. Faça um novo deploy após configurar

### Link redireciona para página inicial em vez de `/reset-password`

**Causa**: Supabase não tem a URL configurada nas Redirect URLs

**Solução**:
1. Acesse o painel do Supabase
2. Adicione `https://meu-financeiro-frontend.vercel.app/reset-password` nas Redirect URLs
3. Salve as alterações
4. Solicite um novo link de recuperação

### Link expira muito rápido

**Causa**: Links de recuperação do Supabase expiram após 1 hora

**Solução**: Solicite um novo link de recuperação

## 📞 Precisa de Ajuda?

- **Erro 404 no Render**: Veja `CORRIGIR_404_RENDER.md` (GUIA PASSO A PASSO)
- **Supabase**: Veja `CONFIGURACAO_SUPABASE.md`
- **Render (geral)**: Veja `DEPLOY.md`
- **Código**: Verifique os logs do console do navegador

## 🚨 Problema de 404? Leia Isto Primeiro!

Se você está vendo **"Not Found"** ao acessar `/reset-password`:

1. **O Supabase está funcionando corretamente** ✅
2. **O problema é no Render** ❌
3. **Solução**: Configure manualmente no painel do Render
4. **Guia completo**: Abra `CORRIGIR_404_RENDER.md`

