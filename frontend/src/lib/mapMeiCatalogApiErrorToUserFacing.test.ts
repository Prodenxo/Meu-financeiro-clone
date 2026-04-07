import { describe, it, expect } from 'vitest';
import { ApiClientError } from '../utils/apiClientError';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import { mapMeiCatalogApiErrorToUserFacing } from './mapMeiCatalogApiErrorToUserFacing';

describe('mapMeiCatalogApiErrorToUserFacing', () => {
  it('com código Plugnotas usa caminho fiscal (provedor_fiscal)', () => {
    const err = new ApiClientError('conflict', {
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    const props = mapMeiCatalogApiErrorToUserFacing(err, 'fallback');
    expect(props.category).toBe('provedor_fiscal');
    expect(props.variant).toBe('modal_body');
  });

  it('sem código usa mapper genérico', () => {
    const props = mapMeiCatalogApiErrorToUserFacing(new Error('Falha de rede'), 'fallback');
    expect(props.title).toBeTruthy();
    expect(props.variant).toBe('modal_body');
  });

  it('surfaceId opcional → analyticsSurfaceId (caminho genérico)', () => {
    const props = mapMeiCatalogApiErrorToUserFacing(new Error('x'), 'fallback', 'mei_catalogo.clientes.modal');
    expect(props.analyticsSurfaceId).toBe('mei_catalogo.clientes.modal');
  });

  it('surfaceId opcional → analyticsSurfaceId (caminho fiscal)', () => {
    const err = new ApiClientError('conflict', {
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    const props = mapMeiCatalogApiErrorToUserFacing(err, 'fallback', 'mei_catalogo.produtos.modal');
    expect(props.category).toBe('provedor_fiscal');
    expect(props.analyticsSurfaceId).toBe('mei_catalogo.produtos.modal');
  });
});
