import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { unwrapApiList } from './unwrapApi.js';

describe('unwrapApiList', () => {
  it('aceita a lista crua', () => {
    assert.deepEqual(unwrapApiList([{ id: 1 }]), [{ id: 1 }]);
  });

  it('abre o envelope { success, data } da API Express', () => {
    const rows = [{ id: 10, nome: 'Água' }];
    assert.deepEqual(unwrapApiList({ success: true, data: rows, message: 'OK', errors: null }), rows);
  });

  it('trata data vazia como lista vazia, não como erro', () => {
    assert.deepEqual(unwrapApiList({ success: true, data: [] }), []);
  });

  it('devolve null quando o formato não é lista', () => {
    assert.equal(unwrapApiList({ success: true, data: { id: 1 } }), null);
    assert.equal(unwrapApiList(null), null);
  });
});
