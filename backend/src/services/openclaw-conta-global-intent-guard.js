import { resolveMoedaCode } from './contas-moeda-global.service.js';

const FX_WORD_RE =
  /\b(dolar(es)?|dólar(es)?|usd|euro?s?|eur|libra?s?|gbp|iene?s?|jpy|yuan|cny|franco\s*su[ií]ço|franco\s*suico|chf|peso\s*argentino|ars)\b/i;

const CONTA_GLOBAL_RE =
  /\b(conta\s*global|moeda\s*global|moedas?\s*(globais|estrangeiras?)|c[aâ]mbio|cambio)\b/i;

const CREATE_HINT_RE =
  /\b(cria|criar|adiciona|adicionar|cadastra|cadastrar|coloca|colocar|registra|registrar|mete|inclui|ganhei|recebi|tenho|guarda|guardar)\b/i;

const LIST_HINT_RE =
  /\b(lista|listar|quais|quanto\s+tenho|saldo|mostra|mostrar|meus?\s+saldos?)\b/i;

const QUOTE_HINT_RE =
  /\b(cota[cç][aã]o|cotacao|quanto\s+est[aá]|cotado|taxa|valor\s+do\s+d[oó]lar|valor\s+do\s+euro)\b/i;

const CONVERT_HINT_RE =
  /\b(conver[tc]|quanto\s+d[aá]|em\s+reais?|para\s+reais?|pra\s+reais?)\b/i;

/** Normaliza para matching (remove acentos). */
const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const collectUserText = (payload = {}) =>
  [
    payload.userText,
    payload.texto,
    payload.contexto,
    payload.pedido,
    payload.obs,
    payload.observacao,
    payload.classificacao,
    payload.descricao,
  ]
    .filter(Boolean)
    .join(' ');

/**
 * Pedido claramente da Conta Global / moeda estrangeira (não carteira BRL).
 * @param {string} text
 */
export const isContaGlobalIntentFromUserText = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return false;
  const s = fold(raw);

  // Carteira BRL explícita (banco BR + reais/centavos/R$) → nunca Conta Global
  const hasBrlMoney = /\b(reais?|centavos?|brl)\b/i.test(s) || /\br\s*\$/i.test(raw);
  const hasBrBank =
    /\b(c6(\s*bank)?|nubank|inter|itau|bradesco|santander|banco\s*do\s*brasil|\bbb\b|caixa|picpay|neon|will bank|pagbank|mercado\s*pago)\b/i.test(
      s,
    );
  if (hasBrlMoney && hasBrBank) return false;

  if (CONTA_GLOBAL_RE.test(raw) || /\b(conta global|moeda global|moedas globais|cambio)\b/i.test(s)) {
    return true;
  }
  const hasFx =
    /\b(dolar(es)?|usd|euro?s?|eur|libra?s?|gbp|iene?s?|jpy|yuan|cny|chf|ars)\b/i.test(s)
    || FX_WORD_RE.test(raw);
  const hasActionHint =
    CREATE_HINT_RE.test(raw)
    || LIST_HINT_RE.test(raw)
    || QUOTE_HINT_RE.test(raw)
    || CONVERT_HINT_RE.test(raw)
    || /\b(cria|criar|adiciona|ganhei|recebi|lista|cotacao|conver|quanto|esta)\b/i.test(s)
    || /\bmoeda\b/i.test(s);
  if (hasFx && hasActionHint) return true;
  // "100 dolares" / "US$ 50" mesmo sem verbo explícito
  if (/\b\d+([.,]\d+)?\s*(dolar(es)?|usd|euro?s?|eur|libra?s?)\b/i.test(s)) return true;
  // "$50" / "US$ 50" — mas NÃO "R$ 50" (o $ de reais não é dólar)
  // Obs: /\br\$\b/ falha em "r$ 0,29" porque $ não forma word-boundary.
  const withoutBrlCurrency = String(raw).replace(/\br\s*\$/gi, ' ');
  if (/\$\s*\d+/.test(withoutBrlCurrency)) return true;
  return false;
};

/**
 * @param {Record<string, unknown>} [payload]
 */
export const isContaGlobalIntentPayload = (payload = {}) => {
  if (payload?.contaGlobal === true || payload?.moedaGlobal === true) return true;
  if (resolveMoedaCode(payload?.moeda || payload?.currency) && payload?.moeda && String(payload.moeda).toUpperCase() !== 'BRL') {
    // payload com moeda estrangeira típico de Conta Global
    if (payload?.contaGlobal !== false) {
      const blob = collectUserText(payload);
      if (isContaGlobalIntentFromUserText(blob) || FX_WORD_RE.test(blob) || CONTA_GLOBAL_RE.test(blob)) {
        return true;
      }
    }
  }
  return isContaGlobalIntentFromUserText(collectUserText(payload));
};

/**
 * Extrai moeda + valor aproximados do texto/payload para create_moeda_global.
 * @param {Record<string, unknown>} [payload]
 */
export const extractContaGlobalCreateHints = (payload = {}) => {
  const blob = collectUserText(payload);
  const moeda =
    resolveMoedaCode(payload?.moeda || payload?.currency)
    || resolveMoedaCode(blob)
    || null;

  let valor = null;
  const fromPayload = payload?.valor ?? payload?.amount;
  if (fromPayload != null && fromPayload !== '') {
    const n = Number(String(fromPayload).replace(',', '.'));
    if (Number.isFinite(n)) valor = n;
  }
  if (valor == null) {
    const m = blob.match(/\b(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(d[oó]lares?|usd|euros?|eur|libras?|gbp)?\b/i)
      || blob.match(/(?:US\$|\$|€|£)\s*(\d+(?:[.,]\d+)?)/i);
    if (m) {
      const raw = String(m[1]).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(raw.includes('.') ? raw : String(m[1]).replace(',', '.'));
      if (Number.isFinite(n)) valor = n;
    }
  }

  return { moeda, valor };
};

export const CONTA_GLOBAL_NO_CARTEIRA_FOOTER =
  'Isto é Conta Global (moeda estrangeira), NÃO carteira em reais. '
  + 'NÃO pergunte Nubank/Poupança/Banco do Brasil. '
  + 'Use create_moeda_global / get_conta_global / get_cotacao / convert_moeda.';
