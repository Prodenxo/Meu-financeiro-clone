import { describe, it, expect } from 'vitest';
import { ApiClientError } from '../utils/apiClientError';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import {
  mapMeiFiscalErrorToCopy,
  looksLikeOpaqueApiPayload,
  MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION,
  meiFiscalToastMessage,
} from './fiscalUserError';

describe('mapMeiFiscalErrorToCopy', () => {
  it('mapeia certificado_409_sem_id com título e link de documentação', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'conflict',
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    expect(copy.title).toContain('Certificado');
    expect(copy.description).toMatch(/Plugnotas|conta/i);
    expect(copy.actionLabel).toBe('Documentação');
    expect(copy.href).toBeTruthy();
  });

  it('usa fallback para payload que parece JSON de API', () => {
    const raw = JSON.stringify({
      success: false,
      message: 'x'.repeat(50),
      errors: { code: 'unknown', detail: 'y'.repeat(40) },
    });
    expect(looksLikeOpaqueApiPayload(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.description).toBe(MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION);
  });

  it('mapeia duplicado por palavra-chave', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'duplicate key value violates unique constraint',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Registo duplicado');
  });

  it('mensagem não mapeada usa fallback global (sem texto bruto da API)', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'ERR_PN_INTERNAL unexpected token in response',
      plugnotasCode: null,
    });
    expect(copy.title).toBe('Operação fiscal');
    expect(copy.description).toBe(MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION);
  });

  it('meiFiscalToastMessage usa ApiClientError.plugnotasCode', () => {
    const err = new ApiClientError('ignored body', {
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    const line = meiFiscalToastMessage(err, 'fallback');
    expect(line).toMatch(/Certificado/i);
    expect(line).not.toContain('{');
  });
});
