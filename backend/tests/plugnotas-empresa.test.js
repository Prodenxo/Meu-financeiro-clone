import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 409 ? 'Conflict' : 'Error',
  headers: { get: () => 'application/json' },
  json: async () => payload
});

test('empresa service valida payload obrigatório', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');

  await assert.rejects(
    () => cadastrarEmpresaPlugNotas(null),
    /Payload da empresa é obrigatório/
  );
  await assert.rejects(
    () => cadastrarEmpresaPlugNotas({ cpfCnpj: '123', certificado: 'cert-1' }),
    /CNPJ da empresa deve ter 14 dígitos/
  );
  await assert.rejects(
    () => cadastrarEmpresaPlugNotas({ cpfCnpj: '17422651000172' }),
    /Certificado é obrigatório/
  );
});

test('empresa service cria empresa com POST /empresa', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'Cadastro efetuado com sucesso',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/empresa$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(response.operation, 'created');
    assert.equal(response.cnpj, '17422651000172');
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service tenta atualização quando empresa já existe', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Empresa já cadastrada' });
    }
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.method, 'POST');
    assert.match(calls[0].url, /\/empresa$/);
    assert.equal(calls[1].options.method, 'PUT');
    assert.match(calls[1].url, /\/empresa\/17422651000172$/);
    assert.equal(response.operation, 'updated');
    assert.equal(response.cnpj, '17422651000172');
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service trata conflito sem update como sucesso operacional', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Empresa já cadastrada' });
    }
    return createJsonResponse(404, { message: 'Operação não suportada' });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 5);
    assert.equal(response.operation, 'existing');
    assert.match(
      String(response.message || ''),
      /sucesso operacional/i
    );
  } finally {
    global.fetch = originalFetch;
  }
});
