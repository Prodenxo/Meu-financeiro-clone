import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import {
  getRatesToBrl,
  listFrankfurterCurrencies,
} from './frankfurter.service.js';

/** Aliases pt-BR → ISO 4217 (voz/texto). */
const MOEDA_ALIASES = {
  dolar: 'USD',
  dólar: 'USD',
  dolár: 'USD',
  dollars: 'USD',
  dollar: 'USD',
  americano: 'USD',
  eua: 'USD',
  usd: 'USD',
  euro: 'EUR',
  euros: 'EUR',
  eur: 'EUR',
  libra: 'GBP',
  esterlina: 'GBP',
  gbp: 'GBP',
  iene: 'JPY',
  ienes: 'JPY',
  japao: 'JPY',
  japão: 'JPY',
  jpy: 'JPY',
  real: 'BRL',
  reais: 'BRL',
  brl: 'BRL',
  peso: 'ARS',
  argentina: 'ARS',
  ars: 'ARS',
  canadense: 'CAD',
  canada: 'CAD',
  canadá: 'CAD',
  cad: 'CAD',
  franco: 'CHF',
  suica: 'CHF',
  suíça: 'CHF',
  chf: 'CHF',
  australiano: 'AUD',
  australia: 'AUD',
  austrália: 'AUD',
  aud: 'AUD',
  yuan: 'CNY',
  china: 'CNY',
  cny: 'CNY',
  mexicano: 'MXN',
  mexico: 'MXN',
  méxico: 'MXN',
  mxn: 'MXN',
};

const MOEDA_NOMES = {
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Iene japonês',
  BRL: 'Real brasileiro',
  ARS: 'Peso argentino',
  CAD: 'Dólar canadense',
  CHF: 'Franco suíço',
  AUD: 'Dólar australiano',
  CNY: 'Yuan chinês',
  MXN: 'Peso mexicano',
};

const normalizeCode = (raw) => String(raw || '').trim().toUpperCase();

const stripAccents = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Resolve código ISO a partir de "USD", "dólar", "euro americano", etc.
 * @param {unknown} raw
 * @returns {string | null}
 */
export const resolveMoedaCode = (raw) => {
  if (raw == null) return null;
  const direct = normalizeCode(raw);
  if (/^[A-Z]{3}$/.test(direct)) return direct;

  const text = stripAccents(String(raw).trim().toLowerCase());
  if (!text) return null;
  if (MOEDA_ALIASES[text]) return MOEDA_ALIASES[text];

  const tokens = text.split(/[\s,/|+-]+/).filter(Boolean);
  for (const token of tokens) {
    if (MOEDA_ALIASES[token]) return MOEDA_ALIASES[token];
  }
  // "dolar americano" → tentar substring
  for (const [alias, code] of Object.entries(MOEDA_ALIASES)) {
    if (text.includes(alias)) return code;
  }
  return null;
};

const parseAmount = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw)
    .trim()
    .replace(/[R$|$|€|£]/gi, '')
    .replace(/\s/g, '');
  if (!s) return null;
  if (/^\d+([.,]\d+)?$/.test(s)) {
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  const br = s.replace(/\./g, '').replace(',', '.');
  const n = Number(br);
  return Number.isFinite(n) ? n : null;
};

const formatBrl = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatMoeda = (value, code) => {
  const n = Number(value || 0);
  try {
    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 4,
    });
  } catch {
    return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} ${code}`;
  }
};

const moedaLabel = (code) => MOEDA_NOMES[code] || code;

/**
 * @param {string} userId
 * @param {{ activeOnly?: boolean }} [opts]
 */
export const listContasMoedaGlobal = async (userId, { activeOnly = true } = {}) => {
  if (!userId) throw badRequest('userId é obrigatório');
  const db = createSupabaseClient({ useServiceRole: true });
  let q = db
    .from('contas_moeda_global')
    .select('*')
    .eq('user_id', userId)
    .order('moeda', { ascending: true });
  if (activeOnly) q = q.eq('ativo', true);
  const { data, error } = await q;
  if (error) throw badRequest(error.message);
  return (data || []).map((row) => ({
    id: row.id,
    moeda: normalizeCode(row.moeda),
    nome: row.nome || null,
    valor: Number(row.valor) || 0,
    ativo: row.ativo !== false,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }));
};

/**
 * Lista + cotações + equivalente BRL + total.
 * @param {string} userId
 * @param {object} [payload]
 */
export const getContaGlobalResumo = async (userId, payload = {}) => {
  const contas = await listContasMoedaGlobal(userId, { activeOnly: true });
  const filterMoeda = resolveMoedaCode(
    payload?.moeda || payload?.currency || payload?.codigo || payload?.code,
  );

  const filtered = filterMoeda
    ? contas.filter((c) => c.moeda === filterMoeda)
    : contas;

  if (filterMoeda && filtered.length === 0) {
    throw notFound(
      `Não há saldo em ${filterMoeda} (${moedaLabel(filterMoeda)}) na Conta Global.`,
    );
  }

  const codes = [...new Set(filtered.map((c) => c.moeda))];
  const rates = await getRatesToBrl(codes.length ? codes : ['USD']);

  const linhas = filtered.map((c) => {
    const rate = c.moeda === 'BRL' ? 1 : Number(rates[c.moeda]);
    const valorBrl = Number.isFinite(rate) ? c.valor * rate : null;
    return {
      ...c,
      nomeMoeda: moedaLabel(c.moeda),
      cotacaoBrl: Number.isFinite(rate) ? rate : null,
      valorBrl,
    };
  });

  const totalBrl = linhas.reduce(
    (sum, l) => sum + (typeof l.valorBrl === 'number' ? l.valorBrl : 0),
    0,
  );
  const missingRates = linhas.filter((l) => l.valorBrl == null).map((l) => l.moeda);

  const message = formatContaGlobalMessage(linhas, totalBrl, {
    filtered: Boolean(filterMoeda),
    filterMoeda,
    missingRates,
  });

  return {
    contas: linhas,
    totalBrl,
    rates,
    filtered: Boolean(filterMoeda),
    filterMoeda: filterMoeda || null,
    missingRates,
    message,
  };
};

export const formatContaGlobalMessage = (linhas, totalBrl, opts = {}) => {
  if (!linhas.length) {
    return 'Conta Global vazia — nenhuma moeda cadastrada. Use create_moeda_global para adicionar.';
  }

  const header = opts.filtered && opts.filterMoeda
    ? `Conta Global — ${opts.filterMoeda} (${moedaLabel(opts.filterMoeda)}):`
    : `Conta Global (${linhas.length} moeda${linhas.length === 1 ? '' : 's'}):`;

  const body = linhas
    .map((l, i) => {
      const label = l.nome ? `${l.moeda} · ${l.nome}` : `${l.moeda} · ${l.nomeMoeda}`;
      const brlPart =
        typeof l.valorBrl === 'number'
          ? ` ≈ ${formatBrl(l.valorBrl)} (cot. ${formatBrl(l.cotacaoBrl)})`
          : ' · cotação indisponível';
      return `${i + 1}) ${label}: ${formatMoeda(l.valor, l.moeda)}${brlPart}`;
    })
    .join('\n');

  const footer = opts.filtered
    ? `\nSubtotal≈ ${formatBrl(totalBrl)}`
    : `\nSaldo total Conta Global ≈ ${formatBrl(totalBrl)}`;

  const warn =
    opts.missingRates?.length > 0
      ? `\n(Sem cotação para: ${opts.missingRates.join(', ')})`
      : '';

  return `${header}\n${body}${footer}${warn}`;
};

/**
 * @param {string} userId
 * @param {object} payload
 */
export const createContaMoedaGlobal = async (userId, payload = {}) => {
  if (!userId) throw badRequest('userId é obrigatório');

  const moeda = resolveMoedaCode(
    payload?.moeda || payload?.currency || payload?.codigo || payload?.code || payload?.nomeMoeda,
  );
  if (!moeda || !/^[A-Z]{3}$/.test(moeda)) {
    throw badRequest(
      'Informe a moeda (ex.: USD, EUR, dólar, euro). Código ISO de 3 letras.',
    );
  }
  if (moeda === 'BRL') {
    throw badRequest(
      'BRL não entra na Conta Global — use as carteiras em reais (create_conta / get_saldo).',
    );
  }

  const valor = parseAmount(payload?.valor ?? payload?.amount ?? payload?.saldo ?? 0);
  if (valor == null || valor < 0) {
    throw badRequest('Informe um valor numérico >= 0 (ex.: 500 ou 1.250,50).');
  }

  const nomeRaw = payload?.nome ?? payload?.apelido ?? payload?.label;
  const nome =
    nomeRaw != null && String(nomeRaw).trim() !== ''
      ? String(nomeRaw).trim().slice(0, 80)
      : null;

  const db = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await db
    .from('contas_moeda_global')
    .insert([
      {
        user_id: userId,
        moeda,
        nome,
        valor,
        ativo: true,
        atualizado_em: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (error) throw badRequest(error.message);

  let rate = null;
  let valorBrl = null;
  try {
    const rates = await getRatesToBrl([moeda]);
    rate = rates[moeda] ?? null;
    if (rate != null) valorBrl = valor * rate;
  } catch {
    // criar mesmo sem cotação
  }

  const conta = {
    id: data.id,
    moeda,
    nome,
    valor,
    nomeMoeda: moedaLabel(moeda),
    cotacaoBrl: rate,
    valorBrl,
  };

  const msg =
    valorBrl != null
      ? `Moeda ${moeda} (${moedaLabel(moeda)}) adicionada na Conta Global: ${formatMoeda(valor, moeda)} ≈ ${formatBrl(valorBrl)}.`
      : `Moeda ${moeda} (${moedaLabel(moeda)}) adicionada na Conta Global: ${formatMoeda(valor, moeda)}.`;

  return { conta, message: msg };
};

/**
 * @param {string} userId
 * @param {object} payload
 */
export const updateContaMoedaGlobal = async (userId, payload = {}) => {
  if (!userId) throw badRequest('userId é obrigatório');
  const id = String(payload?.id || payload?.contaId || '').trim();
  const moedaFilter = resolveMoedaCode(payload?.moeda || payload?.currency);

  const contas = await listContasMoedaGlobal(userId, { activeOnly: true });
  let target = null;
  if (id) {
    target = contas.find((c) => String(c.id) === id) || null;
  } else if (moedaFilter) {
    const matches = contas.filter((c) => c.moeda === moedaFilter);
    if (matches.length === 0) throw notFound(`Nenhuma moeda ${moedaFilter} na Conta Global.`);
    if (matches.length > 1) {
      throw badRequest(
        `Há ${matches.length} lançamentos em ${moedaFilter}. Informe payload.id com um destes: ${matches
          .map((m) => m.id)
          .join(', ')}.`,
      );
    }
    target = matches[0];
  } else {
    throw badRequest('Informe id ou moeda da Conta Global a actualizar.');
  }

  if (!target) throw notFound('Conta / moeda não encontrada na Conta Global.');

  const patch = { atualizado_em: new Date().toISOString() };
  if (payload?.valor !== undefined || payload?.amount !== undefined || payload?.saldo !== undefined) {
    const valor = parseAmount(payload?.valor ?? payload?.amount ?? payload?.saldo);
    if (valor == null || valor < 0) throw badRequest('Valor inválido.');
    patch.valor = valor;
  }
  if (payload?.nome !== undefined || payload?.apelido !== undefined) {
    const n = payload?.nome ?? payload?.apelido;
    patch.nome = n != null && String(n).trim() !== '' ? String(n).trim().slice(0, 80) : null;
  }
  if (payload?.moedaNova || payload?.novaMoeda) {
    const nova = resolveMoedaCode(payload.moedaNova || payload.novaMoeda);
    if (!nova) throw badRequest('Nova moeda inválida.');
    if (nova === 'BRL') throw badRequest('BRL não entra na Conta Global.');
    patch.moeda = nova;
  }

  if (Object.keys(patch).length <= 1) {
    throw badRequest('Nada para actualizar (valor, nome ou moedaNova).');
  }

  const db = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await db
    .from('contas_moeda_global')
    .update(patch)
    .eq('id', target.id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw badRequest(error.message);

  return {
    conta: {
      id: data.id,
      moeda: normalizeCode(data.moeda),
      nome: data.nome,
      valor: Number(data.valor) || 0,
    },
    message: `Conta Global actualizada: ${normalizeCode(data.moeda)} = ${formatMoeda(data.valor, normalizeCode(data.moeda))}.`,
  };
};

/**
 * Soft-delete (ativo=false).
 * @param {string} userId
 * @param {object} payload
 */
export const deleteContaMoedaGlobal = async (userId, payload = {}) => {
  if (!userId) throw badRequest('userId é obrigatório');
  const id = String(payload?.id || payload?.contaId || '').trim();
  const moedaFilter = resolveMoedaCode(payload?.moeda || payload?.currency);

  const contas = await listContasMoedaGlobal(userId, { activeOnly: true });
  let target = null;
  if (id) {
    target = contas.find((c) => String(c.id) === id) || null;
  } else if (moedaFilter) {
    const matches = contas.filter((c) => c.moeda === moedaFilter);
    if (matches.length === 0) throw notFound(`Nenhuma moeda ${moedaFilter} na Conta Global.`);
    if (matches.length > 1) {
      throw badRequest(
        `Há ${matches.length} em ${moedaFilter}. Informe payload.id: ${matches.map((m) => m.id).join(', ')}.`,
      );
    }
    target = matches[0];
  } else {
    throw badRequest('Informe id ou moeda a remover da Conta Global.');
  }

  if (!target) throw notFound('Moeda não encontrada na Conta Global.');

  const db = createSupabaseClient({ useServiceRole: true });
  const { error } = await db
    .from('contas_moeda_global')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', target.id)
    .eq('user_id', userId);

  if (error) throw badRequest(error.message);

  return {
    conta: target,
    message: `Removida da Conta Global: ${target.moeda} (${moedaLabel(target.moeda)}).`,
  };
};

/**
 * Cotação: 1 unidade da moeda = X BRL.
 * @param {object} payload
 */
export const getCotacaoResumo = async (payload = {}) => {
  const rawCodes =
    payload?.moedas
    || payload?.codes
    || payload?.moeda
    || payload?.currency
    || payload?.codigo
    || 'USD,EUR';

  const parts = Array.isArray(rawCodes)
    ? rawCodes
    : String(rawCodes).split(/[,\s;/|]+/);

  const codes = [
    ...new Set(
      parts
        .map((p) => resolveMoedaCode(p))
        .filter((c) => c && c !== 'BRL'),
    ),
  ];

  if (codes.length === 0) {
    throw badRequest('Informe a moeda (ex.: USD, dólar, EUR).');
  }

  const rates = await getRatesToBrl(codes);
  const linhas = codes.map((code) => {
    const rate = rates[code];
    return {
      moeda: code,
      nomeMoeda: moedaLabel(code),
      cotacaoBrl: Number.isFinite(rate) ? rate : null,
    };
  });

  const missing = linhas.filter((l) => l.cotacaoBrl == null).map((l) => l.moeda);
  if (missing.length === codes.length) {
    throw badRequest(`Cotação indisponível para: ${missing.join(', ')}.`);
  }

  const message = linhas
    .map((l) =>
      (l.cotacaoBrl != null
        ? `1 ${l.moeda} (${l.nomeMoeda}) = ${formatBrl(l.cotacaoBrl)}`
        : `1 ${l.moeda}: cotação indisponível`),
    )
    .join('\n');

  return { rates, linhas, missing, message, base: 'BRL' };
};

/**
 * Converte valor entre moeda e BRL (ou moeda→moeda via BRL).
 * @param {object} payload
 */
export const convertMoeda = async (payload = {}) => {
  const amount = parseAmount(payload?.valor ?? payload?.amount ?? payload?.quantidade);
  if (amount == null || amount < 0) {
    throw badRequest('Informe o valor a converter (ex.: 100).');
  }

  const from =
    resolveMoedaCode(payload?.de || payload?.from || payload?.moeda || payload?.currency)
    || 'USD';
  const to =
    resolveMoedaCode(payload?.para || payload?.to || payload?.destino)
    || 'BRL';

  if (from === to) {
    return {
      from,
      to,
      amount,
      result: amount,
      message: `${formatMoeda(amount, from)} = ${formatMoeda(amount, to)} (mesma moeda).`,
    };
  }

  const rates = await getRatesToBrl([from, to].filter((c) => c !== 'BRL'));
  const rateFrom = from === 'BRL' ? 1 : rates[from];
  const rateTo = to === 'BRL' ? 1 : rates[to];

  if (from !== 'BRL' && !Number.isFinite(rateFrom)) {
    throw badRequest(`Cotação indisponível para ${from}.`);
  }
  if (to !== 'BRL' && !Number.isFinite(rateTo)) {
    throw badRequest(`Cotação indisponível para ${to}.`);
  }

  const inBrl = amount * rateFrom;
  const result = to === 'BRL' ? inBrl : inBrl / rateTo;

  const message =
    `${formatMoeda(amount, from)} ≈ ${formatMoeda(result, to)}`
    + (to === 'BRL' || from === 'BRL'
      ? ''
      : ` (via BRL: ${formatBrl(inBrl)})`);

  return {
    from,
    to,
    amount,
    result,
    rateFromBrl: rateFrom,
    rateToBrl: rateTo,
    amountBrl: inBrl,
    message,
  };
};

/**
 * Catálogo de códigos disponíveis (Frankfurter + nomes conhecidos).
 */
export const listCatalogoMoedas = async () => {
  const catalog = await listFrankfurterCurrencies();
  const codes = Object.keys(catalog || {}).sort();
  const popular = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CAD', 'CHF', 'AUD', 'CNY', 'MXN'];
  const popularList = popular
    .filter((c) => codes.includes(c) || MOEDA_NOMES[c])
    .map((c) => `${c} — ${moedaLabel(c)}`);

  return {
    count: codes.length,
    popular: popularList,
    codes,
    message:
      `Moedas populares para Conta Global:\n${popularList.map((l, i) => `${i + 1}) ${l}`).join('\n')}\n`
      + `(Catálogo completo: ${codes.length} códigos ISO. Use o código de 3 letras em create_moeda_global.)`,
  };
};
