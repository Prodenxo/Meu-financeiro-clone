import { describe, expect, it } from 'vitest';
import { resolveMeiPricing, MEI_SLOT_PACKAGE_OPTIONS } from '../src/services/mei-billing-pricing.js';

describe('mei-billing-pricing', () => {
  it('lista pacotes 1–19, 20 e 50', () => {
    expect(MEI_SLOT_PACKAGE_OPTIONS).toHaveLength(21);
    expect(MEI_SLOT_PACKAGE_OPTIONS).toContain(20);
    expect(MEI_SLOT_PACKAGE_OPTIONS).toContain(50);
  });

  it('1–19: R$ 20 por vaga', () => {
    expect(resolveMeiPricing(1)).toEqual({ total: 20, unit: 20, tier: 'unit_1_19' });
    expect(resolveMeiPricing(19)).toEqual({ total: 380, unit: 20, tier: 'unit_1_19' });
  });

  it('pacote 20: R$ 300/mês', () => {
    expect(resolveMeiPricing(20)).toEqual({ total: 300, unit: 15, tier: 'fixed_20' });
  });

  it('pacote 50: R$ 500/mês', () => {
    expect(resolveMeiPricing(50)).toEqual({ total: 500, unit: 10, tier: 'fixed_50' });
  });

  it('rejeita pacotes fora da tabela', () => {
    expect(resolveMeiPricing(0)).toBeNull();
    expect(resolveMeiPricing(21)).toBeNull();
  });
});
