import { describe, expect, it } from 'vitest';
import { buildBpoMonthInsight } from '../../screens/Dashboard/bpoChartHelpers';

describe('buildBpoMonthInsight', () => {
  it('marca excesso quando realizado supera orçado', () => {
    const insight = buildBpoMonthInsight(250, 1500);
    expect(insight.status).toBe('over');
    expect(insight.excesso).toBe(1250);
    expect(insight.atingimentoPct).toBe(600);
  });

  it('marca dentro do orçado', () => {
    const insight = buildBpoMonthInsight(500, 300);
    expect(insight.status).toBe('under');
    expect(insight.variacao).toBe(-200);
  });
});
