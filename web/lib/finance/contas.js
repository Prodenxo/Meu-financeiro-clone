/**
 * Saldo por conta e filtro de conta — porta de `frontend/lib/contaSaldo.ts`,
 * `frontend/lib/contaFinanceiraIntegration.ts` e `frontend/lib/contaFinanceiraTypes.ts`.
 */
import { normalizarTipo, normalizarValor } from './normalize.js';
import { isRealizedLancamentoStatus } from './status.js';

export const CONTA_TIPO_LABELS = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  cartao_credito: 'Cartão de crédito',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
};

export function normalizeContaRow(row) {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    nome: String(row.nome ?? '').trim(),
    tipo: String(row.tipo ?? 'corrente'),
    saldo_inicial:
      typeof row.saldo_inicial === 'number'
        ? row.saldo_inicial
        : parseFloat(String(row.saldo_inicial ?? 0)) || 0,
    limite_credito:
      row.limite_credito == null
        ? null
        : typeof row.limite_credito === 'number'
          ? row.limite_credito
          : parseFloat(String(row.limite_credito)) || null,
    dia_fechamento: row.dia_fechamento == null ? null : Number(row.dia_fechamento) || null,
    dia_vencimento: row.dia_vencimento == null ? null : Number(row.dia_vencimento) || null,
    cor: row.cor ? String(row.cor) : null,
    instituicao_id: row.instituicao_id ? String(row.instituicao_id) : null,
    of_institution_logo_url: row.of_institution_logo_url ? String(row.of_institution_logo_url).trim() : null,
    of_provider: row.of_provider ? String(row.of_provider) : null,
    of_external_id: row.of_external_id ? String(row.of_external_id) : null,
    of_last_synced_at: row.of_last_synced_at ? String(row.of_last_synced_at) : null,
    ativo: row.ativo !== false,
    criado_em: String(row.criado_em ?? ''),
    atualizado_em: String(row.atualizado_em ?? ''),
  };
}

/** Saldo atual = saldo inicial + entradas realizadas − saídas realizadas vinculadas à conta. */
export function computeContaSaldoAtual(saldoInicial, lancamentos, contaId) {
  let delta = 0;
  for (const tx of lancamentos) {
    if (!tx.conta_id || String(tx.conta_id) !== contaId) continue;
    if (!isRealizedLancamentoStatus(tx.status)) continue;
    const valor = normalizarValor(tx.valor);
    if (normalizarTipo(tx.tipo) === 'entrada') delta += valor;
    else delta -= valor;
  }
  return saldoInicial + delta;
}

export function buildContaNameMap(contas) {
  const map = {};
  for (const c of contas) {
    if (c.ativo) map[c.id] = c.nome;
  }
  return map;
}

export function computeSaldosByConta(contas, lancamentos) {
  const out = {};
  for (const c of contas.filter((x) => x.ativo)) {
    out[c.id] = computeContaSaldoAtual(c.saldo_inicial, lancamentos, c.id);
  }
  return out;
}

export function sumSaldosContas(contas, lancamentos) {
  return contas
    .filter((c) => c.ativo)
    .reduce((sum, c) => sum + computeContaSaldoAtual(c.saldo_inicial, lancamentos, c.id), 0);
}

/** Lançamentos sem conta vinculada (realizados) — legado / migração. */
export function sumUnassignedRealizedDelta(lancamentos) {
  let delta = 0;
  for (const tx of lancamentos) {
    if (tx.conta_id) continue;
    if (!isRealizedLancamentoStatus(tx.status)) continue;
    const v = normalizarValor(tx.valor);
    delta += normalizarTipo(tx.tipo) === 'entrada' ? v : -v;
  }
  return delta;
}

export function matchesContaFilter(tx, filter) {
  if (filter === 'all') return true;
  if (filter === 'unassigned') return !tx.conta_id;
  return String(tx.conta_id || '') === filter;
}

export function filterTransactionsByConta(list, filter) {
  if (filter === 'all') return list;
  return list.filter((t) => matchesContaFilter(t, filter));
}

/** Saldo geral legado: soma de todos os lançamentos realizados (sem contas cadastradas). */
export function computeLegacyBalance(transactions) {
  let sum = 0;
  for (const t of transactions) {
    if (!isRealizedLancamentoStatus(t.status)) continue;
    const val = normalizarValor(t.valor);
    sum += normalizarTipo(t.tipo) === 'entrada' ? val : -val;
  }
  return sum;
}

/** Saldo exibido no dashboard conforme o filtro de conta ativo. */
export function resolveDashboardBalance(contas, lancamentos, legacyAllTxBalance, filter) {
  const ativas = contas.filter((c) => c.ativo);

  if (filter === 'unassigned') {
    return { value: sumUnassignedRealizedDelta(lancamentos), mode: 'unassigned' };
  }

  if (filter !== 'all') {
    const conta = ativas.find((c) => c.id === filter);
    if (conta) {
      return {
        value: computeContaSaldoAtual(conta.saldo_inicial, lancamentos, filter),
        mode: 'contas',
      };
    }
  }

  if (ativas.length === 0) {
    return { value: legacyAllTxBalance, mode: 'legacy' };
  }

  let total = sumSaldosContas(ativas, lancamentos);
  if (filter === 'all') {
    total += sumUnassignedRealizedDelta(lancamentos);
  }
  return { value: total, mode: 'contas' };
}

/** Rótulo e dica do card de saldo (mesma lógica do DashboardScreen do Expo). */
export function describeBalance(filter, mode, contaNameById) {
  if (filter === 'all') {
    return mode === 'contas'
      ? { label: 'Saldo nas contas', hint: 'Soma dos saldos cadastrados' }
      : { label: 'Saldo geral', hint: 'Acumulado' };
  }
  if (filter === 'unassigned') {
    return { label: 'Meu financeiro', hint: 'Sem vínculo com conta bancária' };
  }
  return { label: contaNameById[filter] || 'Conta', hint: 'Filtrado nesta visão' };
}
