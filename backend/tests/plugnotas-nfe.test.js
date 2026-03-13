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

test('nfe service valida parâmetros obrigatórios de consulta e download', async () => {
  const { consultarNfe, downloadNfePdf, downloadNfeXml } = await import('../src/services/plugnotas/nfe.service.js');

  await assert.rejects(() => consultarNfe(''), /ID da NF-e é obrigatório/);
  await assert.rejects(() => downloadNfePdf(''), /ID da NF-e é obrigatório/);
  await assert.rejects(() => downloadNfeXml(''), /ID da NF-e é obrigatório/);
});

test('nfe service envia emissão no endpoint correto', async () => {
  const { emitirNfe } = await import('../src/services/plugnotas/nfe.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse({ documents: [{ id: 'nfe-1' }], message: 'ok' });
  };

  try {
    const response = await emitirNfe({
      idIntegracao: 'nfe-int-1',
      emitente: { cpfCnpj: '12345678000199' },
      itens: [{ codigo: 'A1', descricao: 'Produto A', valor: 10 }]
    });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/nfe$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].options.body), [{
      idIntegracao: 'nfe-int-1',
      emitente: { cpfCnpj: '12345678000199' },
      itens: [{ codigo: 'A1', descricao: 'Produto A', valor: 10 }]
    }]);
    assert.equal(response.documents[0].id, 'nfe-1');
  } finally {
    global.fetch = originalFetch;
  }
});

test('nfe service suporta rota de relatório', async () => {
  const { relatorioNfe } = await import('../src/services/plugnotas/nfe.service.js');
  const originalFetch = global.fetch;
  let calledUrl = '';

  global.fetch = async (url) => {
    calledUrl = String(url);
    return createJsonResponse([{ emitente: { cpfCnpj: '123' }, documentos: [] }]);
  };

  try {
    const result = await relatorioNfe({ cpfCnpj: '12345678000199' });
    assert.match(calledUrl, /\/nfe\/relatorio\?cpfCnpj=12345678000199$/);
    assert.equal(Array.isArray(result), true);
  } finally {
    global.fetch = originalFetch;
  }
});
