import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmitenteRowFragment,
  emitenteRowToApiShape
} from '../src/services/mei-certificate-store.js';

test('normalizeEmitenteRowFragment — CEP e UF', () => {
  const row = normalizeEmitenteRowFragment({
    cep: '80.010-000',
    uf: 'pr',
    razaoSocial: '  ACME  '
  });
  assert.equal(row.cep, '80010000');
  assert.equal(row.uf, 'PR');
  assert.equal(row.razao_social, 'ACME');
});

test('normalizeEmitenteRowFragment — update parcial omite vazios', () => {
  const row = normalizeEmitenteRowFragment(
    { razaoSocial: 'X', logradouro: '' },
    { omitEmpty: true }
  );
  assert.equal(row.razao_social, 'X');
  assert.equal(row.logradouro, undefined);
});

test('emitenteRowToApiShape — defaults', () => {
  const api = emitenteRowToApiShape({
    razao_social: 'A',
    regime_tributario: '2',
    optante_simples_nacional: false,
    ibge_municipio: '4106902',
    cidade: 'Curitiba',
    uf: 'PR'
  });
  assert.equal(api.razaoSocial, 'A');
  assert.equal(api.regimeTributario, '2');
  assert.equal(api.simplesNacional, false);
  assert.equal(api.codigoCidade, '4106902');
  assert.equal(api.tipoLogradouro, 'Rua');
});

test('emitenteRowToApiShape — persiste tipo_logradouro', () => {
  const api = emitenteRowToApiShape({
    tipo_logradouro: 'Av.',
    logradouro: 'Brasil',
    razao_social: 'X'
  });
  assert.equal(api.tipoLogradouro, 'Av.');
  assert.equal(api.logradouro, 'Brasil');
});

test('normalizeEmitenteRowFragment — tipoLogradouro', () => {
  const row = normalizeEmitenteRowFragment({ tipoLogradouro: '  Av.  ' });
  assert.equal(row.tipo_logradouro, 'Av.');
});
