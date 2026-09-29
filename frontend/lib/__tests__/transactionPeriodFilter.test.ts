import {
  isInCurrentWeek,
  isInSelectedMonth,
  isTodayDate,
  matchesTransactionPeriod,
} from '../transactionPeriodFilter'

describe('matchesTransactionPeriod', () => {
  const selectedMonth = { year: 2026, month: 5 }

  it('filtra mês selecionado', () => {
    expect(
      matchesTransactionPeriod(
        { data: '2026-05-10' },
        {
          period: 'Esse mês',
          selectedMonth,
          dateRange: { start: '', end: '' },
          useCustomRange: false,
        },
      ),
    ).toBe(true)
    expect(
      matchesTransactionPeriod(
        { data: '2026-04-10' },
        {
          period: 'Esse mês',
          selectedMonth,
          dateRange: { start: '', end: '' },
          useCustomRange: false,
        },
      ),
    ).toBe(false)
  })

  it('isInSelectedMonth usa criado_em quando data está ausente', () => {
    expect(
      isInSelectedMonth(
        { data: null, criado_em: '2026-05-12T10:00:00Z' },
        selectedMonth,
      ),
    ).toBe(true)
  })

  it('filtra intervalo personalizado', () => {
    expect(
      matchesTransactionPeriod(
        { data: '2026-03-15' },
        {
          period: 'Esse mês',
          selectedMonth,
          dateRange: { start: '2026-03-01', end: '2026-03-31' },
          useCustomRange: true,
        },
      ),
    ).toBe(true)
  })
})

describe('isTodayDate', () => {
  it('reconhece hoje', () => {
    const now = new Date()
    expect(isTodayDate(now)).toBe(true)
  })
})

describe('isInCurrentWeek', () => {
  it('inclui data de hoje na semana', () => {
    expect(isInCurrentWeek(new Date())).toBe(true)
  })
})
