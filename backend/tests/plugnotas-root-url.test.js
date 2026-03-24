import test from 'node:test';
import assert from 'node:assert/strict';

test('getPlugnotasRootUrl sem prefixo', async () => {
  process.env.PLUGNOTAS_API_BASE_URL = 'https://api.sandbox.plugnotas.com.br';
  process.env.PLUGNOTAS_API_PATH_PREFIX = '';
  const { getPlugnotasRootUrl } = await import('../src/services/plugnotas/root-url.js');
  assert.equal(getPlugnotasRootUrl(), 'https://api.sandbox.plugnotas.com.br');
});

test('getPlugnotasRootUrl com prefixo /api', async () => {
  process.env.PLUGNOTAS_API_BASE_URL = 'https://api.plugnotas.com.br';
  process.env.PLUGNOTAS_API_PATH_PREFIX = '/api';
  const { getPlugnotasRootUrl } = await import('../src/services/plugnotas/root-url.js');
  assert.equal(getPlugnotasRootUrl(), 'https://api.plugnotas.com.br/api');
});

test('getPlugnotasRootUrl prefixo sem barra inicial vira /api', async () => {
  process.env.PLUGNOTAS_API_BASE_URL = 'https://api.plugnotas.com.br';
  process.env.PLUGNOTAS_API_PATH_PREFIX = 'api';
  const { getPlugnotasRootUrl } = await import('../src/services/plugnotas/root-url.js');
  assert.equal(getPlugnotasRootUrl(), 'https://api.plugnotas.com.br/api');
});
