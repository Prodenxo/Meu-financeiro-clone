import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://plugnotas.example.com';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';

test('nfse service valida parametros obrigatorios de download', async () => {
  const { downloadNfsePdf, downloadNfseXml } = await import('../src/services/plugnotas/nfse.service.js');

  await assert.rejects(() => downloadNfsePdf(''), /ID da NFSe é obrigatório/);
  await assert.rejects(() => downloadNfseXml(''), /ID da NFSe é obrigatório/);
});

test('nfse service baixa PDF com sucesso', async () => {
  const { downloadNfsePdf } = await import('../src/services/plugnotas/nfse.service.js');
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/pdf' },
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
  });

  try {
    const result = await downloadNfsePdf('nfse-id');
    assert.equal(result.contentType, 'application/pdf');
    assert.equal(Buffer.isBuffer(result.buffer), true);
  } finally {
    global.fetch = originalFetch;
  }
});
