import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getGuiaMeiConnectivityHelpHref,
  GUIMEI_CONNECTIVITY_DOC_ANCHOR,
  GUIMEI_CONNECTIVITY_STATIC_HELP_PATH
} from './guiaMeiConnectivityUserMessage';

describe('getGuiaMeiConnectivityHelpHref', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa URL configurada com âncora de conectividade', () => {
    vi.stubEnv(
      'VITE_MEI_OPERACAO_NFSE_DOC_URL',
      'https://example.com/doc.md#outro'
    );
    expect(getGuiaMeiConnectivityHelpHref()).toBe(
      `https://example.com/doc.md#${GUIMEI_CONNECTIVITY_DOC_ANCHOR}`
    );
  });

  it('sem env, aponta para guia estático em public com âncora', () => {
    vi.stubEnv('VITE_MEI_OPERACAO_NFSE_DOC_URL', '');
    expect(getGuiaMeiConnectivityHelpHref()).toBe(
      `${GUIMEI_CONNECTIVITY_STATIC_HELP_PATH}#${GUIMEI_CONNECTIVITY_DOC_ANCHOR}`
    );
  });
});
