import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FILTERS,
  buildTransactionsModel,
  formatTransactionsForXlsx,
  pageWindow,
  paginate,
  resolvePeriod,
  sortTransactions,
  weekBounds,
} from './transactions.js';
import { buildMaterializationDraft, normalizeRecorrenciaRow, projectRecurrences } from './recorrencias.js';
import { normalizeLancamentoRow } from './normalize.js';

const month = { year: 2026, month: 9 };
const today = new Date('2026-09-16T12:00:00'); // quarta-feira
const tx = (id, tipo, valor, data, status, extra = {}) =>
  normalizeLancamentoRow({ id, user_id: 'u', tipo, valor, classificacao: 'Cat', data, status, criado_em: `${data}T12:00:00Z`, ...extra });

const transactions = [
  tx(1, 'entrada', 1000, '2026-09-05', 'recebido', { conta_id: 'c1', classificacao: 'Salário' }),
  tx(2, 'saída', 400, '2026-09-14', 'pago', { conta_id: 'c1', obs: 'Mercado do bairro' }),
  tx(3, 'saída', 100, '2026-09-16', 'a_pagar'),
  tx(4, 'saida', '50.5', '2026-09-30', 'pago', { conta_id: 'c2' }),
  tx(5, 'saída', 999, '2026-08-31', 'pago', { conta_id: 'c1' }),
];

const filters = (patch = {}) => ({ ...DEFAULT_FILTERS, ...patch });
const model = (patch, extra = {}) =>
  buildTransactionsModel({ transactions, filters: filters(patch), selectedMonth: month, today, ...extra });

describe('período', () => {
  it('semana vai de domingo a sábado', () => {
    assert.deepEqual(weekBounds(today), { start: '2026-09-13', end: '2026-09-19' });
  });

  it('intervalo inválido cai no preset do mês', () => {
    const r = resolvePeriod({ period: 'Esse mês', selectedMonth: month, dateRange: { start: '2026-09-20', end: '2026-09-01' }, today });
    assert.equal(r.mode, 'month');
    assert.deepEqual([r.start, r.end, r.label], ['2026-09-01', '2026-09-30', 'Setembro 2026']);
  });

  it('filtra por hoje, semana e intervalo', () => {
    assert.deepEqual(model({ period: 'Hoje' }).rows.map((t) => t.id), ['3']);
    assert.deepEqual(model({ period: 'Essa semana' }).rows.map((t) => t.id), ['3', '2']);
    const custom = model({ dateRange: { start: '2026-08-31', end: '2026-09-05' } });
    assert.deepEqual(custom.rows.map((t) => t.id), ['1', '5']);
    assert.equal(custom.period.label, '31/08/2026 até 05/09/2026');
  });
});

describe('cards e filtros', () => {
  it('KPIs do mês ignoram tipo/situação mas respeitam conta e busca', () => {
    const all = model({ typeFilter: 'entrada', statusFilter: 'pago' });
    assert.deepEqual(all.kpis, { entradas: 1000, saidas: 550.5, saldo: 449.5, countEntradas: 1, countSaidas: 3 });
    assert.deepEqual(all.rows.map((t) => t.id), ['1']);

    assert.equal(model({ contaFilter: 'c1' }).kpis.saldo, 600);
    assert.equal(model({ contaFilter: 'unassigned' }).kpis.saidas, 100);
    assert.deepEqual(model({ search: 'MERCADO' }).rows.map((t) => t.id), ['2']);
  });

  it('pendentes = tudo que não está pago/recebido', () => {
    assert.deepEqual(model({ statusFilter: 'pendente' }).rows.map((t) => t.id), ['3']);
  });

  it('séries dos cards somam o período', () => {
    const { series } = model({});
    assert.equal(series.entradas.reduce((a, b) => a + b, 0), 1000);
    assert.equal(series.saidas.reduce((a, b) => a + b, 0), 550.5);
    assert.equal(series.saldo.at(-1), 449.5);
  });

  it('ordena por data e valor', () => {
    const list = model({}).rows;
    assert.deepEqual(sortTransactions(list, 'antigas').map((t) => t.id), ['1', '2', '3', '4']);
    assert.deepEqual(sortTransactions(list, 'maior').map((t) => t.id), ['1', '2', '3', '4']);
    assert.deepEqual(sortTransactions(list, 'menor').map((t) => t.id), ['4', '3', '2', '1']);
  });
});

describe('recorrências', () => {
  const rec = normalizeRecorrenciaRow({
    id: 'r1', user_id: 'u', dia_do_mes: 31, valor: '80', classificacao: 'Internet', tipo: 'saída',
    status: 'a_pagar', ativo: true, max_ocorrencias: 3, criado_em: '2026-08-02T10:00:00Z',
  });

  it('projeta o mês com dia ajustado e sem entrar nos cards', () => {
    const m = model({}, { recorrencias: [rec] });
    const proj = m.rows.find((t) => t.__projecao);
    assert.equal(proj.id, 'proj_r1_2026-09');
    assert.equal(proj.data, '2026-09-30');
    assert.equal(m.kpis.countSaidas, 3);
    assert.equal(m.exportRows.some((t) => t.__projecao), false);
  });

  it('não repete mês materializado, cancelado, órfão ou além do limite', () => {
    const range = { startYear: 2026, startMonth: 7, endYear: 2026, endMonth: 12 };
    const real = [
      { recorrencia_id: 'r1', recorrencia_ano_mes: '2026-08' },
      { classificacao: 'internet', tipo: 'saida', data: '2026-10-10' },
    ];
    const out = projectRecurrences([rec], real, range, [{ recorrencia_id: 'r1', ano_mes: '2026-09' }]);
    assert.deepEqual(out.map((p) => p.recorrencia_ano_mes), []);
    const semLimite = projectRecurrences([{ ...rec, max_ocorrencias: null }], real, range);
    assert.deepEqual(semLimite.map((p) => p.recorrencia_ano_mes), ['2026-09', '2026-11', '2026-12']);
  });

  it('lançar projeção vira rascunho pendente vinculado', () => {
    const draft = buildMaterializationDraft({ ...projectRecurrences([rec], [], { startYear: 2026, startMonth: 9, endYear: 2026, endMonth: 9 })[0] });
    assert.equal(draft.status, 'a_pagar');
    assert.equal(draft.recorrencia_id, 'r1');
    assert.equal(draft.recorrencia_ano_mes, '2026-09');
  });
});

describe('exportação e paginação', () => {
  it('planilha no mesmo layout do Expo', () => {
    const [row] = formatTransactionsForXlsx([transactions[0]]);
    assert.deepEqual(Object.keys(row), ['Descrição', 'Valor', 'Tipo', 'Data', 'Status', 'Observações']);
    assert.equal(row.Tipo, 'RECEITA');
    assert.equal(row.Data, '05/09/2026');
    assert.equal(row.Status, 'Recebido');
    assert.equal(row['Observações'], '-');
  });

  it('pagina e mostra janela de páginas', () => {
    const list = Array.from({ length: 45 }, (_, i) => i);
    assert.deepEqual(paginate(list, 9, 20).page, 3);
    assert.deepEqual(paginate(list, 3, 20).items.length, 5);
    assert.deepEqual(pageWindow(6, 12), [1, '…', 5, 6, 7, '…', 12]);
    assert.deepEqual(pageWindow(2, 4), [1, 2, 3, 4]);
  });
});
