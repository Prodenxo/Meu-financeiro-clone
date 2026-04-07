import { describe, it, expect } from 'vitest';
import { ApiClientError } from '../utils/apiClientError';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import {
  mapMeiFiscalErrorToCopy,
  looksLikeOpaqueApiPayload,
  MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION,
  meiFiscalToastMessage,
  isLikelyUserFacingFiscalValidationMessage,
  formatMeiFiscalMappedForAlert,
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

  it('POSQA / NF-e: mensagem agregada legível do provedor preserva detalhe (não só fallback global)', () => {
    const raw =
      'Validação Plugnotas NF-e: itens[0].ncm — NCM deve ter 8 dígitos numéricos; itens[0].cfop incompatível com operação.';
    expect(isLikelyUserFacingFiscalValidationMessage(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toContain('NCM');
    expect(copy.description).toContain('8 dígitos');
    const alertText = formatMeiFiscalMappedForAlert(copy);
    expect(alertText).toContain('NF-e');
    expect(alertText).toContain('NCM');
  });

  it('POSQA / NFC-e: rejeição modelo 65 / SEFAZ mantém texto acionável', () => {
    const raw =
      'NFC-e modelo 65: rejeição 215 — Falha no schema XML. Verifique CFOP e CST de ICMS do primeiro item.';
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toMatch(/NFC-e|modelo 65|rejeição|CFOP|ICMS/i);
  });

  it('mensagem curta com pista fiscal (NCM) ainda mapeia para copy do provedor — seg. QA heurística', () => {
    const raw = 'NCM item 0 inválido.';
    expect(isLikelyUserFacingFiscalValidationMessage(raw)).toBe(true);
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: raw, plugnotasCode: null });
    expect(copy.title).toBe('Validação ou rejeição no provedor');
    expect(copy.description).toContain('NCM');
  });
});
