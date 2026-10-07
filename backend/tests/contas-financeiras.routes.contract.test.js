import test from 'node:test';
import assert from 'node:assert/strict';

import router from '../src/routes/contas-financeiras.routes.js';
import indexRouter from '../src/routes/index.js';
import { requireAuth } from '../src/middlewares/auth.js';
import * as controller from '../src/controllers/contas-financeiras.controller.js';

const getRouteHandlers = (path, method) => {
  const layer = router.stack.find((item) => (
    item.route?.path === path && Boolean(item.route?.methods?.[method])
  ));
  assert.ok(layer, `Rota ${method.toUpperCase()} ${path} nao encontrada`);
  return layer.route.stack.map((item) => item.handle);
};

test('GET / existe, exige auth e usa listContasFinanceiras', () => {
  const handlers = getRouteHandlers('/', 'get');
  assert.equal(handlers.includes(requireAuth), true);
  assert.equal(handlers.includes(controller.listContasFinanceiras), true);
});

test('router principal monta /contas-financeiras', () => {
  const mounted = indexRouter.stack.some((layer) => layer.handle === router);
  assert.equal(mounted, true);
});

test('GET / sem token responde 401 antes de consultar o banco', async () => {
  const [authMw] = getRouteHandlers('/', 'get');
  let forwarded = null;
  await authMw({ headers: {}, method: 'GET', originalUrl: '/api/contas-financeiras' }, {}, (err) => {
    forwarded = err;
  });
  assert.ok(forwarded);
  assert.equal(forwarded.statusCode ?? forwarded.status, 401);
});
