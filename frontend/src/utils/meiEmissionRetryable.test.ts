import { describe, expect, it } from 'vitest';
import { ApiClientError } from './apiClientError';
import { isMeiEmissionErrorRetryable } from './meiEmissionRetryable';
import { PLUGNOTAS_GATEWAY_UPSTREAM_PREFIX } from './plugnotasApiErrorCode';

describe('isMeiEmissionErrorRetryable (FR-GUIA-FISC-13)', () => {
  it('5xx e 429/408 são retryable', () => {
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 503 }))).toBe(true);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 502 }))).toBe(true);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 500 }))).toBe(true);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 429 }))).toBe(true);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 408 }))).toBe(true);
  });

  it('4xx de cliente (exceto 429) não são retryable por omissão', () => {
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 400 }))).toBe(false);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 422 }))).toBe(false);
    expect(isMeiEmissionErrorRetryable(new ApiClientError('x', { httpStatus: 404 }))).toBe(false);
  });

  it('código gateway upstream Plugnotas é retryable', () => {
    expect(
      isMeiEmissionErrorRetryable(
        new ApiClientError('gw', { plugnotasCode: `${PLUGNOTAS_GATEWAY_UPSTREAM_PREFIX}502` })
      )
    ).toBe(true);
  });

  it('TypeError Failed to fetch (rede) é retryable', () => {
    expect(isMeiEmissionErrorRetryable(new TypeError('Failed to fetch'))).toBe(true);
  });
});
