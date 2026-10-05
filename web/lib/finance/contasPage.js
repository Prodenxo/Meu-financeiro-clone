/**
 * Modelo da tela Contas — regras de `frontend/screens/ContasScreen.tsx`,
 * `lib/contaFinanceiraDefault.ts`, `lib/contaFinanceiraTypes.ts` e `lib/contaSaldo.ts`,
 * sem UI. Funções puras.
 */
import { CONTA_TIPO_LABELS, computeContaSaldoAtual } from './contas.js';
import { findBankById, findBankByNome } from './bankCatalog.js';
import { normalizarTipo, normalizarValor, parseTransactionDate, toDayKey } from './normalize.js';
import { isRealizedLancamentoStatus } from './status.js';
import { MONTH_SHORT, formatDayMonth } from './format.js';
import { dayKeyToDate } from './transactions.js';

export const CONTA_TIPO_OPTIONS = Object.entries(CONTA_TIPO_LABELS).map(([key, label]) => ({ key, label }));

export const CONTA_COR_PRESETS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#0EA5E9', '#64748B'];

/** Nome da carteira/conta padrão do produto. */
export const DEFAULT_CONTA_NOME = 'Meu Financeiro';
const DEFAULT_CONTA_NAME_KEYS = ['meu financeiro', 'carteira', 'carteira principal', 'dinheiro', 'principal'];

export const CHART_RANGES = [
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
  { value: '90d', label: '90D', days: 90 },
  { value: '1a', label: '1A', days: 365 },
];

export function normalizeContaNomeKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Conta padrão (porta de `pickDefaultContaFinanceira`). */
export function pickDefaultConta(contas) {
  const active = contas.filter((c) => c.ativo);
  if (!active.length) return null;
  const findByKeys = (keys) => active.find((c) => keys.includes(normalizeContaNomeKey(c.nome)));

  const branded = findByKeys([normalizeContaNomeKey(DEFAULT_CONTA_NOME)]);
  if (branded) return branded;
  const alias = findByKeys(DEFAULT_CONTA_NAME_KEYS);
  if (alias) return alias;

  const dinheiro = active.filter((c) => c.tipo === 'dinheiro');
  if (dinheiro.length === 1) return dinheiro[0];
  if (dinheiro.length > 1) {
    const hinted = dinheiro.find((c) => DEFAULT_CONTA_NAME_KEYS.some((hint) => normalizeContaNomeKey(c.nome).includes(hint)));
    if (hinted) return hinted;
  }
  if (active.length === 1) return active[0];
  return [...active].sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())[0] ?? null;
}

export function sortContasWithDefaultFirst(contas) {
  const def = pickDefaultConta(contas);
  if (!def) return contas;
  return [def, ...contas.filter((c) => c.id !== def.id)];
}

/** "2026-09-24" → "24 set. 2026" */
export function formatDayKeyLong(key) {
  const [y, m, d] = String(key || '').split('-');
  const idx = Number(m) - 1;
  if (!d || !MONTH_SHORT[idx]) return '';
  return `${d} ${MONTH_SHORT[idx]}. ${y}`;
}

const dayKeyOf = (t) => toDayKey(parseTransactionDate(t));
const signedValor = (t) => (normalizarTipo(t.tipo) === 'entrada' ? 1 : -1) * normalizarValor(t.valor);

/** Instituição para agrupar/mostrar: entrada do catálogo ou a própria conta. */
export function institutionOf(conta) {
  const bank = findBankById(conta.instituicao_id) ?? findBankByNome(conta.nome);
  const logoRaw = String(conta?.of_institution_logo_url || '').trim();
  const logoUrl = /^https?:\/\//i.test(logoRaw) ? logoRaw : null;
  return bank
    ? { key: `bank:${bank.id}`, nome: bank.nome, cor: bank.cor, slug: bank.libraryNome, logoUrl }
    : { key: `conta:${conta.id}`, nome: conta.nome, cor: conta.cor || '#64748B', slug: null, logoUrl };
}

/** Contas ativas (padrão primeiro) com saldo atual e última movimentação. */
export function buildContaCards(contas, transactions) {
  const ativas = sortContasWithDefaultFirst(contas.filter((c) => c.ativo));
  const def = pickDefaultConta(ativas);
  const lastByConta = new Map();
  for (const t of transactions) {
    if (!t.conta_id) continue;
    const key = dayKeyOf(t);
    const prev = lastByConta.get(String(t.conta_id));
    if (!prev || key > prev) lastByConta.set(String(t.conta_id), key);
  }
  return ativas.map((c) => ({
    conta: c,
    isDefault: Boolean(def && def.id === c.id),
    saldo: computeContaSaldoAtual(c.saldo_inicial, transactions, c.id),
    tipoLabel: CONTA_TIPO_LABELS[c.tipo] || CONTA_TIPO_LABELS.outro,
    lastMovementKey: lastByConta.get(c.id) || null,
  }));
}

/** Distribuição do saldo por instituição (só saldos positivos entram na fatia). */
export function buildInstitutionSummary(cards, { limit = 4 } = {}) {
  const groups = new Map();
  for (const { conta, saldo } of cards) {
    const inst = institutionOf(conta);
    const g = groups.get(inst.key) || { ...inst, saldo: 0 };
    if (!g.logoUrl && inst.logoUrl) g.logoUrl = inst.logoUrl;
    if (!g.slug && inst.slug) g.slug = inst.slug;
    g.saldo += saldo;
    groups.set(inst.key, g);
  }
  const list = [...groups.values()].sort((a, b) => b.saldo - a.saldo);
  const totalPositivo = list.reduce((s, g) => s + Math.max(0, g.saldo), 0);
  const share = (saldo) => (totalPositivo > 0 && saldo > 0 ? (saldo / totalPositivo) * 100 : 0);

  const top = list.slice(0, limit).map((g) => ({ ...g, share: share(g.saldo) }));
  const rest = list.slice(limit);
  if (rest.length) {
    const saldo = rest.reduce((s, g) => s + g.saldo, 0);
    top.push({ key: 'outros', nome: 'Outros', cor: '#9a9aaf', saldo, share: share(saldo), count: rest.length });
  }
  return top;
}

export function formatShare(share) {
  if (share <= 0) return '0%';
  if (share < 1) return '< 1%';
  return `${Math.round(share)}%`;
}

/** Últimas movimentações vinculadas a alguma conta (mais recentes primeiro). */
export function buildRecentAccountMovements(transactions, contas, limit = 5) {
  const nomeById = Object.fromEntries(contas.map((c) => [c.id, c.nome]));
  return [...transactions]
    .filter((t) => t.conta_id)
    .sort((a, b) => dayKeyOf(b).localeCompare(dayKeyOf(a)) || String(b.criado_em).localeCompare(String(a.criado_em)))
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      title: t.classificacao || 'Lançamento',
      dateKey: dayKeyOf(t),
      dateLabel: formatDayKeyLong(dayKeyOf(t)),
      contaNome: nomeById[String(t.conta_id)] || null,
      tipo: normalizarTipo(t.tipo),
      valor: normalizarValor(t.valor),
      status: t.status,
    }));
}

/**
 * Evolução do saldo somado das contas: saldo inicial + lançamentos realizados vinculados,
 * acumulado dia a dia até hoje (mesma fórmula de `computeContaSaldoAtual`, no tempo).
 */
export function buildBalanceHistory({ contas, transactions, today, range = '30d', contaFilter = 'all' }) {
  const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 30;
  const scope = contas.filter((c) => c.ativo && (contaFilter === 'all' || c.id === contaFilter));
  const ids = new Set(scope.map((c) => c.id));
  const todayKey = toDayKey(today);
  const startKey = toDayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1), 12));

  let base = scope.reduce((s, c) => s + c.saldo_inicial, 0);
  const deltaByDay = new Map();
  for (const t of transactions) {
    if (!t.conta_id || !ids.has(String(t.conta_id)) || !isRealizedLancamentoStatus(t.status)) continue;
    const key = dayKeyOf(t);
    if (key > todayKey) continue;
    if (key < startKey) base += signedValor(t);
    else deltaByDay.set(key, (deltaByDay.get(key) || 0) + signedValor(t));
  }

  const series = [];
  let acc = base;
  const cursor = dayKeyToDate(startKey);
  for (let i = 0; i < days; i++) {
    const key = toDayKey(cursor);
    acc += deltaByDay.get(key) || 0;
    series.push({ dayKey: key, label: formatDayMonth(key), saldo: acc });
    cursor.setDate(cursor.getDate() + 1);
  }

  const values = series.map((p) => p.saldo);
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const delta = last - first;
  const hasMovement = deltaByDay.size > 0;
  return {
    series,
    stats: {
      delta,
      min: Math.min(...values),
      max: Math.max(...values),
      variationPct: first !== 0 ? (delta / Math.abs(first)) * 100 : null,
    },
    hasMovement,
  };
}

export function buildContasModel({ contas, transactions, today, tipoFilter = 'all', chartRange = '30d', chartConta = 'all' }) {
  const cards = buildContaCards(contas, transactions);
  const visibleCards = tipoFilter === 'all' ? cards : cards.filter((c) => c.conta.tipo === tipoFilter);
  return {
    cards,
    visibleCards,
    total: cards.reduce((s, c) => s + c.saldo, 0),
    count: cards.length,
    institutions: buildInstitutionSummary(cards),
    recent: buildRecentAccountMovements(transactions, contas),
    history: buildBalanceHistory({ contas, transactions, today, range: chartRange, contaFilter: chartConta }),
    tiposPresentes: [...new Set(cards.map((c) => c.conta.tipo))],
  };
}
