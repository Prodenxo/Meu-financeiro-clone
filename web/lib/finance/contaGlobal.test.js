import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildContaGlobalModel } from './contaGlobal.js';
import { buildCurrencyCatalog, filterCurrencyOptions, formatCotacaoBrl, formatMoedaComCodigo, formatMoedaValorAmount, getMoedaFlagUrls, getMoedaNomePt, matchesMoedaSearch } from './moedas.js';

const contas = [
  { id: '1', moeda: 'usd', nome: null, valor: 100 },
  { id: '2', moeda: 'EUR', nome: 'Wise', valor: 1500 },
  { id: '3', moeda: 'KWD', nome: null, valor: 3500 },
  { id: '4', moeda: 'XYZ', nome: null, valor: 10 },
];
const rates = { USD: 5.2026, EUR: 5.9077, KWD: 16.863123 };

describe('conta global — cálculos', () => {
  it('converte com a cotação (1 unidade = X BRL) sem arredondar e soma só o que tem cotação', () => {
    const m = buildContaGlobalModel({ contas, rates });
    assert.equal(m.count, 4);
    assert.equal(m.rows[0].moeda, 'USD');
    assert.equal(m.rows[0].valorBrl, 100 * 5.2026);
    assert.equal(m.rows[3].valorBrl, null);
    assert.equal(m.rows[3].rate, null);
    assert.equal(m.total, 100 * 5.2026 + 1500 * 5.9077 + 3500 * 16.863123);
    assert.equal(m.convertidasCount, 3);
    assert.deepEqual(m.missingRates, ['XYZ']);
    assert.equal(m.allRatesMissing, false);
  });

  it('maior saldo convertido ignora moedas sem cotação; cotação zero/negativa é inválida', () => {
    const m = buildContaGlobalModel({ contas, rates: { ...rates, XYZ: 0, EUR: -1 } });
    assert.equal(m.maior.moeda, 'KWD');
    assert.deepEqual(m.missingRates, ['EUR', 'XYZ']);
    const vazio = buildContaGlobalModel({ contas: [], rates });
    assert.equal(vazio.maior, null);
    assert.equal(vazio.total, 0);
    assert.equal(vazio.allRatesMissing, false);
    const semCotacao = buildContaGlobalModel({ contas: contas.slice(0, 1), rates: {} });
    assert.equal(semCotacao.allRatesMissing, true);
  });

  it('saldo zero ou negativo continua convertendo', () => {
    const m = buildContaGlobalModel({ contas: [{ id: 'a', moeda: 'USD', valor: 0 }, { id: 'b', moeda: 'EUR', valor: -10 }], rates });
    assert.equal(m.rows[0].valorBrl, 0);
    assert.equal(m.rows[1].valorBrl, -10 * 5.9077);
    assert.equal(m.maior.moeda, 'USD');
  });

  it('busca por código, nome em português, apelido e alias', () => {
    assert.deepEqual(buildContaGlobalModel({ contas, rates, search: 'eur' }).filtered.map((r) => r.moeda), ['EUR']);
    assert.deepEqual(buildContaGlobalModel({ contas, rates, search: 'wise' }).filtered.map((r) => r.moeda), ['EUR']);
    assert.deepEqual(buildContaGlobalModel({ contas, rates, search: 'dólar' }).filtered.map((r) => r.moeda), ['USD']);
    assert.deepEqual(buildContaGlobalModel({ contas, rates, search: 'kuwait' }).filtered.map((r) => r.moeda), ['KWD']);
    assert.deepEqual(buildContaGlobalModel({ contas, rates, search: 'zzz' }).filtered, []);
  });

  it('lista de cotações de referência usa as mesmas taxas dos cards', () => {
    const m = buildContaGlobalModel({ contas, rates });
    assert.deepEqual(
      m.cotacoes.map((c) => [c.moeda, c.rate]),
      [
        ['EUR', 5.9077],
        ['KWD', 16.863123],
        ['USD', 5.2026],
        ['XYZ', null],
      ],
    );
  });
});

describe('moedas — nomes, formato, catálogo', () => {
  it('nomes pt-BR e bandeiras', () => {
    assert.equal(getMoedaNomePt('usd'), 'Dólar americano');
    assert.equal(getMoedaNomePt('KWD'), 'Dinar kuwaitiano');
    assert.equal(getMoedaFlagUrls('EUR')[0].endsWith('/european_union.svg'), true);
    assert.deepEqual(getMoedaFlagUrls('XYZ'), []);
  });

  it('formata valor na moeda sem símbolo e com código; JPY sem centavos', () => {
    assert.equal(formatMoedaValorAmount(1500, 'EUR'), '1.500,00');
    assert.equal(formatMoedaComCodigo(1500, 'eur'), '1.500,00 EUR');
    assert.equal(formatMoedaValorAmount(1234, 'JPY'), '1.234');
    assert.equal(formatMoedaValorAmount(-5.5, 'USD').replace(/\u00a0/g, ' ').startsWith('-'), true);
  });

  it('cotação: 2 casas acima de R$ 1, até 4 abaixo; inválida vira traço', () => {
    assert.equal(formatCotacaoBrl(5.2026).replace(/\u00a0/g, ' '), 'R$ 5,20');
    assert.equal(formatCotacaoBrl(0.0362).replace(/\u00a0/g, ' '), 'R$ 0,0362');
    assert.equal(formatCotacaoBrl(0), '—');
    assert.equal(formatCotacaoBrl(null), '—');
  });

  it('catálogo junta códigos remotos + mínimos; filtro mostra populares primeiro e exclui pedidos', () => {
    const catalog = buildCurrencyCatalog(['hkd', 'xx', 'KWD']);
    assert.equal(catalog.HKD, 'Dólar de Hong Kong');
    assert.equal('XX' in catalog, false);
    const opts = filterCurrencyOptions(catalog, '', { exclude: ['USD'] });
    assert.equal(opts[0].code, 'EUR');
    assert.equal(opts.some((o) => o.code === 'USD'), false);
    assert.deepEqual(filterCurrencyOptions(catalog, 'hong').map((o) => o.code), ['HKD']);
    assert.equal(matchesMoedaSearch('GBP', 'Libra esterlina', 'libra'), true);
  });
});
