import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertNfsePrestadorEmailOrThrow,
  enrichNfseEmitPayloadEmails,
  hasCompleteTomadorEndereco,
  isValidPlugnotasEmitEmail,
  pickFirstValidEmitEmail,
} from '../src/services/plugnotas/plugnotas-nfse-email-resolve.js';

test('pickFirstValidEmitEmail ignora valores inválidos', () => {
  assert.equal(pickFirstValidEmitEmail('', null, 'foo', 'a@b.com'), 'a@b.com');
  assert.equal(pickFirstValidEmitEmail('invalid'), null);
});

test('isValidPlugnotasEmitEmail valida formato básico', () => {
  assert.equal(isValidPlugnotasEmitEmail('contato@empresa.com.br'), true);
  assert.equal(isValidPlugnotasEmitEmail('sem-arroba'), false);
});

test('enrichNfseEmitPayloadEmails preserva e-mail já informado no payload', async () => {
  const payload = await enrichNfseEmitPayloadEmails(
    'user-1',
    {
      prestador: { cpfCnpj: '65599761000157', email: 'prestador@mei.com' },
      tomador: { cpfCnpj: '12345678901', email: 'tomador@cliente.com' },
    },
    {
      prestadorDoc: '65599761000157',
      tomadorDoc: '12345678901',
    },
  );

  assert.equal(payload.prestador.email, 'prestador@mei.com');
  assert.equal(payload.tomador.email, 'tomador@cliente.com');
});

test('hasCompleteTomadorEndereco valida endereço mínimo', () => {
  assert.equal(hasCompleteTomadorEndereco(null), false);
  assert.equal(
    hasCompleteTomadorEndereco({
      cep: '01310100',
      logradouro: 'Av Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      codigoCidade: '3550308',
      descricaoCidade: 'São Paulo',
      estado: 'SP',
    }),
    true,
  );
});

test('assertNfsePrestadorEmailOrThrow exige e-mail do prestador', () => {
  assert.throws(
    () => assertNfsePrestadorEmailOrThrow({ prestador: { cpfCnpj: '65599761000157' } }),
    /E-mail do prestador é obrigatório/,
  );
  assert.doesNotThrow(() => assertNfsePrestadorEmailOrThrow({
    prestador: { cpfCnpj: '65599761000157', email: 'a@b.com' },
  }));
});
