import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

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

    const method = req.method
    const url = new URL(req.url)
    const tipo = url.searchParams.get('type')

    // GET - Listar categorias
    if (method === 'GET') {
      // Buscar categorias do usuário
      const { data: userCategories, error: userError } = await supabaseClient
        .from('categorias_id')
        .select('id, nome, tipo, user_id')
        .eq('user_id', user.id)

      if (userError) {
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar categorias globais (user_id é null)
      const { data: globalCategories, error: globalError } = await supabaseClient
        .from('categorias_id')
        .select('id, nome, tipo, user_id')
        .is('user_id', null)

      if (globalError) {
        return new Response(
          JSON.stringify({ error: globalError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Combinar e ordenar as categorias
      const allCategories = [
        ...(userCategories || []),
        ...(globalCategories || [])
      ]

      // Filtrar por tipo se fornecido
      let filteredCategories = allCategories
      if (tipo) {
        const tipoNormalizado = tipo === 'saída' ? 'saída' : tipo
        const tipoAlternativo = tipo === 'saída' ? 'saida' : null
        filteredCategories = allCategories.filter(cat => 
          cat.tipo === tipoNormalizado || cat.tipo === tipoAlternativo
        )
      }

      // Ordenar por nome
      const sortedCategories = filteredCategories.sort((a, b) => 
        a.nome.localeCompare(b.nome)
      )

      return new Response(
        JSON.stringify(sortedCategories),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Criar categoria
    if (method === 'POST') {
      const { nome, tipo } = await req.json()

      if (!nome || !tipo) {
        return new Response(
          JSON.stringify({ error: 'Nome e tipo são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: newCategory, error } = await supabaseClient
        .from('categorias_id')
        .insert({ nome, tipo, user_id: user.id })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(newCategory),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT - Atualizar categoria
    if (method === 'PUT') {
      const { id, ...updates } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID da categoria é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: updatedCategory, error } = await supabaseClient
        .from('categorias_id')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(updatedCategory),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Deletar categoria
    if (method === 'DELETE') {
      let id: number;
      
      // Tentar obter ID do body ou da query string
      const url = new URL(req.url);
      const idParam = url.searchParams.get('id');
      
      if (idParam) {
        id = parseInt(idParam, 10);
      } else {
        try {
          const body = await req.json();
          id = body.id;
        } catch {
          return new Response(
            JSON.stringify({ error: 'ID da categoria é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID da categoria é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseClient
        .from('categorias_id')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

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
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Erro não tratado na Edge Function categories:', {
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
