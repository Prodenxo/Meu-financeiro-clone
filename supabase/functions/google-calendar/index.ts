import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:5173'

serve(async (req) => {
  // Handle CORS preflight requests
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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente não configuradas')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Criar cliente Supabase
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obter usuário autenticado
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const getValidAccessToken = async () => {
      const { data: tokens, error: tokensError } = await supabaseClient
        .from('google_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .single()

      if (tokensError || !tokens || !tokens.access_token) {
        return { error: 'Não autenticado no Google Calendar' }
      }

      let accessToken = tokens.access_token

      if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
        if (tokens.refresh_token) {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID || '',
              client_secret: GOOGLE_CLIENT_SECRET || '',
              refresh_token: tokens.refresh_token,
              grant_type: 'refresh_token',
            }),
          })

          if (tokenResponse.ok) {
            const newTokens = await tokenResponse.json()
            accessToken = newTokens.access_token
            const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

            await supabaseClient
              .from('google_tokens')
              .update({
                access_token: newTokens.access_token,
                expires_at: expiresAt,
              })
              .eq('user_id', user.id)
          }
        }
      }

      return { accessToken }
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/google-calendar', '') || '/'
    const method = req.method

    // GET /check-auth - Verificar se está autenticado no Google
    if (method === 'GET' && path === '/check-auth') {
      // Buscar tokens do usuário no banco de dados
      const { data: tokens, error } = await supabaseClient
        .from('google_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .single()

      if (error || !tokens || !tokens.access_token) {
        return new Response(
          JSON.stringify({ authenticated: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se o token expirou
      if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
        // Token expirado, tentar renovar
        if (tokens.refresh_token) {
          try {
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID || '',
                client_secret: GOOGLE_CLIENT_SECRET || '',
                refresh_token: tokens.refresh_token,
                grant_type: 'refresh_token',
              }),
            })

            if (tokenResponse.ok) {
              const newTokens = await tokenResponse.json()
              const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

              await supabaseClient
                .from('google_tokens')
                .update({
                  access_token: newTokens.access_token,
                  expires_at: expiresAt,
                })
                .eq('user_id', user.id)

              return new Response(
                JSON.stringify({ authenticated: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } catch (refreshError) {
            console.error('Erro ao renovar token:', refreshError)
          }
        }

        return new Response(
          JSON.stringify({ authenticated: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ authenticated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /auth - Iniciar fluxo OAuth
    if (method === 'GET' && path === '/auth') {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_CLIENT_ID não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const state = crypto.randomUUID()
      const scope = 'https://www.googleapis.com/auth/calendar'

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      // Salvar state no banco para validação posterior
      await supabaseClient
        .from('oauth_states')
        .insert({ user_id: user.id, state, expires_at: new Date(Date.now() + 600000).toISOString() })

      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /events - Listar eventos do Google Calendar
    if (method === 'GET' && path === '/events') {
      const now = new Date()
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      const timeMin = url.searchParams.get('timeMin') || defaultStart.toISOString()
      const timeMax = url.searchParams.get('timeMax') || defaultEnd.toISOString()

      const tokenResult = await getValidAccessToken()
      if (tokenResult.error || !tokenResult.accessToken) {
        return new Response(
          JSON.stringify({ error: tokenResult.error || 'Não autenticado no Google Calendar' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
      calendarUrl.searchParams.set('timeMin', timeMin)
      calendarUrl.searchParams.set('timeMax', timeMax)
      calendarUrl.searchParams.set('singleEvents', 'true')
      calendarUrl.searchParams.set('orderBy', 'startTime')

      const calendarResponse = await fetch(calendarUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResult.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!calendarResponse.ok) {
        const error = await calendarResponse.json()
        return new Response(
          JSON.stringify({ error: error.error?.message || 'Erro ao listar eventos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await calendarResponse.json()
      const items = Array.isArray(data.items) ? data.items : []
      const events = items.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: item.start,
        end: item.end,
        status: item.status,
      }))

      return new Response(
        JSON.stringify({ events }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /callback - Processar callback OAuth
    if (method === 'POST' && path === '/callback') {
      const { code, state } = await req.json()

      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: 'Código ou state não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar state
      const { data: stateData, error: stateError } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('state', state)
        .single()

      if (stateError || !stateData || new Date(stateData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'State inválido ou expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Trocar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json()
        return new Response(
          JSON.stringify({ error: error.error || 'Erro ao obter tokens' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokens = await tokenResponse.json()
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      // Salvar tokens no banco
      const { error: saveError } = await supabaseClient
        .from('google_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
        }, { onConflict: 'user_id' })

      if (saveError) {
        return new Response(
          JSON.stringify({ error: saveError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Remover state usado
      await supabaseClient
        .from('oauth_states')
        .delete()
        .eq('state', state)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /create-event - Criar evento no Google Calendar
    if (method === 'POST' && path === '/create-event') {
      const event = await req.json()

      const tokenResult = await getValidAccessToken()
      if (tokenResult.error || !tokenResult.accessToken) {
        return new Response(
          JSON.stringify({ error: tokenResult.error || 'Não autenticado no Google Calendar' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar evento no Google Calendar
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResult.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })

      if (!calendarResponse.ok) {
        const error = await calendarResponse.json()
        return new Response(
          JSON.stringify({ error: error.error?.message || 'Erro ao criar evento' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const createdEvent = await calendarResponse.json()

      return new Response(
        JSON.stringify({ success: true, eventId: createdEvent.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Erro não tratado na Edge Function google-calendar:', {
      message: error.message,
      stack: error.stack
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
