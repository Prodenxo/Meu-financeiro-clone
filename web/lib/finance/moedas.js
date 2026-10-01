/**
 * Moedas da Conta global — porta de `frontend/lib/moedaCountryIso.ts`, `moedaNomesPt.ts`,
 * `moedaFlagSources.ts`, `moedaFormat.ts` e `contaMoedaGlobalTypes.ts` do app Expo.
 * Só funções puras (sem fetch).
 */

export const POPULAR_MOEDAS = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CAD', 'CHF', 'AUD', 'CNY', 'MXN'];

/** Códigos mínimos quando o catálogo remoto falhar. */
export const FALLBACK_CURRENCY_CODES = [...POPULAR_MOEDAS, 'CLP', 'COP', 'PEN'];

/** ISO 4217 → ISO 3166-1 alpha-2 (bandeira). Moedas sem país único usam a convenção (EUR → eu). */
const MOEDA_TO_COUNTRY = {
  AED: 'ae', AFN: 'af', ALL: 'al', AMD: 'am', ANG: 'cw', AOA: 'ao', ARS: 'ar', AUD: 'au', AWG: 'aw', AZN: 'az',
  BAM: 'ba', BBD: 'bb', BDT: 'bd', BGN: 'bg', BHD: 'bh', BIF: 'bi', BMD: 'bm', BND: 'bn', BOB: 'bo', BRL: 'br',
  BSD: 'bs', BTN: 'bt', BWP: 'bw', BYN: 'by', BZD: 'bz', CAD: 'ca', CDF: 'cd', CHF: 'ch', CLP: 'cl', CNY: 'cn',
  COP: 'co', CRC: 'cr', CUP: 'cu', CVE: 'cv', CZK: 'cz', DJF: 'dj', DKK: 'dk', DOP: 'do', DZD: 'dz', EGP: 'eg',
  ERN: 'er', ETB: 'et', EUR: 'eu', FJD: 'fj', FKP: 'fk', GBP: 'gb', GEL: 'ge', GHS: 'gh', GIP: 'gi', GMD: 'gm',
  GNF: 'gn', GTQ: 'gt', GYD: 'gy', HKD: 'hk', HNL: 'hn', HRK: 'hr', HTG: 'ht', HUF: 'hu', IDR: 'id', ILS: 'il',
  INR: 'in', IQD: 'iq', IRR: 'ir', ISK: 'is', JMD: 'jm', JOD: 'jo', JPY: 'jp', KES: 'ke', KGS: 'kg', KHR: 'kh',
  KMF: 'km', KRW: 'kr', KWD: 'kw', KYD: 'ky', KZT: 'kz', LAK: 'la', LBP: 'lb', LKR: 'lk', LRD: 'lr', LSL: 'ls',
  LYD: 'ly', MAD: 'ma', MDL: 'md', MGA: 'mg', MKD: 'mk', MMK: 'mm', MNT: 'mn', MOP: 'mo', MRU: 'mr', MUR: 'mu',
  MVR: 'mv', MWK: 'mw', MXN: 'mx', MYR: 'my', MZN: 'mz', NAD: 'na', NGN: 'ng', NIO: 'ni', NOK: 'no', NPR: 'np',
  NZD: 'nz', OMR: 'om', PAB: 'pa', PEN: 'pe', PGK: 'pg', PHP: 'ph', PKR: 'pk', PLN: 'pl', PYG: 'py', QAR: 'qa',
  RON: 'ro', RSD: 'rs', RUB: 'ru', RWF: 'rw', SAR: 'sa', SBD: 'sb', SCR: 'sc', SDG: 'sd', SEK: 'se', SGD: 'sg',
  SHP: 'sh', SLE: 'sl', SOS: 'so', SRD: 'sr', SSP: 'ss', STN: 'st', SYP: 'sy', SZL: 'sz', THB: 'th', TJS: 'tj',
  TMT: 'tm', TND: 'tn', TOP: 'to', TRY: 'tr', TTD: 'tt', TWD: 'tw', TZS: 'tz', UAH: 'ua', UGX: 'ug', USD: 'us',
  UYU: 'uy', UZS: 'uz', VES: 've', VND: 'vn', VUV: 'vu', WST: 'ws', XAF: 'cm', XCD: 'ag', XOF: 'sn', XPF: 'pf',
  YER: 'ye', ZAR: 'za', ZMW: 'zm', ZWL: 'zw',
};

/** Nomes pt-BR quando `Intl.DisplayNames` não souber (mesma lista do Expo). */
export const MOEDA_NOMES_PT = {
  USD: 'Dólar americano', EUR: 'Euro', GBP: 'Libra esterlina', JPY: 'Iene japonês', BRL: 'Real brasileiro',
  ARS: 'Peso argentino', CAD: 'Dólar canadense', CHF: 'Franco suíço', AUD: 'Dólar australiano', CNY: 'Yuan chinês',
  MXN: 'Peso mexicano', CLP: 'Peso chileno', COP: 'Peso colombiano', PEN: 'Sol peruano', UYU: 'Peso uruguaio',
  PYG: 'Guarani paraguaio', BOB: 'Boliviano', HKD: 'Dólar de Hong Kong', SGD: 'Dólar de Singapura', KRW: 'Won sul-coreano',
  INR: 'Rupia indiana', TRY: 'Lira turca', ZAR: 'Rand sul-africano', NOK: 'Coroa norueguesa', SEK: 'Coroa sueca',
  DKK: 'Coroa dinamarquesa', PLN: 'Zloty polonês', CZK: 'Coroa tcheca', HUF: 'Forint húngaro', ILS: 'Novo shekel israelense',
  THB: 'Baht tailandês', PHP: 'Peso filipino', IDR: 'Rupia indonésia', MYR: 'Ringgit malaio', NZD: 'Dólar neozelandês',
  RON: 'Leu romeno', BGN: 'Lev búlgaro', ISK: 'Coroa islandesa', RUB: 'Rublo russo', UAH: 'Hryvnia ucraniana',
  AED: 'Dirham dos Emirados', SAR: 'Riyal saudita', QAR: 'Riyal do Catar', KWD: 'Dinar kuwaitiano', EGP: 'Libra egípcia',
  MAD: 'Dirham marroquino', TWD: 'Dólar taiwanês', VND: 'Dong vietnamita', PKR: 'Rupia paquistanesa', BDT: 'Taka bengali',
  NGN: 'Naira nigeriana', KES: 'Xelim queniano', GHS: 'Cedi ganês', CRC: 'Colón costa-riquenho', DOP: 'Peso dominicano',
  GTQ: 'Quetzal guatemalteco', HNL: 'Lempira hondurenha', NIO: 'Córdoba nicaraguense', PAB: 'Balboa panamenho', VES: 'Bolívar venezuelano',
};

/** Termos extras para busca em português. */
const MOEDA_BUSCA_PT = {
  USD: ['dolar', 'dólar', 'americano', 'eua', 'usa'],
  EUR: ['euro', 'europa'],
  GBP: ['libra', 'sterling', 'esterlina', 'reino unido'],
  JPY: ['iene', 'japao', 'japão'],
  BRL: ['real', 'brasil'],
  ARS: ['peso', 'argentina'],
  CAD: ['canadense', 'canada', 'canadá'],
  AUD: ['australiano', 'australia', 'austrália'],
  CHF: ['franco', 'suica', 'suíça'],
  CNY: ['yuan', 'china'],
  MXN: ['mexicano', 'mexico', 'méxico'],
};

export function normalizeMoedaCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

export function isMoedaCode(raw) {
  return /^[A-Z]{3}$/.test(normalizeMoedaCode(raw));
}

export function getMoedaCountryIso(moeda) {
  const code = normalizeMoedaCode(moeda);
  return code ? MOEDA_TO_COUNTRY[code] || null : null;
}

let displayNames = null;
function getDisplayNames() {
  if (displayNames !== null) return displayNames || null;
  try {
    displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['pt-BR'], { type: 'currency' }) : false;
  } catch {
    displayNames = false;
  }
  return displayNames || null;
}

/** Nome da moeda em pt-BR (Intl → lista fixa → código). */
export function getMoedaNomePt(moeda) {
  const code = normalizeMoedaCode(moeda);
  if (!code) return '';
  if (MOEDA_NOMES_PT[code]) return MOEDA_NOMES_PT[code];
  let intl = null;
  try {
    intl = getDisplayNames()?.of(code) || null;
  } catch {
    intl = null;
  }
  if (intl && intl.toUpperCase() !== code) return intl.charAt(0).toUpperCase() + intl.slice(1);
  return code;
}

/** `{ USD: 'Dólar americano', ... }` a partir de uma lista de códigos (+ códigos mínimos). */
export function buildCurrencyCatalog(codes = []) {
  const set = new Set([...FALLBACK_CURRENCY_CODES, ...Object.keys(MOEDA_NOMES_PT)]);
  for (const c of codes) {
    const code = normalizeMoedaCode(c);
    if (isMoedaCode(code)) set.add(code);
  }
  const out = {};
  for (const code of [...set].sort()) out[code] = getMoedaNomePt(code);
  return out;
}

export function matchesMoedaSearch(code, name, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const c = String(code || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (c.includes(q) || n.includes(q)) return true;
  const aliases = MOEDA_BUSCA_PT[String(code || '').toUpperCase()];
  return aliases ? aliases.some((a) => a.includes(q) || q.includes(a)) : false;
}

/** Opções do seletor: populares primeiro (sem busca) ou filtradas e ordenadas por código. */
export function filterCurrencyOptions(catalog, search, { exclude = [] } = {}) {
  const excluded = new Set(exclude.map(normalizeMoedaCode));
  const entries = Object.entries(catalog || {}).filter(([code]) => !excluded.has(code));
  const q = String(search || '').trim();
  if (!q) {
    const popular = POPULAR_MOEDAS.filter((c) => catalog?.[c] && !excluded.has(c));
    const rest = entries.map(([c]) => c).filter((c) => !POPULAR_MOEDAS.includes(c)).sort();
    return [...popular, ...rest].map((code) => ({ code, name: catalog[code] || getMoedaNomePt(code) }));
  }
  return entries
    .filter(([code, name]) => matchesMoedaSearch(code, name, q))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => ({ code, name }));
}

/* ===== Bandeiras (mesmas fontes do Expo web) ===== */

const CIRCLE_FLAG_SLUG = { eu: 'european_union' };

export function getMoedaFlagUrls(moeda) {
  const iso = getMoedaCountryIso(moeda);
  if (!iso) return [];
  const slug = CIRCLE_FLAG_SLUG[iso] || iso;
  return [`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@gh-pages/flags/${slug}.svg`, `https://flagcdn.com/w80/${iso}.png`];
}

/* ===== Formatação ===== */

function currencyParts(value, code) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).formatToParts(value);
}

/** "1.500,00" — valor na moeda, sem símbolo (casas decimais da própria moeda). */
export function formatMoedaValorAmount(value, moeda) {
  const code = normalizeMoedaCode(moeda) || 'USD';
  const n = Number(value) || 0;
  try {
    return currencyParts(n, code)
      .filter((p) => p.type !== 'currency')
      .map((p) => p.value)
      .join('')
      .trim();
  } catch {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/** "1.500,00 EUR" — como nos cards da referência. */
export function formatMoedaComCodigo(value, moeda) {
  return `${formatMoedaValorAmount(value, moeda)} ${normalizeMoedaCode(moeda)}`;
}

/** Cotação 1 unidade = X BRL. Abaixo de R$ 1 mostra até 4 casas para não virar «R$ 0,00». */
export function formatCotacaoBrl(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}

/** Linha de `contas_moeda_global` → objeto do app (igual a `normalizeContaMoedaGlobalRow`). */
export function normalizeContaMoedaGlobalRow(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id || ''),
    moeda: normalizeMoedaCode(row.moeda),
    nome: row.nome != null && String(row.nome).trim() !== '' ? String(row.nome) : null,
    valor: Number(row.valor) || 0,
    ativo: row.ativo !== false,
    criado_em: String(row.criado_em || ''),
    atualizado_em: String(row.atualizado_em || ''),
  };
}
