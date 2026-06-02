import { badRequest } from '../utils/errors.js';

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

  return {
    tipo,
    valor,
    classificacao,
    data,
    status: payload?.status,
    obs: payload?.obs ?? payload?.observacao ?? null,
    conta_id: payload?.conta_id ?? payload?.contaId ?? null,
  };
};
