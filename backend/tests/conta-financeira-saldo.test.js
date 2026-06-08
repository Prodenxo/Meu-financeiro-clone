import test from 'node:test'
import assert from 'node:assert/strict'
import { computeContaSaldoAtual } from '../src/services/conta-financeira-saldo.js'

const contaId = 'carteira-1'

test('saldo = saldo_inicial + entradas realizadas − saídas realizadas', () => {
  const lancamentos = [
    { conta_id: contaId, tipo: 'entrada', valor: 1000, status: 'recebido' },
    { conta_id: contaId, tipo: 'saida', valor: 200, status: 'pago' },
    { conta_id: contaId, tipo: 'entrada', valor: 50, status: 'a_receber' },
    { conta_id: 'outra', tipo: 'entrada', valor: 999, status: 'recebido' },
  ]
  assert.equal(computeContaSaldoAtual(500, lancamentos, contaId), 1300)
})

test('ignora lançamentos sem conta_id', () => {
  const lancamentos = [
    { tipo: 'entrada', valor: 100, status: 'recebido' },
  ]
  assert.equal(computeContaSaldoAtual(0, lancamentos, contaId), 0)
})
