import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SERPRO_OAUTH_TOKEN_URL = process.env.SERPRO_OAUTH_TOKEN_URL || 'https://oauth.serpro.example/token';
process.env.SERPRO_CONSUMER_KEY = process.env.SERPRO_CONSUMER_KEY || 'consumer-key';
process.env.SERPRO_CONSUMER_SECRET = process.env.SERPRO_CONSUMER_SECRET || 'consumer-secret';
process.env.SERPRO_ROLE_TYPE = process.env.SERPRO_ROLE_TYPE || 'TERCEIROS';
process.env.SERPRO_OAUTH_TOKEN_NO_MTLS = 'true';
process.env.SERPRO_CERT_PFX_BASE64 = process.env.SERPRO_CERT_PFX_BASE64 || Buffer.from('fake-pfx').toString('base64');
process.env.SERPRO_CERT_PFX_PASS = process.env.SERPRO_CERT_PFX_PASS || '123';

import {
  getSerproTokens,
  __setHttpClientsForTests,
  __resetAuthProcuradorStateForTests
} from '../src/services/gestao/authProcurador.service.js';

const buildJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status >= 200 && status < 300 ? 'OK' : 'Bad Request',
  headers: {
    get: (name) => (String(name || '').toLowerCase() === 'content-type'
      ? 'application/json;charset=UTF-8'
      : null)
  },
  json: async () => payload,
  text: async () => JSON.stringify(payload || {})
});

test('auth-procurador faz fallback para mTLS após erro de certificado no OAuth sem mTLS', async () => {
  __resetAuthProcuradorStateForTests();
  let fetchCalls = 0;
  let mtlsCalls = 0;

  __setHttpClientsForTests({
    noMtls: true,
    fetchFn: async () => {
      fetchCalls += 1;
      return buildJsonResponse(400, { message: 'Não foi possível identificar um certificado digital válido.' });
    },
    mtlsFn: async (_url, options) => {
      mtlsCalls += 1;
      assert.equal(Boolean(options?.pfx), true);
      return buildJsonResponse(200, {
        access_token: 'token-via-mtls',
        jwt_token: 'jwt-via-mtls',
        expires_in: 3600
      });
    }
  });

  try {
    const tokens = await getSerproTokens({ forceRefresh: true });
    assert.equal(tokens.accessToken, 'token-via-mtls');
    assert.equal(tokens.jwtToken, 'jwt-via-mtls');
    assert.equal(fetchCalls, 1);
    assert.equal(mtlsCalls, 1);
  } finally {
    __resetAuthProcuradorStateForTests();
  }
});

test('auth-procurador preserva erro original quando fallback mTLS também falha', async () => {
  __resetAuthProcuradorStateForTests();
  let fetchCalls = 0;
  let mtlsCalls = 0;

  __setHttpClientsForTests({
    noMtls: true,
    fetchFn: async () => {
      fetchCalls += 1;
      return buildJsonResponse(400, { message: 'Não foi possível identificar um certificado digital válido.' });
    },
    mtlsFn: async () => {
      mtlsCalls += 1;
      return buildJsonResponse(400, { message: 'Falha secundária no mTLS' });
    }
  });

  try {
    await assert.rejects(
      () => getSerproTokens({ forceRefresh: true }),
      (error) => {
        assert.equal(error?.message, 'Não foi possível identificar um certificado digital válido.');
        return true;
      }
    );
    assert.equal(fetchCalls, 1);
    assert.equal(mtlsCalls, 1);
  } finally {
    __resetAuthProcuradorStateForTests();
  }
});

test('auth-procurador não tenta fallback mTLS para erros OAuth não relacionados a certificado', async () => {
  __resetAuthProcuradorStateForTests();
  let fetchCalls = 0;
  let mtlsCalls = 0;

  __setHttpClientsForTests({
    noMtls: true,
    fetchFn: async () => {
      fetchCalls += 1;
      return buildJsonResponse(400, { message: 'Falha genérica de autenticação' });
    },
    mtlsFn: async () => {
      mtlsCalls += 1;
      return buildJsonResponse(200, {
        access_token: 'token-via-mtls',
        expires_in: 3600
      });
    }
  });

  try {
    await assert.rejects(
      () => getSerproTokens({ forceRefresh: true }),
      (error) => {
        assert.equal(error?.message, 'Falha genérica de autenticação');
        return true;
      }
    );
    assert.equal(fetchCalls, 1);
    assert.equal(mtlsCalls, 0);
  } finally {
    __resetAuthProcuradorStateForTests();
  }
});
