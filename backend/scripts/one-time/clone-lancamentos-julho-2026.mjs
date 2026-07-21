/**
 * Exporta / reimporta lançamentos de um cliente (julho/2026).
 *
 * Fluxo típico:
 *  1) Exportar (ANTES de apagar):
 *     node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=cliente@email.com --export
 *
 *  2) Apagar os lançamentos divergentes no app/DB (você faz manualmente).
 *
 *  3) Visualizar o que será gravado (dry-run, padrão):
 *     node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=cliente@email.com --import --file=scripts/one-time/exports/....json
 *
 *  4) Gravar de verdade:
 *     node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=cliente@email.com --import --file=... --apply
 *
 * Opções:
 *   --user-id=<uuid>     em vez de --email
 *   --from=2026-07-01    (padrão)
 *   --to=2026-07-31      (padrão)
 *   --delete-period      com --import --apply: apaga lançamentos do período no destino antes de inserir
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const PERIOD_FROM_DEFAULT = '2026-07-01'
const PERIOD_TO_DEFAULT = '2026-07-31'

const args = parseArgs(process.argv.slice(2))

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const mode = args.export ? 'export' : args.import ? 'import' : null
if (!mode) {
  printHelp()
  process.exit(1)
}

const periodFrom = String(args.from || PERIOD_FROM_DEFAULT)
const periodTo = String(args.to || PERIOD_TO_DEFAULT)
assertDate(periodFrom, '--from')
assertDate(periodTo, '--to')

const user = await resolveUser({
  email: args.email,
  userId: args['user-id'] || args.userId,
})

console.log(`Usuário: ${user.email || '(sem e-mail)'} (${user.id})`)
console.log(`Período: ${periodFrom} → ${periodTo}`)

if (mode === 'export') {
  await runExport({ user, periodFrom, periodTo, outPath: args.out || args.file })
} else {
  await runImport({
    user,
    periodFrom,
    periodTo,
    filePath: args.file,
    apply: Boolean(args.apply),
    deletePeriod: Boolean(args['delete-period'] || args.deletePeriod),
  })
}

// ─── helpers ───────────────────────────────────────────────────────────────

function parseArgs (argv) {
  const out = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const eq = raw.indexOf('=')
    if (eq === -1) {
      out[raw.slice(2)] = true
      continue
    }
    const key = raw.slice(2, eq)
    out[key] = raw.slice(eq + 1)
  }
  return out
}

function printHelp () {
  console.log(`Uso:
  node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=EMAIL --export
  node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=EMAIL --import --file=CAMINHO.json
  node scripts/one-time/clone-lancamentos-julho-2026.mjs --email=EMAIL --import --file=CAMINHO.json --apply

Opções:
  --user-id=UUID
  --from=YYYY-MM-DD   (padrão ${PERIOD_FROM_DEFAULT})
  --to=YYYY-MM-DD     (padrão ${PERIOD_TO_DEFAULT})
  --out=CAMINHO.json  (só no export)
  --delete-period     (só no import --apply: apaga o período no destino antes de inserir)
`)
}

function assertDate (value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error(`${label} inválido (use YYYY-MM-DD): ${value}`)
    process.exit(1)
  }
}

function normalizeContaNomeKey (value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function matchContaByName (contas, rawName) {
  const key = normalizeContaNomeKey(rawName)
  if (!key) return null
  const active = contas.filter((c) => c?.ativo !== false)
  const exact = active.find((c) => normalizeContaNomeKey(c?.nome) === key)
  if (exact) return exact
  return (
    active.find((c) => {
      const nomeKey = normalizeContaNomeKey(c?.nome)
      return nomeKey.includes(key) || key.includes(nomeKey)
    }) ?? null
  )
}

async function resolveUser ({ email, userId }) {
  if (userId) {
    const { data, error } = await admin.auth.admin.getUserById(String(userId))
    if (error || !data?.user) {
      console.error('Usuário não encontrado pelo user-id:', userId, error?.message || '')
      process.exit(1)
    }
    return { id: data.user.id, email: data.user.email || null }
  }

  if (!email) {
    console.error('Informe --email=... ou --user-id=...')
    process.exit(1)
  }

  const target = String(email).trim().toLowerCase()
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('Erro ao listar usuários:', error.message)
      process.exit(1)
    }
    const users = data?.users || []
    const found = users.find((u) => String(u.email || '').toLowerCase() === target)
    if (found) return { id: found.id, email: found.email || null }
    if (users.length < perPage) break
    page += 1
  }

  console.error('Usuário não encontrado pelo e-mail:', email)
  process.exit(1)
}

async function loadContasMap (userId) {
  const { data, error } = await admin
    .from('contas_financeiras')
    .select('id, nome, tipo, ativo')
    .eq('user_id', userId)
  if (error) {
    console.error('Erro ao carregar contas:', error.message)
    process.exit(1)
  }
  const list = data || []
  const byId = new Map(list.map((c) => [c.id, c]))
  return { list, byId }
}

async function fetchLancamentosPeriodo (userId, periodFrom, periodTo) {
  const { data, error } = await admin
    .from('lancamentos_id')
    .select('*')
    .eq('user_id', userId)
    .gte('data', periodFrom)
    .lte('data', periodTo)
    .order('data', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) {
    console.error('Erro ao buscar lançamentos:', error.message)
    process.exit(1)
  }
  return data || []
}

function toExportRow (tx, contaNome) {
  return {
    source_id: tx.id,
    tipo: tx.tipo,
    valor: Number(tx.valor),
    classificacao: tx.classificacao,
    categoria: tx.categoria ?? null,
    status: tx.status,
    data: tx.data,
    obs: tx.obs ?? null,
    conta_id_origem: tx.conta_id ?? null,
    conta_nome: contaNome,
  }
}

function printPreview (rows, { title }) {
  console.log(`\n=== ${title} (${rows.length}) ===`)
  if (!rows.length) {
    console.log('(vazio)')
    return
  }

  const sample = rows.slice(0, 30)
  for (const row of sample) {
    const valor = Number(row.valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    const conta = row.conta_nome || row.conta_nome_resolvida || '(sem conta)'
    const desc = String(row.obs || '').replace(/\s+/g, ' ').slice(0, 60)
    console.log(
      `${row.data} | ${String(row.tipo).padEnd(7)} | ${valor.padStart(12)} | ${String(row.classificacao || '').slice(0, 24).padEnd(24)} | ${String(conta).slice(0, 18).padEnd(18)} | ${desc}`,
    )
  }
  if (rows.length > sample.length) {
    console.log(`... +${rows.length - sample.length} linhas omitidas`)
  }

  const totalEntrada = rows
    .filter((r) => String(r.tipo).includes('entrada'))
    .reduce((s, r) => s + Number(r.valor || 0), 0)
  const totalSaida = rows
    .filter((r) => !String(r.tipo).includes('entrada'))
    .reduce((s, r) => s + Number(r.valor || 0), 0)

  console.log(
    `\nTotais: entradas ${totalEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | saídas ${totalSaida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
  )
}

async function runExport ({ user, periodFrom, periodTo, outPath }) {
  const { byId } = await loadContasMap(user.id)
  const txs = await fetchLancamentosPeriodo(user.id, periodFrom, periodTo)

  const rows = txs.map((tx) => {
    const conta = tx.conta_id ? byId.get(tx.conta_id) : null
    return toExportRow(tx, conta?.nome || null)
  })

  printPreview(rows, { title: 'EXPORT (pré-visualização)' })

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    user_email: user.email,
    period: { from: periodFrom, to: periodTo },
    count: rows.length,
    lancamentos: rows,
  }

  const exportsDir = join(__dirname, 'exports')
  await mkdir(exportsDir, { recursive: true })
  const safeEmail = String(user.email || user.id).replace(/[^a-zA-Z0-9._-]+/g, '_')
  const defaultPath = join(exportsDir, `lancamentos-${safeEmail}-${periodFrom}_${periodTo}.json`)
  const filePath = resolve(outPath || defaultPath)

  await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
  console.log(`\nArquivo salvo: ${filePath}`)
  console.log('Próximo passo: apague os lançamentos divergentes e rode --import (dry-run), depois --apply.')
}

async function runImport ({ user, periodFrom, periodTo, filePath, apply, deletePeriod }) {
  if (!filePath) {
    console.error('Informe --file=caminho.json')
    process.exit(1)
  }

  const absolute = resolve(filePath)
  let payload
  try {
    payload = JSON.parse(await readFile(absolute, 'utf8'))
  } catch (err) {
    console.error('Falha ao ler JSON:', err.message)
    process.exit(1)
  }

  const rows = Array.isArray(payload?.lancamentos) ? payload.lancamentos : null
  if (!rows) {
    console.error('JSON inválido: esperado { lancamentos: [...] }')
    process.exit(1)
  }

  if (payload.user_id && payload.user_id !== user.id) {
    console.warn(
      `Atenção: JSON é do user ${payload.user_id} (${payload.user_email || '?'}), importando em ${user.id} (${user.email || '?'}).`,
    )
  }

  const { list: contas } = await loadContasMap(user.id)
  const prepared = []
  const unmatchedContas = new Set()

  for (const row of rows) {
    const contaNome = row.conta_nome || null
    let contaId = null
    if (contaNome) {
      const matched = matchContaByName(contas, contaNome)
      if (matched) {
        contaId = matched.id
      } else {
        unmatchedContas.add(contaNome)
      }
    }

    prepared.push({
      ...row,
      conta_id_destino: contaId,
      conta_nome_resolvida: contaNome
        ? (contas.find((c) => c.id === contaId)?.nome || `(NÃO ENCONTRADA: ${contaNome})`)
        : '(sem conta)',
    })
  }

  printPreview(prepared, {
    title: apply ? 'IMPORT — o que SERÁ gravado' : 'IMPORT — dry-run (nada será gravado)',
  })

  if (unmatchedContas.size) {
    console.warn('\nContas do JSON sem match pelo nome no destino:')
    for (const nome of unmatchedContas) console.warn(`  - ${nome}`)
    console.warn('Esses lançamentos serão inseridos SEM conta_id (ou com conta nula).')
  }

  if (!apply) {
    console.log('\nDry-run ok. Para gravar de verdade, rode de novo com --apply')
    if (deletePeriod) {
      console.log('( --delete-period só executa junto com --apply )')
    }
    return
  }

  if (deletePeriod) {
    console.log(`\nApagando lançamentos existentes de ${periodFrom} a ${periodTo}...`)
    const { error: delErr, count } = await admin
      .from('lancamentos_id')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .gte('data', periodFrom)
      .lte('data', periodTo)

    if (delErr) {
      console.error('Falha ao apagar período:', delErr.message)
      process.exit(1)
    }
    console.log(`Apagados: ${count ?? '(n/d)'} lançamentos`)
  }

  const inserts = prepared.map((row) => {
    const payloadRow = {
      user_id: user.id,
      tipo: row.tipo,
      valor: Number(row.valor),
      classificacao: row.classificacao,
      status: row.status || 'pago',
      data: row.data,
      obs: row.obs ?? null,
    }
    if (row.categoria != null && row.categoria !== '') {
      payloadRow.categoria = row.categoria
    }
    if (row.conta_id_destino) {
      payloadRow.conta_id = row.conta_id_destino
    }
    return payloadRow
  })

  const chunkSize = 100
  let inserted = 0
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize)
    const { data, error } = await admin.from('lancamentos_id').insert(chunk).select('id')
    if (error) {
      console.error(`Falha no insert (offset ${i}):`, error.message)
      process.exit(1)
    }
    inserted += (data || []).length
    console.log(`Inseridos ${inserted}/${inserts.length}...`)
  }

  console.log(`\nConcluído: ${inserted} lançamentos recriados para ${user.email || user.id}.`)
}
