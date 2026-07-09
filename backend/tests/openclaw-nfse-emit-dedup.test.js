import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOpenclawNfseEmitFingerprint,
  extractCodigoFromNfsePayloadJson,
  extractValorFromNfsePayloadJson,
  findRecentDuplicateOpenclawNfse,
  isRecoverableOpenclawNfseEmitError,
  withOpenclawNfseEmitInflight,
} from '../src/services/openclaw-nfse-emit-dedup.js';

test('buildOpenclawNfseEmitFingerprint — tomador + valor + código', () => {
  const fp = buildOpenclawNfseEmitFingerprint('user-1', {
    tomadorCpfCnpj: '119.532.577-04',
    servico: { valorServico: 4, codigo: '140101' },
  });
  assert.equal(fp, 'user-1|11953257704|4|140101');
});

test('extractValorFromNfsePayloadJson lê servico[0].valor.servico', () => {
  const valor = extractValorFromNfsePayloadJson({
    servico: [{ codigo: '140101', valor: { servico: 4 } }],
  });
  assert.equal(valor, 4);
});

test('findRecentDuplicateOpenclawNfse ignora nota concluída (só processando)', async () => {
  const now = new Date().toISOString();
  const listarNotas = async () => ([
    {
      id: 'nota-1',
      status: 'concluido',
      cnpj_tomador: '11953257704',
      created_at: now,
      payload_json: { servico: [{ codigo: '140101', valor: { servico: 4 } }] },
    },
  ]);

  const input = {
    tomadorCpfCnpj: '11953257704',
    servico: { valorServico: 4, codigo: '140101' },
  };

  const dup = await findRecentDuplicateOpenclawNfse({
    userId: 'user-1',
    input,
    listarNotas,
  });
  assert.equal(dup, null);
});

test('findRecentDuplicateOpenclawNfse encontra nota em processamento igual', async () => {
  const now = new Date().toISOString();
  const listarNotas = async () => ([
    {
      id: 'nota-proc',
      status: 'processando',
      cnpj_tomador: '11953257704',
      created_at: now,
      payload_json: { servico: [{ codigo: '140101', valor: { servico: 4 } }] },
    },
  ]);

  const dup = await findRecentDuplicateOpenclawNfse({
    userId: 'user-1',
    input: {
      tomadorCpfCnpj: '11953257704',
      servico: { valorServico: 4, codigo: '140101' },
    },
    listarNotas,
  });
  assert.equal(dup?.id, 'nota-proc');
});

test('findRecentDuplicateOpenclawNfse ignora nota rejeitada', async () => {
  const listarNotas = async () => ([
    {
      id: 'nota-rej',
      status: 'rejeitado',
      cnpj_tomador: '11953257704',
      created_at: new Date().toISOString(),
      payload_json: { servico: [{ codigo: '140101', valor: { servico: 4 } }] },
    },
  ]);

  const dup = await findRecentDuplicateOpenclawNfse({
    userId: 'user-1',
    input: {
      tomadorCpfCnpj: '11953257704',
      servico: { valorServico: 4, codigo: '140101' },
    },
    listarNotas,
  });
  assert.equal(dup, null);
});

test('withOpenclawNfseEmitInflight serializa chamadas paralelas', async () => {
  let running = 0;
  let maxRunning = 0;

  const work = async () => {
    running += 1;
    maxRunning = Math.max(maxRunning, running);
    await new Promise((r) => { setTimeout(r, 30); });
    running -= 1;
    return 'ok';
  };

  const [a, b] = await Promise.all([
    withOpenclawNfseEmitInflight('same-key', work),
    withOpenclawNfseEmitInflight('same-key', work),
  ]);

  assert.equal(a, 'ok');
  assert.equal(b, 'ok');
  assert.equal(maxRunning, 1);
});

test('extractCodigoFromNfsePayloadJson', () => {
  assert.equal(
    extractCodigoFromNfsePayloadJson({ servico: [{ codigo: '14.01.01' }] }),
    '140101',
  );
});

test('isRecoverableOpenclawNfseEmitError — timeout PlugNotas', () => {
  assert.equal(
    isRecoverableOpenclawNfseEmitError(new Error('Não foi possível alinhar a numeração: aborted')),
    true,
  );
  assert.equal(isRecoverableOpenclawNfseEmitError(new Error('valor inválido')), false);
});
