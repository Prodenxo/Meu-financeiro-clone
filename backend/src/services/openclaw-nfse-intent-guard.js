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
const CLIENTE_NUM_RE = /\bcliente\s*#?\s*(\d{1,2})\b/i;
const SERVICO_NUM_RE = /\bservi[cç]o\s*#?\s*(\d{1,2})\b/i;

export const NFSE_NO_CARTEIRA_FOOTER =
  '\n\nPara emitir a nota: diga cliente (número) + serviço (número) + valor. '
  + 'Não precisa informar carteira/banco (Nubank, Poupança).';

/**
 * Extrai índices "cliente 3" / "serviço 1" de texto livre (áudio, obs, classificação).
 * @param {string} text
 */
export const extractNfseIndicesFromText = (text) => {
  const s = String(text || '');
  const clienteMatch = CLIENTE_NUM_RE.exec(s);
  const servicoMatch = SERVICO_NUM_RE.exec(s);
  return {
    clienteIndice: clienteMatch ? parsePositiveInt(clienteMatch[1]) : null,
    servicoIndice: servicoMatch ? parsePositiveInt(servicoMatch[1]) : null,
  };
};

const collectPayloadTextBlob = (payload = {}) => [
  payload.texto,
  payload.pedido,
  payload.descricao,
  payload.observacao,
  payload.obs,
  payload.classificacao,
  payload.categoria,
]
  .filter(Boolean)
  .join(' ');

/**
 * Texto do utilizador (WhatsApp) indica NFSe — injeta hint no relay OpenClaw.
 * @param {string} text
 */
export const isNfseEmitIntentFromUserText = (text) => {
  const s = String(text || '').trim();
  if (!s) return false;
  if (NFSE_KEYWORD_RE.test(s)) return true;
  if (/\b(liste|lista|mostre|me\s+(diga|fale)|quais)\b.*\b(clientes?|servi[cç]os?)\b/i.test(s)
    && /\b(nfse|nfs-e|nota fiscal|nota de servi)/i.test(s)) {
    return true;
  }
  const { clienteIndice, servicoIndice } = extractNfseIndicesFromText(s);
  if (clienteIndice && servicoIndice) return true;
  if (clienteIndice && /\b(emite|emitir|emiss[aã]o|nota)\b/i.test(s)) return true;
  if (/\bmanuten|repara|pintura\b/i.test(s) && clienteIndice) return true;
  return false;
};

/**
 * Completa payload NFSe a partir de obs/classificação ("cliente 3 serviço 1").
 * @param {Record<string, unknown>} [payload]
 */
export const enrichNfsePayloadFromFreeText = (payload = {}) => {
  const next = { ...payload };
  const blob = collectPayloadTextBlob(payload);
  const fromText = extractNfseIndicesFromText(blob);

  if (fromText.clienteIndice && !resolveClienteIndiceFromPayload(next)) {
    next.clienteIndice = fromText.clienteIndice;
  }
  if (fromText.servicoIndice && !resolveServicoIndiceFromPayload(next)) {
    next.servicoIndice = fromText.servicoIndice;
  }
  return next;
};

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

  const enriched = enrichNfsePayloadFromFreeText(payload);
  if (
    resolveClienteIndiceFromPayload(enriched)
    && resolveServicoIndiceFromPayload(enriched)
  ) {
    return true;
  }
  if (
    resolveClienteIndiceFromPayload(enriched)
    && (payload.valor != null || payload.valorServico != null)
  ) {
    return true;
  }

  if (resolveServicoIndiceFromPayload(payload) && resolveClienteIndiceFromPayload(payload) == null) {
    const nome = firstNonEmpty(payload.tomadorNome, payload.tomadorRazaoSocial);
    if (nome && !/^\d+$/.test(nome)) return true;
  }

  const texto = collectPayloadTextBlob(payload);
  if (NFSE_KEYWORD_RE.test(texto)) return true;

  const fromText = extractNfseIndicesFromText(texto);
  if (fromText.clienteIndice && fromText.servicoIndice) return true;
  if (fromText.clienteIndice && (payload.valor != null || payload.valorServico != null)) return true;

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
  const enriched = enrichNfsePayloadFromFreeText(payload);
  const next = { ...enriched };

  const clienteIndice = resolveClienteIndiceFromPayload(enriched);
  if (clienteIndice) {
    next.clienteIndice = clienteIndice;
  }

  const servicoIndice = resolveServicoIndiceFromPayload(enriched);
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

const PT_NUMBER_WORDS = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  quinze: 15,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  cem: 100,
};

const normalizePtWord = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{M}/gu, '');

/**
 * Extrai valor em reais de texto pt-BR (dígitos ou "cinco reais").
 * @param {string} text
 */
export const parseValorFromPortugueseText = (text) => {
  const s = String(text || '');
  const digitMatch = s.match(/\bvalor\s*(?:de\s*)?r?\$?\s*(\d+(?:[.,]\d{1,2})?)/i)
    || s.match(/\b(\d+(?:[.,]\d{1,2})?)\s*reais?\b/i)
    || s.match(/\br\$\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (digitMatch) {
    const raw = digitMatch[1].replace(/\./g, '').replace(',', '.');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const wordMatch = s.match(/\bvalor\s*(?:de\s*)?([a-záéíóúãõ]+)\s*reais?\b/i)
    || s.match(/\b([a-záéíóúãõ]+)\s*reais?\b/i);
  if (wordMatch) {
    const mapped = PT_NUMBER_WORDS[normalizePtWord(wordMatch[1])];
    return mapped > 0 ? mapped : null;
  }
  return null;
};

/**
 * Pedido completo em linguagem natural: cliente N + serviço M + valor.
 * @param {string} text
 */
export const isCompleteNfseEmitOrderFromUserText = (text) => {
  const s = String(text || '').trim();
  if (!s) return false;
  const { clienteIndice, servicoIndice } = extractNfseIndicesFromText(s);
  if (!clienteIndice || !servicoIndice) return false;
  const valor = parseValorFromPortugueseText(s);
  if (valor == null || valor <= 0) return false;
  return /\b(emite|emitir|emiss|quero|manda|fazer|tirar|nota)\b/i.test(s) || /\bvalor\b/i.test(s);
};

/**
 * Monta payload emit_nfse a partir do texto do utilizador.
 * @param {string} text
 */
export const buildEmitNfsePayloadFromUserText = (text) => {
  if (!isCompleteNfseEmitOrderFromUserText(text)) return null;
  const { clienteIndice, servicoIndice } = extractNfseIndicesFromText(text);
  const valor = parseValorFromPortugueseText(text);
  if (!clienteIndice || !servicoIndice || valor == null) return null;
  return { clienteIndice, servicoIndice, valor };
};

/**
 * Une payload do mf-curl com texto do utilizador (userText/texto/pedido).
 * @param {Record<string, unknown>} [payload]
 */
export const buildOpenclawNfseEmitPayloadFromSources = (payload = {}) => {
  const userText = String(
    payload?.userText ?? payload?.texto ?? payload?.pedido ?? payload?.contexto ?? '',
  ).trim();
  let merged = enrichNfsePayloadFromFreeText(payload);
  if (userText) {
    const fromText = buildEmitNfsePayloadFromUserText(userText);
    if (fromText) merged = { ...merged, ...fromText };
  }
  return merged;
};

export const NFSE_PREVIEW_AGENT_HINT =
  'Pedido com cliente + serviço + valor: chame emit_nfse SEM confirm:true (só preview). '
  + 'Repita APENAS o campo message e peça *sim* / *confirmo*. '
  + 'Só após o utilizador confirmar, chame emit_nfse com confirm:true e os MESMOS dados. '
  + 'PROIBIDO list_nfse_clientes, list_catalog_servicos ou repetir a lista.';

export const NFSE_ALWAYS_NEW_EMIT_AGENT_HINT =
  'Cada pedido confirmado de emissão = SEMPRE emit_nfse com confirm:true (nota NOVA na PlugNotas). '
  + 'PROIBIDO reutilizar nota antiga com mesmo cliente/valor: não uses list_nfse_notas, get_nfse_pdf '
  + 'nem mf-nfse-send.sh para “emitir” — só quando o utilizador pedir explicitamente reenviar PDF '
  + 'de uma nota já existente.';
