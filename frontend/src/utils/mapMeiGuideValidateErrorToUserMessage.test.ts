import { describe, expect, it } from 'vitest';
import { ApiClientError } from './apiClientError';
import {
  mapMeiGuideValidateErrorToUserMessage,
  MEI_GUIDE_SERPRO_UNAVAILABLE,
  MEI_GUIDE_VALIDATE_CONS_C_BODY,
  MEI_GUIDE_VALIDATE_CONS_C_TITLE
} from './mapMeiGuideValidateErrorToUserMessage';

describe('mapMeiGuideValidateErrorToUserMessage', () => {
  it('503 + code Serpro → CONS-C', () => {
    const err = new ApiClientError('O serviço da Receita Federal está temporariamente indisponível.', {
      httpStatus: 503,
      apiErrorCode: MEI_GUIDE_SERPRO_UNAVAILABLE,
      payload: null
    });
    const r = mapMeiGuideValidateErrorToUserMessage(err);
    expect(r.variant).toBe('cons-c');
    if (r.variant === 'cons-c') {
      expect(r.title).toBe(MEI_GUIDE_VALIDATE_CONS_C_TITLE);
      expect(r.body).toBe(MEI_GUIDE_VALIDATE_CONS_C_BODY);
      expect(r.rawDetail).toBeUndefined();
    }
  });

  it('400 + Internal Server Error (legacy) → CONS-C com rawDetail', () => {
    const err = new ApiClientError('Internal Server Error', { httpStatus: 400, payload: null });
    const r = mapMeiGuideValidateErrorToUserMessage(err);
    expect(r.variant).toBe('cons-c');
    if (r.variant === 'cons-c') {
      expect(r.rawDetail).toBe('Internal Server Error');
    }
  });

  it('400 + rejeição negócio → plain', () => {
    const err = new ApiClientError('Rejeitado', { httpStatus: 400, payload: null });
    const r = mapMeiGuideValidateErrorToUserMessage(err);
    expect(r.variant).toBe('plain');
    if (r.variant === 'plain') {
      expect(r.message).toBe('Rejeitado');
    }
  });
});
