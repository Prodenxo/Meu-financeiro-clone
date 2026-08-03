import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';

const matchesFilter = (row, [op, field, val]) => {
  const v = row[field];
  if (op === 'eq') return v === val;
  if (op === 'is') return val === null ? v == null : v === val;
  if (op === 'in') return Array.isArray(val) && val.includes(v);
  if (op === 'gte') return String(v) >= String(val);
  if (op === 'lte') return String(v) <= String(val);
  return true;
};

const matchesAll = (row, filters) => filters.every((f) => matchesFilter(row, f));

const createDupSupabaseMock = (fixture) => {
  const { userId, userCategories, budgets, saidas, entradasRecebidas } = fixture;

  const execute = (state) => {
    const { table, filters } = state;
    let rows = [];

    if (table === 'categorias_id') {
      rows = userCategories.filter((r) => matchesAll(r, filters));
    } else if (table === 'orçamentos') {
      rows = budgets.filter((b) => b.user_id === userId && matchesAll(b, filters));
    } else if (table === 'lancamentos_id') {
      const isEntradaRecebida = filters.some(
        ([op, f, val]) => op === 'eq' && f === 'status' && val === 'recebido'
      );
      const pool = isEntradaRecebida
        ? entradasRecebidas.filter((r) => r.user_id === userId)
        : saidas.filter((r) => r.user_id === userId);
      rows = pool.filter((r) => matchesAll(r, filters));
    }

    return { data: rows, error: null };
  };

  const from = (table) => {
    const state = { table, filters: [] };
    const chain = {
      select() {
        return chain;
      },
      eq(field, val) {
        state.filters.push(['eq', field, val]);
        return chain;
      },
      is(field, val) {
        state.filters.push(['is', field, val]);
        return chain;
      },
      gte(field, val) {
        state.filters.push(['gte', field, val]);
        return chain;
      },
      lte(field, val) {
        state.filters.push(['lte', field, val]);
        return chain;
      },
      in(field, vals) {
        state.filters.push(['in', field, vals]);
        return chain;
      },
      then(onFulfilled, onRejected) {
        return Promise.resolve(execute(state)).then(onFulfilled, onRejected);
      }
    };
    return chain;
  };

  return { from };
};

test('dedupeCategoriesByCopyKey mantém menor id por nome+tipo', async () => {
  const { dedupeCategoriesByCopyKey } = await import('../src/services/categories.service.js');
  const { canonicalCategories, categoryIdAlias } = dedupeCategoriesByCopyKey([
    { id: 50, nome: 'Spotify', tipo: 'saida' },
    { id: 12, nome: 'Spotify', tipo: 'saida' },
    { id: 3, nome: 'Salário', tipo: 'entrada' }
  ]);

  assert.equal(canonicalCategories.length, 2);
  assert.equal(canonicalCategories.find((c) => c.nome === 'Spotify')?.id, 12);
  assert.equal(categoryIdAlias.get(50), 12);
});

test('listCategoryBudgetsDreMatrix não duplica linha nem soma realizado 2x (Spotify)', async (t) => {
  const USER_ID = 'dup-user';
  const YEAR = 2026;

  const fixture = {
    userId: USER_ID,
    userCategories: [
      { id: 12, nome: 'Spotify', tipo: 'saida', user_id: USER_ID },
      { id: 50, nome: 'Spotify', tipo: 'saida', user_id: USER_ID }
    ],
    budgets: [
      { user_id: USER_ID, categorias_id: 50, valor_orçado: null, date: '2026-03-01' }
    ],
    saidas: [
      { user_id: USER_ID, classificacao: 'Spotify', valor: 1, tipo: 'saida', data: '2026-03-05' }
    ],
    entradasRecebidas: []
  };

  const {
    listCategoryBudgetsDreMatrix,
    listCategoryBudgetsSummary,
    __setCategoriesBudgetReadClientForTests
  } = await import('../src/services/categories.service.js');

  const restore = __setCategoriesBudgetReadClientForTests(() => createDupSupabaseMock(fixture));
  t.after(restore);

  const matrix = await listCategoryBudgetsDreMatrix(USER_ID, YEAR);
  const march = matrix.filter((c) => c.month === 3);

  assert.equal(march.length, 1, 'deve haver uma única célula Spotify em março');
  assert.equal(march[0].categorias_id, 12);
  assert.equal(march[0].valor_gasto, 1);

  const summary = await listCategoryBudgetsSummary(USER_ID, { year: YEAR, month: 3 });
  const spotifyRows = summary.filter((r) => r.categorias_id === 12 || r.categorias_id === 50);
  assert.equal(spotifyRows.length, 1);
  assert.equal(spotifyRows[0].valor_gasto, 1);
});
