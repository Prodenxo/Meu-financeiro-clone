import { formatBrl } from './format.js';

export const RECURRENCE_QUANTITY_MIN = 1;
export const RECURRENCE_QUANTITY_MAX = 1200;

export const RECURRENCE_PRESETS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
];

export function parseRecurrenceQuantity(raw) {
  if (raw === '' || raw == null) return null;
  const n = parseInt(String(raw), 10);
  if (!Number.isInteger(n)) return NaN;
  if (n < RECURRENCE_QUANTITY_MIN || n > RECURRENCE_QUANTITY_MAX) return NaN;
  return n;
}

/** Quantidade total de lançamentos no plano, incluindo o atual (como no app Expo). */
export function recurrenceTotalLabel(quantity) {
  if (quantity == null) {
    return 'Sem data limite — repete todo mês até você desativar a recorrência.';
  }
  return `${quantity} lançamento${quantity === 1 ? '' : 's'} no total, incluindo este. As próximas ocorrências ficam pendentes.`;
}

export function dayOfMonthFromIso(isoDate) {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date().getDate();
  return Math.min(Math.max(Number(m[3]), 1), 31);
}

export function buildRecurrenceRow({ tipo, valor, classificacao, data, obs, maxOcorrencias }) {
  const pendente = tipo === 'entrada' ? 'a_receber' : 'a_pagar';
  return {
    tipo: tipo === 'entrada' ? 'entrada' : 'saída',
    valor,
    classificacao,
    status: pendente,
    obs: obs || null,
    dia_do_mes: dayOfMonthFromIso(data),
    ativo: true,
    max_ocorrencias: maxOcorrencias,
  };
}

export function buildTransactionEventTitle({ tipo, valor, classificacao }) {
  const prefix = tipo === 'entrada' ? 'Receber' : 'Pagar';
  const cat = classificacao ? ` — ${classificacao}` : '';
  return `${prefix}: ${formatBrl(valor)}${cat}`;
}

export function buildTransactionEventDescription({ tipo, valor, classificacao, status, obs }) {
  const statusLabel =
    status === 'recebido' || status === 'pago'
      ? tipo === 'entrada'
        ? 'Recebido'
        : 'Pago'
      : tipo === 'entrada'
        ? 'A receber'
        : 'A pagar';
  let text = `Categoria: ${classificacao || 'Sem categoria'}\nValor: ${formatBrl(valor)}\nStatus no app: ${statusLabel}`;
  if (obs?.trim()) text += `\nObservação: ${obs.trim()}`;
  text += '\n\n(Lembrete do Meu Financeiro — o pagamento/recebimento é atualizado só no app.)';
  return text;
}

/** RRULE mensal alinhada à recorrência financeira (uma série no Google). */
export function monthlyRecurrenceRule(totalCount) {
  if (totalCount == null) return 'RRULE:FREQ=MONTHLY';
  return `RRULE:FREQ=MONTHLY;COUNT=${totalCount}`;
}

export function buildTransactionGooglePayload({
  tipo,
  valor,
  classificacao,
  data,
  obs,
  status,
  isAllDay,
  startTime,
  endTime,
  reminderMinutes,
  recurring,
  recurrenceTotal,
}) {
  const [sh, sm] = String(startTime || '09:00').split(':').map(Number);
  const [eh, em] = String(endTime || '10:00').split(':').map(Number);
  const reminder = reminderMinutes === '' || reminderMinutes == null ? null : Number(reminderMinutes);
  return {
    title: buildTransactionEventTitle({ tipo, valor, classificacao }),
    isAllDay: Boolean(isAllDay),
    startDate: data,
    endDate: data,
    startHour: sh || 9,
    startMinute: sm || 0,
    endHour: eh || 10,
    endMinute: em || 0,
    recurrence: recurring ? monthlyRecurrenceRule(recurrenceTotal) : null,
    description: buildTransactionEventDescription({ tipo, valor, classificacao, status, obs }),
    reminderMinutes: Number.isFinite(reminder) ? reminder : null,
    createMeetLink: false,
  };
}

export function validateTransactionGoogleForm({ isAllDay, startTime, endTime, data }) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ''))) errors.data = 'Informe uma data válida.';
  if (!isAllDay) {
    if (!startTime) errors.startTime = 'Informe o horário de início.';
    if (!endTime) errors.endTime = 'Informe o horário de término.';
    if (startTime && endTime && endTime <= startTime) {
      errors.endTime = 'O término deve ser depois do início.';
    }
  }
  return errors;
}
