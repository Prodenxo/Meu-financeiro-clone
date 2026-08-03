#!/usr/bin/env node
/**
 * Inventário MEI ativos (critério FocoMEI migration) — só contagens.
 * Não grava pacote completo; imprime relatório mascarado.
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const PAGE = 1000

const maskEmail = (email) => {
  const s = String(email || '')
  const [u, d] = s.split('@')
  if (!d) return '***'
  const left = u.length <= 2 ? `${u[0] || '*'}*` : `${u.slice(0, 2)}***`
  return `${left}@${d}`
}

const maskCnpj = (cnpj) => {
  const d = String(cnpj || '').replace(/\D/g, '')
  if (d.length < 8) return '**'
  return `${d.slice(0, 4)}****${d.slice(-4)}`
}

async function fetchAll (build) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await build().range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const batch = data || []
    rows.push(...batch)
    if (batch.length < PAGE) break
    from += PAGE
  }
  return rows
}

async function fetchInChunks (ids, build, { softFail = false } = {}) {
  const out = []
  for (let i = 0; i < ids.length; i += 80) {
    const chunk = ids.slice(i, i + 80)
    if (!chunk.length) continue
    let from = 0
    while (true) {
      const { data, error } = await build(chunk).range(from, from + PAGE - 1)
      if (error) {
        if (softFail) return out
        throw new Error(error.message)
      }
      const batch = data || []
      out.push(...batch)
      if (batch.length < PAGE) break
      from += PAGE
    }
  }
  return out
}

const ACTIVE_SUB_STATUSES = new Set(['active', 'ativo', 'trialing'])

console.log('=== INVENTÁRIO MEI → FocoMEI (somente contagens) ===\n')

const allEmpresas = await fetchAll(() =>
  admin.from('empresas').select('id, empresa, cnpj, max_mei, status, stripe_customer_id, created_at').order('empresa'),
)
console.log(`empresas (total no sistema): ${allEmpresas.length}`)

const subLines = await fetchAll(() =>
  admin.from('empresa_mei_subscription_lines').select('id, empresa_id, status, mei_slots'),
)
const activeSubByEmpresa = new Set(
  subLines
    .filter((l) => ACTIVE_SUB_STATUSES.has(String(l.status || '').toLowerCase()))
    .map((l) => l.empresa_id)
    .filter(Boolean),
)
console.log(`empresa_mei_subscription_lines: ${subLines.length} (ativas: ${activeSubByEmpresa.size} empresas)`)

const meiLinks = await fetchAll(() =>
  admin
    .from('role_x_user_x_empresa')
    .select('id, user_id, empresas_id, roles_id, status, mei, expires_at')
    .eq('mei', true)
    .eq('status', true),
)
const meiLinkEmpresas = new Set(meiLinks.map((l) => l.empresas_id).filter(Boolean))
console.log(`vínculos mei=true & status=true: ${meiLinks.length} (empresas distintas: ${meiLinkEmpresas.size})`)

const byMaxMei = allEmpresas.filter((e) => Number(e.max_mei || 0) > 0)
const includedMap = new Map()
for (const e of allEmpresas) {
  const reasons = []
  if (Number(e.max_mei || 0) > 0) reasons.push('max_mei')
  if (activeSubByEmpresa.has(e.id)) reasons.push('subscription_active')
  if (meiLinkEmpresas.has(e.id)) reasons.push('mei_link')
  if (reasons.length) includedMap.set(e.id, { ...e, reasons })
}

const included = [...includedMap.values()].sort((a, b) =>
  String(a.empresa || '').localeCompare(String(b.empresa || ''), 'pt-BR'),
)
const empresaIds = included.map((e) => e.id)

const reasonStats = { max_mei: 0, subscription_active: 0, mei_link: 0, only_max: 0, only_sub: 0, only_link: 0, multi: 0 }
for (const e of included) {
  for (const r of e.reasons) reasonStats[r]++
  if (e.reasons.length > 1) reasonStats.multi++
  else if (e.reasons[0] === 'max_mei') reasonStats.only_max++
  else if (e.reasons[0] === 'subscription_active') reasonStats.only_sub++
  else reasonStats.only_link++
}

console.log('\n--- Empresas incluídas ---')
console.log(`total: ${included.length}`)
console.log(`  com max_mei>0: ${byMaxMei.length}`)
console.log(`  com subscription ativa: ${activeSubByEmpresa.size}`)
console.log(`  com vínculo mei ativo: ${meiLinkEmpresas.size}`)
console.log(`  só max_mei: ${reasonStats.only_max} | só sub: ${reasonStats.only_sub} | só link: ${reasonStats.only_link} | multi-critério: ${reasonStats.multi}`)

// Todos os vínculos ativos nessas empresas (não só mei=true)
const allLinks = await fetchInChunks(empresaIds, (chunk) =>
  admin
    .from('role_x_user_x_empresa')
    .select('id, user_id, empresas_id, roles_id, status, mei, expires_at')
    .in('empresas_id', chunk)
    .eq('status', true),
)
const userIds = [...new Set(allLinks.map((l) => l.user_id).filter(Boolean))]
const meiTrueLinks = allLinks.filter((l) => l.mei === true)

console.log('\n--- Usuários / vínculos (status=true nas empresas incluídas) ---')
console.log(`vínculos ativos: ${allLinks.length}`)
console.log(`  dos quais mei=true: ${meiTrueLinks.length}`)
console.log(`usuários únicos: ${userIds.length}`)

const roles = await fetchAll(() => admin.from('roles').select('id, roles'))
const roleById = new Map(roles.map((r) => [r.id, r.roles]))

const profiles = await fetchInChunks(userIds, (chunk) =>
  admin.from('profiles').select('id, role').in('id', chunk),
)
console.log(`profiles encontrados: ${profiles.length} / ${userIds.length}`)

// Auth directory (emails) — paginado
const wanted = new Set(userIds)
const authUsers = []
let page = 1
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw new Error(error.message)
  const users = data?.users || []
  for (const u of users) {
    if (wanted.has(u.id)) {
      authUsers.push({
        id: u.id,
        email: u.email || null,
        phone: u.phone || null,
        email_confirmed_at: u.email_confirmed_at || null,
        banned_until: u.banned_until || null,
        created_at: u.created_at || null,
      })
    }
  }
  if (users.length < 1000) break
  page += 1
  if (page > 50) break
}
console.log(`auth.users resolvidos: ${authUsers.length} / ${userIds.length}`)
console.log('password_hashes: 0 (SUPABASE_DB_URL / Auth API — password_reset_required=true)')

// Contagens por tabela (user-scoped)
const tablesByUser = [
  'lancamentos_id',
  'categorias_id',
  'contas_financeiras',
  'contas_moeda_global',
  'n8n_link',
  'google_tokens_id',
  'user_mei_certificates',
  'mei_nfse',
  'mei_nfse_clientes',
  'mei_nfse_servicos',
  'mei_nfse_rps_counters',
  'das_mensal_status',
]

console.log('\n--- Dados por usuário (empresas incluídas) ---')
const counts = {}
for (const table of tablesByUser) {
  const rows = await fetchInChunks(
    userIds,
    (chunk) => admin.from(table).select('id', { count: 'exact' }).in('user_id', chunk),
    { softFail: true },
  )
  // select id may return rows; for soft-fail empty tables
  counts[table] = rows.length
  console.log(`  ${table}: ${rows.length}`)
}

const invites = await fetchInChunks(empresaIds, (chunk) =>
  admin.from('empresa_invites').select('id').in('empresas_id', chunk),
  { softFail: true },
)
counts.empresa_invites = invites.length
console.log(`  empresa_invites: ${invites.length}`)

const meiSubIncluded = subLines.filter((l) => empresaIds.includes(l.empresa_id))
counts.empresa_mei_subscription_lines = meiSubIncluded.length
console.log(`  empresa_mei_subscription_lines (das incluídas): ${meiSubIncluded.length}`)

// Tabelas opcionais / possíveis nomes
for (const table of ['mei_nfse_produtos', 'das_mei', 'parcelamento_pdfs', 'orcamentos', 'recorrencias', 'recorrencia_skips']) {
  const { error, count } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.log(`  ${table}: AUSENTE (${error.code || error.message})`)
    counts[table] = null
  } else {
    console.log(`  ${table}: existe (total sistema head=${count}) — será filtrado no export`)
    counts[table] = 'exists'
  }
}

// Certificados com PFX (sem descriptografar / sem logar senha)
const certs = await fetchInChunks(userIds, (chunk) =>
  admin.from('user_mei_certificates').select('id, user_id, pfx_base64, cert_document').in('user_id', chunk),
)
const certsWithPfx = certs.filter((c) => Boolean(c.pfx_base64))
console.log(`\ncertificados: ${certs.length} | com PFX: ${certsWithPfx.length} (senhas NÃO exibidas)`)

// Amostra mascarada
console.log('\n--- Amostra empresas (mascarada, 10) ---')
for (const e of included.slice(0, 10)) {
  console.log(
    `  ${e.empresa || '(sem nome)'} | cnpj=${maskCnpj(e.cnpj)} | max_mei=${e.max_mei} | reasons=${e.reasons.join('+')}`,
  )
}

console.log('\n--- Amostra usuários (mascarada, 10) ---')
const authById = new Map(authUsers.map((u) => [u.id, u]))
const profileById = new Map(profiles.map((p) => [p.id, p]))
for (const uid of userIds.slice(0, 10)) {
  const u = authById.get(uid)
  const links = allLinks.filter((l) => l.user_id === uid)
  const papels = links.map((l) => `${roleById.get(l.roles_id) || '?'}(mei=${l.mei})`).join(', ')
  console.log(
    `  ${maskEmail(u?.email)} | profile=${profileById.get(uid)?.role || '—'} | vínculos=${links.length} [${papels}]`,
  )
}

console.log('\n=== RESUMO PARA APROVAÇÃO ===')
console.log(JSON.stringify({
  criterio: 'max_mei>0 OR subscription_active OR mei_link_active',
  empresas_incluidas: included.length,
  usuarios_unicos: userIds.length,
  vinculos_ativos: allLinks.length,
  vinculos_mei_true: meiTrueLinks.length,
  password_reset_required: true,
  counts,
  certificados_com_pfx: certsWithPfx.length,
}, null, 2))
