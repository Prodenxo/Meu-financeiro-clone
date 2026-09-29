import { formatTransactionsForXlsx } from '../exportTransactionsSpreadsheet'

describe('formatTransactionsForXlsx', () => {
  it('usa o mesmo layout do Site (transacoes_*.xlsx)', () => {
    const rows = formatTransactionsForXlsx([
      {
        classificacao: 'Salário',
        valor: 350,
        tipo: 'entrada',
        data: '2026-05-13',
        status: 'recebido',
        obs: null,
      },
    ])
    expect(rows[0]).toEqual({
      Descrição: 'Salário',
      Valor: expect.stringMatching(/R\$\s?350,00/),
      Tipo: 'RECEITA',
      Data: '13/05/2026',
      Status: 'Recebido',
      Observações: '-',
    })
  })
})
