import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  logDocumentosAtivosMirrorPersistWarn,
  saveDocumentosAtivosMirror
} from '../src/services/mei-certificate-store.js';

const selection = { nfse: true, nfe: false, nfce: false };

function mockSupabaseChain({ selectError, existingId, updateError }) {
  return () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: existingId ? { id: existingId } : null,
            error: selectError ?? null
          })
        })
      }),
      update: () => ({
        eq: async () => ({ error: updateError ?? null })
      })
    })
  });
}

test('saveDocumentosAtivosMirror: erro no select Supabase dispara logWarn (FR-UPD-DOC-09)', async () => {
  const warns = [];
  await saveDocumentosAtivosMirror('user-uuid-1', selection, {
    getSupabase: mockSupabaseChain({
      selectError: { message: 'connection refused', code: 'PGRST000' }
    }),
    logWarn: (ctx) => warns.push(ctx)
  });
  assert.equal(warns.length, 1);
  assert.equal(warns[0].userId, 'user-uuid-1');
  assert.equal(warns[0].reason, 'mirror_select_user_mei_certificates_failed');
  assert.match(String(warns[0].detail), /connection refused/i);
});

test('saveDocumentosAtivosMirror: erro no update dispara logWarn', async () => {
  const warns = [];
  await saveDocumentosAtivosMirror('user-uuid-2', selection, {
    getSupabase: mockSupabaseChain({
      existingId: 'row-id',
      updateError: { message: 'RLS policy', code: '42501' }
    }),
    logWarn: (ctx) => warns.push(ctx)
  });
  assert.equal(warns.length, 1);
  assert.equal(warns[0].reason, 'mirror_update_documentos_ativos_failed');
  assert.match(String(warns[0].detail), /RLS/i);
});

test('saveDocumentosAtivosMirror: sucesso não dispara logWarn', async () => {
  const warns = [];
  await saveDocumentosAtivosMirror('user-uuid-3', selection, {
    getSupabase: mockSupabaseChain({ existingId: 'row-id' }),
    logWarn: (ctx) => warns.push(ctx)
  });
  assert.equal(warns.length, 0);
});

test('saveDocumentosAtivosMirror: sem linha UMC dispara logWarn (QA / critério skip observável)', async () => {
  const warns = [];
  await saveDocumentosAtivosMirror('user-uuid-no-umc', selection, {
    getSupabase: mockSupabaseChain({ existingId: null }),
    logWarn: (ctx) => warns.push(ctx)
  });
  assert.equal(warns.length, 1);
  assert.equal(warns[0].reason, 'mirror_no_user_mei_certificate_row');
  assert.equal(warns[0].userId, 'user-uuid-no-umc');
});

test('saveDocumentosAtivosMirror: excepção inesperada dispara logWarn', async () => {
  const warns = [];
  await saveDocumentosAtivosMirror('user-uuid-4', selection, {
    getSupabase: () => {
      throw new Error('getSupabase boom');
    },
    logWarn: (ctx) => warns.push(ctx)
  });
  assert.equal(warns.length, 1);
  assert.equal(warns[0].reason, 'mirror_persist_unexpected_error');
});

test('logDocumentosAtivosMirrorPersistWarn não inclui payload Plugnotas (smoke)', () => {
  let out = '';
  const orig = console.warn;
  console.warn = (a, b) => {
    out = `${a} ${JSON.stringify(b)}`;
  };
  try {
    logDocumentosAtivosMirrorPersistWarn({
      userId: 'u1',
      reason: 'mirror_update_documentos_ativos_failed',
      detail: 'x'
    });
  } finally {
    console.warn = orig;
  }
  assert.match(out, /documentos_ativos mirror/);
  assert.match(out, /"userId":"u1"/);
  assert.match(out, /mirror_update_documentos_ativos_failed/);
  assert.equal(out.includes('nfse'), false);
});
