import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DOCUMENTOS_ATIVOS,
  MSG_DOCUMENTOS_ATIVOS_MIN_ONE,
  mapPlugnotasEmpresaToDocumentSelection,
  getDocumentosAtivosValidationMessage,
  type DocumentosAtivosState
} from './plugnotasEmpresaDocumentosAtivos';

describe('plugnotasEmpresaDocumentosAtivos', () => {
  it('mapPlugnotasEmpresaToDocumentSelection devolve full quando nfse/nfe/nfce.ativo são booleanos', () => {
    const raw = {
      message: 'OK',
      data: {
        nfse: { ativo: true, tipoContrato: 0 },
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: true, tipoContrato: 0 }
      }
    };
    const r = mapPlugnotasEmpresaToDocumentSelection(raw);
    expect(r.kind).toBe('full');
    if (r.kind === 'full') {
      expect(r.selection).toEqual({ nfse: true, nfe: false, nfce: true });
    }
  });

  it('mapPlugnotasEmpresaToDocumentSelection devolve partial quando falta bloco ou ativo não é boolean', () => {
    expect(mapPlugnotasEmpresaToDocumentSelection({ data: { nfe: { ativo: false } } }).kind).toBe(
      'partial'
    );
    expect(mapPlugnotasEmpresaToDocumentSelection({ data: { nfse: { ativo: 'sim' } } }).kind).toBe(
      'partial'
    );
    expect(mapPlugnotasEmpresaToDocumentSelection(null).kind).toBe('partial');
  });

  it('getDocumentosAtivosValidationMessage exige pelo menos um true', () => {
    const allFalse: DocumentosAtivosState = { nfse: false, nfe: false, nfce: false };
    expect(getDocumentosAtivosValidationMessage(allFalse)).toBe(MSG_DOCUMENTOS_ATIVOS_MIN_ONE);
    expect(
      getDocumentosAtivosValidationMessage({ ...DEFAULT_DOCUMENTOS_ATIVOS })
    ).toBeNull();
  });
});
