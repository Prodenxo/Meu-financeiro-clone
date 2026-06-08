import { badRequest } from '../utils/errors.js';
import {
  matchContaByName,
  pickDefaultContaFinanceira,
  resolveContaIdFromPayload,
} from './conta-financeira-default.js';

/**
 * UUID do lançamento no payload do bot (aceita aliases comuns do modelo).
 * @param {object | undefined} payload
 * @returns {string | null}
 */
export const resolveOpenclawTransactionId = (payload) => {
  const raw =
    payload?.id ??
    payload?.transactionId ??
    payload?.transaction_id ??
    payload?.lancamentoId ??
    payload?.lancamento_id;
  const id = raw != null ? String(raw).trim() : '';
  return id || null;
};

const TIPO_ALIASES = {
  entrada: 'entrada',
  ingresso: 'entrada',
  receita: 'entrada',
  recebimento: 'entrada',
  recebi: 'entrada',
  credito: 'entrada',
  crédito: 'entrada',
  saida: 'saida',
  saída: 'saida',
  despesa: 'saida',
  gasto: 'saida',
  pagamento: 'saida',
  debito: 'saida',
  débito: 'saida',
};

const normalizeCategoryKey = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseValor = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+([.,]\d+)?$/.test(s)) {
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  const br = s
    .replace(/[R$r$]/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(br);
  return Number.isFinite(n) ? n : null;
};

const resolveDataIso = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (s === 'hoje' || s === 'today' || s === 'agora') {
    return new Date().toISOString().slice(0, 10);
  }
  if (s === 'ontem' || s === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (br) {
    const [, dd, mm, yyyy] = br;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return null;
};

const isNumericCategoryCode = (value) => /^\d{3,8}$/.test(String(value || '').trim());

/**
 * Corrige payload do OpenClaw antes de createTransaction.
 * @param {object} payload
 * @param {{ categories?: Array<{ nome?: string, tipo?: string }> }} [options]
 */
export const normalizeOpenclawTransactionPayload = (payload = {}, options = {}) => {
  const categories = options.categories || [];
  const tipoRaw = String(payload?.tipo ?? payload?.type ?? '').trim().toLowerCase();
  const tipo = TIPO_ALIASES[tipoRaw] || (tipoRaw === 'saída' ? 'saida' : tipoRaw);

  let classificacao = String(
    payload?.classificacao
    ?? payload?.categoria
    ?? payload?.category
    ?? payload?.descricao
    ?? payload?.description
    ?? '',
  ).trim();

  if (isNumericCategoryCode(classificacao)) {
    classificacao = '';
  }

  if (classificacao && categories.length) {
    const key = normalizeCategoryKey(classificacao);
    const match = categories.find((c) => normalizeCategoryKey(c?.nome) === key);
    if (match?.nome) classificacao = match.nome;
    else {
      const partial = categories.find(
        (c) =>
          normalizeCategoryKey(c?.nome).includes(key)
          || key.includes(normalizeCategoryKey(c?.nome)),
      );
      if (partial?.nome) classificacao = partial.nome;
    }
  }

  if (!classificacao) {
    const salarioHints = ['salario', 'salário', 'salary'];
    const hint = salarioHints.find((h) => tipo === 'entrada');
    if (hint && categories.length) {
      const sal = categories.find(
        (c) =>
          c?.tipo === 'entrada'
          && normalizeCategoryKey(c?.nome).includes('salario'),
      );
      if (sal?.nome) classificacao = sal.nome;
    }
  }

  const valor = parseValor(payload?.valor ?? payload?.value ?? payload?.amount);
  const data = resolveDataIso(payload?.data ?? payload?.date);

  const missing = [];
  if (!tipo || (tipo !== 'entrada' && tipo !== 'saida')) {
    missing.push('tipo (use entrada ou saida — não use "ingresso")');
  }
  if (valor == null || valor <= 0) missing.push('valor (número, ex.: 2500)');
  if (!classificacao) {
    missing.push(
      'classificacao (nome da categoria na app, ex.: Salário — nunca código numérico inventado)',
    );
  }
  if (!data) missing.push('data (YYYY-MM-DD ou "hoje")');

  if (missing.length) {
    throw badRequest(
      `Lançamento incompleto para a API: ${missing.join('; ')}. `
      + 'Chame list_categories e use o campo nome exato da categoria.',
    );
  }

  const contas = options.contas || [];
  let conta_id = resolveContaIdFromPayload(contas, payload);
  const requestedName = String(
    payload?.conta
    ?? payload?.conta_nome
    ?? payload?.contaNome
    ?? payload?.carteira
    ?? payload?.wallet
    ?? '',
  ).trim();

  if (requestedName && contas.length && !conta_id) {
    throw badRequest(
      `Carteira/conta "${requestedName}" não encontrada. `
      + 'Chame list_contas e use o nome exacto ou conta_id (UUID).',
    );
  }

  const defaultConta = pickDefaultContaFinanceira(contas);
  if (!conta_id && defaultConta?.id) {
    conta_id = defaultConta.id;
  }

  let conta_nome = null;
  if (conta_id && contas.length) {
    conta_nome = contas.find((c) => String(c?.id) === String(conta_id))?.nome ?? null;
  } else if (requestedName && conta_id) {
    conta_nome = matchContaByName(contas, requestedName)?.nome ?? requestedName;
  } else if (defaultConta?.nome) {
    conta_nome = defaultConta.nome;
  }

  return {
    tipo,
    valor,
    classificacao,
    data,
    status: payload?.status,
    obs: payload?.obs ?? payload?.observacao ?? null,
    conta_id,
    conta_nome,
  };
};

/** Campos parciais para update_transaction (OpenClaw). */
export const normalizeOpenclawTransactionUpdate = (payload = {}, options = {}) => {
  const id = resolveOpenclawTransactionId(payload);
  if (!id) {
    throw badRequest('ID da transação é obrigatório (payload.id ou transactionId)');
  }

  const patch = { id };
  const categories = options.categories || [];
  const contas = options.contas || [];

  if (payload?.tipo != null || payload?.type != null) {
    const tipoRaw = String(payload?.tipo ?? payload?.type ?? '').trim().toLowerCase();
    const tipo = TIPO_ALIASES[tipoRaw] || (tipoRaw === 'saída' ? 'saida' : tipoRaw);
    if (tipo !== 'entrada' && tipo !== 'saida') {
      throw badRequest('tipo inválido (entrada ou saida)');
    }
    patch.tipo = tipo;
  }

  if (payload?.valor != null || payload?.value != null || payload?.amount != null) {
    const valor = parseValor(payload?.valor ?? payload?.value ?? payload?.amount);
    if (valor == null || valor <= 0) throw badRequest('valor inválido');
    patch.valor = valor;
  }

  if (
    payload?.classificacao != null
    || payload?.categoria != null
    || payload?.category != null
  ) {
    let classificacao = String(
      payload?.classificacao ?? payload?.categoria ?? payload?.category ?? '',
    ).trim();
    if (isNumericCategoryCode(classificacao)) classificacao = '';
    if (!classificacao) throw badRequest('classificacao inválida');
    if (categories.length) {
      const key = normalizeCategoryKey(classificacao);
      const match = categories.find((c) => normalizeCategoryKey(c?.nome) === key);
      if (match?.nome) classificacao = match.nome;
    }
    patch.classificacao = classificacao;
  }

  if (payload?.data != null || payload?.date != null) {
    const data = resolveDataIso(payload?.data ?? payload?.date);
    if (!data) throw badRequest('data inválida');
    patch.data = data;
  }

  if (payload?.status != null) patch.status = payload.status;
  if (payload?.obs != null || payload?.observacao != null) {
    patch.obs = payload?.obs ?? payload?.observacao ?? null;
  }

  const hasCarteiraField =
    payload?.conta_id != null
    || payload?.contaId != null
    || payload?.conta != null
    || payload?.conta_nome != null
    || payload?.carteira != null
    || payload?.wallet != null;
  if (hasCarteiraField && contas.length) {
    const conta_id = resolveContaIdFromPayload(contas, payload);
    const requestedName = String(
      payload?.conta ?? payload?.conta_nome ?? payload?.carteira ?? payload?.wallet ?? '',
    ).trim();
    if (requestedName && !conta_id) {
      throw badRequest(
        `Carteira "${requestedName}" não encontrada. Use list_contas.`,
      );
    }
    if (conta_id) patch.conta_id = conta_id;
  }

  if (Object.keys(patch).length === 1) {
    throw badRequest('Nenhum campo para actualizar além do id');
  }

  return patch;
};
