import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateNfseRpsForEmit,
  reserveNextNfseRpsNumber,
} from '../src/services/plugnotas/nfse-rps-allocator.js';

test('reserveNextNfseRpsNumber usa RPC quando disponível', async () => {
  let calls = 0;
  const getDb = () => ({
    rpc: async (name, args) => {
      calls += 1;
      assert.equal(name, 'mei_nfse_reserve_rps');
      assert.equal(args.p_cnpj, '65805583000173');
      assert.equal(args.p_floor, 90);
      return { data: 91, error: null };
    },
  });

  const numero = await reserveNextNfseRpsNumber(getDb, { cnpj: '65805583000173', floor: 90 });
  assert.equal(numero, 91);
  assert.equal(calls, 1);
});

test('reserveNextNfseRpsNumber faz fallback floor+1 sem RPC', async () => {
  const getDb = () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    rpc: async () => ({ data: null, error: { message: 'function not found', code: '42883' } }),
  });

  const numero = await reserveNextNfseRpsNumber(getDb, { cnpj: '65805583000173', floor: 94 });
  assert.equal(numero, 95);
});

test('allocateNfseRpsForEmit combina histórico PlugNotas com reserva', async () => {
  const original = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      notas: [{ dps: { numero: 90, serie: '1' }, rps: { numero: 90, serie: '1' } }],
    }),
  });

  let reserveCalls = 0;
  try {
    const getDb = () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { last_numero: 100 }, error: null }),
          }),
        }),
        upsert: async () => ({ error: null }),
      }),
      rpc: async (name, args) => {
        if (name === 'mei_nfse_sync_rps_floor') return { error: null };
        if (name === 'mei_nfse_reserve_rps') {
          reserveCalls += 1;
          return { data: args.p_floor + 1, error: null };
        }
        return { data: null, error: { message: 'unknown' } };
      },
    });

    const allocation = await allocateNfseRpsForEmit(getDb, '65805583000173', 88);
    assert.equal(allocation.numero, 101);
    assert.ok(reserveCalls >= 1);
  } finally {
    global.fetch = original;
  }
});
