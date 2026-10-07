import { createSupabaseClient } from '../config/supabase.js';
import { HttpError, badRequest, notFound } from '../utils/errors.js';
import { fetchAllPages } from './transactions.service.js';

/** Cliente Supabase (service role) para leituras de orçamentos/resumo DRE; substituível em testes de paridade. */
let getCategoriesBudgetReadClient = () => createSupabaseClient({ useServiceRole: true });

export const __setCategoriesBudgetReadClientForTests = (fn) => {
  const prev = getCategoriesBudgetReadClient;
  getCategoriesBudgetReadClient = fn;
  return () => {
    getCategoriesBudgetReadClient = prev;
  };
};

const normalizeTipo = (tipo) => {
  if (!tipo) return tipo;
  return tipo === 'saída' ? 'saida' : tipo;
};

const normalizeCategoryName = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const categoryCopyKey = (nome, tipo) =>
  `${normalizeCategoryName(nome)}:${normalizeTipo(tipo) || ''}`;

const mergeOrcadoValues = (left, right) => {
  if (left == null) return right ?? null;
  if (right == null) return left;
  return Math.max(Number(left), Number(right));
};

/**
 * Colapsa categorias duplicadas (mesmo nome + tipo) num único ID canónico (menor id).
 * Evita linhas repetidas e soma duplicada do realizado na matriz DRE/BPO.
 */
export const dedupeCategoriesByCopyKey = (categories) => {
  const groups = new Map();
  for (const cat of categories || []) {
    const key = categoryCopyKey(cat.nome, cat.tipo);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cat);
  }

  const canonicalCategories = [];
  const categoryIdAlias = new Map();

  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => Number(a.id) - Number(b.id));
    const keep = sorted[0];
    canonicalCategories.push(keep);
    for (const cat of sorted) {
      categoryIdAlias.set(cat.id, keep.id);
    }
  }

  return { canonicalCategories, categoryIdAlias };
};

/**
 * Garante cópias das categorias globais (user_id IS NULL) para o utilizador.
 * Idempotente — alinhado à migração copy_global_categories_to_users + RLS categorias_select_own.
 */
export const ensureGlobalCategoriesCopiedForUser = async (dbClient, userId) => {
  if (!userId) return { inserted: 0, budgetRows: 0 };

  const { data: globals, error: globalError } = await dbClient
    .from('categorias_id')
    .select('nome, tipo')
    .is('user_id', null);

  if (globalError) throw badRequest(globalError.message);
  if (!globals?.length) return { inserted: 0, budgetRows: 0 };

  const { data: existing, error: existingError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo')
    .eq('user_id', userId);

  if (existingError) throw badRequest(existingError.message);

  const existingKeys = new Set(
    (existing || []).map((row) => categoryCopyKey(row.nome, row.tipo)),
  );

  const toInsert = (globals || [])
    .filter((row) => !existingKeys.has(categoryCopyKey(row.nome, row.tipo)))
    .map((row) => ({
      user_id: userId,
      nome: row.nome,
      tipo: normalizeTipo(row.tipo),
    }));

  if (!toInsert.length) return { inserted: 0, budgetRows: 0 };

  const { data: insertedRows, error: insertError } = await dbClient
    .from('categorias_id')
    .insert(toInsert)
    .select('id');

  if (insertError) throw badRequest(insertError.message);

  const monthStart = getMonthStartDateString();
  const newIds = (insertedRows || []).map((row) => row.id).filter(Boolean);
  let budgetRows = 0;

  if (newIds.length > 0) {
    const { data: existingBudgets, error: budgetReadError } = await dbClient
      .from('orçamentos')
      .select('categorias_id')
      .eq('user_id', userId)
      .eq('date', monthStart)
      .in('categorias_id', newIds);

    if (budgetReadError) throw badRequest(budgetReadError.message);

    const budgetedIds = new Set((existingBudgets || []).map((row) => row.categorias_id));
    const budgetInserts = newIds
      .filter((id) => !budgetedIds.has(id))
      .map((categorias_id) => ({
        user_id: userId,
        categorias_id,
        date: monthStart,
        'valor_orçado': null,
      }));

    if (budgetInserts.length > 0) {
      const { error: budgetInsertError } = await dbClient
        .from('orçamentos')
        .insert(budgetInserts);
      if (budgetInsertError) throw badRequest(budgetInsertError.message);
      budgetRows = budgetInserts.length;
    }
  }

  return { inserted: toInsert.length, budgetRows };
};

export const parseValorOrcado = (valorOrcado) => {
  if (valorOrcado === null || valorOrcado === undefined || valorOrcado === '') return null;
  const parsed = Number(String(valorOrcado).replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw badRequest('Informe um valor orçado válido.', { valor_orcado: 'Informe um valor orçado válido.' });
  }
  return Math.round(parsed * 100) / 100;
};

const pad2 = (n) => String(n).padStart(2, '0');

/** `toISOString` desloca o dia conforme o fuso do servidor; a data civil local é a que vale. */
export const formatLocalDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getMonthStartDateString = (date = new Date()) =>
  formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));

/** Início do mês de `date` ("AAAA-MM-DD", "AAAA-MM-DDTHH:mm..." ou Date); string é lida sem fuso. */
export const monthStartFromInput = (date) => {
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})/.exec(date.trim());
    if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) return `${match[1]}-${match[2]}-01`;
  }
  const parsed = date ? new Date(date) : new Date();
  if (Number.isNaN(parsed.getTime())) throw badRequest('Mês inválido');
  return getMonthStartDateString(parsed);
};

const ensureMonthlyBudgets = async (dbClient, userId, targetDate = new Date()) => {
  const currentMonthStart = getMonthStartDateString(targetDate);
  const previousMonthStart = getMonthStartDateString(
    new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
  );

  const { data: currentBudgets, error: currentError } = await dbClient
    .from('orçamentos')
    .select('categorias_id')
    .eq('user_id', userId)
    .eq('date', currentMonthStart);

  if (currentError) throw badRequest(currentError.message);

  const existingIds = new Set((currentBudgets || []).map((item) => item.categorias_id));

  const { data: lastMonthBudgets, error: lastMonthError } = await dbClient
    .from('orçamentos')
    .select('categorias_id')
    .eq('user_id', userId)
    .eq('date', previousMonthStart)
    .not('valor_orçado', 'is', null);

  if (lastMonthError) throw badRequest(lastMonthError.message);

  const toInsert = (lastMonthBudgets || [])
    .filter((budget) => !existingIds.has(budget.categorias_id))
    .map((budget) => ({
      user_id: userId,
      categorias_id: budget.categorias_id,
      date: currentMonthStart,
      'valor_orçado': null
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await dbClient
      .from('orçamentos')
      .insert(toInsert);

    if (insertError) throw badRequest(insertError.message);
  }

  return currentMonthStart;
};

const getYearMonthRange = (year) => {
  return { startDate: formatLocalDate(new Date(year, 0, 1)), endDate: formatLocalDate(new Date(year, 11, 31)) };
};

const getMonthRangeFromInput = (year, month) => {
  if (!year || !month || Number.isNaN(Number(year)) || Number.isNaN(Number(month))) {
    return null;
  }
  if (month < 1 || month > 12) {
    throw badRequest('Mês inválido');
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end), start };
};

/** Mês civil 1–12 a partir de `data` em lançamento (YYYY-MM-DD ou ISO). */
export const parseMonthFromLancamentoDate = (dataValue) => {
  if (!dataValue) return null;
  const s = String(dataValue);
  const ymd = s.length >= 10 ? s.slice(0, 10) : s;
  const parts = ymd.split('-');
  if (parts.length < 2) return null;
  const month = Number.parseInt(parts[1], 10);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  return month;
};

/** Mês civil 1–12 a partir de `date` de linha em orçamentos (início do mês). */
export const parseMonthFromBudgetDate = (dateValue) => {
  if (!dateValue) return null;
  const s = String(dateValue);
  const ymd = s.length >= 10 ? s.slice(0, 10) : s;
  const parts = ymd.split('-');
  if (parts.length < 2) return null;
  const month = Number.parseInt(parts[1], 10);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  return month;
};

const ensureUserCategory = async (dbClient, userId, categoriaId) => {
  await ensureGlobalCategoriesCopiedForUser(dbClient, userId);
  const { data, error } = await dbClient
    .from('categorias_id')
    .select('id, user_id')
    .eq('id', categoriaId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw badRequest(error.message);
  if (!data) throw badRequest('Categoria inválida para o usuário');
};

export const listCategories = async (userId, tipo) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });
  await ensureGlobalCategoriesCopiedForUser(dbClient, userId);

  const { data: categories, error } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId);

  if (error) throw badRequest(error.message);

  let allCategories = categories || [];

  if (tipo) {
    const tipoNormalizado = normalizeTipo(tipo);
    const tiposAceitos = tipoNormalizado === 'saida'
      ? ['saida', 'saída']
      : [tipoNormalizado];
    allCategories = allCategories.filter((cat) => tiposAceitos.includes(cat.tipo));
  }

  return allCategories.sort((a, b) => a.nome.localeCompare(b.nome));
};

/**
 * Lista mínima para integrações (somente identificadores visíveis ao utilizador).
 * @param {{ id: number, nome: string }[]} rows
 * @returns {{ id: number, nome: string }[]}
 */
export const mapCategoriesToMinimalRows = (rows) =>
  (rows || []).map(({ id, nome }) => ({ id, nome }));

export const CATEGORY_NAME_MAX = 60;

/** Para onde vão os lançamentos de uma categoria excluída (mesmos ids do app e do site). */
export const DEFAULT_CATEGORY_ID = { saida: 62, entrada: 228 };

/** Nome e tipo validados (mesmas regras do formulário do site). Com `partial`, o tipo pode faltar. */
export const parseCategoryInput = (payload, { partial = false } = {}) => {
  const nome = String(payload?.nome ?? '').trim();
  const rawTipo = String(payload?.tipo ?? '').trim().toLowerCase();
  const errors = {};
  if (!nome) errors.nome = 'Informe o nome da categoria.';
  else if (nome.length > CATEGORY_NAME_MAX) errors.nome = `Use até ${CATEGORY_NAME_MAX} caracteres.`;

  let tipo = null;
  if (rawTipo) {
    tipo = normalizeTipo(rawTipo);
    if (tipo !== 'entrada' && tipo !== 'saida') errors.tipo = 'O tipo deve ser entrada ou saída.';
  } else if (!partial) {
    errors.tipo = 'Informe o tipo da categoria.';
  }

  const messages = Object.values(errors);
  if (messages.length > 0) throw badRequest(messages[0], errors);
  return { nome, tipo };
};

export const isSameCategoryName = (a, b) => normalizeCategoryName(a) === normalizeCategoryName(b);

/** Outra categoria com o mesmo nome (sem acento/caixa) e tipo; `ignoreId` = a que está sendo editada. */
export const findDuplicateCategory = (categories, nome, tipo, ignoreId = null) => {
  const key = categoryCopyKey(nome, tipo);
  return (categories || []).find(
    (cat) => (ignoreId == null || Number(cat.id) !== Number(ignoreId)) && categoryCopyKey(cat.nome, cat.tipo) === key,
  ) || null;
};

const duplicateCategoryError = (duplicate, tipo) => {
  const message = `Já existe a categoria "${duplicate.nome}" em ${tipo === 'entrada' ? 'entradas' : 'saídas'}.`;
  return badRequest(message, { nome: message });
};

const parseCategoryId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('ID da categoria é obrigatório');
  return id;
};

export const createCategory = async (userId, payload) => {
  const { nome, tipo } = parseCategoryInput(payload);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  await ensureGlobalCategoriesCopiedForUser(dbClient, userId);

  const { data: existingCategories, error: existingError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo')
    .eq('user_id', userId);

  if (existingError) throw badRequest(existingError.message);

  const duplicate = findDuplicateCategory(existingCategories, nome, tipo);
  if (duplicate) throw duplicateCategoryError(duplicate, tipo);

  const { data, error } = await dbClient
    .from('categorias_id')
    .insert({ nome, tipo, user_id: userId })
    .select()
    .single();

  if (error) throw badRequest(error.message);

  const monthStart = getMonthStartDateString();
  const { error: budgetError } = await dbClient
    .from('orçamentos')
    .insert({
      user_id: userId,
      categorias_id: data.id,
      date: monthStart,
      'valor_orçado': null
    });

  if (budgetError) throw badRequest(budgetError.message);
  return data;
};

/**
 * Edita nome/tipo (só esses campos) de uma categoria do próprio usuário.
 * Lançamentos guardam a categoria pelo nome: renomear também renomeia os lançamentos,
 * senão eles virariam "Sem categoria" (mesma regra do site).
 */
export const updateCategory = async (userId, payload) => {
  const id = parseCategoryId(payload?.id);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data: own, error: listError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo')
    .eq('user_id', userId);
  if (listError) throw badRequest(listError.message);

  const current = (own || []).find((cat) => Number(cat.id) === id);
  if (!current) throw notFound('Categoria não encontrada');

  const input = parseCategoryInput(payload, { partial: true });
  const nome = input.nome;
  const tipo = input.tipo || normalizeTipo(current.tipo);

  const duplicate = findDuplicateCategory(own, nome, tipo, id);
  if (duplicate) throw duplicateCategoryError(duplicate, tipo);

  const { data, error } = await dbClient
    .from('categorias_id')
    .update({ nome, tipo })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw badRequest(error.message);

  let renamedTransactions = 0;
  if (current.nome !== nome) {
    const { data: renamed, error: txError } = await dbClient
      .from('lancamentos_id')
      .update({ classificacao: nome })
      .eq('user_id', userId)
      .eq('classificacao', current.nome)
      .select('id');
    if (txError) throw badRequest(`Categoria salva, mas os lançamentos não foram renomeados: ${txError.message}`);
    renamedTransactions = (renamed || []).length;
  }

  return { ...data, renamed_transactions: renamedTransactions };
};

/**
 * Exclui uma categoria do próprio usuário. Os lançamentos dela passam para a categoria
 * padrão do tipo antes (o histórico financeiro não some); a própria padrão não pode ser excluída.
 */
export const deleteCategory = async (userId, body, query) => {
  const id = parseCategoryId(query?.id ?? body?.id);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { data: categoria, error: catError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (catError) throw badRequest(catError.message);
  if (!categoria) throw notFound('Categoria não encontrada');

  const tipo = normalizeTipo(categoria.tipo) === 'entrada' ? 'entrada' : 'saida';
  const { data: padrao, error: padraoError } = await dbClient
    .from('categorias_id')
    .select('nome')
    .eq('id', DEFAULT_CATEGORY_ID[tipo])
    .maybeSingle();
  if (padraoError) throw badRequest(padraoError.message);
  if (!padrao?.nome) throw badRequest('Não foi possível encontrar a categoria padrão.');
  if (isSameCategoryName(padrao.nome, categoria.nome)) {
    throw badRequest('Esta é a categoria padrão e não pode ser excluída.');
  }

  const { data: moved, error: moveError } = await dbClient
    .from('lancamentos_id')
    .update({ classificacao: padrao.nome })
    .eq('user_id', userId)
    .eq('classificacao', categoria.nome)
    .select('id');
  if (moveError) throw badRequest('Não foi possível mover os lançamentos da categoria. Nada foi excluído.');

  const { error } = await dbClient
    .from('categorias_id')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw badRequest('Não foi possível excluir a categoria.');

  return { moved_to: padrao.nome, moved_transactions: (moved || []).length };
};

export const listCategoryBudgets = async (userId) => {
  const dbClient = createSupabaseClient({ useServiceRole: true });
  const currentMonthStart = await ensureMonthlyBudgets(dbClient, userId);
  const { data, error } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado')
    .eq('user_id', userId)
    .eq('date', currentMonthStart);

  if (error) throw badRequest(error.message);
  return data || [];
};

export const upsertCategoryBudget = async (userId, payload) => {
  const { categorias_id: categoriasId, valor_orcado: valorOrcado, date, only_if_empty: onlyIfEmpty } = payload || {};
  const categoriaId = Number(categoriasId);

  if (!categoriaId) throw badRequest('ID da categoria é obrigatório', { categorias_id: 'Selecione uma categoria.' });

  const valorOrcadoNormalizado = parseValorOrcado(valorOrcado);
  const currentMonthStart = monthStartFromInput(date);

  const dbClient = createSupabaseClient({ useServiceRole: true });
  await ensureUserCategory(dbClient, userId, categoriaId);

  const { data: existing, error: existingError } = await dbClient
    .from('orçamentos')
    .select('id, valor_orçado')
    .eq('user_id', userId)
    .eq('categorias_id', categoriaId)
    .eq('date', currentMonthStart)
    .maybeSingle();

  if (existingError) throw badRequest(existingError.message);

  if (onlyIfEmpty && existing?.id && existing['valor_orçado'] != null) {
    throw new HttpError(409, 'Esta categoria já tem orçamento neste mês.', {
      categorias_id: 'Esta categoria já tem orçamento neste mês.',
    });
  }

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
      date: currentMonthStart,
      'valor_orçado': valorOrcadoNormalizado
    })
    .select('categorias_id, valor_orçado')
    .single();

  if (error) throw badRequest(error.message);
  return data;
};

export const listCategoryBudgetsSummary = async (userId, { year, month } = {}) => {
  const dbClient = getCategoriesBudgetReadClient();
  await ensureGlobalCategoriesCopiedForUser(dbClient, userId);

  const { data: categories, error: catError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId);

  if (catError) throw badRequest(catError.message);

  const { canonicalCategories, categoryIdAlias } = dedupeCategoriesByCopyKey(categories || []);

  const range = getMonthRangeFromInput(year, month);
  const monthStartDate = range ? range.startDate : await ensureMonthlyBudgets(dbClient, userId);
  const { data: budgets, error: budgetsError } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado')
    .eq('user_id', userId)
    .eq('date', monthStartDate);

  if (budgetsError) throw badRequest(budgetsError.message);

  const startOfMonth = range?.startDate
    || formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const endOfMonth = range?.endDate
    || formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  const transactions = await fetchAllPages((from, to) =>
    dbClient
      .from('lancamentos_id')
      .select('id, classificacao, valor, tipo, data')
      .eq('user_id', userId)
      .in('tipo', ['saida', 'saída'])
      .gte('data', startOfMonth)
      .lte('data', endOfMonth)
      .order('id', { ascending: true })
      .range(from, to),
  );

  const spentByCategoryName = new Map();
  (transactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const key = normalizeCategoryName(transaction.classificacao);
    const current = spentByCategoryName.get(key) || 0;
    spentByCategoryName.set(key, current + Number(transaction.valor || 0));
  });

  const receivedTransactions = await fetchAllPages((from, to) =>
    dbClient
      .from('lancamentos_id')
      .select('id, classificacao, valor, tipo, data, status')
      .eq('user_id', userId)
      .eq('tipo', 'entrada')
      .in('status', ['recebido', 'pago'])
      .gte('data', startOfMonth)
      .lte('data', endOfMonth)
      .order('id', { ascending: true })
      .range(from, to),
  );

  const receivedByCategoryName = new Map();
  (receivedTransactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const key = normalizeCategoryName(transaction.classificacao);
    const current = receivedByCategoryName.get(key) || 0;
    receivedByCategoryName.set(key, current + Number(transaction.valor || 0));
  });

  const budgetByCategoryId = new Map();
  (budgets || []).forEach((budget) => {
    const canonicalId = categoryIdAlias.get(budget.categorias_id) ?? budget.categorias_id;
    const incoming = budget.valor_orçado ?? null;
    if (!budgetByCategoryId.has(canonicalId)) {
      budgetByCategoryId.set(canonicalId, incoming);
      return;
    }
    budgetByCategoryId.set(
      canonicalId,
      mergeOrcadoValues(budgetByCategoryId.get(canonicalId), incoming),
    );
  });

  return canonicalCategories.map((categoria) => {
    const key = normalizeCategoryName(categoria.nome);
    return {
      categorias_id: categoria.id,
      valor_orcado: budgetByCategoryId.has(categoria.id) ? budgetByCategoryId.get(categoria.id) : null,
      valor_gasto: spentByCategoryName.get(key) || 0,
      valor_recebido: receivedByCategoryName.get(key) || 0
    };
  });
};

export const duplicateMonthlyBudgets = async (userId, { year, month }) => {
  const range = getMonthRangeFromInput(year, month);
  if (!range) throw badRequest('Ano e mês são obrigatórios');

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const targetMonthStart = range.startDate;
  const previousMonthStart = getMonthStartDateString(
    new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1)
  );

  const { data: previousBudgets, error: previousError } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado')
    .eq('user_id', userId)
    .eq('date', previousMonthStart)
    .not('valor_orçado', 'is', null);

  if (previousError) throw badRequest(previousError.message);

  const { data: existingBudgets, error: existingError } = await dbClient
    .from('orçamentos')
    .select('id, categorias_id')
    .eq('user_id', userId)
    .eq('date', targetMonthStart);

  if (existingError) throw badRequest(existingError.message);

  const existingMap = new Map((existingBudgets || []).map((item) => [item.categorias_id, item.id]));

  const updates = (previousBudgets || []).filter((budget) => existingMap.has(budget.categorias_id));
  const inserts = (previousBudgets || []).filter((budget) => !existingMap.has(budget.categorias_id));

  const updateResults = await Promise.all(
    updates.map((budget) =>
      dbClient
        .from('orçamentos')
        .update({ 'valor_orçado': budget.valor_orçado })
        .eq('id', existingMap.get(budget.categorias_id))
        .eq('user_id', userId)
    )
  );
  const updateError = updateResults.find((result) => result?.error)?.error;
  if (updateError) throw badRequest(updateError.message);

  if (inserts.length > 0) {
    const rows = inserts.map((budget) => ({
      user_id: userId,
      categorias_id: budget.categorias_id,
      date: targetMonthStart,
      'valor_orçado': budget.valor_orçado
    }));
    const { error: insertError } = await dbClient
      .from('orçamentos')
      .insert(rows);

    if (insertError) throw badRequest(insertError.message);
  }

  return {
    sourceMonthStart: previousMonthStart,
    targetMonthStart,
    duplicated: (previousBudgets || []).length,
    inserted: inserts.length,
    updated: updates.length
  };
};

export const listCategoryBudgetsYearly = async (userId, year) => {
  if (!year || Number.isNaN(Number(year))) {
    throw badRequest('Ano inválido');
  }

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { startDate, endDate } = getYearMonthRange(year);

  const { data, error } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw badRequest(error.message);

  return (data || []).map((budget) => ({
    categorias_id: budget.categorias_id,
    valor_orcado: budget.valor_orçado ?? null,
    month: Number(String(budget.date).split('-')[1]) - 1
  }));
};

/**
 * Matriz orçado × realizado por categoria e mês (1–12) num ano.
 * Semântica alinhada a `listCategoryBudgetsSummary` por mês.
 * Células omitidas quando não há linha de orçamento naquele mês e gasto/recebido são 0.
 */
export const listCategoryBudgetsDreMatrix = async (userId, year) => {
  const y = Number(year);
  if (year === undefined || year === null || Number.isNaN(y)) {
    throw badRequest('Ano inválido');
  }
  if (!Number.isInteger(y) || y < 1900 || y > 2100) {
    throw badRequest('Ano inválido');
  }

  const dbClient = getCategoriesBudgetReadClient();
  const { startDate, endDate } = getYearMonthRange(y);
  await ensureGlobalCategoriesCopiedForUser(dbClient, userId);

  const { data: userCategories, error: userError } = await dbClient
    .from('categorias_id')
    .select('id, nome, tipo, user_id')
    .eq('user_id', userId);

  if (userError) throw badRequest(userError.message);

  const { canonicalCategories, categoryIdAlias } = dedupeCategoriesByCopyKey(userCategories || []);

  const { data: budgetRows, error: budgetsError } = await dbClient
    .from('orçamentos')
    .select('categorias_id, valor_orçado, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (budgetsError) throw badRequest(budgetsError.message);

  const { data: transactions, error: transactionsError } = await dbClient
    .from('lancamentos_id')
    .select('classificacao, valor, tipo, data')
    .eq('user_id', userId)
    .in('tipo', ['saida', 'saída'])
    .gte('data', startDate)
    .lte('data', endDate);

  if (transactionsError) throw badRequest(transactionsError.message);

  const { data: receivedTransactions, error: receivedError } = await dbClient
    .from('lancamentos_id')
    .select('classificacao, valor, tipo, data, status')
    .eq('user_id', userId)
    .eq('tipo', 'entrada')
    .in('status', ['recebido', 'pago'])
    .gte('data', startDate)
    .lte('data', endDate);

  if (receivedError) throw badRequest(receivedError.message);

  const budgetMap = new Map();
  (budgetRows || []).forEach((row) => {
    const month = parseMonthFromBudgetDate(row.date);
    if (!month) return;
    const canonicalId = categoryIdAlias.get(row.categorias_id) ?? row.categorias_id;
    const key = `${canonicalId}_${month}`;
    const incoming = row.valor_orçado ?? null;
    if (!budgetMap.has(key)) {
      budgetMap.set(key, incoming);
      return;
    }
    budgetMap.set(key, mergeOrcadoValues(budgetMap.get(key), incoming));
  });

  const spentMap = new Map();
  (transactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const month = parseMonthFromLancamentoDate(transaction.data);
    if (!month) return;
    const nameKey = normalizeCategoryName(transaction.classificacao);
    const cellKey = `${nameKey}_${month}`;
    const current = spentMap.get(cellKey) || 0;
    spentMap.set(cellKey, current + Number(transaction.valor || 0));
  });

  const receivedMap = new Map();
  (receivedTransactions || []).forEach((transaction) => {
    if (!transaction?.classificacao) return;
    const month = parseMonthFromLancamentoDate(transaction.data);
    if (!month) return;
    const nameKey = normalizeCategoryName(transaction.classificacao);
    const cellKey = `${nameKey}_${month}`;
    const current = receivedMap.get(cellKey) || 0;
    receivedMap.set(cellKey, current + Number(transaction.valor || 0));
  });

  const results = [];
  for (const categoria of canonicalCategories) {
    const nomeKey = normalizeCategoryName(categoria.nome);
    for (let month = 1; month <= 12; month += 1) {
      const budgetKey = `${categoria.id}_${month}`;
      const hasBudget = budgetMap.has(budgetKey);
      const valorOrcado = hasBudget ? budgetMap.get(budgetKey) : null;
      const valorGasto = spentMap.get(`${nomeKey}_${month}`) || 0;
      const valorRecebido = receivedMap.get(`${nomeKey}_${month}`) || 0;

      const include =
        hasBudget || valorGasto !== 0 || valorRecebido !== 0;
      if (!include) continue;

      results.push({
        categorias_id: categoria.id,
        month,
        valor_orcado: valorOrcado,
        valor_gasto: valorGasto,
        valor_recebido: valorRecebido
      });
    }
  }

  return results;
};
