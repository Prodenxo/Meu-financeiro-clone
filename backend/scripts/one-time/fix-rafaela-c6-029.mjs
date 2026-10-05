#!/usr/bin/env node
/**
 * Corrige o lançamento errado da Rafaela (CAD Conta Global em vez de C6 BRL).
 * user: 0b0f17c3-f26d-426f-829b-e70bc090478a
 * CAD id: 12c64316-7ad8-48e6-8a95-43dc98831b14
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const APPLY = process.argv.includes('--apply')
const userId = '0b0f17c3-f26d-426f-829b-e70bc090478a'
const cadId = '12c64316-7ad8-48e6-8a95-43dc98831b14'

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: cad } = await admin
  .from('contas_moeda_global')
  .select('*')
  .eq('id', cadId)
  .eq('user_id', userId)
  .maybeSingle()

console.log('CAD row', cad)

const { data: contas } = await admin
  .from('contas_financeiras')
  .select('id, nome, ativo')
  .eq('user_id', userId)

console.log('contas', contas)

const c6 = (contas || []).find((c) => /c6/i.test(String(c.nome || '')))
console.log('c6 match', c6)

if (!APPLY) {
  console.log('Dry-run. Passe --apply para: apagar CAD + criar entrada 0.29 no C6.')
  process.exit(0)
}

if (cad) {
  const { error } = await admin
    .from('contas_moeda_global')
    .delete()
    .eq('id', cadId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  console.log('CAD removido')
}

if (!c6?.id) {
  console.error('Conta C6 não encontrada — não criei lançamento.')
  process.exit(1)
}

const { data: catRows } = await admin
  .from('categorias_id')
  .select('id, nome, tipo')
  .eq('user_id', userId)
  .ilike('nome', '%receb%')
  .limit(10)

console.log('categorias receb*', catRows)

const categoria =
  (catRows || []).find((c) => /recebimento/i.test(c.nome))?.nome
  || (catRows || [])[0]?.nome
  || 'Recebimento'

const row = {
  user_id: userId,
  tipo: 'entrada',
  valor: 0.29,
  data: '2026-07-22',
  status: 'recebido',
  classificacao: categoria,
  categoria,
  conta_id: c6.id,
  obs: 'Recebimento de R$ 0,29 na conta C6 Bank. (corrigido após falso Conta Global)',
}

const { data: inserted, error: insErr } = await admin
  .from('lancamentos_id')
  .insert(row)
  .select('id, valor, data, conta_id, categoria, obs')
  .maybeSingle()

if (insErr) throw new Error(insErr.message)
console.log('LANCAMENTO_OK', inserted)
