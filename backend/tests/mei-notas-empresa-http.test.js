import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';

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
