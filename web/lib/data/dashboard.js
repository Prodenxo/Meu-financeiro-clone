import 'server-only';
import { getMonthStart, normalizarTipo, normalizeCategoryKey, normalizeLancamentoRow } from '@/lib/finance/normalize';
import { normalizeContaRow } from '@/lib/finance/contas';
import { unwrapApiList } from '@/lib/data/unwrapApi';

/** Mesma query do `transactionStore.fetchTransactions` (todos os lançamentos do usuário). */
export async function fetchTransactions(supabase, userId) {
  const { data, error } = await supabase
    .from('lancamentos_id')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os lançamentos: ${error.message}`);
  return (data || []).map(normalizeLancamentoRow);
}

/** Mesma query do `contaFinanceiraStore.fetchContas`. */
export async function fetchContas(supabase, userId) {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
  if (error) throw new Error(`Não foi possível carregar as contas: ${error.message}`);
  return (data || []).map(normalizeContaRow);
}

/**
 * Categorias do usuário — igual ao `fetchUserCategories` do Expo:
 * prefere a API Express (`GET /api/categories`, que garante a cópia das categorias
 * globais) e cai para a consulta direta no Supabase quando a API não está configurada.
 * A URL da API e o token ficam só no servidor.
 */
export async function fetchCategories(supabase, userId) {
  const apiUrl = process.env.MEI_API_URL?.trim().replace(/\/$/, '');
  if (apiUrl) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const res = await fetch(`${apiUrl}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const rows = unwrapApiList(await res.json());
          if (rows) return toCategoryMaps(rows);
          console.warn('[categories] API devolveu um formato inesperado — usando Supabase.');
        }
        console.warn('[categories] API respondeu', res.status, '— usando Supabase.');
      }
    } catch (err) {
      console.warn('[categories] API indisponível — usando Supabase.', err?.message || err);
    }
  }

  const { data, error } = await supabase
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId)
    .order('nome');
  if (error) {
    console.warn('[categories] Supabase falhou:', error.message);
    return toCategoryMaps([]);
  }
  return toCategoryMaps(data || []);
}

function toCategoryMaps(rows) {
  const categoriasMap = {};
  const categoriasTipoMap = {};
  const list = [];
  for (const cat of rows) {
    const id = String(cat.id ?? '');
    const nome = String(cat.nome ?? '');
    const tipo = normalizarTipo(String(cat.tipo ?? ''));
    if (!id) continue;
    categoriasMap[id] = nome;
    categoriasTipoMap[id] = tipo;
    list.push({ id, nome, tipo });
  }
  return { categoriasMap, categoriasTipoMap, list };
}

/**
 * Resumo de orçamento do mês — porta de `hooks/useDashboardBudgetSummary.ts`
 * (somente leitura; não cria linhas em `orçamentos`).
 */
export async function fetchBudgetSummary(supabase, userId, { year, month }, categoriasMap) {
  const currentMonthStart = getMonthStart(new Date(year, month - 1, 1));
  const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

  const [
    { data: budgetRows, error: budgetError },
    { data: spentRows, error: spentError },
    { data: receivedRows, error: receivedError },
  ] = await Promise.all([
    supabase
      .from('orçamentos')
      .select('categorias_id, valor_orçado, user_id')
      .eq('date', currentMonthStart)
      .or(`user_id.eq.${userId},user_id.is.null`),
    supabase
      .from('lancamentos_id')
      .select('classificacao, valor, tipo, data')
      .eq('user_id', userId)
      .in('tipo', ['saida', 'saída'])
      .gte('data', startOfMonth)
      .lte('data', endOfMonth),
    supabase
      .from('lancamentos_id')
      .select('classificacao, valor, tipo, data, status')
      .eq('user_id', userId)
      .eq('status', 'recebido')
      .eq('tipo', 'entrada')
      .gte('data', startOfMonth)
      .lte('data', endOfMonth),
  ]);

  if (budgetError || spentError || receivedError) {
    console.warn('[budgets] falha:', budgetError?.message || spentError?.message || receivedError?.message);
    return [];
  }

  const nameToId = {};
  Object.entries(categoriasMap).forEach(([id, nome]) => {
    if (nome) nameToId[normalizeCategoryKey(nome)] = id;
  });

  const summaryById = {};
  (budgetRows || []).forEach((row) => {
    const catId = Number(row.categorias_id);
    if (!catId) return;
    const valorOrcado = row['valor_orçado'];
    summaryById[String(catId)] = {
      categorias_id: catId,
      valor_orcado:
        typeof valorOrcado === 'number'
          ? valorOrcado
          : valorOrcado === null || valorOrcado === undefined
            ? null
            : Number(valorOrcado),
      valor_gasto: 0,
      valor_recebido: 0,
    };
  });

  (spentRows || []).forEach((row) => {
    const catId = nameToId[normalizeCategoryKey(String(row?.classificacao ?? ''))];
    if (!catId || !summaryById[catId]) return;
    summaryById[catId].valor_gasto += Number(row.valor ?? 0);
  });

  (receivedRows || []).forEach((row) => {
    const catId = nameToId[normalizeCategoryKey(String(row?.classificacao ?? ''))];
    if (!catId || !summaryById[catId]) return;
    summaryById[catId].valor_recebido += Number(row.valor ?? 0);
  });

  return Object.values(summaryById);
}

/** Carrega tudo que a Visão geral precisa, em paralelo (sem cascata). */
export async function loadDashboardData(supabase, userId, selectedMonth) {
  const [transactions, contas, categories] = await Promise.all([
    fetchTransactions(supabase, userId),
    fetchContas(supabase, userId),
    fetchCategories(supabase, userId),
  ]);
  const budgetSummary = await fetchBudgetSummary(supabase, userId, selectedMonth, categories.categoriasMap);
  return { transactions, contas, categories, budgetSummary };
}
