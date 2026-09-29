import {
  resolveDashboardBalance,
  sumUnassignedRealizedDelta,
} from '../contaFinanceiraIntegration'
import type { ContaFinanceira } from '../contaFinanceiraTypes'

const CONTA_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const CONTA_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const contas: ContaFinanceira[] = [
  {
    id: CONTA_A,
    user_id: 'u1',
    nome: 'Nubank',
    saldo_inicial: 100,
    ativo: true,
    cor: null,
    instituicao_id: null,
    criado_em: '',
    atualizado_em: '',
  },
]

describe('resolveDashboardBalance', () => {
  it('filtro unassigned soma só lançamentos sem conta realizados', () => {
    const lancamentos = [
      { conta_id: null, tipo: 'entrada', valor: 350, status: 'recebido' },
      { conta_id: CONTA_A, tipo: 'entrada', valor: 50, status: 'recebido' },
      { conta_id: null, tipo: 'entrada', valor: 200, status: 'a_receber' },
    ]
    const meta = resolveDashboardBalance(contas, lancamentos, 0, 'unassigned')
    expect(meta.mode).toBe('unassigned')
    expect(meta.value).toBe(350)
  })

  it('filtro all inclui contas + avulsos realizados', () => {
    const lancamentos = [
      { conta_id: null, tipo: 'entrada', valor: 350, status: 'recebido' },
      { conta_id: CONTA_A, tipo: 'entrada', valor: 50, status: 'recebido' },
    ]
    const meta = resolveDashboardBalance(contas, lancamentos, 0, 'all')
    expect(meta.value).toBe(100 + 50 + 350)
  })

  it('filtro de conta específica ignora outras contas e avulsos', () => {
    const lancamentos = [
      { conta_id: null, tipo: 'entrada', valor: 350, status: 'recebido' },
      { conta_id: CONTA_A, tipo: 'entrada', valor: 50, status: 'recebido' },
      { conta_id: CONTA_B, tipo: 'entrada', valor: 999, status: 'recebido' },
    ]
    const meta = resolveDashboardBalance(contas, lancamentos, 0, CONTA_A)
    expect(meta.value).toBe(150)
  })
})

describe('sumUnassignedRealizedDelta', () => {
  it('ignora pendente e a_receber', () => {
    expect(
      sumUnassignedRealizedDelta([
        { conta_id: null, tipo: 'entrada', valor: 350, status: 'recebido' },
        { conta_id: null, tipo: 'entrada', valor: 100, status: 'a_receber' },
      ]),
    ).toBe(350)
  })
})
