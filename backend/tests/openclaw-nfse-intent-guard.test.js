import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmitNfsePayloadFromUserText,
  enrichNfsePayloadFromFreeText,
  isCompleteNfseEmitOrderFromUserText,
  isNfseEmitIntentFromUserText,
  isNfseEmitIntentPayload,
  mapMisroutedTransactionToNfsePayload,
  parseValorFromPortugueseText,
  resolveClienteIndiceFromPayload,
  resolveServicoIndiceFromPayload,
} from '../src/services/openclaw-nfse-intent-guard.js';
import { pickClienteCatalogoByIndexResult } from '../src/services/openclaw-nfse.service.js';

test('resolveClienteIndiceFromPayload — cliente 2', () => {
  assert.equal(resolveClienteIndiceFromPayload({ cliente: 2 }), 2);
  assert.equal(resolveClienteIndiceFromPayload({ clienteIndice: '3' }), 3);
  assert.equal(resolveClienteIndiceFromPayload({ tomadorNome: 'Taure' }), null);
});

test('resolveServicoIndiceFromPayload — serviço 1', () => {
  assert.equal(resolveServicoIndiceFromPayload({ servico: 1 }), 1);
  assert.equal(resolveServicoIndiceFromPayload({ servicoIndice: 2 }), 2);
});

test('isNfseEmitIntentPayload — cliente + serviço numerados (WhatsApp)', () => {
  assert.equal(
    isNfseEmitIntentPayload({ cliente: 2, servico: 1, valor: 2 }),
    true,
  );
  assert.equal(
    isNfseEmitIntentPayload({ valor: 2, tipo: 'entrada', classificacao: 'Alimentação' }),
    false,
  );
  assert.equal(
    isNfseEmitIntentPayload({ tomadorNome: 'Taure', servicoIndice: 1, valor: 2 }),
    true,
  );
});

test('isNfseEmitIntentFromUserText — lista clientes NFSe', () => {
  assert.equal(
    isNfseEmitIntentFromUserText(
      'Liste para mim todos os meus clientes de emissão de nota fiscal de serviço e todos os serviços',
    ),
    true,
  );
});

test('isNfseEmitIntentFromUserText — cliente 3 serviço 1', () => {
  assert.equal(
    isNfseEmitIntentFromUserText('emiti uma nota para o cliente 3, serviço 1, no valor de 5 reais'),
    true,
  );
});

test('enrichNfsePayloadFromFreeText — obs com cliente/serviço', () => {
  const enriched = enrichNfsePayloadFromFreeText({
    tipo: 'entrada',
    valor: 5,
    classificacao: 'manutenção',
    obs: 'cliente 3 serviço 1',
  });
  assert.equal(enriched.clienteIndice, 3);
  assert.equal(enriched.servicoIndice, 1);
  assert.equal(
    isNfseEmitIntentPayload({
      tipo: 'entrada',
      valor: 5,
      obs: 'cliente 3 serviço 1',
    }),
    true,
  );
});

test('mapMisroutedTransactionToNfsePayload normaliza índices', () => {
  const mapped = mapMisroutedTransactionToNfsePayload({ cliente: 2, servico: 1, valor: 2 });
  assert.deepEqual(mapped, {
    cliente: 2,
    servico: 1,
    valor: 2,
    clienteIndice: 2,
    servicoIndice: 1,
  });
});

test('pickClienteCatalogoByIndexResult — lista numerada', () => {
  const rows = [
    { id: 'a', nome: 'CF Contabilidade' },
    { id: 'b', nome: 'Taure' },
    { id: 'c', nome: 'Leonardo' },
  ];
  const r = pickClienteCatalogoByIndexResult(rows, 2);
  assert.equal(r.kind, 'ok');
  assert.equal(r.cliente.nome, 'Taure');
});

test('parseValorFromPortugueseText — cinco reais', () => {
  assert.equal(parseValorFromPortugueseText('no valor de cinco reais'), 5);
  assert.equal(parseValorFromPortugueseText('valor de 5 reais'), 5);
});

test('isCompleteNfseEmitOrderFromUserText — emite cliente 3 serviço 1', () => {
  const text = 'Emite para o cliente 3 o serviço 1, no valor de cinco reais.';
  assert.equal(isCompleteNfseEmitOrderFromUserText(text), true);
  assert.deepEqual(buildEmitNfsePayloadFromUserText(text), {
    clienteIndice: 3,
    servicoIndice: 1,
    valor: 5,
  });
});
