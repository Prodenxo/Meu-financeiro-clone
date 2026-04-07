import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  reportUserErrorShown,
  setUserErrorShownReporter,
  USER_ERROR_SHOWN_EVENT,
} from './reportUserErrorShown';

describe('reportUserErrorShown', () => {
  afterEach(() => {
    setUserErrorShownReporter(null);
    vi.unstubAllEnvs();
  });

  it('reporter injectado recebe só category, surfaceId opcional e timestamp — sem texto de erro', () => {
    const spy = vi.fn();
    setUserErrorShownReporter(spy);

    reportUserErrorShown({
      category: 'rede',
      surfaceId: 'transacoes.list',
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0] as Record<string, unknown>;
    expect(arg.category).toBe('rede');
    expect(arg.surfaceId).toBe('transacoes.list');
    expect(typeof arg.timestamp).toBe('string');
    expect(arg).not.toHaveProperty('title');
    expect(arg).not.toHaveProperty('description');
    expect(arg).not.toHaveProperty('technicalDetail');
  });

  it('com VITE_ENABLE_USER_ERROR_ANALYTICS=true e gtag, envia evento error_shown sem PII', () => {
    vi.stubEnv('VITE_ENABLE_USER_ERROR_ANALYTICS', 'true');
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    try {
      reportUserErrorShown({ category: 'sessao' });

      expect(gtag).toHaveBeenCalledWith(
        'event',
        USER_ERROR_SHOWN_EVENT,
        expect.objectContaining({
          event_category: 'sessao',
          timestamp: expect.any(String),
        })
      );
      const params = gtag.mock.calls[0][2] as Record<string, string>;
      expect(params).not.toHaveProperty('title');
      expect(params).not.toHaveProperty('description');
    } finally {
      delete (window as unknown as { gtag?: typeof gtag }).gtag;
    }
  });
});
