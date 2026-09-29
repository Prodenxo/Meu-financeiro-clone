import { buildDailyFlow, buildTodayFlow } from '../../screens/Dashboard/dashboardInsights';

describe('buildTodayFlow', () => {
  it('agrega só movimentações realizadas do dia de referência', () => {
    const ref = new Date(2026, 4, 25, 12, 0, 0);
    const today = buildTodayFlow(
      [
        { data: '2026-05-25', tipo: 'entrada', valor: 1000, status: 'recebido' },
        { data: '2026-05-25', tipo: 'saida', valor: 200, status: 'pago' },
        { data: '2026-05-24', tipo: 'entrada', valor: 5000, status: 'recebido' },
        { data: '2026-05-25', tipo: 'entrada', valor: 9000, status: 'a_receber' },
      ],
      ref,
    );

    expect(today.dayKey).toBe('2026-05-25');
    expect(today.income).toBe(1000);
    expect(today.expense).toBe(200);
    expect(today.dayLabel).toContain('Hoje');
  });

  it('retorna zeros quando não há movimentação no dia', () => {
    const ref = new Date(2026, 4, 25, 12, 0, 0);
    const today = buildTodayFlow(
      [{ data: '2026-05-24', tipo: 'entrada', valor: 100, status: 'recebido' }],
      ref,
    );

    expect(today.income).toBe(0);
    expect(today.expense).toBe(0);
  });
});

describe('buildDailyFlow', () => {
  const may2026 = { year: 2026, month: 5 };

  it('ignora lançamentos pendentes (a_pagar / a_receber)', () => {
    const days = buildDailyFlow(
      [
        { data: '2026-05-10', tipo: 'entrada', valor: 21000, status: 'a_receber' },
        { data: '2026-05-12', tipo: 'saida', valor: 7500, status: 'a_pagar' },
        { data: '2026-05-15', tipo: 'saida', valor: 300, status: 'pago' },
      ],
      may2026.year,
      may2026.month,
    );

    expect(days).toHaveLength(1);
    expect(days[0].expense).toBe(300);
    expect(days[0].income).toBe(0);
  });

  it('usa criado_em quando data está ausente (mesmo critério da tela Transações)', () => {
    const days = buildDailyFlow(
      [
        {
          data: null,
          criado_em: '2026-05-08T15:00:00Z',
          tipo: 'entrada',
          valor: 500,
          status: 'recebido',
        },
      ],
      may2026.year,
      may2026.month,
    );

    expect(days).toHaveLength(1);
    expect(days[0].income).toBe(500);
  });

  it('não inclui lançamento só pelo prefixo de data inválida', () => {
    const days = buildDailyFlow(
      [
        {
          data: '2026-05',
          criado_em: '2024-01-10T00:00:00Z',
          tipo: 'entrada',
          valor: 999,
          status: 'recebido',
        },
      ],
      may2026.year,
      may2026.month,
    );

    expect(days).toHaveLength(0);
  });

  it('agrega entradas e saídas realizadas no mesmo dia', () => {
    const days = buildDailyFlow(
      [
        { data: '2026-05-20', tipo: 'entrada', valor: 1000, status: 'recebido' },
        { data: '2026-05-20', tipo: 'saida', valor: 200, status: 'pago' },
      ],
      may2026.year,
      may2026.month,
    );

    expect(days).toHaveLength(1);
    expect(days[0].income).toBe(1000);
    expect(days[0].expense).toBe(200);
  });
});
