import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchEmpresaJsonWithMeiCache,
  invalidateMeiEmpresaGetCache,
  meiEmpresaGetCacheStorageKey,
  MEI_EMPRESA_GET_CACHE_TTL_MS
} from './guiaMeiEmpresaGetCache';

describe('guiaMeiEmpresaGetCache', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('dedupe: duas chamadas simultâneas usam um único fetcher', async () => {
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls += 1;
      return { ok: true };
    });
    const a = fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '12345678000190',
      fetcher
    });
    const b = fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '12345678000190',
      fetcher
    });
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toEqual({ ok: true });
    expect(rb).toEqual({ ok: true });
    expect(calls).toBe(1);
  });

  it('dentro do TTL reutiliza sessionStorage sem novo fetch', async () => {
    const fetcher = vi.fn(async () => ({ v: 1 }));
    await fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '12345678000190',
      fetcher
    });
    await fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '12345678000190',
      fetcher
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('entrada expirada (t antigo) dispara novo fetch', async () => {
    const key = meiEmpresaGetCacheStorageKey('u1', '11111111000191');
    sessionStorage.setItem(
      key,
      JSON.stringify({ t: Date.now() - MEI_EMPRESA_GET_CACHE_TTL_MS - 1000, payload: { stale: true } })
    );
    const fetcher = vi.fn(async () => ({ fresh: true }));
    const r = await fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '11111111000191',
      fetcher
    });
    expect(r).toEqual({ fresh: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('invalidate remove cache para próxima chamada', async () => {
    const fetcher = vi.fn(async () => ({ x: 1 }));
    await fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '99888777000100',
      fetcher
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    invalidateMeiEmpresaGetCache('u1', '99888777000100');
    await fetchEmpresaJsonWithMeiCache({
      userId: 'u1',
      cnpjDigits: '99888777000100',
      fetcher
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
