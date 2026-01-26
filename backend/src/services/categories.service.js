import { createSupabaseClient } from '../config/supabase.js';
import { badRequest } from '../utils/errors.js';

const normalizeTipo = (tipo) => {
  if (!tipo) return tipo;
  return tipo === 'saída' ? 'saida' : tipo;
};

const parseValorOrcado = (valorOrcado) => {
  if (valorOrcado === null || valorOrcado === undefined || valorOrcado === '') return null;
  const parsed = Number(String(valorOrcado).replace(',', '.'));
  if (Number.isNaN(parsed)) throw badRequest('Valor do orçamento inválido');
  return parsed;
};

const ensureUserCategory = async (dbClient, userId, categoriaId) => {
  const { data, error } = await dbClient
    .from('categorias_id')
    .select('id, user_id')
    .eq('id', categoriaId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .maybeSingle();

  if (error) throw badRequest(error.message);
  if (!data) throw badRequest('Categoria inválida para o usuário');
};

export const listCategories = async (userId, tipo) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });

  const { data: userCategories, error: userError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId);

  if (userError) throw badRequest(userError.message);

  const { data: globalCategories, error: globalError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .is('user_id', null);

  if (globalError) throw badRequest(globalError.message);

  let allCategories = [
    ...(userCategories || []),
    ...(globalCategories || [])
  ];

  if (tipo) {
    const tipoNormalizado = normalizeTipo(tipo);
    const tiposAceitos = tipoNormalizado === 'saida'
      ? ['saida', 'saída']
      : [tipoNormalizado];
    allCategories = allCategories.filter((cat) => tiposAceitos.includes(cat.tipo));
  }

  return allCategories.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const createCategory = async (userId, payload) => {
  const { nome, tipo } = payload || {};
  if (!nome || !tipo) throw badRequest('Nome e tipo são obrigatórios');

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await dbClient
    .from('categorias_id')
    .insert({ nome, tipo: normalizeTipo(tipo), user_id: userId })
    .select()
    .single();

  if (error) throw badRequest(error.message);
  return data;
};

export const updateCategory = async (userId, payload) => {
  const { id, ...updates } = payload || {};
  if (!id) throw badRequest('ID da categoria é obrigatório');

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await dbClient
    .from('categorias_id')
    .update({
      ...updates,
      ...(updates.tipo ? { tipo: normalizeTipo(updates.tipo) } : {})
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw badRequest(error.message);
  return data;
};

export const deleteCategory = async (userId, body, query) => {
  const idFromQuery = query?.id ? Number(query.id) : null;
  const idFromBody = body?.id ? Number(body.id) : null;
  const id = idFromQuery || idFromBody;

  if (!id) throw badRequest('ID da categoria é obrigatório');

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await dbClient
    .from('categorias_id')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw badRequest(error.message);
};

export const listCategoryBudgets = async (userId) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado')
    .eq('user_id', userId);

  if (error) throw badRequest(error.message);
  return data || [];
};

export const upsertCategoryBudget = async (userId, payload) => {
  const { categorias_id: categoriasId, valor_orcado: valorOrcado } = payload || {};
  const categoriaId = Number(categoriasId);

  if (!categoriaId) throw badRequest('ID da categoria é obrigatório');

  const dbClient = createSupabaseClient({ useServiceRole: true });
  await ensureUserCategory(dbClient, userId, categoriaId);

  const valorOrcadoNormalizado = parseValorOrcado(valorOrcado);

  const { data: existing, error: existingError } = await dbClient
    .from('orçamentos')
    .select('id')
    .eq('user_id', userId)
    .eq('categorias_id', categoriaId)
    .maybeSingle();

  if (existingError) throw badRequest(existingError.message);

  if (existing?.id) {
    const { data, error } = await dbClient
      .from('orçamentos')
      .update({ 'valor_orçado': valorOrcadoNormalizado })
      .eq('id', existing.id)
      .select('categorias_id, valor_orçado')
      .single();

    if (error) throw badRequest(error.message);
    return data;
  }

  const { data, error } = await dbClient
    .from('orçamentos')
    .insert({
      user_id: userId,
      categorias_id: categoriaId,
      'valor_orçado': valorOrcadoNormalizado
    })
    .select('categorias_id, valor_orçado')
    .single();

  if (error) throw badRequest(error.message);
  return data;
};

export const listCategoryBudgetsSummary = async (userId) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });

  const { data: userCategories, error: userError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId);

  if (userError) throw badRequest(userError.message);

  const { data: globalCategories, error: globalError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .is('user_id', null);

  if (globalError) throw badRequest(globalError.message);

  const allCategories = [
    ...(userCategories || []),
    ...(globalCategories || [])
  ];

  const { data: budgets, error: budgetsError } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado')
    .eq('user_id', userId);

  if (budgetsError) throw badRequest(budgetsError.message);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const { data: transactions, error: transactionsError } = await dbClient
    .from('lancamentos_id')
    .select('classificacao, valor, tipo, data')
    .eq('user_id', userId)
    .in('tipo', ['saida', 'saída'])
    .gte('data', startOfMonth)
    .lte('data', endOfMonth);

  if (transactionsError) throw badRequest(transactionsError.message);

  const spentByCategoryName = new Map();
  (transactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const key = String(transaction.classificacao).toLowerCase();
    const current = spentByCategoryName.get(key) || 0;
    spentByCategoryName.set(key, current + Number(transaction.valor || 0));
  });

  const { data: receivedTransactions, error: receivedError } = await dbClient
    .from('lancamentos_id')
    .select('classificacao, valor, tipo, data, status')
    .eq('user_id', userId)
    .eq('status', 'recebido')
    .eq('tipo', 'entrada')
    .gte('data', startOfMonth)
    .lte('data', endOfMonth);

  if (receivedError) throw badRequest(receivedError.message);

  const receivedByCategoryName = new Map();
  (receivedTransactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const key = String(transaction.classificacao).toLowerCase();
    const current = receivedByCategoryName.get(key) || 0;
    receivedByCategoryName.set(key, current + Number(transaction.valor || 0));
  });

  const budgetByCategoryId = new Map();
  (budgets || []).forEach((budget) => {
    budgetByCategoryId.set(budget.categorias_id, budget.valor_orçado ?? null);
  });

  return allCategories.map((categoria) => ({
    categorias_id: categoria.id,
    valor_orcado: budgetByCategoryId.has(categoria.id) ? budgetByCategoryId.get(categoria.id) : null,
    valor_gasto: spentByCategoryName.get(String(categoria.nome).toLowerCase()) || 0,
    valor_recebido: receivedByCategoryName.get(String(categoria.nome).toLowerCase()) || 0
  }));
};
