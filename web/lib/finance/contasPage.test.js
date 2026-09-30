import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBalanceHistory,
  buildContaCards,
  buildContasModel,
  buildInstitutionSummary,
  buildRecentAccountMovements,
  formatDayKeyLong,
  formatShare,
  pickDefaultConta,
} from './contasPage.js';
import { normalizeLancamentoRow } from './normalize.js';
import { normalizeContaRow } from './contas.js';

const today = new Date('2026-09-29T12:00:00');
const conta = (id, nome, extra = {}) =>
  normalizeContaRow({ id, user_id: 'u', nome, tipo: 'corrente', saldo_inicial: 1000, ativo: true, criado_em: '2026-01-01T00:00:00Z', ...extra });
const tx = (id, tipo, valor, data, status, conta_id) =>
  normalizeLancamentoRow({ id, user_id: 'u', tipo, valor, classificacao: 'Cat', data, status, conta_id, criado_em: `${data}T12:00:00Z` });

const contas = [
  conta('c1', 'Nubank', { instituicao_id: 'nubank', saldo_inicial: 500 }),
  conta('c2', 'Banco do Brasil', { saldo_inicial: 100 }),
  conta('c3', 'Carteira', { tipo: 'dinheiro', saldo_inicial: 50, criado_em: '2026-03-01T00:00:00Z' }),
  conta('c4', 'Antiga', { ativo: false }),
];
const transactions = [
  tx(1, 'entrada', 1000, '2026-09-24', 'recebido', 'c1'),
  tx(2, 'saída', 200, '2026-09-10', 'pago', 'c1'),
  tx(3, 'saída', 300, '2026-09-22', 'a_pagar', 'c1'), // pendente: não entra no saldo
  tx(4, 'saída', 400, '2026-09-20', 'pago', 'c2'),
  tx(5, 'entrada', 70, '2026-08-01', 'recebido', 'c3'),
  tx(6, 'saída', 999, '2026-09-25', 'pago', null), // sem conta
];

describe('cards das contas', () => {
  it('conta padrão vem primeiro e saldo usa só realizados', () => {
    assert.equal(pickDefaultConta(contas).id, 'c3');
    const cards = buildContaCards(contas, transactions);
    assert.deepEqual(cards.map((c) => c.conta.id), ['c3', 'c1', 'c2']);
    assert.equal(cards[0].isDefault, true);
    assert.equal(cards.find((c) => c.conta.id === 'c1').saldo, 1300);
    assert.equal(cards.find((c) => c.conta.id === 'c2').saldo, -300);
    assert.equal(cards.find((c) => c.conta.id === 'c1').lastMovementKey, '2026-09-24');
    assert.equal(formatDayKeyLong('2026-09-24'), '24 set. 2026');
  });

  it('resumo por instituição agrupa pelo catálogo e mostra Outros', () => {
    const cards = buildContaCards(contas, transactions);
    const inst = buildInstitutionSummary(cards, { limit: 1 });
    assert.equal(inst[0].nome, 'Nubank');
    assert.equal(Math.round(inst[0].share), Math.round((1300 / 1420) * 100));
    assert.equal(inst[1].nome, 'Outros');
    assert.equal(inst[1].saldo, 120 - 300);
    assert.equal(formatShare(inst[1].share), '0%');
    assert.equal(formatShare(0.4), '< 1%');
  });

  it('últimas movimentações só das contas, mais recentes primeiro', () => {
    const recent = buildRecentAccountMovements(transactions, contas, 3);
    assert.deepEqual(recent.map((r) => r.id), ['1', '3', '4']);
    assert.equal(recent[0].contaNome, 'Nubank');
    assert.equal(recent[0].dateLabel, '24 set. 2026');
  });
});

describe('evolução do saldo', () => {
  it('acumula saldo inicial + realizados até hoje na janela', () => {
    const h = buildBalanceHistory({ contas, transactions, today, range: '7d' });
    assert.equal(h.series.length, 7);
    assert.equal(h.series[0].dayKey, '2026-09-23');
    // antes da janela: 500+100+50 + 70 - 200 - 400 = 120; dia 24 entra +1000
    assert.equal(h.series[0].saldo, 120);
    assert.equal(h.series.at(-1).saldo, 1120);
    assert.equal(h.stats.delta, 1000);
    assert.equal(h.stats.min, 120);
    assert.equal(h.stats.max, 1120);
    assert.equal(Math.round(h.stats.variationPct), 833);
  });

  it('filtra por conta e ignora pendentes', () => {
    const h = buildBalanceHistory({ contas, transactions, today, range: '30d', contaFilter: 'c2' });
    assert.equal(h.series.at(-1).saldo, -300);
    assert.equal(h.hasMovement, true);
  });
});

describe('modelo completo', () => {
  it('total = soma dos saldos das contas ativas; filtro por tipo', () => {
    const m = buildContasModel({ contas, transactions, today, tipoFilter: 'dinheiro' });
    assert.equal(m.count, 3);
    assert.equal(m.total, 1300 - 300 + 120);
    assert.deepEqual(m.visibleCards.map((c) => c.conta.id), ['c3']);
    assert.deepEqual(m.tiposPresentes.sort(), ['corrente', 'dinheiro']);
  });
});
