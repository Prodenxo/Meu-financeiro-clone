import { computeContaSaldoAtual } from '../contaSaldo'

const CONTA = '11111111-1111-1111-1111-111111111111'

describe('computeContaSaldoAtual', () => {
  it('soma saldo inicial com entradas e subtrai saídas realizadas', () => {
    const saldo = computeContaSaldoAtual(100, [
      { conta_id: CONTA, tipo: 'entrada', valor: 50, status: 'recebido' },
      { conta_id: CONTA, tipo: 'saida', valor: 30, status: 'pago' },
      { conta_id: CONTA, tipo: 'saida', valor: 10, status: 'a_pagar' },
      { conta_id: null, tipo: 'entrada', valor: 999, status: 'recebido' },
    ], CONTA)
    expect(saldo).toBe(120)
  })

  it('ignora lançamentos de outra conta', () => {
    const saldo = computeContaSaldoAtual(0, [
      { conta_id: 'other', tipo: 'entrada', valor: 100, status: 'pago' },
    ], CONTA)
    expect(saldo).toBe(0)
  })
})
