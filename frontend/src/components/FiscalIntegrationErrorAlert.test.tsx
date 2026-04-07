// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import {
  EmissaoFiscalErrorAlert,
  EmissaoFiscalErrorAlertModal,
  FISCAL_ERROR_LONG_THRESHOLD,
  GuiaMeiEmpresaCadastroErrorPanel,
  LongFiscalErrorMessage,
  PlugnotasIntegrationErrorAlert
} from './FiscalIntegrationErrorAlert';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

describe('EmissaoFiscalErrorAlert', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mostra texto curto integralmente', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert documentTypeLabel="NF-e" message="Erro curto." />
      );
    });
    expect(container.textContent).toContain('Erro curto.');
    expect(container.textContent).toContain('NF-e');
    expect(container.querySelector('button')).toBeNull();
  });

  it('emissão: mostra dica nacional quando mensagem cita nfse.nacional (US-MEI-NAT-04)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert documentTypeLabel="NFS-e" message="Validação: campo nfse.nacional rejeitado." />
      );
    });
    expect(container.textContent).toContain('nfse.nacional rejeitado');
    expect(container.textContent).toContain('município');
    expect(container.querySelector('a[href^="/guia-mei-nfse-nacional.html#emissor-nfse-nacional-spike-nat01"]')).toBeTruthy();
  });

  it('mensagem longa oferece expansão e depois mostra texto completo', async () => {
    const longBody = 'x'.repeat(FISCAL_ERROR_LONG_THRESHOLD + 40);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert documentTypeLabel="NFSe" message={longBody} />
      );
    });
    const btn = container.querySelector('button');
    expect(btn?.textContent).toContain('Ver detalhes completos');
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
    expect(btn?.hasAttribute('aria-controls')).toBe(false);

    await act(async () => {
      btn?.click();
    });

    expect(container.textContent).toContain(longBody);
    expect(container.textContent).toContain('Ocultar detalhes');
    const hideBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Ocultar'));
    expect(hideBtn?.getAttribute('aria-controls')).toBeTruthy();
  });

  it('modal: link da dica nacional usa tom rose (pós-QA US-MEI-NAT-04)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlertModal
          documentTypeLabel="NFS-e"
          message="Rejeição no emissor: nfse.nacional não aceito."
        />
      );
    });
    const a = container.querySelector('a[href*="guia-mei-nfse-nacional"]');
    expect(a).toBeTruthy();
    expect(a?.className).toMatch(/text-rose-800/);
    expect(a?.className).not.toMatch(/decoration-rose-700/);
  });
});

describe('PlugnotasIntegrationErrorAlert', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mostra dica NFS-e Nacional quando mensagem cita ambiente nacional (pós-QA US-MEI-NAT-04)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PlugnotasIntegrationErrorAlert
          title="Falha na operação"
          message="HTTP 400: ambiente nacional não disponível para este município."
        />
      );
    });
    expect(container.textContent).toContain('Falha na operação');
    expect(container.textContent).toContain('ambiente nacional');
    expect(container.querySelector('a[href^="/guia-mei-nfse-nacional.html#emissor-nfse-nacional-spike-nat01"]')).toBeTruthy();
  });
});

describe('GuiaMeiEmpresaCadastroErrorPanel', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mostra dica NFC-e e provedor quando mensagem cita versaoQrCode', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="Falha: revisar nfce.config.versaoQrCode" />
      );
    });
    expect(container.textContent).toContain('revisar nfce.config.versaoQrCode');
    expect(container.textContent).toContain('NFC-e');
    expect(container.textContent).toContain('provedor de emissão fiscal');
    expect(container.textContent).toMatch(
      /guia rápido.*cadastro|documentação de operação|abra o guia rápido de cadastro/i
    );
    expect(container.textContent).toMatch(/guia rápido de cadastro|documentação de operação/);
    expect(
      container.querySelector('a[href^="/guia-mei-nfce-cadastro.html#cadastro-empresa-nfce-qrcode-sefaz"]')
    ).toBeTruthy();
  });

  it('mostra dica NFS-e Nacional e link quando mensagem cita município e nacional (US-MEI-NAT-04)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="Município não credenciado para NFS-e Nacional." />
      );
    });
    expect(container.textContent).toContain('Município não credenciado');
    expect(container.textContent).toContain('NFS-e Nacional');
    expect(container.querySelector('a[href^="/guia-mei-nfse-nacional.html#emissor-nfse-nacional-spike-nat01"]')).toBeTruthy();
  });

  it('mensagem longa mantém expansão e hint NFC-e com nfce.config.sefaz', async () => {
    const filler = 'z'.repeat(FISCAL_ERROR_LONG_THRESHOLD + 30);
    const msg = `${filler}\nnfce.config.sefaz obrigatório`;
    const root = createRoot(container);
    await act(async () => {
      root.render(<GuiaMeiEmpresaCadastroErrorPanel message={msg} />);
    });
    await act(async () => {
      container.querySelector('button')?.click();
    });
    expect(container.textContent).toContain('nfce.config.sefaz obrigatório');
    expect(container.textContent).toContain('NFC-e');
  });

  it('não exibe bloco de doc NFC-e para erro genérico nem rodapé de provedor (QA US-03)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<GuiaMeiEmpresaCadastroErrorPanel message="Informe a razão social." />);
    });
    expect(container.textContent).toContain('Informe a razão social.');
    expect(container.textContent).not.toContain('A Guia MEI só emite');
    expect(container.textContent).not.toContain('provedor de emissão fiscal');
    expect(container.textContent).toContain('formulário');
  });

  it('exibe checklist e Saiba mais quando fiscalErrorCode é certificado_409_sem_id (US-MEI-FISC-03)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel
          message="O certificado já está cadastrado no emissor fiscal, mas não foi possível obter o ID automaticamente."
          fiscalErrorCode={PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID}
        />
      );
    });
    expect(container.textContent).toContain('CNPJ no formulário');
    expect(container.textContent).toContain('provedor fiscal');
    expect(container.textContent).toContain('Saiba mais');
    expect(
      container.querySelector('a[href^="/guia-mei-certificado-409-sem-id.html#certificado-emissor-409-sem-id"]')
    ).toBeTruthy();
  });
});

describe('LongFiscalErrorMessage', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('tom warning expande mensagem longa como danger/rose', async () => {
    const longBody = 'y'.repeat(FISCAL_ERROR_LONG_THRESHOLD + 20);
    const root = createRoot(container);
    await act(async () => {
      root.render(<LongFiscalErrorMessage message={longBody} tone="warning" />);
    });
    await act(async () => {
      container.querySelector('button')?.click();
    });
    expect(container.textContent).toContain(longBody);
  });
});
