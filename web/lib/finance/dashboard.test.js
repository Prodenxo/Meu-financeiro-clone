import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardModel, budgetTone, buildSaldoSeries } from './dashboard.js';
import { normalizeLancamentoRow } from './normalize.js';
import { normalizeContaRow } from './contas.js';
import { normalizeTransactionStatus, getTransactionStatusLabel } from './status.js';

const month = { year: 2026, month: 9 };
const tx = (id, tipo, valor, data, status, conta_id = null) =>
  normalizeLancamentoRow({ id, user_id: 'u', tipo, valor, classificacao: 'Cat', data, status, conta_id, criado_em: `${data}T12:00:00Z` });

const contas = [
  normalizeContaRow({ id: 'c1', user_id: 'u', nome: 'Nubank', tipo: 'corrente', saldo_inicial: 1000, ativo: true }),
  normalizeContaRow({ id: 'c2', user_id: 'u', nome: 'Itaú', tipo: 'corrente', saldo_inicial: 500, ativo: false }),
];

const transactions = [
  tx(1, 'entrada', 4500, '2026-09-05', 'recebido', 'c1'),
  tx(2, 'saída', 1200, '2026-09-06', 'pago', 'c1'),
  tx(3, 'saída', 300, '2026-09-20', 'a_pagar', 'c1'),
  tx(4, 'saída', 100, '2026-09-21', 'pago', null), // sem conta
  tx(5, 'saída', 900, '2026-08-10', 'pago', 'c1'), // mês anterior
  tx(6, 'saida', '250.50', '2026-09-22', 'pago', 'c1'), // tipo sem acento e valor string (numeric do Postgres)
];

const base = { transactions, contas, categoriasMap: {}, categoriasTipoMap: {}, budgetSummary: [], selectedMonth: month, today: new Date(2026, 8, 21, 12) };

describe('buildDashboardModel', () => {
  it('separa saldo das contas (todas as datas) do resultado do mês (só realizado)', () => {
    const m = buildDashboardModel({ ...base, contaFilter: 'all' });
    // contas ativas: 1000 + 4500 - 1200 - 900 - 250.5 = 3149.5; em "all" somam-se também
    // os avulsos realizados (−100) — mesma regra de `resolveDashboardBalance` do Expo. a_pagar não entra.
    assert.equal(m.balance.mode, 'contas');
    assert.equal(m.balance.value, 3049.5);
    // resultado do mês realizado: entradas 4500; saídas 1200 + 100 + 250.5
    assert.equal(m.totals.income, 4500);
    assert.equal(m.totals.expenses, 1550.5);
    assert.equal(m.totals.countExpenses, 3);
    // pendentes do mês
    assert.equal(m.pending.total, 300);
    assert.equal(m.pending.items.length, 1);
    assert.equal(m.monthCount, 5);
  });

  it('filtra por conta e por "sem conta" sem mudar a fórmula', () => {
    const c1 = buildDashboardModel({ ...base, contaFilter: 'c1' });
    assert.equal(c1.balance.value, 3149.5);
    assert.equal(c1.totals.expenses, 1450.5);

    const un = buildDashboardModel({ ...base, contaFilter: 'unassigned' });
    assert.equal(un.balance.mode, 'unassigned');
    assert.equal(un.balance.value, -100);
    assert.equal(un.totals.expenses, 100);
  });

  it('série do gráfico acumula só lançamentos realizados, em ordem de data', () => {
    const series = buildSaldoSeries(transactions.filter((t) => t.data.startsWith('2026-09')));
    assert.deepEqual(
      series.map((p) => [p.dayKey, p.saldo]),
      [
        ['2026-09-05', 4500],
        ['2026-09-06', 3300],
        ['2026-09-21', 3200],
        ['2026-09-22', 2949.5],
      ],
    );
  });

  it('fluxo de hoje usa a data de referência', () => {
    const m = buildDashboardModel({ ...base, contaFilter: 'all' });
    assert.equal(m.todayFlow.dayKey, '2026-09-21');
    assert.equal(m.todayFlow.expense, 100);
    assert.equal(m.todayFlow.income, 0);
  });
});

describe('budgetTone', () => {
  it('saída: quanto mais gasto, pior', () => {
    assert.equal(budgetTone({ tipo: 'saida', percentual: 20 }), 'success');
    assert.equal(budgetTone({ tipo: 'saida', percentual: 50 }), 'warning');
    assert.equal(budgetTone({ tipo: 'saida', percentual: 75 }), 'orange');
    assert.equal(budgetTone({ tipo: 'saida', percentual: 76 }), 'danger');
  });
  it('entrada: quanto mais recebido, melhor', () => {
    assert.equal(budgetTone({ tipo: 'entrada', percentual: 80 }), 'success');
    assert.equal(budgetTone({ tipo: 'entrada', percentual: 10 }), 'danger');
  });
});

describe('status', () => {
  it('normaliza por tipo como no backend', () => {
    assert.equal(normalizeTransactionStatus('entrada', ''), 'recebido');
    assert.equal(normalizeTransactionStatus('saída', ''), 'pago');
    assert.equal(normalizeTransactionStatus('saída', 'a_pagar'), 'a_pagar');
    assert.equal(getTransactionStatusLabel('saída', 'a_pagar'), 'Pendente');
    assert.equal(getTransactionStatusLabel('entrada', 'recebido'), 'Recebido');
  });
});
