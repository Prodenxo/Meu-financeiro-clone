/** Pacotes MEI contratáveis (espelha `mei-billing-pricing.js` no backend). */
export const MEI_SLOT_PACKAGE_OPTIONS: number[] = [
  ...Array.from({ length: 19 }, (_, i) => i + 1),
  20,
  50,
];

/** 1–19: R$ 20/vaga · 20 vagas: R$ 300/mês · 50 vagas: R$ 500/mês */
export function resolveMeiPackagePrice(meiSlots: number): number {
  if (meiSlots >= 1 && meiSlots <= 19) return meiSlots * 20;
  if (meiSlots === 20) return 300;
  if (meiSlots === 50) return 500;
  return 0;
}
