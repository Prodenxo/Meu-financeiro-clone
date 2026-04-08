import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  countDocumentosAtivosSelecionados,
  getHintBlocoDadosMinimosEmitente,
  getTituloBlocoDadosMinimosEmitente,
  isGuiaMeiEmissaoNfeNfceDisponivelNaUi,
  shouldShowCadastroNfeNfceInfoBanner,
  shouldShowRequisitosNfeNfceSecao,
  TITULO_DADOS_MINIMOS_NEUTRO,
  TITULO_DADOS_MINIMOS_SO_NFSE
} from './guiaMeiCadastroDocumentosAtivos';
import { DEFAULT_DOCUMENTOS_ATIVOS } from './plugnotasEmpresaDocumentosAtivos';

describe('guiaMeiCadastroDocumentosAtivos', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('FR-CAD-DOC-08: título «só NFS-e» quando apenas NFS-e está activo', () => {
    expect(
      getTituloBlocoDadosMinimosEmitente({ nfse: true, nfe: false, nfce: false })
    ).toBe(TITULO_DADOS_MINIMOS_SO_NFSE);
    const hintOnlyNfse = getHintBlocoDadosMinimosEmitente({ nfse: true, nfe: false, nfce: false });
    expect(hintOnlyNfse).toContain('inscrição estadual');
    expect(hintOnlyNfse).toContain('Inscrição municipal é opcional');
  });

  it('FR-CAD-DOC-08: título neutro quando há dois ou mais tipos activos', () => {
    expect(
      getTituloBlocoDadosMinimosEmitente({ nfse: true, nfe: true, nfce: false })
    ).toBe(TITULO_DADOS_MINIMOS_NEUTRO);
    expect(countDocumentosAtivosSelecionados({ nfse: true, nfe: true, nfce: false })).toBe(2);
    expect(getHintBlocoDadosMinimosEmitente({ nfse: true, nfe: true, nfce: false })).toContain(
      'documentos selecionados'
    );
  });

  it('título neutro quando só NF-e (um tipo, não é só NFS-e)', () => {
    expect(
      getTituloBlocoDadosMinimosEmitente({ nfse: false, nfe: true, nfce: false })
    ).toBe(TITULO_DADOS_MINIMOS_NEUTRO);
  });

  it('secção requisitos NFE/NFCE quando qualquer dos dois está activo', () => {
    expect(shouldShowRequisitosNfeNfceSecao(DEFAULT_DOCUMENTOS_ATIVOS)).toBe(false);
    expect(shouldShowRequisitosNfeNfceSecao({ nfse: true, nfe: true, nfce: false })).toBe(true);
    expect(shouldShowRequisitosNfeNfceSecao({ nfse: false, nfe: false, nfce: true })).toBe(true);
  });

  it('FR-CAD-DOC-10: banner só quando emissão NFE/NFC-e não está na UI e tipo activo', () => {
    vi.stubEnv('VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI', 'true');
    expect(isGuiaMeiEmissaoNfeNfceDisponivelNaUi()).toBe(true);
    expect(shouldShowCadastroNfeNfceInfoBanner({ nfse: true, nfe: true, nfce: false })).toBe(false);

    vi.stubEnv('VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI', 'false');
    expect(isGuiaMeiEmissaoNfeNfceDisponivelNaUi()).toBe(false);
    expect(shouldShowCadastroNfeNfceInfoBanner({ nfse: true, nfe: true, nfce: false })).toBe(true);
    expect(shouldShowCadastroNfeNfceInfoBanner({ nfse: true, nfe: false, nfce: false })).toBe(false);
  });
});
