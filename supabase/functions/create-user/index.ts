/**
 * Fallback legado — produção com EXPO_PUBLIC_MEI_API_URL deve usar POST /api/users no backend.
 * MEI só com mei:true explícito no body; default false.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'Configuração do servidor incompleta' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: authData } = await userClient.auth.getUser()
    const requesterId = authData?.user?.id
    if (!requesterId) {
      return json({ error: 'Não autenticado' }, 401)
    }

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '').trim()
    const displayName = body?.displayName ? String(body.displayName).trim() : null
    const phone = body?.phone ? String(body.phone).replace(/\D/g, '') : null
    const roleInput = String(body?.role || 'usuario').trim().toLowerCase()
    const empresaId = body?.empresaId ? String(body.empresaId) : null
    const targetMei = body?.mei === true

    if (!email) {
      return json({ error: 'Email é obrigatório' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: requesterLink } = await admin
      .from('role_x_user_x_empresa')
      .select('empresas_id, roles_id')
      .eq('user_id', requesterId)
      .eq('status', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: requesterRoleRow } = requesterLink?.roles_id
      ? await admin.from('roles').select('roles').eq('id', requesterLink.roles_id).maybeSingle()
      : { data: null }

    const requesterRole = String(requesterRoleRow?.roles || '').toLowerCase()
    const isSuperadmin = requesterRole === 'superadmin'
    const isAdmin = requesterRole === 'admin'

    if (!isSuperadmin && !isAdmin) {
      return json({ error: 'Sem permissão' }, 403)
    }

    let finalEmpresaId = requesterLink?.empresas_id || null
    let finalRole = roleInput === 'admin' ? 'admin' : 'usuario'

    if (isSuperadmin) {
      if (!empresaId) {
        return json({ error: 'Empresa é obrigatória' }, 400)
      }
      finalEmpresaId = empresaId
      if (!['admin', 'usuario', 'outsider'].includes(roleInput)) {
        return json({ error: 'Role inválida' }, 400)
      }
      finalRole = roleInput === 'user' ? 'usuario' : roleInput
    }

    if (!finalEmpresaId) {
      return json({ error: 'Empresa é obrigatória' }, 400)
    }

    const { data: roleRows } = await admin.from('roles').select('id, roles')
    const roleRow = (roleRows || []).find((r) => {
      const n = String(r.roles || '').toLowerCase()
      return n === finalRole || (finalRole === 'usuario' && n === 'user')
    })

    if (!roleRow?.id) {
      return json({ error: 'Role não encontrada' }, 400)
    }

    const finalPassword = password || crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        phone: phone || null,
      },
    })

    if (createErr || !created?.user?.id) {
      return json({ error: createErr?.message || 'Erro ao criar usuário' }, 400)
    }

    const userId = created.user.id

    const { error: linkErr } = await admin.from('role_x_user_x_empresa').insert({
      user_id: userId,
      roles_id: roleRow.id,
      empresas_id: finalEmpresaId,
      status: true,
      mei: targetMei,
    })

    if (linkErr) {
      await admin.auth.admin.deleteUser(userId)
      return json({ error: linkErr.message }, 400)
    }

    if (phone) {
      await admin.from('n8n_link').upsert(
        { user_id: userId, user_number: phone.startsWith('55') ? phone : `55${phone}` },
        { onConflict: 'user_id' },
      )
    }

    return json({
      userId,
      email,
      role: finalRole,
      empresaId: finalEmpresaId,
      generatedPassword: password ? null : finalPassword,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return json({ error: message }, 500)
  }
})
