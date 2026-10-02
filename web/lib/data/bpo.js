import 'server-only';
import { backendFetch, getBackendApiBase } from '@/lib/auth/backendApi';
import { fetchCategories } from '@/lib/data/dashboard';

/**
 * Matriz anual da Visão BPO. Caminho principal: `GET /api/categories/budgets/dre-matrix`
 * (o mesmo que o app atual usa primeiro). A API limita ao usuário do token.
 * Se a rota não existir, cai na mesma consulta do fallback do Expo.
 */

function normalizeCells(rows) {
  return (Array.isArray(rows) ? rows : []).map((cell) => ({
    categorias_id: Number(cell.categorias_id),
    month: Number(cell.month),
    valor_orcado: cell.valor_orcado === null || cell.valor_orcado === undefined ? null : Number(cell.valor_orcado),
    valor_gasto: Number(cell.valor_gasto || 0),
    valor_recebido: Number(cell.valor_recebido || 0),
  }));
}

async function fetchDreMatrixFromSupabase(supabase, userId, year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const monthOf = (date) => {
    const month = Number(String(date || '').split('-')[1]);
    return month >= 1 && month <= 12 ? month : null;
  };

  const [{ data: cats, error: catErr }, { data: budgets, error: budErr }, { data: spent, error: spentErr }, { data: received, error: recErr }] =
    await Promise.all([
      supabase.from('categorias_id').select('id, nome').eq('user_id', userId),
      supabase.from('orçamentos').select('categorias_id, valor_orçado, date').eq('user_id', userId).gte('date', start).lte('date', end),
      supabase.from('lancamentos_id').select('classificacao, valor, data').eq('user_id', userId).in('tipo', ['saida', 'saída']).gte('data', start).lte('data', end),
      supabase
        .from('lancamentos_id')
        .select('classificacao, valor, data')
        .eq('user_id', userId)
        .eq('status', 'recebido')
        .eq('tipo', 'entrada')
        .gte('data', start)
        .lte('data', end),
    ]);
  const error = catErr || budErr || spentErr || recErr;
  if (error) throw new Error(error.message);

  const budgetMap = new Map();
  for (const row of budgets || []) {
    const month = monthOf(row.date);
    if (!month || !row.categorias_id) continue;
    budgetMap.set(`${row.categorias_id}_${month}`, row['valor_orçado'] ?? null);
  }
  const add = (map, rows) => {
    for (const row of rows || []) {
      const month = monthOf(row.data);
      if (!month) continue;
      const key = `${normalize(row.classificacao)}_${month}`;
      map.set(key, (map.get(key) || 0) + Number(row.valor || 0));
    }
  };
  const spentMap = new Map();
  const receivedMap = new Map();
  add(spentMap, spent);
  add(receivedMap, received);

  const cells = [];
  for (const cat of cats || []) {
    const nome = normalize(cat.nome);
    for (let month = 1; month <= 12; month += 1) {
      const hasBudget = budgetMap.has(`${cat.id}_${month}`);
      const valorGasto = spentMap.get(`${nome}_${month}`) || 0;
      const valorRecebido = receivedMap.get(`${nome}_${month}`) || 0;
      if (!hasBudget && valorGasto === 0 && valorRecebido === 0) continue;
      cells.push({
        categorias_id: Number(cat.id),
        month,
        valor_orcado: hasBudget ? budgetMap.get(`${cat.id}_${month}`) ?? null : null,
        valor_gasto: valorGasto,
        valor_recebido: valorRecebido,
      });
    }
  }
  return cells;
}

export async function loadBpoMatrix(supabase, userId, year) {
  const { list } = await fetchCategories(supabase, userId);
  const categories = list
    .map((cat) => ({ id: Number(cat.id), nome: cat.nome, tipo: cat.tipo }))
    .filter((cat) => cat.id > 0 && cat.nome);

  let cells = null;
  if (getBackendApiBase()) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      try {
        cells = normalizeCells(await backendFetch(`/categories/budgets/dre-matrix?year=${year}`, { token }));
      } catch (error) {
        console.warn('[bpo] API da matriz falhou — usando Supabase.', error?.message || error);
      }
    }
  }
  if (!cells) cells = await fetchDreMatrixFromSupabase(supabase, userId, year);
  return { categories, cells };
}
