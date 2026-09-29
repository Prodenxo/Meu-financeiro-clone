const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBrl(value) {
  return BRL.format(Number.isFinite(value) ? value : 0);
}

/** Valor com sinal explícito para listas (−R$ 4.000,00 / +R$ 4.500,00). */
export function formatSignedBrl(value, tipo) {
  const abs = formatBrl(Math.abs(value));
  return tipo === 'entrada' ? `+${abs}` : `−${abs}`;
}

/** Eixo do gráfico: R$ 200, −R$ 1,3 mil, R$ 12 mil. */
export function formatAxisBrl(value) {
  const v = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace('.', ',').replace(',0', '')} mil`;
  return `${sign}${BRL_COMPACT.format(abs)}`;
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MONTH_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

export function formatMonthLabel({ year, month }) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "22 set" a partir de YYYY-MM-DD (sem depender do fuso). */
export function formatDayMonth(isoDate) {
  const [, mm, dd] = String(isoDate || '').split('-');
  const idx = Number(mm) - 1;
  if (!dd || !MONTH_SHORT[idx]) return '';
  return `${dd} ${MONTH_SHORT[idx]}`;
}

export function formatPct(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1).replace('.', ',')}%`;
}
