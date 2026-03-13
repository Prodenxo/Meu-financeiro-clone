import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';

const createJsonResponse = (payload) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => payload
});

test('nfce service valida parâmetros obrigatórios de consulta e download', async () => {
  const { consultarNfce, downloadNfcePdf, downloadNfceXml } = await import('../src/services/plugnotas/nfce.service.js');

  await assert.rejects(() => consultarNfce(''), /ID da NFC-e é obrigatório/);
  await assert.rejects(() => downloadNfcePdf(''), /ID da NFC-e é obrigatório/);
  await assert.rejects(() => downloadNfceXml(''), /ID da NFC-e é obrigatório/);
});

test('nfce service envia emissão no endpoint correto', async () => {
  const { emitirNfce } = await import('../src/services/plugnotas/nfce.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse({ documents: [{ id: 'nfce-1' }], message: 'ok' });
  };

  try {
    const response = await emitirNfce({
      idIntegracao: 'nfce-int-1',
      emitente: { cpfCnpj: '12345678000199' },
      itens: [{ codigo: 'A1', descricao: 'Produto A', valor: 10 }]
    });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/nfce$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].options.body), [{
      idIntegracao: 'nfce-int-1',
      emitente: { cpfCnpj: '12345678000199' },
      itens: [{ codigo: 'A1', descricao: 'Produto A', valor: 10 }]
    }]);
    assert.equal(response.documents[0].id, 'nfce-1');
  } finally {
    global.fetch = originalFetch;
  }
});
