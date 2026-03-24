import { describe, expect, it } from 'vitest';
import {
  NFSE_SERVICO_CODIGO_MIN_LENGTH,
  getNfseServicoCodigoValidationError,
  normalizeNfseServicoCodigoForLength
} from './nfseServicoCodigo';

describe('normalizeNfseServicoCodigoForLength', () => {
  it('remove mascara e mantem alfanumericos ASCII', () => {
    expect(normalizeNfseServicoCodigoForLength('01.01')).toBe('0101');
    expect(normalizeNfseServicoCodigoForLength('12.34-56')).toBe('123456');
    expect(normalizeNfseServicoCodigoForLength('  Ab_9-x  ')).toBe('Ab9x');
    expect(normalizeNfseServicoCodigoForLength('')).toBe('');
  });
});

describe('getNfseServicoCodigoValidationError', () => {
  it('nao retorna erro para vazio ou so espacos (obrigatoriedade e outro fluxo)', () => {
    expect(getNfseServicoCodigoValidationError('')).toBeNull();
    expect(getNfseServicoCodigoValidationError('   ')).toBeNull();
    expect(getNfseServicoCodigoValidationError(undefined)).toBeNull();
    expect(getNfseServicoCodigoValidationError(null)).toBeNull();
  });

  it('rejeita codigo curto apos normalizacao', () => {
    expect(getNfseServicoCodigoValidationError('01.01')).toMatch(/pelo menos 6/);
    expect(getNfseServicoCodigoValidationError('12345')).toMatch(/pelo menos 6/);
    expect(getNfseServicoCodigoValidationError('1')).toMatch(/pelo menos 6/);
  });

  it('aceita 6 ou mais alfanumericos', () => {
    expect(getNfseServicoCodigoValidationError('01.02.03')).toBeNull();
    expect(getNfseServicoCodigoValidationError('123456')).toBeNull();
    expect(getNfseServicoCodigoValidationError('010101')).toBeNull();
  });

  it('expoe constante alinhada ao backend', () => {
    expect(NFSE_SERVICO_CODIGO_MIN_LENGTH).toBe(6);
  });
});
