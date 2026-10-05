#!/usr/bin/env node
/**
 * Export completo de empresas com módulo MEI ativo → pacote para PostgreSQL.
 *
 * Inclui:
 *  - empresas (max_mei > 0) + vínculos, profiles, roles
 *  - dados das contas (lançamentos, categorias, contas, NFS-e, DAS, certs, etc.)
 *  - certificado PFX + senha em claro (secrets/)
 *  - auth.users com encrypted_password (mesma senha no destino Supabase/GoTrue)
 *    → exige SUPABASE_DB_URL válido no .env
 *
 * Uso (pasta Site/backend):
 *   node scripts/one-time/export-mei-empresas-full.mjs --dry-run
 *   node scripts/one-time/export-mei-empresas-full.mjs
 *   node scripts/one-time/export-mei-empresas-full.mjs --output=./exports/mei-full
 *   node scripts/one-time/export-mei-empresas-full.mjs --allow-missing-auth-passwords
 *
 * Formato de saída (mais fácil de importar em outro Postgres):
 *   manifest.json
 *   README-IMPORT.md
 *   tables/<tabela>.json          → arrays JSON
 *   sql/01_public_tables.sql      → INSERTs public.*
 *   sql/02_auth_users.sql         → auth.users + auth.identities (se DB OK)
 *   secrets/certificates.json     → pfx_base64 + passphrase (SENSÍVEL)
 *   auth/users_directory.json     → e-mails / ids (sem senha)
 */
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const args = parseArgs(process.argv.slice(2))
const isDryRun = Boolean(args['dry-run'] || args.dryRun)
const allowMissingAuth = Boolean(
  args['allow-missing-auth-passwords'] || args.allowMissingAuthPasswords,
)
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const defaultOut = path.join(__dirname, 'exports', `mei-empresas-full-${stamp}`)
const outDir = args.output
  ? path.resolve(process.cwd(), String(args.output))
  : defaultOut

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Tabelas public filtradas por user_id (dos usuários das empresas MEI). */
const TABLES_BY_USER_ID = [
  'profiles',
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
  'calendar_checklist_completions',
  'calendar_upcoming_reminder_sent',
]

const PAGE = 1000

main().catch((err) => {
  console.error(err?.stack || err?.message || err)
  process.exit(1)
})

async function main () {
  console.log(isDryRun ? '=== DRY-RUN ===' : '=== EXPORT ===')
  console.log(`Saída: ${outDir}`)

  const empresas = await fetchAll(
    () => admin.from('empresas').select('*').gt('max_mei', 0).order('empresa'),
  )
  const empresaIds = empresas.map((e) => e.id)
  console.log(`Empresas MEI (max_mei > 0): ${empresas.length}`)

  if (!empresaIds.length) {
    console.log('Nada a exportar.')
    return
  }

  const links = await fetchInChunks(
    empresaIds,
    (chunk) =>
      admin
        .from('role_x_user_x_empresa')
        .select('*')
        .in('empresas_id', chunk),
  )
  const userIds = [...new Set(links.map((l) => l.user_id).filter(Boolean))]
  console.log(`Vínculos: ${links.length} | Usuários únicos: ${userIds.length}`)

  const roles = await fetchAll(() => admin.from('roles').select('*').order('roles'))
  const invites = await fetchInChunks(
    empresaIds,
    (chunk) =>
      admin.from('empresa_invites').select('*').in('empresas_id', chunk),
  )
  const meiLines = await fetchInChunks(
    empresaIds,
    (chunk) =>
      admin
        .from('empresa_mei_subscription_lines')
        .select('*')
        .in('empresa_id', chunk),
  )

  const byUser = {}
  for (const table of TABLES_BY_USER_ID) {
    if (table === 'profiles') {
      byUser.profiles = await fetchInChunks(
        userIds,
        (chunk) => admin.from('profiles').select('*').in('id', chunk),
      )
      console.log(`  profiles: ${byUser.profiles.length}`)
      continue
    }
    byUser[table] = await fetchInChunks(
      userIds,
      (chunk) => admin.from(table).select('*').in('user_id', chunk),
      { softFail: true },
    )
    console.log(`  ${table}: ${byUser[table].length}`)
  }

  const authDirectory = await loadAuthDirectory(userIds)
  console.log(`Auth directory: ${authDirectory.length} usuários`)

  let authPack = null
  try {
    authPack = await loadAuthPasswordsFromDb(userIds)
    console.log(
      `Auth passwords (DB): ${authPack.users.length} users, ${authPack.identities.length} identities`,
    )
  } catch (err) {
    console.error(`\n⚠ Falha ao ler auth.users via SUPABASE_DB_URL: ${err.message}`)
    if (!isDryRun && !allowMissingAuth) {
      console.error(`
Para manter a MESMA SENHA no destino, o hash precisa vir de auth.users
(Supabase não expõe senha em texto nem o hash pela API Admin).

1) Abra o Dashboard Supabase → Project Settings → Database
2) Copie a connection string (URI) com a senha atual do banco
3) Atualize SUPABASE_DB_URL no Site/backend/.env
4) Rode de novo este script

Ou use --allow-missing-auth-passwords para exportar sem hashes
(usuários terão que redefinir senha no destino).
`)
      process.exit(2)
    }
    if (allowMissingAuth) {
      console.warn('Continuando SEM hashes de senha (--allow-missing-auth-passwords).')
    } else {
      console.warn('Dry-run: seguindo sem hashes (corrija SUPABASE_DB_URL antes do export real).')
    }
  }

  const certificatesSecret = buildCertificatesSecret(byUser.user_mei_certificates || [])
  console.log(`Certificados com PFX/senha: ${certificatesSecret.length}`)

  const bundle = {
    empresas,
    roles,
    role_x_user_x_empresa: links,
    empresa_invites: invites,
    empresa_mei_subscription_lines: meiLines,
    ...byUser,
  }

  // Certificados na tabela public ficam SEM passphrase em claro;
  // a senha descriptografada vai só em secrets/certificates.json
  if (bundle.user_mei_certificates) {
    bundle.user_mei_certificates = bundle.user_mei_certificates.map((row) => ({
      ...row,
      // mantém enc/iv originais para reimport no mesmo app + mesma chave
    }))
  }

  if (isDryRun) {
    console.log('\nDry-run OK. Contagens:')
    for (const [k, v] of Object.entries(bundle)) {
      console.log(`  ${k}: ${Array.isArray(v) ? v.length : '?'}`)
    }
    console.log(`  auth_directory: ${authDirectory.length}`)
    console.log(`  auth_password_hashes: ${authPack?.users?.length ?? 0}`)
    console.log(`  certificates_secret: ${certificatesSecret.length}`)
    return
  }

  fs.mkdirSync(path.join(outDir, 'tables'), { recursive: true })
  fs.mkdirSync(path.join(outDir, 'sql'), { recursive: true })
  fs.mkdirSync(path.join(outDir, 'secrets'), { recursive: true })
  fs.mkdirSync(path.join(outDir, 'auth'), { recursive: true })

  const counts = {}
  for (const [table, rows] of Object.entries(bundle)) {
    const list = Array.isArray(rows) ? rows : []
    counts[table] = list.length
    fs.writeFileSync(
      path.join(outDir, 'tables', `${table}.json`),
      JSON.stringify(list, null, 2),
      'utf8',
    )
  }

  fs.writeFileSync(
    path.join(outDir, 'auth', 'users_directory.json'),
    JSON.stringify(authDirectory, null, 2),
    'utf8',
  )

  fs.writeFileSync(
    path.join(outDir, 'secrets', 'certificates.json'),
    JSON.stringify(
      {
        warning:
          'SENSÍVEL: contém PFX em base64 e senha do certificado em texto claro. Não versionar.',
        exported_at: new Date().toISOString(),
        certificates: certificatesSecret,
      },
      null,
      2,
    ),
    'utf8',
  )

  // SQL public
  const publicSql = []
  publicSql.push('-- Gerado por export-mei-empresas-full.mjs')
  publicSql.push('-- Ordem sugerida de import: roles → empresas → profiles → vínculos → demais')
  publicSql.push('BEGIN;')
  const insertOrder = [
    'roles',
    'empresas',
    'profiles',
    'role_x_user_x_empresa',
    'empresa_invites',
    'empresa_mei_subscription_lines',
    'contas_financeiras',
    'contas_moeda_global',
    'categorias_id',
    'lancamentos_id',
    'n8n_link',
    'google_tokens_id',
    'user_mei_certificates',
    'mei_nfse_clientes',
    'mei_nfse_servicos',
    'mei_nfse_rps_counters',
    'mei_nfse',
    'das_mensal_status',
    'calendar_checklist_completions',
    'calendar_upcoming_reminder_sent',
  ]
  for (const table of insertOrder) {
    const rows = bundle[table]
    if (!rows?.length) continue
    publicSql.push(`\n-- ${table} (${rows.length})`)
    publicSql.push(...rowsToInsertSql(table, rows))
  }
  publicSql.push('COMMIT;')
  fs.writeFileSync(
    path.join(outDir, 'sql', '01_public_tables.sql'),
    publicSql.join('\n') + '\n',
    'utf8',
  )

  if (authPack?.users?.length) {
    const authSql = []
    authSql.push('-- auth.users + auth.identities (Supabase/GoTrue)')
    authSql.push('-- Importar no Postgres do Supabase de destino (schema auth).')
    authSql.push('BEGIN;')
    authSql.push(...rowsToInsertSql('auth.users', authPack.users, { qualified: true }))
    if (authPack.identities.length) {
      authSql.push(...rowsToInsertSql('auth.identities', authPack.identities, { qualified: true }))
    }
    authSql.push('COMMIT;')
    fs.writeFileSync(
      path.join(outDir, 'sql', '02_auth_users.sql'),
      authSql.join('\n') + '\n',
      'utf8',
    )
    fs.writeFileSync(
      path.join(outDir, 'auth', 'users_with_password_hashes.json'),
      JSON.stringify(
        {
          warning: 'Contém encrypted_password (bcrypt). Não versionar.',
          users: authPack.users,
          identities: authPack.identities,
        },
        null,
        2,
      ),
      'utf8',
    )
  }

  const manifest = {
    exported_at: new Date().toISOString(),
    source: 'Meu Financeiro / MEI Infinito',
    filter: 'empresas.max_mei > 0',
    counts: {
      ...counts,
      auth_directory: authDirectory.length,
      auth_password_hashes: authPack?.users?.length ?? 0,
      certificates_with_passphrase: certificatesSecret.length,
    },
    empresa_ids: empresaIds,
    user_ids: userIds,
    auth_passwords_included: Boolean(authPack?.users?.length),
    notes: [
      'Formato JSON + SQL INSERT — o mais simples para outro PostgreSQL.',
      'Senha de login: hash bcrypt em sql/02_auth_users.sql (destino Supabase/GoTrue).',
      'Senha do certificado PFX: secrets/certificates.json (texto claro).',
      'Para reimportar certificados criptografados no mesmo app, use também passphrase_enc/iv da tabela + a mesma MEI_CERT_ENCRYPTION_KEY.',
    ],
  }
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )
  fs.writeFileSync(
    path.join(outDir, 'README-IMPORT.md'),
    buildReadme(manifest),
    'utf8',
  )

  console.log('\nExport concluído:')
  console.log(`  ${outDir}`)
  console.log(`  auth hashes: ${manifest.counts.auth_password_hashes}`)
  console.log(`  certificados: ${manifest.counts.certificates_with_passphrase}`)
}

function buildCertificatesSecret (rows) {
  const out = []
  for (const row of rows || []) {
    if (!row?.pfx_base64) continue
    let passphrase = null
    let passphraseError = null
    try {
      passphrase = decryptPassphraseLocal(row.passphrase_enc, row.passphrase_iv)
    } catch (err) {
      passphraseError = err.message || String(err)
    }
    out.push({
      id: row.id,
      user_id: row.user_id,
      cert_document: row.cert_document,
      razao_social: row.razao_social,
      nome_fantasia: row.nome_fantasia,
      plugnotas_cert_id: row.plugnotas_cert_id,
      cert_valid_from: row.cert_valid_from,
      cert_valid_to: row.cert_valid_to,
      pfx_base64: row.pfx_base64,
      passphrase,
      passphrase_error: passphraseError,
      // cópia criptografada original (só útil com a mesma MEI_CERT_ENCRYPTION_KEY)
      passphrase_enc: row.passphrase_enc,
      passphrase_iv: row.passphrase_iv,
    })
  }
  return out
}

function decryptPassphraseLocal (passphraseEnc, passphraseIv) {
  const raw = process.env.MEI_CERT_ENCRYPTION_KEY
  if (!raw) throw new Error('MEI_CERT_ENCRYPTION_KEY não configurada')
  const keyBuf = raw.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(raw)
    ? Buffer.from(raw, 'base64')
    : Buffer.from(raw, 'utf8')
  if (keyBuf.length < 32) {
    throw new Error('MEI_CERT_ENCRYPTION_KEY deve ter 32 bytes (ou 44 em base64)')
  }
  const key = keyBuf.subarray(0, 32)
  const iv = Buffer.from(passphraseIv, 'base64')
  const combined = Buffer.from(passphraseEnc, 'base64')
  if (combined.length < 16) throw new Error('Dados de senha inválidos')
  const enc = combined.subarray(0, combined.length - 16)
  const tag = combined.subarray(combined.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

async function loadAuthDirectory (userIds) {
  const out = []
  // Admin API lista em páginas; filtramos pelos IDs do export
  const wanted = new Set(userIds)
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const users = data?.users || []
    for (const u of users) {
      if (!wanted.has(u.id)) continue
      out.push({
        id: u.id,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
        last_sign_in_at: u.last_sign_in_at,
        raw_app_meta_data: u.app_metadata || {},
        raw_user_meta_data: u.user_metadata || {},
      })
    }
    if (users.length < perPage) break
    page += 1
    if (page > 50) break
  }
  return out
}

async function loadAuthPasswordsFromDb (userIds) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('SUPABASE_DB_URL ausente no .env')
  }

  const connectionString = encodeDbUrlPassword(dbUrl)
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    // Colunas estáveis do GoTrue/Supabase Auth
    const usersRes = await client.query(
      `
      SELECT
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
      FROM auth.users
      WHERE id = ANY($1::uuid[])
      `,
      [userIds],
    )

    const identitiesRes = await client.query(
      `
      SELECT
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at,
        email
      FROM auth.identities
      WHERE user_id = ANY($1::uuid[])
      `,
      [userIds],
    )

    return {
      users: usersRes.rows,
      identities: identitiesRes.rows,
    }
  } finally {
    await client.end().catch(() => {})
  }
}

function encodeDbUrlPassword (raw) {
  const m = String(raw).match(/^([^:]+:\/\/[^:]+):([^@]+)@(.+)$/)
  if (!m) return raw
  const protocolUser = m[1]
  const rawPass = m[2]
  const rest = m[3]
  try {
    return `${protocolUser}:${encodeURIComponent(decodeURIComponent(rawPass))}@${rest}`
  } catch {
    return `${protocolUser}:${encodeURIComponent(rawPass)}@${rest}`
  }
}

function rowsToInsertSql (table, rows, opts = {}) {
  if (!rows?.length) return []
  const lines = []
  const cols = Object.keys(rows[0])
  const colList = cols.map((c) => quoteIdent(c)).join(', ')
  const tableName = opts.qualified ? table : quoteIdent(table)

  for (const row of rows) {
    const values = cols.map((c) => sqlLiteral(row[c])).join(', ')
    lines.push(
      `INSERT INTO ${tableName} (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING;`,
    )
  }
  return lines
}

function quoteIdent (name) {
  if (name.includes('.')) {
    return name.split('.').map((p) => `"${p.replace(/"/g, '""')}"`).join('.')
  }
  return `"${String(name).replace(/"/g, '""')}"`
}

function sqlLiteral (value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL'
    return String(value)
  }
  if (value instanceof Date) return `'${value.toISOString()}'`
  if (typeof value === 'object') {
    const json = JSON.stringify(value).replace(/'/g, "''")
    return `'${json}'::jsonb`
  }
  const s = String(value).replace(/'/g, "''")
  return `'${s}'`
}

async function fetchAll (buildQuery) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const batch = data || []
    rows.push(...batch)
    if (batch.length < PAGE) break
    from += PAGE
  }
  return rows
}

async function fetchInChunks (ids, buildQuery, opts = {}) {
  const out = []
  const chunkSize = 80
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    if (!chunk.length) continue
    let from = 0
    while (true) {
      const { data, error } = await buildQuery(chunk).range(from, from + PAGE - 1)
      if (error) {
        if (opts.softFail && (error.code === '42P01' || /does not exist|Could not find/i.test(error.message))) {
          return out
        }
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

function buildReadme (manifest) {
  return `# Importação — empresas MEI (export completo)

Exportado em: ${manifest.exported_at}

## O que tem neste pacote

| Pasta/arquivo | Conteúdo |
|---|---|
| \`tables/*.json\` | Dados public em JSON (fácil de inspecionar / ETL) |
| \`sql/01_public_tables.sql\` | INSERTs para schema \`public\` |
| \`sql/02_auth_users.sql\` | \`auth.users\` + \`auth.identities\` com **hash bcrypt** (mesma senha) |
| \`secrets/certificates.json\` | **PFX + senha do certificado em texto claro** |
| \`auth/users_directory.json\` | Lista e-mail/id (sem senha) |
| \`manifest.json\` | Contagens e metadados |

## Senha de login (mesmo acesso)

O Supabase **não guarda senha em texto**. Este export traz o campo \`encrypted_password\` (bcrypt do GoTrue).

No Postgres de destino (projeto Supabase):

1. Importe \`sql/02_auth_users.sql\` **antes** dos dados \`public\` que referenciam \`user_id\`.
2. Depois importe \`sql/01_public_tables.sql\`.
3. Usuários entram com o **mesmo e-mail e a mesma senha**.

Se \`02_auth_users.sql\` não existir, o export rodou sem \`SUPABASE_DB_URL\` válido — rode de novo após corrigir a connection string.

## Certificado digital

Em \`secrets/certificates.json\`: \`pfx_base64\` + \`passphrase\` (texto claro).

Trate como segredo: não commit, transfira por canal seguro.

## Contagens

\`\`\`json
${JSON.stringify(manifest.counts, null, 2)}
\`\`\`
`
}
