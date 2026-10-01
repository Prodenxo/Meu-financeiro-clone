import 'server-only';
import { normalizeContaMoedaGlobalRow } from '@/lib/finance/moedas';
import { fetchCurrencyCatalog, fetchRatesToBrl } from '@/lib/data/cotacoes';

/** Mesma mensagem do app atual quando a migration ainda não foi aplicada. */
export function formatContaMoedaGlobalDbError(error) {
  const msg = String(error?.message || 'Erro ao acessar a Conta global.');
  const code = String(error?.code || '');
  if (code === '42P01' || code === 'PGRST205' || /contas_moeda_global/i.test(msg) || /schema cache/i.test(msg) || /relation.*does not exist/i.test(msg)) {
    return 'A tabela contas_moeda_global ainda não existe no Supabase. Execute a migration supabase/migrations/20260706120000_create_contas_moeda_global.sql no SQL Editor do projeto.';
  }
  return msg;
}

/** Mesma consulta do `contaMoedaGlobalStore.fetchContas` (só ativas, ordenadas por moeda). */
export async function fetchContasMoedaGlobal(supabase, userId) {
  const { data, error } = await supabase.from('contas_moeda_global').select('*').eq('user_id', userId).eq('ativo', true).order('moeda', { ascending: true });
  if (error) throw new Error(formatContaMoedaGlobalDbError(error));
  return (data || []).map(normalizeContaMoedaGlobalRow);
}

/**
 * Dados da tela: moedas do utilizador + cotações só das moedas cadastradas + catálogo para o modal.
 * O saldo daqui NÃO entra na Visão geral (`lib/data/dashboard.js` não lê esta tabela).
 */
export async function loadContaGlobalData(supabase, userId) {
  const contas = await fetchContasMoedaGlobal(supabase, userId);
  const codes = [...new Set(contas.map((c) => c.moeda))];
  const [cotacoes, catalog] = await Promise.all([fetchRatesToBrl(codes), fetchCurrencyCatalog()]);
  return { contas, rates: cotacoes.rates, rateSources: cotacoes.sources, ratesError: cotacoes.error, catalog };
}
