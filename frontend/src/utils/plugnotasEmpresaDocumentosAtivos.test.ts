import { describe, expect, it } from 'vitest';
import {
  buildDocumentosAtivosSolicitacaoModalidade,
  DEFAULT_DOCUMENTOS_ATIVOS,
  documentosAtivosDivergem,
  extractDocumentosAtivosFromEmpresaResponse,
  mergeDocumentosAtivosPrecedence,
  MSG_DOCUMENTOS_ATIVOS_MIN_ONE,
  mapPlugnotasEmpresaToDocumentSelection,
  getDocumentosAtivosValidationMessage,
  type DocumentosAtivosState
} from './plugnotasEmpresaDocumentosAtivos';

describe('plugnotasEmpresaDocumentosAtivos', () => {
  it('extract: envelope data.empresa (paridade backend)', () => {
    const sel = extractDocumentosAtivosFromEmpresaResponse({
      data: {
        empresa: {
          nfse: { ativo: true },
          nfe: { ativo: false },
          nfce: { ativo: false }
        }
      }
    });
    expect(sel).toEqual({ nfse: true, nfe: false, nfce: false });
  });

  it('mergeDocumentosAtivosPrecedence: remoto > espelho > default', () => {
    const mirror: DocumentosAtivosState = { nfse: true, nfe: false, nfce: false };
    const remote: DocumentosAtivosState = { nfse: false, nfe: true, nfce: false };
    expect(
      mergeDocumentosAtivosPrecedence({
        remote,
        mirror,
        fallback: DEFAULT_DOCUMENTOS_ATIVOS
      })
    ).toEqual(remote);
    expect(
      mergeDocumentosAtivosPrecedence({
        remote: null,
        mirror,
        fallback: DEFAULT_DOCUMENTOS_ATIVOS
      })
    ).toEqual(mirror);
    expect(
      mergeDocumentosAtivosPrecedence({
        remote: null,
        mirror: null,
        fallback: DEFAULT_DOCUMENTOS_ATIVOS
      })
    ).toEqual(DEFAULT_DOCUMENTOS_ATIVOS);
  });

  it('documentosAtivosDivergem: false se um dos lados for null; true só com tri-boolean estrito diferente', () => {
    const a: DocumentosAtivosState = { nfse: true, nfe: false, nfce: false };
    const b: DocumentosAtivosState = { nfse: false, nfe: true, nfce: false };
    expect(documentosAtivosDivergem(null, a)).toBe(false);
    expect(documentosAtivosDivergem(a, null)).toBe(false);
    expect(documentosAtivosDivergem(a, a)).toBe(false);
    expect(documentosAtivosDivergem(a, b)).toBe(true);
  });

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

  it('mapPlugnotasEmpresaToDocumentSelection: ativo como "sim" (coerção alinhada ao backend)', () => {
    const r = mapPlugnotasEmpresaToDocumentSelection({
      data: {
        nfse: { ativo: 'sim' },
        nfe: { ativo: false },
        nfce: { ativo: false }
      }
    });
    expect(r.kind).toBe('full');
    if (r.kind === 'full') {
      expect(r.selection).toEqual({ nfse: true, nfe: false, nfce: false });
    }
  });

  it('mapPlugnotasEmpresaToDocumentSelection devolve partial quando não há seleção parseável', () => {
    expect(mapPlugnotasEmpresaToDocumentSelection({ data: { nfe: { ativo: false } } }).kind).toBe(
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

  describe('buildDocumentosAtivosSolicitacaoModalidade (FR-GUIA-FISC-14 D2)', () => {
    it('activa NFE mantendo nfce do GET', () => {
      const raw = {
        data: {
          empresa: {
            nfse: { ativo: true },
            nfe: { ativo: false },
            nfce: { ativo: false }
          }
        }
      };
      expect(buildDocumentosAtivosSolicitacaoModalidade(raw, 'NFE')).toEqual({
        nfse: true,
        nfe: true,
        nfce: false
      });
    });

    it('activa NFCE mantendo nfe do GET', () => {
      const raw = {
        data: {
          empresa: {
            nfse: { ativo: true },
            nfe: { ativo: true },
            nfce: { ativo: false }
          }
        }
      };
      expect(buildDocumentosAtivosSolicitacaoModalidade(raw, 'NFCE')).toEqual({
        nfse: true,
        nfe: true,
        nfce: true
      });
    });

    it('sem parse usa default e activa NFE', () => {
      expect(buildDocumentosAtivosSolicitacaoModalidade({}, 'NFE')).toEqual({
        nfse: true,
        nfe: true,
        nfce: false
      });
    });
  });
});
