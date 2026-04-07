import { describe, it, expect } from 'vitest';
import { buildApiErrorMessage } from './buildApiErrorMessage';
import { ApiClientError, apiClientErrorFromPayload, getPlugnotasCodeFromUnknownError } from './apiClientError';

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
});
