import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBackendHealthOk } from './fetchBackendHealthOk';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchBackendHealthOk', () => {
  it('retorna true quando status ok e JSON esperado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' })
        })
      )
    );

    await expect(fetchBackendHealthOk('http://localhost:3333/health')).resolves.toBe(true);
  });

  it('retorna false quando HTTP não ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ status: 'ok' })
        })
      )
    );

    await expect(fetchBackendHealthOk('/health')).resolves.toBe(false);
  });

  it('retorna false quando corpo não tem status ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'degraded' })
        })
      )
    );

    await expect(fetchBackendHealthOk('/health')).resolves.toBe(false);
  });

  it('retorna false quando JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('bad json'))
        })
      )
    );

    await expect(fetchBackendHealthOk('/health')).resolves.toBe(false);
  });

  it('retorna false quando fetch lança', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));

    await expect(fetchBackendHealthOk('/health')).resolves.toBe(false);
  });

  it('repassa AbortSignal ao fetch', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await fetchBackendHealthOk('/health', controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      '/health',
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
