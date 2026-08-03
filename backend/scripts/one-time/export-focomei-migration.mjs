#!/usr/bin/env node
/**
 * Export completo MEI → FocoMEI
 *
 * Uso (Site/backend):
 *   node scripts/one-time/export-focomei-migration.mjs
 */
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const outRoot = path.join(__dirname, 'exports', `focomei-migration-${stamp}`)

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const PAGE = 1000
const ACTIVE_SUB = new Set(['active', 'ativo', 'trialing'])

const TABLES_BY_USER = [
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
  'mei_nfse_produtos',
  'mei_nfse_rps_counters',
  'das_mensal_status',
  'das_mei',
  'parcelamento_pdfs',
  'orcamentos',
  'recorrencias',
  'recorrencia_skips',
]

main().catch((err) => {
  console.error(err?.stack || err)
  process.exit(1)
})

async function main () {
  console.log(`Saída: ${outRoot}`)
  fs.mkdirSync(path.join(outRoot, 'empresas'), { recursive: true })
  fs.mkdirSync(path.join(outRoot, 'users'), { recursive: true })
  fs.mkdirSync(path.join(outRoot, 'secrets', 'certificates'), { recursive: true })

  const allEmpresas = await fetchAll(() =>
    admin.from('empresas').select('*').order('empresa'),
  )
  const subLines = await fetchAll(() =>
    admin.from('empresa_mei_subscription_lines').select('*'),
  )
  const activeSubEmpresas = new Set(
    subLines
      .filter((l) => ACTIVE_SUB.has(String(l.status || '').toLowerCase()))
      .map((l) => l.empresa_id)
      .filter(Boolean),
  )
  const meiLinksAll = await fetchAll(() =>
    admin
      .from('role_x_user_x_empresa')
      .select('*')
      .eq('mei', true)
      .eq('status', true),
  )
  const meiLinkEmpresas = new Set(meiLinksAll.map((l) => l.empresas_id).filter(Boolean))

  const included = []
  for (const e of allEmpresas) {
    const reasons = []
    if (Number(e.max_mei || 0) > 0) reasons.push('max_mei')
    if (activeSubEmpresas.has(e.id)) reasons.push('subscription_active')
    if (meiLinkEmpresas.has(e.id)) reasons.push('mei_link')
    if (reasons.length) included.push({ ...e, _reasons: reasons })
  }
  included.sort((a, b) => String(a.empresa || '').localeCompare(String(b.empresa || ''), 'pt-BR'))
  const empresaIds = included.map((e) => e.id)
  console.log(`Empresas: ${included.length}`)

  const roles = await fetchAll(() => admin.from('roles').select('*').order('roles'))
  const roleById = new Map(roles.map((r) => [r.id, r]))

  const links = await fetchInChunks(empresaIds, (chunk) =>
    admin.from('role_x_user_x_empresa').select('*').in('empresas_id', chunk).eq('status', true),
  )
  const userIds = [...new Set(links.map((l) => l.user_id).filter(Boolean))]
  console.log(`Usuários: ${userIds.length} | Vínculos: ${links.length}`)

  const profiles = await fetchInChunks(userIds, (chunk) =>
    admin.from('profiles').select('*').in('id', chunk),
  )
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  const invites = await fetchInChunks(empresaIds, (chunk) =>
    admin.from('empresa_invites').select('*').in('empresas_id', chunk),
    { softFail: true },
  )
  const subIncluded = subLines.filter((l) => empresaIds.includes(l.empresa_id))

  const authUsers = await loadAuthUsers(userIds)
  const authById = new Map(authUsers.map((u) => [u.id, u]))

  const byUser = {}
  const tableCounts = {}
  for (const table of TABLES_BY_USER) {
    const rows = await fetchInChunks(
      userIds,
      (chunk) => admin.from(table).select('*').in('user_id', chunk),
      { softFail: true },
    )
    byUser[table] = rows
    tableCounts[table] = rows.length
    console.log(`  ${table}: ${rows.length}`)
  }

  // index rows by user_id
  const indexByUser = (rows) => {
    const m = new Map()
    for (const r of rows || []) {
      const uid = r.user_id
      if (!uid) continue
      if (!m.has(uid)) m.set(uid, [])
      m.get(uid).push(r)
    }
    return m
  }
  const indexed = Object.fromEntries(
    Object.entries(byUser).map(([k, rows]) => [k, indexByUser(rows)]),
  )

  // certificates: meta in package, PFX only in secrets/
  const certMeta = []
  const certs = byUser.user_mei_certificates || []
  for (const row of certs) {
    const hasPfx = Boolean(row.pfx_base64)
    const { pfx_base64, passphrase_enc, passphrase_iv, ...rest } = row
    certMeta.push({
      id: row.id,
      user_id: row.user_id,
      has_pfx: hasPfx,
      has_passphrase_enc: Boolean(passphrase_enc),
      cert_document: row.cert_document || null,
      razao_social: row.razao_social || null,
      plugnotas_cert_id: row.plugnotas_cert_id || null,
      cert_valid_from: row.cert_valid_from || null,
      cert_valid_to: row.cert_valid_to || null,
    })
    if (hasPfx || passphrase_enc) {
      const secretPath = path.join(outRoot, 'secrets', 'certificates', `${row.id}.json`)
      writeJson(secretPath, {
        warning: 'SENSÍVEL — não versionar. Contém pfx_base64 e/ou passphrase cifrada.',
        id: row.id,
        user_id: row.user_id,
        pfx_base64: pfx_base64 || null,
        passphrase_enc: passphrase_enc || null,
        passphrase_iv: passphrase_iv || null,
        meta: rest,
        encryption: {
          algo: 'aes-256-gcm',
          env_key: 'MEI_CERT_ENCRYPTION_KEY',
          note: 'No FocoMEI use a mesma chave ou reimporte descriptografando no origem e recifrando no destino.',
        },
      })
    }
  }

  // users without profile
  const usersWithoutProfile = userIds.filter((id) => !profileById.has(id))

  // mei users
  const meiUserIds = [...new Set(links.filter((l) => l.mei === true).map((l) => l.user_id))]

  // admins por empresa
  const adminsByEmpresa = {}
  for (const e of included) {
    const empresaLinks = links.filter((l) => l.empresas_id === e.id)
    const admins = empresaLinks.filter((l) => {
      const roleName = String(roleById.get(l.roles_id)?.roles || '').toLowerCase()
      return roleName === 'admin' || roleName === 'superadmin'
    }).map((l) => ({
      user_id: l.user_id,
      email: authById.get(l.user_id)?.email || null,
      role: roleById.get(l.roles_id)?.roles || null,
      mei: l.mei === true,
      link_id: l.id,
    }))
    adminsByEmpresa[e.id] = admins
  }

  // empresas max_mei > 0 com 0 usuários mei
  const empresasMaxMeiSemMeiUsers = included
    .filter((e) => Number(e.max_mei || 0) > 0)
    .filter((e) => !links.some((l) => l.empresas_id === e.id && l.mei === true))
    .map((e) => ({
      id: e.id,
      empresa: e.empresa,
      cnpj: e.cnpj,
      max_mei: e.max_mei,
      active_users: links.filter((l) => l.empresas_id === e.id).length,
    }))

  // write per-empresa
  for (const e of included) {
    const { _reasons, ...empresaRow } = e
    const dir = path.join(outRoot, 'empresas', e.id)
    fs.mkdirSync(dir, { recursive: true })
    const empresaLinks = links.filter((l) => l.empresas_id === e.id)
    const empresaUserIds = [...new Set(empresaLinks.map((l) => l.user_id))]
    writeJson(path.join(dir, 'empresa.json'), {
      ...empresaRow,
      inclusion_reasons: _reasons,
    })
    writeJson(path.join(dir, 'memberships.json'), empresaLinks)
    writeJson(path.join(dir, 'admins.json'), adminsByEmpresa[e.id] || [])
    writeJson(
      path.join(dir, 'subscription_lines.json'),
      subIncluded.filter((l) => l.empresa_id === e.id),
    )
    writeJson(
      path.join(dir, 'invites.json'),
      invites.filter((i) => i.empresas_id === e.id),
    )
    writeJson(path.join(dir, 'user_ids.json'), empresaUserIds)
  }

  // write per-user
  for (const uid of userIds) {
    const dir = path.join(outRoot, 'users', uid)
    fs.mkdirSync(dir, { recursive: true })
    const auth = authById.get(uid) || { id: uid }
    const userLinks = links.filter((l) => l.user_id === uid)
    writeJson(path.join(dir, 'user.json'), {
      ...auth,
      password_reset_required: true,
      profile: profileById.get(uid) || null,
      profile_missing: !profileById.has(uid),
      memberships: userLinks.map((l) => ({
        link_id: l.id,
        empresas_id: l.empresas_id,
        roles_id: l.roles_id,
        role: roleById.get(l.roles_id)?.roles || null,
        mei: l.mei === true,
        status: l.status,
        expires_at: l.expires_at,
      })),
    })

    for (const table of TABLES_BY_USER) {
      if (table === 'user_mei_certificates') {
        // meta only (sem pfx) no user folder
        const rows = (indexed[table]?.get(uid) || []).map((row) => {
          const { pfx_base64, passphrase_enc, passphrase_iv, ...rest } = row
          return {
            ...rest,
            has_pfx: Boolean(pfx_base64),
            has_passphrase_enc: Boolean(passphrase_enc),
            secret_file: pfx_base64 || passphrase_enc
              ? `secrets/certificates/${row.id}.json`
              : null,
          }
        })
        writeJson(path.join(dir, 'certificate.meta.json'), rows)
        continue
      }
      const rows = indexed[table]?.get(uid) || []
      if (!rows.length && !(table in byUser && tableCounts[table] === 0)) {
        // table missing globally — skip empty file noise for soft-fail absent
      }
      writeJson(path.join(dir, `${table}.json`), rows)
    }
  }

  // aggregate files
  writeJson(path.join(outRoot, '01_empresas_mei.json'), included.map(({ _reasons, ...e }) => ({
    ...e,
    inclusion_reasons: _reasons,
  })))

  writeJson(path.join(outRoot, '02_users_and_memberships.json'), {
    password_reset_required_all: true,
    roles,
    users: userIds.map((uid) => {
      const auth = authById.get(uid) || { id: uid }
      return {
        ...auth,
        password_reset_required: true,
        profile: profileById.get(uid) || null,
        profile_missing: !profileById.has(uid),
        memberships: links.filter((l) => l.user_id === uid),
      }
    }),
    users_mei_true: meiUserIds,
    users_without_profile: usersWithoutProfile,
  })

  writeJson(path.join(outRoot, '03_certificates_meta.json'), {
    note: 'Sem PFX/senha. Binários em secrets/certificates/<id>.json',
    count: certMeta.length,
    with_pfx: certMeta.filter((c) => c.has_pfx).length,
    certificates: certMeta,
  })

  const manifest = {
    exported_at: new Date().toISOString(),
    source: 'MeiInfinito / Meu Financeiro (Supabase)',
    target: 'FocoMEI (AUTH_MODE=local)',
    package_path: outRoot,
    preserve_uuids: true,
    password_reset_required_all: true,
    filter: {
      criteria: 'max_mei>0 OR subscription_active OR mei_link_active',
      empresa_count: included.length,
    },
    counts: {
      empresas: included.length,
      users: userIds.length,
      users_mei_true: meiUserIds.length,
      users_without_profile: usersWithoutProfile.length,
      profiles_found: profiles.length,
      vinculos_ativos: links.length,
      vinculos_mei_true: links.filter((l) => l.mei === true).length,
      roles: roles.length,
      empresa_invites: invites.length,
      empresa_mei_subscription_lines: subIncluded.length,
      certificates: certs.length,
      certificates_with_pfx: certMeta.filter((c) => c.has_pfx).length,
      ...tableCounts,
    },
    empresas: included.map((e) => ({
      id: e.id,
      empresa: e.empresa,
      cnpj: e.cnpj,
      max_mei: e.max_mei,
      status: e.status,
      inclusion_reasons: e._reasons,
      admins_count: (adminsByEmpresa[e.id] || []).length,
      mei_users_count: links.filter((l) => l.empresas_id === e.id && l.mei === true).length,
      active_users_count: links.filter((l) => l.empresas_id === e.id).length,
    })),
    users_mei_true: meiUserIds.map((uid) => ({
      user_id: uid,
      email: authById.get(uid)?.email || null,
      profile_role: profileById.get(uid)?.role || null,
      empresas: links.filter((l) => l.user_id === uid && l.mei === true).map((l) => l.empresas_id),
    })),
    admins_by_empresa: adminsByEmpresa,
    empresas_max_mei_sem_usuarios_mei: empresasMaxMeiSemMeiUsers,
    users_without_profile: usersWithoutProfile.map((uid) => ({
      user_id: uid,
      email: authById.get(uid)?.email || null,
      default_profile_on_import: { id: uid, role: 'usuario' },
    })),
    security: {
      secrets_dir: 'secrets/certificates/',
      gitignored: true,
      no_plaintext_passphrase_in_manifest: true,
      google_tokens_included: true,
      note: 'Utilizador deve reconectar Google se tokens expirarem no destino.',
    },
  }

  writeJson(path.join(outRoot, '00_manifest.json'), manifest)
  fs.writeFileSync(path.join(outRoot, '90_validation.sql'), buildValidationSql(empresaIds, userIds, manifest.counts))
  fs.writeFileSync(path.join(outRoot, '99_IMPORT_NOTES_FOCOMEI.md'), buildImportNotes(manifest))

  // CSV opcional empresas
  const csvLines = [
    'id,empresa,cnpj,max_mei,status,reasons,mei_users,active_users,admins',
    ...manifest.empresas.map((e) =>
      [
        e.id,
        csvEscape(e.empresa),
        csvEscape(e.cnpj),
        e.max_mei,
        csvEscape(e.status),
        e.inclusion_reasons.join('+'),
        e.mei_users_count,
        e.active_users_count,
        e.admins_count,
      ].join(','),
    ),
  ]
  fs.writeFileSync(path.join(outRoot, '01_empresas_mei.csv'), csvLines.join('\n'), 'utf8')

  console.log('\n=== EXPORT OK ===')
  console.log(JSON.stringify({
    path: outRoot,
    empresas: manifest.counts.empresas,
    users: manifest.counts.users,
    users_mei_true: manifest.counts.users_mei_true,
    users_without_profile: manifest.counts.users_without_profile,
    empresas_max_mei_sem_mei_users: empresasMaxMeiSemMeiUsers.length,
    certificates_with_pfx: manifest.counts.certificates_with_pfx,
    lancamentos: manifest.counts.lancamentos_id,
    mei_nfse: manifest.counts.mei_nfse,
  }, null, 2))
}

function writeJson (filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function csvEscape (v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

async function loadAuthUsers (userIds) {
  const wanted = new Set(userIds)
  const out = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const users = data?.users || []
    for (const u of users) {
      if (!wanted.has(u.id)) continue
      out.push({
        id: u.id,
        email: u.email || null,
        phone: u.phone || null,
        email_confirmed_at: u.email_confirmed_at || null,
        created_at: u.created_at || null,
        banned_until: u.banned_until || null,
        raw_user_meta_data: u.user_metadata || {},
        raw_app_meta_data: u.app_metadata || {},
      })
    }
    if (users.length < 1000) break
    page += 1
    if (page > 50) break
  }
  return out
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
      const q = build(chunk)
      const { data, error } = await q.range(from, from + PAGE - 1)
      if (error) {
        if (softFail) return out
        throw new Error(`${error.message}`)
      }
      const batch = data || []
      out.push(...batch)
      if (batch.length < PAGE) break
      from += PAGE
    }
  }
  return out
}

function buildValidationSql (empresaIds, userIds, counts) {
  const empList = empresaIds.map((id) => `'${id}'`).join(',\n  ')
  return `-- Validação origem MeiInfinito ↔ manifesto FocoMEI
-- Gerado automaticamente. Contagens esperadas no manifesto:
-- ${JSON.stringify(counts)}

WITH mei_empresas AS (
  SELECT id FROM empresas
  WHERE id IN (
  ${empList}
  )
)
SELECT 'empresas_incluidas' AS metric, COUNT(*)::int AS n FROM mei_empresas
UNION ALL
SELECT 'vinculos_ativos', COUNT(*)::int
FROM role_x_user_x_empresa r
WHERE r.status IS TRUE AND r.empresas_id IN (SELECT id FROM mei_empresas)
UNION ALL
SELECT 'vinculos_mei_true', COUNT(*)::int
FROM role_x_user_x_empresa r
WHERE r.status IS TRUE AND r.mei IS TRUE AND r.empresas_id IN (SELECT id FROM mei_empresas)
UNION ALL
SELECT 'users_unicos', COUNT(DISTINCT r.user_id)::int
FROM role_x_user_x_empresa r
WHERE r.status IS TRUE AND r.empresas_id IN (SELECT id FROM mei_empresas)
UNION ALL
SELECT 'lancamentos', COUNT(*)::int
FROM lancamentos_id l
WHERE l.user_id IN (
  SELECT DISTINCT user_id FROM role_x_user_x_empresa
  WHERE status IS TRUE AND empresas_id IN (SELECT id FROM mei_empresas)
)
UNION ALL
SELECT 'mei_nfse', COUNT(*)::int
FROM mei_nfse n
WHERE n.user_id IN (
  SELECT DISTINCT user_id FROM role_x_user_x_empresa
  WHERE status IS TRUE AND empresas_id IN (SELECT id FROM mei_empresas)
)
UNION ALL
SELECT 'certificados', COUNT(*)::int
FROM user_mei_certificates c
WHERE c.user_id IN (
  SELECT DISTINCT user_id FROM role_x_user_x_empresa
  WHERE status IS TRUE AND empresas_id IN (SELECT id FROM mei_empresas)
);
`
}

function buildImportNotes (manifest) {
  return `# Notas de importação — FocoMEI

Exportado em: ${manifest.exported_at}
Origem: MeiInfinito (Supabase Auth)
Destino: FocoMEI (\`AUTH_MODE=local\`)

## Princípios
1. **Preservar UUIDs** de \`users\`, \`empresas\`, \`role_x_user_x_empresa\` e demais PKs sempre que o schema do FocoMEI permitir.
2. Se algum UUID não puder ser preservado: gerar mapa \`old_id → new_id\` e reescrever FKs em lote.
3. **Senha de login:** \`password_reset_required=true\` para **todos** os usuários. Não há hash Auth neste pacote. No FocoMEI, forçar reset / criar senha temporária + fluxo de troca.

## Ordem sugerida
1. \`roles\` (catálogo)
2. \`public.users\` (a partir de \`02_users_and_memberships.json\` / \`users/*/user.json\`) — mapear de \`auth.users\`
3. \`profiles\` — ver secção abaixo
4. \`empresas\` (\`01_empresas_mei.json\` / \`empresas/<id>/empresa.json\`)
5. \`role_x_user_x_empresa\`
6. \`empresa_mei_subscription_lines\`, \`empresa_invites\` (tokens: tratar como sensíveis)
7. Dados por usuário: contas → categorias → lançamentos → recorrências → NFS-e → DAS → certificados

## Profiles faltantes (${manifest.counts.users_without_profile})
${manifest.counts.users_without_profile} usuários **não** têm linha em \`profiles\`.
Lista completa: \`00_manifest.json\` → \`users_without_profile\`.

**No import:** criar default:
\`\`\`json
{ "id": "<mesmo user_id>", "role": "usuario" }
\`\`\`

## Usuários MEI (\`mei=true\`)
Contagem: **${manifest.counts.users_mei_true}**
Lista: \`00_manifest.json\` → \`users_mei_true\`

## Admins por empresa
\`00_manifest.json\` → \`admins_by_empresa\`
Também em \`empresas/<empresa_id>/admins.json\`

## Empresas com max_mei > 0 e 0 usuários mei
Contagem: **${manifest.empresas_max_mei_sem_usuarios_mei.length}**
Lista: \`00_manifest.json\` → \`empresas_max_mei_sem_usuarios_mei\`

## Certificados digitais
- Meta (sem segredo): \`03_certificates_meta.json\` e \`users/<id>/certificate.meta.json\`
- **Segredos:** \`secrets/certificates/<cert_id>.json\` (PFX base64 + \`passphrase_enc\` / \`passphrase_iv\`)
- Cifra origem: AES-256-GCM com env \`MEI_CERT_ENCRYPTION_KEY\`
- No FocoMEI: usar a **mesma** chave **ou** descriptografar no ambiente origem seguro e recifrar com a chave do FocoMEI
- **Nunca** commitar \`secrets/\` nem colar PFX/senha em chat/PR

## Google OAuth
\`google_tokens_id\` está no pacote (\`users/<id>/google_tokens_id.json\`).
Tokens podem expirar / ser inválidos noutro projeto OAuth. Se falhar: utilizador reconecta Google no FocoMEI.

## WhatsApp (\`n8n_link\`)
Incluído. Validar se o número continua único no destino.

## Validação
Rodar \`90_validation.sql\` no Postgres/Supabase de origem e comparar com \`00_manifest.json\` → \`counts\`.

## Contagens do manifesto
\`\`\`json
${JSON.stringify(manifest.counts, null, 2)}
\`\`\`
`
}
