import { describe, it, expect } from 'vitest';
import {
  getPlugnotasCodeFromApiErrors,
  PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID
} from './plugnotasApiErrorCode';

describe('plugnotasApiErrorCode', () => {
  it('expõe constante certificado_409_sem_id', () => {
    expect(PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID).toBe('certificado_409_sem_id');
  });

  it('getPlugnotasCodeFromApiErrors lê plugnotasCode do objeto errors', () => {
    expect(getPlugnotasCodeFromApiErrors({ plugnotasCode: 'certificado_409_sem_id' })).toBe(
      'certificado_409_sem_id'
    );
    expect(getPlugnotasCodeFromApiErrors(null)).toBeNull();
    expect(getPlugnotasCodeFromApiErrors([])).toBeNull();
    expect(getPlugnotasCodeFromApiErrors({ plugnotasCode: 1 })).toBeNull();
  });
});
