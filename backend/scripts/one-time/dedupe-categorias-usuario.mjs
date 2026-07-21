/**
 * Remove categorias duplicadas (mesmo nome + tipo).
 * Corrige o BPO que soma o realizado N vezes quando há N IDs com o mesmo nome.
 *
 * Um usuário (dry-run):
 *   node scripts/one-time/dedupe-categorias-usuario.mjs --email=cliente@email.com
 *
 * Um usuário (aplicar):
 *   node scripts/one-time/dedupe-categorias-usuario.mjs --email=cliente@email.com --apply
 *
 * Todos os usuários:
 *   node scripts/one-time/dedupe-categorias-usuario.mjs --all
 *   node scripts/one-time/dedupe-categorias-usuario.mjs --all --apply
 *
 * Opções:
 *   --user-id=<uuid>
 *   --keep=lowest-id|highest-id   (padrão: lowest-id = mais antiga)
 *   --quiet                      (menos log por grupo; útil com --all)
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const args = parseArgs(process.argv.slice(2))
const apply = Boolean(args.apply)
const allMode = Boolean(args.all)
const quiet = Boolean(args.quiet) || allMode
const keepMode = String(args.keep || 'lowest-id')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(`Modo: ${apply ? 'APPLY (vai gravar)' : 'DRY-RUN (só visualiza)'}`)
console.log(`Manter: ${keepMode}`)
console.log(`Escopo: ${allMode ? 'TODOS os usuários' : 'um usuário'}`)

if (allMode) {
  await runAll()
} else {
  const user = await resolveUser({
    email: args.email,
    userId: args['user-id'] || args.userId,
  })
  const result = await dedupeUser(user, { apply, keepMode, quiet: false })
  printUserResult(user, result)
  if (!apply && result.groups > 0) {
    console.log('\nDry-run ok. Rode de novo com --apply para executar.')
  }
}

async function runAll () {
  const allCats = await fetchAllUserCategories()
  const byUser = new Map()
  for (const cat of allCats) {
    if (!byUser.has(cat.user_id)) byUser.set(cat.user_id, [])
    byUser.get(cat.user_id).push(cat)
  }

  const affected = []
  for (const [userId, cats] of byUser.entries()) {
    const groups = buildDupGroups(cats, keepMode)
    if (groups.length) affected.push({ userId, cats, groups })
  }

  console.log(`Usuários com duplicata: ${affected.length}`)
  if (!affected.length) {
    console.log('Nada a fazer.')
    return
  }

  let totalGroups = 0
  let totalRemove = 0
  let totalRemapped = 0
  let totalBudgetsDeleted = 0
  let totalCatsDeleted = 0
  let errors = 0

  for (const item of affected) {
    const email = await resolveEmail(item.userId)
    const user = { id: item.userId, email }
    try {
      const result = await dedupeUser(user, {
        apply,
        keepMode,
        quiet,
        preloadedCats: item.cats,
      })
      totalGroups += result.groups
      totalRemove += result.toRemove
      totalRemapped += result.remapped
      totalBudgetsDeleted += result.budgetsDeleted
      totalCatsDeleted += result.catsDeleted
      printUserResult(user, result)
    } catch (err) {
      errors += 1
      console.error(`ERRO ${email || item.userId}:`, err.message || err)
    }
  }

  console.log('\n=== RESUMO ===')
  console.log(`Usuários processados: ${affected.length}`)
  console.log(`Grupos duplicados: ${totalGroups}`)
  console.log(`Categorias extras: ${totalRemove}`)
  if (apply) {
    console.log(`Orçamentos remapeados: ${totalRemapped}`)
    console.log(`Orçamentos duplicados removidos: ${totalBudgetsDeleted}`)
    console.log(`Categorias removidas: ${totalCatsDeleted}`)
  } else {
    console.log('Dry-run ok. Rode de novo com --all --apply para executar.')
  }
  if (errors) console.log(`Falhas: ${errors}`)
}

async function dedupeUser (user, { apply, keepMode, quiet, preloadedCats }) {
  let cats = preloadedCats
  if (!cats) {
    const { data, error } = await admin
      .from('categorias_id')
      .select('id, nome, tipo, user_id')
      .eq('user_id', user.id)
      .order('id', { ascending: true })
    if (error) throw new Error(error.message)
    cats = data || []
  }

  const plan = buildDupGroups(cats, keepMode)
  if (!plan.length) {
    return {
      groups: 0,
      toRemove: 0,
      remapped: 0,
      budgetsDeleted: 0,
      catsDeleted: 0,
    }
  }

  if (!quiet) {
    console.log(`\nGrupos duplicados: ${plan.length}`)
    for (const p of plan) {
      console.log(`\n${p.key}`)
      console.log(`  MANTER  id=${p.keep.id}  nome=${JSON.stringify(p.keep.nome)}  tipo=${p.keep.tipo}`)
      for (const r of p.remove) {
        console.log(`  REMOVER id=${r.id}  nome=${JSON.stringify(r.nome)}  tipo=${r.tipo}`)
      }
    }
  }

  const removeIds = plan.flatMap((p) => p.remove.map((r) => r.id))
  const keepByRemoveId = new Map()
  for (const p of plan) {
    for (const r of p.remove) keepByRemoveId.set(r.id, p.keep.id)
  }

  if (!apply) {
    return {
      groups: plan.length,
      toRemove: removeIds.length,
      remapped: 0,
      budgetsDeleted: 0,
      catsDeleted: 0,
    }
  }

  const { data: budgets, error: budErr } = await admin
    .from('orçamentos')
    .select('id, categorias_id, date, valor_orçado, user_id')
    .eq('user_id', user.id)
    .in('categorias_id', removeIds)

  if (budErr) throw new Error(budErr.message)

  let remapped = 0
  let budgetsDeleted = 0

  for (const budget of budgets || []) {
    const targetCatId = keepByRemoveId.get(budget.categorias_id)
    if (!targetCatId) continue

    const { data: existing } = await admin
      .from('orçamentos')
      .select('id, valor_orçado')
      .eq('user_id', user.id)
      .eq('categorias_id', targetCatId)
      .eq('date', budget.date)
      .maybeSingle()

    if (existing?.id) {
      const keepVal = existing.valor_orçado
      const dropVal = budget.valor_orçado
      const prefer =
        keepVal == null && dropVal != null
          ? dropVal
          : keepVal != null && dropVal != null
            ? Math.max(Number(keepVal), Number(dropVal))
            : keepVal

      if (prefer !== keepVal) {
        const { error } = await admin
          .from('orçamentos')
          .update({ valor_orçado: prefer })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
      }

      const { error: delB } = await admin.from('orçamentos').delete().eq('id', budget.id)
      if (delB) throw new Error(delB.message)
      budgetsDeleted += 1
    } else {
      const { error } = await admin
        .from('orçamentos')
        .update({ categorias_id: targetCatId })
        .eq('id', budget.id)
      if (error) throw new Error(error.message)
      remapped += 1
    }
  }

  const { error: delCatsErr, count } = await admin
    .from('categorias_id')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)
    .in('id', removeIds)

  if (delCatsErr) throw new Error(delCatsErr.message)

  return {
    groups: plan.length,
    toRemove: removeIds.length,
    remapped,
    budgetsDeleted,
    catsDeleted: count ?? removeIds.length,
  }
}

function buildDupGroups (cats, keepMode) {
  const groups = new Map()
  for (const cat of cats || []) {
    const key = categoryKey(cat.nome, cat.tipo)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(cat)
  }

  const plan = []
  for (const [key, list] of groups.entries()) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) => Number(a.id) - Number(b.id))
    const keep = keepMode === 'highest-id' ? sorted[sorted.length - 1] : sorted[0]
    const remove = sorted.filter((c) => c.id !== keep.id)
    plan.push({ key, keep, remove })
  }
  return plan
}

function printUserResult (user, result) {
  const label = user.email || user.id
  if (!result.groups) {
    console.log(`${label}: ok (sem duplicatas)`)
    return
  }
  if (!apply) {
    console.log(`${label}: ${result.groups} grupos / ${result.toRemove} a remover`)
    return
  }
  console.log(
    `${label}: removidas ${result.catsDeleted} cats | orç. remap ${result.remapped} | orç. del ${result.budgetsDeleted}`,
  )
}

async function fetchAllUserCategories () {
  const all = []
  let from = 0
  const pageSize = 1000
  for (;;) {
    const { data, error } = await admin
      .from('categorias_id')
      .select('id, nome, tipo, user_id')
      .not('user_id', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    all.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return all
}

async function resolveEmail (userId) {
  try {
    const { data } = await admin.auth.admin.getUserById(userId)
    return data?.user?.email || null
  } catch {
    return null
  }
}

function parseArgs (argv) {
  const out = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const eq = raw.indexOf('=')
    if (eq === -1) {
      out[raw.slice(2)] = true
      continue
    }
    out[raw.slice(2, eq)] = raw.slice(eq + 1)
  }
  return out
}

function normalizeCategoryName (value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function normalizeTipo (tipo) {
  if (!tipo) return ''
  return tipo === 'saída' ? 'saida' : String(tipo)
}

function categoryKey (nome, tipo) {
  return `${normalizeTipo(tipo)}|${normalizeCategoryName(nome)}`
}

async function resolveUser ({ email, userId }) {
  if (userId) {
    const { data, error } = await admin.auth.admin.getUserById(String(userId))
    if (error || !data?.user) {
      console.error('Usuário não encontrado pelo user-id:', userId)
      process.exit(1)
    }
    return { id: data.user.id, email: data.user.email || null }
  }

  if (!email) {
    console.error('Informe --email=..., --user-id=... ou --all')
    process.exit(1)
  }

  const target = String(email).trim().toLowerCase()
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
    const users = data?.users || []
    const found = users.find((u) => String(u.email || '').toLowerCase() === target)
    if (found) return { id: found.id, email: found.email || null }
    if (users.length < perPage) break
    page += 1
  }

  console.error('Usuário não encontrado:', email)
  process.exit(1)
}
