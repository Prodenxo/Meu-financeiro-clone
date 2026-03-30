/** Centavos como string só de dígitos (ex.: "12345" → 123,45). */
export function moneyDigitsFromNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '';
  const cents = Math.round(value * 100);
  return String(Math.max(0, cents));
}

/** Exibe dígitos de centavos como valor pt-BR (ex. 1.234,56). */
export function formatMoneyDigitsPtBr(centDigits: string): string {
  const digits = centDigits.replace(/\D/g, '');
  if (!digits) return '';
  const amount = parseInt(digits, 10) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** Converte entrada formatada ou só dígitos para número em reais (ou null se vazio). */
export function parseMoneyInputToNumber(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

export function formatBrlDisplay(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
