import { describe, it, expect } from 'vitest';
import { buildApiErrorMessage } from '../utils/buildApiErrorMessage';
import { ApiClientError, apiClientErrorFromPayload } from '../utils/apiClientError';
import { mapApiClientErrorToUserFacing } from './mapApiClientErrorToUserFacing';
import { mapUnknownErrorToUserFacing } from './mapUnknownErrorToUserFacing';
import { USER_ERROR_COPY } from './userErrorCopy';

const ctx = {
  variant: 'page_banner' as const,
  onRetry: () => {},
  retryLabel: 'Tentar novamente',
};

describe('mapUnknownErrorToUserFacing', () => {
  it('classifica falha de fetch como rede', () => {
    const err = new TypeError('Failed to fetch');
    const p = mapUnknownErrorToUserFacing(err, ctx);
    expect(p.category).toBe('rede');
    expect(p.title).toBe(USER_ERROR_COPY.rede.title);
    expect(p.description).toContain('internet');
  });

  it('Erro na requisição mostra título e descrição canónicos (não fica só uma linha)', () => {
    const p = mapUnknownErrorToUserFacing(new Error('Erro na requisição'), ctx);
    expect(p.category).toBe('validacao_servidor');
    expect(p.title).toBe(USER_ERROR_COPY.validacao_servidor.title);
    expect(p.description.length).toBeGreaterThan(20);
  });

  it('JSON opaco vai para desconhecido com detalhe colapsável', () => {
    const json =
      '{"message":"x","errors":{"plugnotasCode":"c"},"extra":"' + 'y'.repeat(80) + '"}';
    const p = mapUnknownErrorToUserFacing(new Error(json), ctx);
    expect(p.category).toBe('desconhecido');
    expect(p.technicalDetail).toContain('message');
  });

  it('401 na mensagem → sessão', () => {
    const p = mapUnknownErrorToUserFacing(new Error('Request failed 401 Unauthorized'), ctx);
    expect(p.category).toBe('sessao');
    expect(p.primaryAction?.href).toBe('/login');
  });

  it('surfaceId no contexto → analyticsSurfaceId no props (P2)', () => {
    const p = mapUnknownErrorToUserFacing(new TypeError('Failed to fetch'), {
      ...ctx,
      surfaceId: 'dashboard.transactions',
    });
    expect(p.category).toBe('rede');
    expect(p.analyticsSurfaceId).toBe('dashboard.transactions');
  });
});

describe('mapApiClientErrorToUserFacing', () => {
  it('usa payload.details em detalhe técnico e copy estável na descrição', () => {
    const payload = {
      success: false as const,
      message: 'Validação',
      details: 'Campo X é obrigatório',
    };
    const err = apiClientErrorFromPayload(payload, buildApiErrorMessage);
    const p = mapApiClientErrorToUserFacing(err, ctx);
    expect(p.category).toBe('validacao_servidor');
    expect(p.description).toBe(USER_ERROR_COPY.validacao_servidor.description);
    expect(p.technicalDetail).toContain('Campo X');
  });

  it('plugnotasCode → provedor_fiscal', () => {
    const err = apiClientErrorFromPayload(
      {
        success: false,
        message: 'Falha fiscal',
        errors: { plugnotasCode: 'certificado_409_sem_id' },
      },
      buildApiErrorMessage
    );
    const p = mapApiClientErrorToUserFacing(err, ctx);
    expect(p.category).toBe('provedor_fiscal');
    expect(p.source).toBe('provedor_fiscal');
    expect(p.title).toBe(USER_ERROR_COPY.provedor_fiscal.title);
  });

  it('401 no texto agregado → sessão', () => {
    const err = new ApiClientError('HTTP 401 Unauthorized', { payload: null });
    const p = mapApiClientErrorToUserFacing(err, ctx);
    expect(p.category).toBe('sessao');
  });
});
