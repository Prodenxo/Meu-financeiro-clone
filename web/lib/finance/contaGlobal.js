/**
 * Regras da tela Conta global — porta de `ContaGlobalScreen` / `ContaGlobalMetrics` do Expo.
 * Cotação = quantos reais vale 1 unidade da moeda (`rates[code]`, mesma convenção do Expo e
 * do backend `getRatesToBrl`). Saldo em reais = valor × cotação, sem arredondar; arredonda só na tela.
 */
import { getMoedaNomePt, matchesMoedaSearch, normalizeMoedaCode } from './moedas.js';

function validRate(code, rates) {
  if (code === 'BRL') return 1;
  const r = Number(rates?.[code]);
  return Number.isFinite(r) && r > 0 ? r : null;
}

/**
 * @param {{ contas: Array, rates: Record<string, number>, search?: string }} p
 */
export function buildContaGlobalModel({ contas = [], rates = {}, search = '' }) {
  const rows = contas.map((c) => {
    const moeda = normalizeMoedaCode(c.moeda);
    const rate = validRate(moeda, rates);
    const valor = Number(c.valor) || 0;
    const nomeMoeda = getMoedaNomePt(moeda);
    return {
      id: String(c.id),
      moeda,
      nome: c.nome || null,
      nomeMoeda,
      label: c.nome || nomeMoeda,
      valor,
      rate,
      valorBrl: rate != null ? valor * rate : null,
      conta: c,
    };
  });

  const convertidas = rows.filter((r) => r.valorBrl != null);
  const total = convertidas.reduce((sum, r) => sum + r.valorBrl, 0);
  const missingRates = [...new Set(rows.filter((r) => r.rate == null).map((r) => r.moeda))].sort();

  let maior = null;
  for (const r of convertidas) {
    if (maior == null || r.valorBrl > maior.valorBrl) maior = r;
  }

  const q = String(search || '').trim();
  const filtered = q ? rows.filter((r) => matchesMoedaSearch(r.moeda, `${r.nomeMoeda} ${r.nome || ''}`, q)) : rows;

  const cotacoes = [...new Set(rows.map((r) => r.moeda))].sort().map((moeda) => ({
    moeda,
    nomeMoeda: getMoedaNomePt(moeda),
    rate: validRate(moeda, rates),
  }));

  return {
    rows,
    filtered,
    count: rows.length,
    total,
    convertidasCount: convertidas.length,
    maior,
    missingRates,
    cotacoes,
    allRatesMissing: rows.length > 0 && convertidas.length === 0,
  };
}
