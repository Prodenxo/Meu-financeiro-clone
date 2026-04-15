import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status >= 400 ? 'Error' : 'OK',
  headers: { get: () => 'application/json' },
  json: async () => payload
});

const mountApp = async (controller) => {
  const { errorHandler } = await import('../src/middlewares/errorHandler.js');
  const {
    __setGetRequesterContextForTests,
    requireMeiEnabled
  } = await import('../src/middlewares/requireMei.js');

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'mei-empresa-user' };
    req.accessToken = 'mei-empresa-token';
    next();
  });
  app.post(
    '/api/mei-notas/setup/emissao-fiscal/empresa',
    requireMeiEnabled,
    controller.cadastrarPlugNotasEmpresa
  );
  app.use(errorHandler);

  return { app, __setGetRequesterContextForTests };
};

const listen = (app) => new Promise((resolve, reject) => {
  const server = createServer(app);
  server.listen(0, () => {
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    resolve({ server, port });
  });
  server.on('error', reject);
});

test('HTTP POST /api/mei-notas/setup/emissao-fiscal/empresa bloqueia payload_contrato antes do preflight quando codigoCidade está ausente', async () => {
  const controller = await import('../src/controllers/mei-notas.controller.js');
  const { app, __setGetRequesterContextForTests } = await mountApp(controller);
  const originalFetch = global.fetch;
  const upstreamCalls = [];

  global.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('127.0.0.1') || u.includes('localhost')) {
      return originalFetch(url, init);
    }
    upstreamCalls.push({ url: u, init });
    throw new Error('upstream should not be called');
  };

  __setGetRequesterContextForTests(async () => ({ role: 'admin', mei: true }));
  const { server, port } = await listen(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/mei-notas/setup/emissao-fiscal/empresa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        razaoSocial: 'Empresa Teste',
        endereco: {
          logradouro: 'Rua A',
          numero: '1',
          bairro: 'Centro',
          cep: '01000000',
          uf: 'SP'
        }
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.errors?.plugnotasCode, 'payload_contrato');
    assert.equal(json.errors?.runtimeDecision?.consultedMunicipio, false);
    assert.equal(upstreamCalls.length, 0);
  } finally {
    global.fetch = originalFetch;
    __setGetRequesterContextForTests(null);
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('HTTP POST /api/mei-notas/setup/emissao-fiscal/empresa bloqueia município com login obrigatório após preflight', async () => {
  const controller = await import('../src/controllers/mei-notas.controller.js');
  const { app, __setGetRequesterContextForTests } = await mountApp(controller);
  const originalFetch = global.fetch;
  const upstreamCalls = [];

  global.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('127.0.0.1') || u.includes('localhost')) {
      return originalFetch(url, init);
    }
    upstreamCalls.push({ url: u, init });
    if (u.includes('/nfse/cidades/')) {
      return createJsonResponse(200, {
        padraoNacional: { producao: true, homologacao: false },
        login: { producao: true, homologacao: false },
        senha: { producao: false, homologacao: false }
      });
    }
    return createJsonResponse(200, {
      message: 'Cadastro efetuado com sucesso',
      data: { cnpj: '17422651000172' }
    });
  };

  __setGetRequesterContextForTests(async () => ({ role: 'admin', mei: true }));
  const { server, port } = await listen(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/mei-notas/setup/emissao-fiscal/empresa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        razaoSocial: 'Empresa Teste',
        endereco: {
          codigoCidade: '3550308',
          logradouro: 'Rua A',
          numero: '1',
          bairro: 'Centro',
          cep: '01000000',
          uf: 'SP'
        }
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.errors?.plugnotasCode, 'prefeitura_login_required_blocked');
    assert.equal(json.errors?.runtimeDecision?.consultedMunicipio, true);
    assert.equal(upstreamCalls.length, 1);
    assert.match(upstreamCalls[0].url, /\/nfse\/cidades\/3550308$/);
  } finally {
    global.fetch = originalFetch;
    __setGetRequesterContextForTests(null);
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('HTTP POST REC500 P2: IBGE 5002704 com preflight híbrido retorna prefeitura_login_required_blocked (sem POST /empresa)', async () => {
  const controller = await import('../src/controllers/mei-notas.controller.js');
  const { app, __setGetRequesterContextForTests } = await mountApp(controller);
  const originalFetch = global.fetch;
  const upstreamCalls = [];

  global.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('127.0.0.1') || u.includes('localhost')) {
      return originalFetch(url, init);
    }
    upstreamCalls.push({ url: u, init });
    if (u.includes('/nfse/cidades/')) {
      return createJsonResponse(200, {
        padraoNacional: { producao: true, homologacao: false },
        login: { producao: true, homologacao: false },
        senha: { producao: false, homologacao: false }
      });
    }
    return createJsonResponse(200, {
      message: 'Cadastro efetuado com sucesso',
      data: { cnpj: '17422651000172' }
    });
  };

  __setGetRequesterContextForTests(async () => ({ role: 'admin', mei: true }));
  const { server, port } = await listen(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/mei-notas/setup/emissao-fiscal/empresa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        razaoSocial: 'Empresa Teste',
        endereco: {
          codigoCidade: '5002704',
          logradouro: 'Rua A',
          numero: '1',
          bairro: 'Centro',
          cep: '01000000',
          uf: 'SP'
        }
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.errors?.plugnotasCode, 'prefeitura_login_required_blocked');
    assert.equal(json.errors?.runtimeDecision?.codigoIbge, '5002704');
    assert.equal(json.errors?.runtimeDecision?.padraoNacionalEnabled, true);
    assert.equal(upstreamCalls.length, 1);
    assert.match(upstreamCalls[0].url, /\/nfse\/cidades\/5002704$/);
  } finally {
    global.fetch = originalFetch;
    __setGetRequesterContextForTests(null);
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('HTTP POST /api/mei-notas/setup/emissao-fiscal/empresa bloqueia credenciais municipais antes do upstream', async () => {
  const controller = await import('../src/controllers/mei-notas.controller.js');
  const { app, __setGetRequesterContextForTests } = await mountApp(controller);
  const originalFetch = global.fetch;
  const upstreamCalls = [];

  global.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('127.0.0.1') || u.includes('localhost')) {
      return originalFetch(url, init);
    }
    upstreamCalls.push({ url: u, init });
    throw new Error('upstream should not be called');
  };

  __setGetRequesterContextForTests(async () => ({ role: 'admin', mei: true }));
  const { server, port } = await listen(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/mei-notas/setup/emissao-fiscal/empresa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        nfse: {
          ativo: true,
          config: {
            producao: true,
            prefeitura: { codigoIbge: '3550308', login: 'user', senha: 'secret' }
          }
        }
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.errors?.plugnotasCode, 'prefeitura_login_required_blocked');
    assert.equal(upstreamCalls.length, 0);
  } finally {
    global.fetch = originalFetch;
    __setGetRequesterContextForTests(null);
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
