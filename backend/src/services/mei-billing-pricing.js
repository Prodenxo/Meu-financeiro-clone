/** Pacotes MEI contratáveis via Stripe (superadmin). */
export const MEI_SLOT_PACKAGE_OPTIONS = [
  ...Array.from({ length: 19 }, (_, i) => i + 1),
  20,
  50,
];

const validateMeiSlots = (meiSlots) => Number.isInteger(meiSlots) && meiSlots > 0;

/**
 * 1–19: R$ 20/vaga · 20 vagas: R$ 300/mês · 50 vagas: R$ 500/mês
 */
export const resolveMeiPricing = (meiSlots) => {
  if (!validateMeiSlots(meiSlots)) {
    return null;
  }

  if (meiSlots >= 1 && meiSlots <= 19) {
    return {
      total: meiSlots * 20,
      unit: 20,
      tier: 'unit_1_19',
    };
  }

  if (meiSlots === 20) {
    return {
      total: 300,
      unit: 15,
      tier: 'fixed_20',
    };
  }

  if (meiSlots === 50) {
    return {
      total: 500,
      unit: 10,
      tier: 'fixed_50',
    };
  }

  return null;
};

export const MEI_PRICING_INVALID_MESSAGE =
  'Pacote inválido: permitido 1 a 19 MEIs (R$ 20/vaga), pacote de 20 (R$ 300/mês) ou pacote de 50 (R$ 500/mês)';
