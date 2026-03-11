import test from 'node:test';
import assert from 'node:assert/strict';

import router from '../src/routes/mei-notas.routes.js';
import { requireAuth } from '../src/middlewares/auth.js';
import { requireMeiEnabled } from '../src/middlewares/requireMei.js';
import * as controller from '../src/controllers/mei-notas.controller.js';

const getRouteHandlers = (path, method) => {
  const layer = router.stack.find((item) => (
    item.route?.path === path
    && Boolean(item.route?.methods?.[method])
  ));
  assert.ok(layer, `Rota ${method.toUpperCase()} ${path} não encontrada`);
  return layer.route.stack.map((item) => item.handle);
};

test('rotas autenticadas de mei-notas exigem requireMeiEnabled', () => {
  const protectedRoutes = [
    { method: 'post', path: '/emitir' },
    { method: 'get', path: '/' },
    { method: 'get', path: '/:id' },
    { method: 'get', path: '/:id/pdf' },
    { method: 'get', path: '/:id/xml' }
  ];

  for (const route of protectedRoutes) {
    const handlers = getRouteHandlers(route.path, route.method);
    assert.equal(handlers.includes(requireAuth), true, `${route.method.toUpperCase()} ${route.path} deve exigir autenticação`);
    assert.equal(handlers.includes(requireMeiEnabled), true, `${route.method.toUpperCase()} ${route.path} deve exigir MEI habilitado`);
  }
});

test('webhook de mei-notas não usa middleware de usuário', () => {
  const handlers = getRouteHandlers('/webhook', 'post');

  assert.deepEqual(handlers, [controller.webhook]);
});
