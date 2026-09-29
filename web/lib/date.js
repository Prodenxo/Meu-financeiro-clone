/** Datas "de hoje" no fuso do produto (Brasil), para o servidor não depender do fuso do host. */
export const APP_TIME_ZONE = 'America/Sao_Paulo';

export function nowInAppTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24 };
}

/** Lê `?mes=YYYY-MM`; inválido → mês atual. */
export function parseMonthParam(value, fallback) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
  if (!m) return fallback;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return fallback;
  return { year, month };
}

export function toMonthParam({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
