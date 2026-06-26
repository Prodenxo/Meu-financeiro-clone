import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ROLE_DEFAULT = 'usuario'

const roleToDbValue = (role: string | null) => {
  if (!role) return null
  if (role === 'usuario') return 'user'
  return role
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests - DEVE retornar antes de qualquer processamento
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight request recebido')
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Validação de variáveis de ambiente críticas
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente não configuradas:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      })
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Requisição recebida:', {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!req.headers.get('Authorization')
    })
    
    const url = new URL(req.url)
    const path = url.pathname.replace('/auth', '') || '/'
    const method = req.method
    
    // Para operações de autenticação (signup, signin), não precisamos de token
    // Para outras operações, precisamos do token do usuário
    const authHeader = req.headers.get('Authorization')
    
    // Para operações de autenticação (signup, signin), usar Service Role Key se disponível
    // Para outras operações que precisam do usuário autenticado, usar Anon Key com token
    const isAuthOperation = (method === 'POST' && (path === '/signup' || path === '/signin')) ||
                            (method === 'POST' && path === '/reset-password') ||
                            (method === 'POST' && path === '/process-recovery-hash') ||
                            (method === 'POST' && path === '/exchange-code-for-session')
    
    // Usar Service Role Key para operações de auth no servidor (mais seguro)
    // Fallback para Anon Key se Service Role não estiver disponível
    const keyToUse = (isAuthOperation && supabaseServiceKey) ? supabaseServiceKey : supabaseAnonKey
    
    // Determinar headers para o cliente Supabase
    // Para operações de auth com Service Role Key, passar Authorization header com a key
    // Para outras operações autenticadas, usar o token do usuário
    let clientHeaders: Record<string, string> = {}
    
    if (isAuthOperation && supabaseServiceKey) {
      // Para operações de auth com Service Role Key, passar a key no header Authorization
      clientHeaders = { Authorization: `Bearer ${supabaseServiceKey}` }
    } else if (!isAuthOperation && authHeader) {
      // Para outras operações, usar o token do usuário
      clientHeaders = { Authorization: authHeader }
    }
    
    // Criar cliente Supabase
    const supabaseClient = createClient(
      supabaseUrl,
      keyToUse,
      {
        global: {
          headers: clientHeaders,
        },
      }
    )

    // Rotas de autenticação
    if (method === 'POST' && path === '/signup') {
      const { email, password, phone, displayName } = await req.json()

      // Remove o "+" do telefone antes de salvar
      const cleanedPhone = phone?.startsWith('+') ? phone.substring(1) : phone

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: cleanedPhone,
            display_name: displayName || null,
          },
        },
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = data.user?.id
      const userPhone = cleanedPhone || data.user?.user_metadata?.phone

      if (userId && supabaseServiceKey) {
        const adminClient = createClient(
          supabaseUrl,
          supabaseServiceKey,
          {
            global: {
              headers: { Authorization: `Bearer ${supabaseServiceKey}` },
            },
          }
        )

        await adminClient
          .from('profiles')
          .insert({ id: userId, role: ROLE_DEFAULT })
          .select('role')
          .single()

        const roleLookup = roleToDbValue(ROLE_DEFAULT)
        const { data: roleData, error: roleError } = await adminClient
          .from('roles')
          .select('id')
          .ilike('roles', roleLookup ?? '')
          .maybeSingle()

        if (roleError || !roleData?.id) {
          return new Response(
            JSON.stringify({ error: roleError?.message || 'Role não encontrada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: linkError } = await adminClient
          .from('role_x_user_x_empresa')
          .insert({
            user_id: userId,
            roles_id: roleData.id,
            empresas_id: null,
            status: true,
            mei: false
          })

        if (linkError) {
          return new Response(
            JSON.stringify({ error: linkError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Sincronizar telefone com n8n_link se fornecido
      if (userId && userPhone) {
        try {
          const { error: syncError } = await supabaseClient
            .from('n8n_link')
            .upsert(
              { user_id: userId, user_number: cleanedPhone },
              { onConflict: 'user_id' }
            )

          if (syncError) {
            console.error('Erro ao sincronizar telefone:', syncError)
            // Não falhar o registro se a sincronização falhar
          }
        } catch (syncError) {
          console.error('Erro ao sincronizar telefone:', syncError)
        }
      }

      return new Response(
        JSON.stringify({
          user: data.user,
          userId,
          phone: userPhone,
          displayName: displayName || data.user?.user_metadata?.display_name || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path === '/signin') {
      const { email, password } = await req.json()

      console.log('Tentando fazer login para:', email)

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erro no login:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Login bem-sucedido:', {
        userId: data.user?.id,
        hasSession: !!data.session,
        hasAccessToken: !!data.session?.access_token
      })

      return new Response(
        JSON.stringify({
          user: data.user,
          userId: data.user?.id || null,
          phone: data.user?.user_metadata?.phone || null,
          displayName: data.user?.user_metadata?.display_name || null,
          session: data.session,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path === '/signout') {
      // Para signout, precisamos do token do usuário
      if (!authHeader) {
        // Se não houver token, ainda retornar sucesso (logout local)
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar cliente com o token do usuário
      const logoutClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )

      const { error } = await logoutClient.auth.signOut()

      if (error) {
        // Mesmo se houver erro, retornar sucesso (logout local já foi feito)
        console.error('Erro ao fazer logout no backend:', error.message)
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'GET' && path === '/session') {
      // Para /session, precisamos do token do usuário
      if (!authHeader) {
        return new Response(
          JSON.stringify({ session: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar cliente com o token do usuário
      const sessionClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )

      // Tentar obter sessão usando getUser ao invés de getSession
      // getSession não funciona bem em Edge Functions
      try {
        const { data: { user }, error: userError } = await sessionClient.auth.getUser()
        
        if (userError || !user) {
          return new Response(
            JSON.stringify({ session: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Construir objeto de sessão a partir do usuário
        // Nota: Em Edge Functions, não temos acesso direto à sessão completa
        // Mas podemos retornar os dados do usuário que o frontend precisa
        const session = {
          user: user,
          access_token: authHeader.replace('Bearer ', ''),
        }

        return new Response(
          JSON.stringify({ session }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error: any) {
        return new Response(
          JSON.stringify({ session: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (method === 'POST' && path === '/reset-password') {
      const { email } = await req.json()
      const origin = req.headers.get('origin') || 'http://localhost:5173'

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /process-recovery-hash - Processa hash de recuperação de senha da URL
    if (method === 'POST' && path === '/process-recovery-hash') {
      const { access_token, refresh_token, type } = await req.json()

      if (type !== 'recovery' || !access_token) {
        return new Response(
          JSON.stringify({ error: 'Hash inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar cliente com o token de recuperação
      const recoveryClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: `Bearer ${access_token}` },
          },
        }
      )

      // Verificar se o token é válido e obter sessão
      const { data: { session }, error } = await recoveryClient.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      })

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: error?.message || 'Token inválido ou expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /exchange-code-for-session - Suporta fluxo PKCE (link com ?code=...)
    if (method === 'POST' && path === '/exchange-code-for-session') {
      const { code } = await req.json()

      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Código de recuperação ausente' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: { session }, error } = await supabaseClient.auth.exchangeCodeForSession(code)

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: error?.message || 'Código inválido ou expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path === '/update-password') {
      const { newPassword } = await req.json()

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path === '/update-phone') {
      const { phone } = await req.json()

      // Obter usuário atual
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const cleanedPhone = String(phone).replace(/\D/g, '').replace(/^\+/, '')

      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: { phone: cleanedPhone },
      })

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      if (!serviceRoleKey) {
        return new Response(
          JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey)
      const variants = new Set<string>([cleanedPhone])
      if (cleanedPhone.startsWith('55') && cleanedPhone.length > 11) {
        variants.add(cleanedPhone.slice(2))
      }
      if (!cleanedPhone.startsWith('55') && cleanedPhone.length >= 10) {
        variants.add(`55${cleanedPhone}`)
      }

      for (const num of variants) {
        await adminClient.from('n8n_link').delete().eq('user_number', num).neq('user_id', user.id)
      }

      const { error: syncError } = await adminClient
        .from('n8n_link')
        .upsert(
          { user_id: user.id, user_number: cleanedPhone },
          { onConflict: 'user_id' }
        )

      if (syncError) {
        console.error('Erro ao sincronizar telefone:', syncError)
        // Não falhar se a sincronização falhar
      }

      return new Response(
        JSON.stringify({ phone: cleanedPhone }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST' && path === '/update-display-name') {
      const { displayName } = await req.json()

      const { error } = await supabaseClient.auth.updateUser({
        data: { display_name: displayName },
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Erro não tratado na Edge Function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: Deno.env.get('DENO_ENV') === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
