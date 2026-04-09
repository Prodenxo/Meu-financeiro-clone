import { describe, it, expect } from 'vitest';
import { buildApiErrorMessage } from './buildApiErrorMessage';
import {
  ApiClientError,
  apiClientErrorFromPayload,
  getApiErrorCodeFromUnknownError,
  getHttpStatusFromUnknownError,
  getPlugnotasCodeFromUnknownError,
  getPlugnotasRequestFromUnknownError,
} from './apiClientError';

describe('ApiClientError', () => {
  it('apiClientErrorFromPayload anexa plugnotasCode quando presente em errors', () => {
    const err = apiClientErrorFromPayload(
      {
        success: false,
        message: 'Falha ao cadastrar',
        errors: { plugnotasCode: 'certificado_409_sem_id' }
      },
      buildApiErrorMessage
    );
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.plugnotasCode).toBe('certificado_409_sem_id');
    expect(err.message).toContain('Falha');
    expect(err.payload).toMatchObject({
      success: false,
      message: 'Falha ao cadastrar',
      errors: { plugnotasCode: 'certificado_409_sem_id' },
    });
  });

  it('getPlugnotasCodeFromUnknownError lê ApiClientError', () => {
    const err = new ApiClientError('x', { plugnotasCode: 'certificado_409_sem_id' });
    expect(getPlugnotasCodeFromUnknownError(err)).toBe('certificado_409_sem_id');
  });

  it('getPlugnotasCodeFromUnknownError retorna null para Error genérico', () => {
    expect(getPlugnotasCodeFromUnknownError(new Error('x'))).toBeNull();
  });

  it('apiClientErrorFromPayload anexa httpStatus quando passado', () => {
    const err = apiClientErrorFromPayload(
      { success: false, message: 'x', errors: { plugnotasCode: 'plugnotas_gateway_502' } },
      buildApiErrorMessage,
      { httpStatus: 502 }
    );
    expect(err.httpStatus).toBe(502);
    expect(getHttpStatusFromUnknownError(err)).toBe(502);
  });

  it('getHttpStatusFromUnknownError retorna null sem metadado', () => {
    expect(getHttpStatusFromUnknownError(new Error('x'))).toBeNull();
  });

  it('apiClientErrorFromPayload anexa apiErrorCode quando presente em errors.code', () => {
    const err = apiClientErrorFromPayload(
      { success: false, message: 'Indisponível', errors: { code: 'MEI_GUIDE_SERPRO_UNAVAILABLE' } },
      buildApiErrorMessage,
      { httpStatus: 503 }
    );
    expect(err.apiErrorCode).toBe('MEI_GUIDE_SERPRO_UNAVAILABLE');
    expect(getApiErrorCodeFromUnknownError(err)).toBe('MEI_GUIDE_SERPRO_UNAVAILABLE');
  });

  it('apiClientErrorFromPayload anexa plugnotasRequest quando presente em errors', () => {
    const err = apiClientErrorFromPayload(
      {
        success: false,
        message: 'Falha ao cadastrar',
        errors: { plugnotasRequest: { method: 'post', path: '/empresa' } }
      },
      buildApiErrorMessage
    );
    expect(err.plugnotasRequest).toEqual({ method: 'POST', path: '/empresa' });
    expect(getPlugnotasRequestFromUnknownError(err)).toEqual({ method: 'POST', path: '/empresa' });
  });
});
