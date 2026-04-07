import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persistDocumentosAtivosMirrorAfterEmpresa } from '../src/services/mei-notas-documentos-mirror.js';

test('persistDocumentosAtivosMirrorAfterEmpresa chama save com userId e seleção normalizada', async () => {
  const calls = [];
  await persistDocumentosAtivosMirrorAfterEmpresa(
    'user-1',
    { documentosAtivos: { nfse: true, nfe: false, nfce: false } },
    {
      saveDocumentosAtivosMirror: async (uid, sel) => {
        calls.push({ uid, sel });
      }
    }
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].uid, 'user-1');
  assert.deepStrictEqual(calls[0].sel, { nfse: true, nfe: false, nfce: false });
});

test('persistDocumentosAtivosMirrorAfterEmpresa sem documentosAtivos não chama save', async () => {
  let called = false;
  await persistDocumentosAtivosMirrorAfterEmpresa(
    'user-1',
    { razaoSocial: 'X' },
    {
      saveDocumentosAtivosMirror: async () => {
        called = true;
      }
    }
  );
  assert.equal(called, false);
});

test('persistDocumentosAtivosMirrorAfterEmpresa engole erro de validação (todos false)', async () => {
  let called = false;
  await persistDocumentosAtivosMirrorAfterEmpresa(
    'user-1',
    { documentosAtivos: { nfse: false, nfe: false, nfce: false } },
    {
      saveDocumentosAtivosMirror: async () => {
        called = true;
      }
    }
  );
  assert.equal(called, false);
});
