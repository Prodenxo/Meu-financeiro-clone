/**
 * Cadastro com solicitação de acesso (empresa + usuário pending).
 * Tenta Easypanel; se indisponível ou 404, executa inline com service role.
 * Status de pendência rastreado SOMENTE via role_x_user_x_empresa.status = false.
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

const backendUrl = () =>
  (Deno.env.get('MEU_FINANCEIRO_API_URL') || Deno.env.get('BACKEND_URL') || '').replace(/\/$/, '')

const internalSecret = () => Deno.env.get('ACCESS_REQUEST_INTERNAL_SECRET') || ''

const normalizeText = (value: unknown) => {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  return s || null
}

const buildEmpresaInsert = (empresaInput: Record<string, unknown> = {}) => {
  const cnpj = String(empresaInput.cnpj || '').replace(/\D/g, '')
  if (cnpj.length !== 14) throw new Error('CNPJ inválido (14 dígitos).')
  const razaoSocial = normalizeText(empresaInput.razaoSocial)
  const nomeFantasia = normalizeText(empresaInput.nomeFantasia)
  const empresaNome = razaoSocial || nomeFantasia
  if (!empresaNome) throw new Error('Informe razão social ou nome fantasia.')

  return {
    empresa: empresaNome,
    cnpj,
    razao_social: razaoSocial,
    nome_fantasia: nomeFantasia,
    cep: String(empresaInput.cep || '').replace(/\D/g, '') || null,
    logradouro: normalizeText(empresaInput.logradouro),
    numero: normalizeText(empresaInput.numero),
    complemento: normalizeText(empresaInput.complemento),
    bairro: normalizeText(empresaInput.bairro),
    cidade: normalizeText(empresaInput.cidade),
    estado: normalizeText(empresaInput.estado)?.toUpperCase()?.slice(0, 2) || null,
    telefone: normalizeText(empresaInput.telefone),
    email: normalizeText(empresaInput.email),
    max_mei: 0,
    max_usuarios_nao_mei: null,
    status: 'pending',
  }
}

async function resolveUsuarioRoleId(admin: ReturnType<typeof createClient>) {
  const { data: rows } = await admin.from('roles').select('id, roles')
  const match = (rows || []).find((r) => {
    const n = String(r.roles || '').trim().toLowerCase()
    return n === 'user' || n === 'usuario'
  })
  return match?.id ? String(match.id) : null
}

async function deleteUserDataAndAuth(admin: ReturnType<typeof createClient>, userId: string) {
  const tables = ['lancamentos_id', 'categorias_id', 'n8n_link', 'google_tokens_id', 'role_x_user_x_empresa']
  for (const table of tables) {
    await admin.from(table).delete().eq('user_id', userId)
  }
  await admin.from('profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
}

async function submitInline(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
) {
  const user = (body.user || {}) as Record<string, unknown>
  const empresa = (body.empresa || {}) as Record<string, unknown>
  const observacao = normalizeText(body.observacao)

  const email = normalizeText(user.email)?.toLowerCase()
  const password = String(user.password || '').trim()
  const fullName = normalizeText(user.fullName)
  const phone = normalizeText(user.phone)

  if (!email) throw new Error('E-mail é obrigatório.')
  if (!fullName) throw new Error('Nome completo é obrigatório.')
  if (password.length < 8) throw new Error('Senha deve ter pelo menos 8 caracteres.')

  const { data: listByEmail, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listErr) throw new Error(listErr.message)
  const emailTaken = (listByEmail?.users || []).some(
    (u) => String(u.email || '').toLowerCase() === email,
  )
  if (emailTaken) throw new Error('Este e-mail já está cadastrado.')

  const empresaPayload = buildEmpresaInsert(empresa)
  const { data: empresaRow, error: empresaErr } = await admin
    .from('empresas')
    .insert(empresaPayload)
    .select('id')
    .maybeSingle()
  if (empresaErr || !empresaRow?.id) {
    throw new Error(empresaErr?.message || 'Erro ao criar empresa.')
  }

  const requestedAt = new Date().toISOString()
  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      display_name: fullName,
      phone: phone || null,
      access_request_observacao: observacao,
      access_requested_at: requestedAt,
    },
  })

  if (createErr || !createdUser?.user?.id) {
    await admin.from('empresas').delete().eq('id', empresaRow.id)
    throw new Error(createErr?.message || 'Erro ao criar usuário.')
  }

  const userId = createdUser.user.id

  try {
    const roleId = await resolveUsuarioRoleId(admin)
    if (!roleId) throw new Error('Perfil de usuário não encontrado na base.')

    await admin.from('empresas').update({ requested_by: userId }).eq('id', empresaRow.id)

    // Cria perfil SEM profiles.status — status rastreado via role_x_user_x_empresa
    const { error: profileErr } = await admin.from('profiles').upsert({
      id: userId,
      role: 'usuario',
    })
    if (profileErr) throw new Error(profileErr.message)

    // Vínculo com status=false = pendente de aprovação
    const { error: linkErr } = await admin.from('role_x_user_x_empresa').insert({
      user_id: userId,
      roles_id: roleId,
      empresas_id: empresaRow.id,
      status: false,
      mei: false,
    })
    if (linkErr) throw new Error(linkErr.message)

    if (phone) {
      const cleaned = phone.startsWith('+') ? phone.slice(1) : phone.replace(/\D/g, '')
      if (cleaned) {
        await admin.from('n8n_link').upsert(
          { user_id: userId, user_number: cleaned },
          { onConflict: 'user_id' },
        )
      }
    }
  } catch (err) {
    await deleteUserDataAndAuth(admin, userId).catch(() => {})
    await admin.from('empresas').delete().eq('id', empresaRow.id)
    throw err
  }

  return { ok: true, userId }
}

async function tryBackendSubmit(body: Record<string, unknown>) {
  const base = backendUrl()
  const secret = internalSecret()
  if (!base || !secret) return { ok: false as const, error: 'backend_skip' }

  const res = await fetch(`${base}/api/internal/access-requests/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.message === 'string'
      ? data.message
      : typeof data?.error === 'string'
        ? data.error
        : 'Não foi possível enviar a solicitação.'
    return { ok: false as const, error: msg, status: res.status }
  }

  return { ok: true as const, data: data?.data ?? data }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }

  try {
    const body = await req.json()

    const backend = await tryBackendSubmit(body)
    if (backend.ok) {
      return json(backend.data)
    }

    // Fallback inline: backend indisponível, sem config, ou rota ainda não deployada (404)
    const useEdgeFallback =
      backend.error === 'backend_skip' ||
      !backend.status ||
      backend.status === 404 ||
      backend.status >= 500

    if (!useEdgeFallback) {
      return json({ error: backend.error || 'Não foi possível enviar a solicitação.' }, backend.status || 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Configuração Supabase incompleta na Edge Function.' }, 500)
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const result = await submitInline(admin, body)
    return json(result)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado' }, 400)
  }
})
