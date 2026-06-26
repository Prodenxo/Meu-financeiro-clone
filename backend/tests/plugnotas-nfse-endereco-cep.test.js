import assert from 'node:assert/strict';
import test from 'node:test';
import {
  enderecoFromCepLookupNfse,
  hasCompleteTomadorEndereco,
  resolveTomadorEmitEndereco,
} from '../src/services/plugnotas/plugnotas-nfse-email-resolve.js';

const CEP_21220290 = {
  cep: '21220290',
  state: 'RJ',
  city: 'Rio de Janeiro',
  neighborhood: 'Vila da Penha',
  street: 'Rua Merces',
  city_ibge_code: '3304557',
};

test('enderecoFromCepLookupNfse preenche endereço a partir do CEP', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (String(url).includes('/cep/v2/21220290')) {
      return {
        ok: true,
        async json() {
          return CEP_21220290;
        },
      };
    }
    throw new Error(`fetch inesperado: ${url}`);
  };

  const endereco = await enderecoFromCepLookupNfse('21220-290');
  assert.equal(endereco?.cep, '21220290');
  assert.equal(endereco?.logradouro, 'Rua Merces');
  assert.equal(endereco?.bairro, 'Vila da Penha');
  assert.equal(endereco?.descricaoCidade, 'Rio de Janeiro');
  assert.equal(endereco?.estado, 'RJ');
  assert.equal(endereco?.codigoCidade, '3304557');
});

test('resolveTomadorEmitEndereco completa PJ só com tomadorCep no payload', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (String(url).includes('/cep/v2/21220290')) {
      return {
        ok: true,
        async json() {
          return CEP_21220290;
        },
      };
    }
    return { ok: false, status: 404, async json() { return {}; } };
  };

  const endereco = await resolveTomadorEmitEndereco(
    'user-test',
    '12345678000199',
    { tomadorCep: '21220290' },
  );

  assert.ok(hasCompleteTomadorEndereco(endereco));
  assert.equal(endereco.numero, 'S/N');
});
