import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth } from '../src/middlewares/auth.js';

const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

test('API_SECRET sem user id devolve 400', async (t) => {
  t.after(() => {
    delete process.env.API_SECRET;
  });
  process.env.API_SECRET = 'integration-test-secret-only';

  const req = {
    headers: { authorization: 'Bearer integration-test-secret-only' },
    query: {},
  };
  let err;
  await requireAuth(req, {}, (e) => {
    err = e;
  });
  assert.ok(err);
  assert.equal(err.status, 400);
});

test('API_SECRET com X-MeuFinanceiro-User-Id define req.user', async (t) => {
  t.after(() => {
    delete process.env.API_SECRET;
  });
  process.env.API_SECRET = 'integration-test-secret-only';

  const req = {
    headers: {
      authorization: 'Bearer integration-test-secret-only',
      'x-meufinanceiro-user-id': SAMPLE_UUID,
    },
    query: {},
  };
  let err;
  await requireAuth(req, {}, (e) => {
    err = e;
  });
  assert.equal(err, undefined);
  assert.equal(req.user?.id, SAMPLE_UUID);
  assert.equal(req.authType, 'api_key');
});

test('API_SECRET aceita userId na query', async (t) => {
  t.after(() => {
    delete process.env.API_SECRET;
  });
  process.env.API_SECRET = 'integration-test-secret-only';

  const req = {
    headers: { authorization: 'Bearer integration-test-secret-only' },
    query: { userId: SAMPLE_UUID },
  };
  let err;
  await requireAuth(req, {}, (e) => {
    err = e;
  });
  assert.equal(err, undefined);
  assert.equal(req.user?.id, SAMPLE_UUID);
});
