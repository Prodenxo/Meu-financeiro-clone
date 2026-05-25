/**
 * Proxy autenticado → backend interno (/api/internal/access-requests/manage).
 * Ação `report` roda na Edge (service role) para não depender de deploy do backend.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const normalizeRole = (role: unknown) => {
  if (!role) return null
  const n = String(role).trim().toLowerCase()
  if (n === 'superadmin') return 'superadmin'
  if (n === 'admin') return 'admin'
  if (n === 'user' || n === 'usuario') return 'usuario'
  if (n === 'outsider') return 'outsider'
  return null
}

const normalizeText = (value: unknown) => {
  if (value == null) return null
  const s = String(value).trim()
  return s || null
}

async function getActorRole(admin: SupabaseClient, actorUserId: string) {
  const { data: linkData } = await admin
    .from('role_x_user_x_empresa')
    .select('roles_id, status')
    .eq('user_id', actorUserId)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (linkData?.roles_id) {
    const { data: roleData } = await admin
      .from('roles')
      .select('roles')
      .eq('id', linkData.roles_id)
      .maybeSingle()
    return normalizeRole(roleData?.roles)
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', actorUserId)
    .maybeSingle()
  return normalizeRole(profile?.role)
}

const ADMIN_ROLE_ID_REPORT = '849af65c-fe71-464c-8d26-1c61166b29a1'

const isAccessRequestLink = (
  link: { user_id: string; status: boolean | null; roles_id: string | null },
  emp: { requested_by?: string | null },
  activeMembers: number,
) => {
  if (emp.requested_by && emp.requested_by === link.user_id) return true
  if (link.status === false) return true
  if (link.status === true && link.roles_id === ADMIN_ROLE_ID_REPORT && activeMembers === 1) {
    return true
  }
  return false
}

const chunkIds = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const fetchAuthUsersByIds = async (admin: SupabaseClient, userIds: string[]) => {
  const map = new Map<string, { email?: string; user_metadata?: Record<string, unknown> }>()
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!unique.length) return map

  let cursor = 0
  const concurrency = 8
  const worker = async () => {
    while (cursor < unique.length) {
      const userId = unique[cursor]
      cursor += 1
      try {
        const { data } = await admin.auth.admin.getUserById(userId)
        if (data?.user) map.set(userId, data.user)
      } catch {
        /* removido */
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()))
  return map
}

async function buildAccessReport(admin: SupabaseClient, limit: number) {
  const cap = Math.min(Math.max(limit, 1), 500)
  const linkCap = Math.min(cap * 3, 600)

  const { data: links, error: linksErr } = await admin
    .from('role_x_user_x_empresa')
    .select('user_id, empresas_id, created_at, status, roles_id, mei')
    .order('created_at', { ascending: false })
    .limit(linkCap)

  if (linksErr) throw linksErr
  if (!links?.length) return []

  const empresaIds = [...new Set(links.map((l) => l.empresas_id).filter(Boolean))]
  const empById = new Map<string, Record<string, unknown>>()

  for (const ids of chunkIds(empresaIds, 80)) {
    const { data: empresas, error: empErr } = await admin
      .from('empresas')
      .select(
        'id, empresa, cnpj, razao_social, nome_fantasia, status, requested_by, created_at, email, max_mei',
      )
      .in('id', ids)
    if (empErr) throw empErr
    for (const e of empresas || []) empById.set(String(e.id), e)
  }

  const { data: activeLinks, error: activeErr } = await admin
    .from('role_x_user_x_empresa')
    .select('empresas_id')
    .in('empresas_id', empresaIds)
    .eq('status', true)

  if (activeErr) throw activeErr

  const activeCountByEmpresa = new Map<string, number>()
  for (const row of activeLinks || []) {
    if (!row.empresas_id) continue
    const id = String(row.empresas_id)
    activeCountByEmpresa.set(id, (activeCountByEmpresa.get(id) || 0) + 1)
  }

  const seen = new Set<string>()
  const candidates: {
    link: (typeof links)[0]
    emp: Record<string, unknown>
    key: string
  }[] = []

  for (const link of links) {
    const key = `${link.user_id}-${link.empresas_id}`
    if (seen.has(key)) continue
    const emp = empById.get(String(link.empresas_id))
    if (!emp) continue
    const activeMembers = activeCountByEmpresa.get(String(link.empresas_id)) ?? 0
    if (!isAccessRequestLink(link, emp as { requested_by?: string | null }, activeMembers)) continue
    seen.add(key)
    candidates.push({ link, emp, key })
    if (candidates.length >= cap) break
  }

  const authUsers = await fetchAuthUsersByIds(
    admin,
    candidates.map((c) => c.link.user_id),
  )

  const entries = candidates.map(({ link, emp, key }) => {
    const authUser = authUsers.get(link.user_id)
    const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>
    const empresaNome =
      (emp.empresa as string) ??
      (emp.razao_social as string) ??
      (emp.nome_fantasia as string) ??
      null
    const requestedAt =
      (meta.access_requested_at as string) ??
      link.created_at ??
      (emp.created_at as string) ??
      null
    const isApproved = link.status === true

    return {
      id: key,
      eventType: isApproved ? 'approved' : 'submitted',
      subjectUserId: link.user_id,
      email: authUser?.email ?? (emp.email as string) ?? null,
      fullName: (meta.full_name as string) ?? (meta.name as string) ?? empresaNome,
      empresaNome,
      cnpj: (emp.cnpj as string) ?? null,
      observacao:
        (meta.access_request_observacao as string) ?? (meta.observacao as string) ?? null,
      actorEmail: isApproved ? (meta.access_approved_by_email as string) ?? null : null,
      occurredAt: isApproved
        ? (meta.access_approved_at as string) ?? requestedAt
        : requestedAt,
      requestedAt,
      approvedAt: isApproved ? (meta.access_approved_at as string) ?? null : null,
    }
  })

  entries.sort((a, b) => {
    const ta = new Date(String(a.occurredAt || 0)).getTime()
    const tb = new Date(String(b.occurredAt || 0)).getTime()
    return tb - ta
  })

  return entries
}

async function handleReportInline(
  admin: SupabaseClient,
  actorUserId: string,
  body: Record<string, unknown>,
) {
  const role = await getActorRole(admin, actorUserId)
  if (role !== 'superadmin') {
    return json({ error: 'Apenas superadmin.' }, 403)
  }

  const limit = Math.min(Math.max(Number(body?.limit) || 200, 1), 500)
  const eventType = normalizeText(body?.eventType)

  let entries = await buildAccessReport(admin, limit)
  if (eventType && ['submitted', 'approved'].includes(eventType)) {
    entries = entries.filter((e) => e?.eventType === eventType)
  }

  return json({ entries })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Não autenticado' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return json({ error: 'Configuração Supabase incompleta' }, 500)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) {
    return json({ error: 'Não autenticado' }, 401)
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const action = String(body?.action || '').trim()

    if (action === 'report') {
      const admin = createClient(supabaseUrl, serviceKey)
      return await handleReportInline(admin, user.id, body)
    }

    const base = backendUrl()
    const secret = internalSecret()
    if (!base || !secret) {
      return json({ error: 'Servidor não configurado (API URL ou segredo interno).' }, 500)
    }

    const res = await fetch(`${base}/api/internal/access-requests/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ ...body, actorUserId: user.id }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : 'Operação não concluída.'

      // Backend antigo sem `report`: tenta na Edge
      if (action === 'report' || /desconhecida:\s*report/i.test(msg)) {
        const admin = createClient(supabaseUrl, serviceKey)
        return await handleReportInline(admin, user.id, body)
      }

      return json({ error: msg }, res.status)
    }

    return json(data?.data ?? data)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado' }, 500)
  }
})
