/**
 * Corrige receitas (entrada) gravadas com status "pago" → "recebido".
 *
 * Dry-run:
 *   node scripts/one-time/fix-entrada-pago-status.mjs
 *
 * Aplicar:
 *   node scripts/one-time/fix-entrada-pago-status.mjs --apply
 *
 * Um usuário:
 *   node scripts/one-time/fix-entrada-pago-status.mjs --user-id=<uuid> --apply
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const eq = a.indexOf('=');
      if (eq === -1) return [a.slice(2), true];
      return [a.slice(2, eq), a.slice(eq + 1)];
    }),
);

const apply = Boolean(args.apply);
const userId = args['user-id'] || args.userId || null;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let query = admin
  .from('lancamentos_id')
  .select('id, user_id, classificacao, valor, data, status, tipo', { count: 'exact' })
  .eq('tipo', 'entrada')
  .eq('status', 'pago');

if (userId) query = query.eq('user_id', userId);

const { data: rows, error, count } = await query;
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Modo: ${apply ? 'APPLY' : 'DRY-RUN'}`);
console.log(`Registros entrada+pago: ${count ?? rows?.length ?? 0}`);

if (!rows?.length) {
  console.log('Nada a corrigir.');
  process.exit(0);
}

for (const row of rows.slice(0, 20)) {
  console.log(`  ${row.id} | user=${row.user_id} | ${row.classificacao} | R$ ${row.valor} | ${row.data}`);
}
if (rows.length > 20) console.log(`  ... +${rows.length - 20} linhas`);

if (!apply) {
  console.log('\nDry-run ok. Rode com --apply para gravar.');
  process.exit(0);
}

const ids = rows.map((r) => r.id);
const { error: updErr, count: updated } = await admin
  .from('lancamentos_id')
  .update({ status: 'recebido' })
  .in('id', ids);

if (updErr) {
  console.error('Falha ao atualizar:', updErr.message);
  process.exit(1);
}

console.log(`\nAtualizados: ${updated ?? ids.length} lançamentos → status recebido`);
