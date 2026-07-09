import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isNfseEmitIntentPayload,
  mapMisroutedTransactionToNfsePayload,
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
