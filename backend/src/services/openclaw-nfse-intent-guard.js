const firstNonEmpty = (...values) => {
  for (const v of values) {
    const s = v !== undefined && v !== null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
};

const parsePositiveInt = (value) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const NFSE_KEYWORD_RE = /\b(nfse|nfs-e|nota fiscal|nota de servi[cç]o|emitir nota|emite nota|emiss[aã]o de nota|presta[cç][aã]o de servi)/i;

const NFSE_PAYLOAD_KEYS = [
  'tomadorNome',
  'tomadorCpfCnpj',
  'tomadorRazaoSocial',
  'tomadorCnpj',
  'servicoIndice',
  'servicoNumero',
  'codigoServico',
  'cnae',
  'clienteIndice',
  'tomadorIndice',
  'clienteNumero',
  'tomadorNumero',
  'discriminacao',
  'confirm',
  'notaFiscal',
  'nfse',
];

/**
 * Índice numérico do cliente na lista (ex.: "cliente 2" → 2).
 * @param {Record<string, unknown>} [payload]
 * @returns {number|null}
 */
export const resolveClienteIndiceFromPayload = (payload = {}) => {
  const explicit = firstNonEmpty(
    payload.clienteIndice,
    payload.tomadorIndice,
    payload.clienteNumero,
    payload.tomadorNumero,
  );
  const fromExplicit = parsePositiveInt(explicit);
  if (fromExplicit) return fromExplicit;

  const cliente = payload.cliente;
  if (typeof cliente === 'number') return parsePositiveInt(cliente);
  if (typeof cliente === 'string' && /^\d{1,2}$/.test(cliente.trim())) {
    return parsePositiveInt(cliente.trim());
  }
  return null;
};

/**
 * Índice numérico do serviço na lista (ex.: "serviço 1" → 1).
 * @param {Record<string, unknown>} [payload]
 * @returns {number|null}
 */
export const resolveServicoIndiceFromPayload = (payload = {}) => {
  const raw = firstNonEmpty(
    payload.servicoIndice,
    payload.servicoNumero,
    payload.indice,
    payload.servico,
  );
  return parsePositiveInt(raw);
};

/**
 * Pedido parece emissão de NFSe (não lançamento em carteira).
 * @param {Record<string, unknown>} [payload]
 */
export const isNfseEmitIntentPayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;

  if (NFSE_PAYLOAD_KEYS.some((key) => {
    const v = payload[key];
    return v != null && String(v).trim() !== '';
  })) {
    return true;
  }

  if (resolveClienteIndiceFromPayload(payload) && resolveServicoIndiceFromPayload(payload)) {
    return true;
  }

  if (resolveServicoIndiceFromPayload(payload) && resolveClienteIndiceFromPayload(payload) == null) {
    const nome = firstNonEmpty(payload.tomadorNome, payload.tomadorRazaoSocial);
    if (nome && !/^\d+$/.test(nome)) return true;
  }

  const texto = [
    payload.texto,
    payload.pedido,
    payload.descricao,
    payload.observacao,
    payload.classificacao,
    payload.categoria,
  ]
    .filter(Boolean)
    .join(' ');
  if (NFSE_KEYWORD_RE.test(texto)) return true;

  const classificacao = String(payload.classificacao || payload.categoria || '').toLowerCase();
  if (
    classificacao
    && /servi[cç]o|manuten|repara|pintura|presta/.test(classificacao)
    && resolveServicoIndiceFromPayload(payload)
  ) {
    return true;
  }

  return false;
};

/**
 * Normaliza payload enviado por engano em create_transaction para emit_nfse.
 * @param {Record<string, unknown>} [payload]
 */
export const mapMisroutedTransactionToNfsePayload = (payload = {}) => {
  const next = { ...payload };

  const clienteIndice = resolveClienteIndiceFromPayload(payload);
  if (clienteIndice) {
    next.clienteIndice = clienteIndice;
  }

  const servicoIndice = resolveServicoIndiceFromPayload(payload);
  if (servicoIndice) {
    next.servicoIndice = servicoIndice;
  }

  const valor = payload.valor ?? payload.valorServico ?? payload.valorReais;
  if (valor != null && valor !== '') {
    next.valor = valor;
  }

  const nomeCliente = firstNonEmpty(
    payload.tomadorNome,
    payload.tomadorRazaoSocial,
    typeof payload.cliente === 'string' && !/^\d+$/.test(payload.cliente.trim())
      ? payload.cliente
      : '',
  );
  if (nomeCliente) {
    next.tomadorNome = nomeCliente;
  }

  if (payload.confirm === true || String(payload.confirm || '').toLowerCase() === 'true') {
    next.confirm = true;
  }

  return next;
};

export const NFSE_MISROUTED_TRANSACTION_HINT =
  'Pedido de NOTA FISCAL de serviço (NFSe). Use emit_nfse com clienteIndice, servicoIndice e valor. '
  + 'PROIBIDO create_transaction, list_contas ou perguntar carteira (Nubank, Poupança).';
