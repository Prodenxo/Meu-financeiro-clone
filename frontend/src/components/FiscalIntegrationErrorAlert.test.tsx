// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import {
  EmissaoFiscalErrorAlert,
  EmissaoFiscalErrorAlertModal,
  GuiaMeiEmpresaCadastroErrorPanel,
  LongFiscalErrorMessage,
  PlugnotasIntegrationErrorAlert
} from './FiscalIntegrationErrorAlert';
import { FISCAL_ERROR_LONG_THRESHOLD } from '../lib/fiscalUserError';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import { MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT } from '../utils/nfseNacionalPlugnotasErrorHints';
import { MEI_GUIDE_SERPRO_UNAVAILABLE } from '../utils/mapMeiGuideValidateErrorToUserMessage';

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

  it('FR-CID-UX-02: mostra hint IBGE quando mensagem cita tabela de cidades / codigoCidade', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert
          documentTypeLabel="NFS-e"
          message="Valor não encontrado na tabela de cidades do IBGE."
        />
      );
    });
    expect(container.textContent).toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
    expect(container.querySelector('[role="note"]')?.textContent).toContain('tabela de cidades');
  });

  it('FR-TIBGE-UX-01 / TIBGE-L1: hint IBGE quando mensagem cita fields.endereco.codigoIBGECidade e tabela', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert
          documentTypeLabel="NFS-e"
          message="Falha na validação: fields.endereco.codigoIBGECidade — valor não encontrado na tabela de cidades do IBGE."
        />
      );
    });
    expect(container.textContent).toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
    expect(container.querySelector('[role="note"]')).toBeTruthy();
  });

  it('FR-TIBGE / UX §3.2: híbrido PREF-L1 + TIBGE — hint IBGE não substitui prefeitura-config', async () => {
    const hybrid =
      'Falha na validação: fields.nfse.config.prefeitura: Preenchimento obrigatório. fields.endereco.codigoIBGECidade não consta na tabela de cidades do IBGE.';
    const root = createRoot(container);
    await act(async () => {
      root.render(<EmissaoFiscalErrorAlert documentTypeLabel="NFS-e" message={hybrid} />);
    });
    expect(container.textContent).toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
    expect(
      container.querySelector('[role="region"][aria-label="Configuração de prefeitura no NFS-e"]')
    ).toBeTruthy();
  });

  it('FR-PLOGIN / PLOGIN-UX-L1: mensagem com prefeitura.login obrigatório — região dedicada (distinto PREF-L1)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert
          documentTypeLabel="NFS-e"
          message="HTTP 400: fields.nfse.config.prefeitura.login é obrigatório no cadastro NFSe."
        />
      );
    });
    expect(
      container.querySelector('[role="region"][aria-label="Acesso ao portal da prefeitura no NFS-e"]')
    ).toBeTruthy();
    expect(container.textContent).toContain('acesso ao portal da prefeitura');
    expect(
      container.querySelector('[role="region"][aria-label="Configuração de prefeitura no NFS-e"]')
    ).toBeNull();
  });

  it('FR-CID-UX-02: mensagem só prefeitura não mostra hint IBGE', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert
          documentTypeLabel="NFS-e"
          message="Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório"
        />
      );
    });
    expect(container.textContent).not.toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
  });

  it('mensagem longa oferece expansão técnica e depois mostra texto completo', async () => {
    const inner = 'x'.repeat(FISCAL_ERROR_LONG_THRESHOLD + 40);
    const longBody = JSON.stringify({ success: false, message: inner, errors: { code: 'x' } });
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <EmissaoFiscalErrorAlert documentTypeLabel="NFSe" message={longBody} />
      );
    });
    const btn = container.querySelector('button');
    expect(btn?.textContent).toContain('Ver detalhes técnicos');
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
    expect(btn?.getAttribute('aria-controls')).toBeTruthy();

    await act(async () => {
      btn?.click();
    });

    expect(container.textContent).toContain(longBody);
    expect(container.textContent).toContain('Ocultar detalhes técnicos');
    const hideBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ocultar detalhes técnicos')
    );
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

  it('ROB: usa contrato estruturado para ambiente/configuração sem expor endpoint como narrativa', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PlugnotasIntegrationErrorAlert
          title="Falha na operação"
          message="Token inválido (POST /empresa no emissor fiscal)"
          plugnotasCode="ambiente_configuracao"
          httpStatus={401}
          plugnotasRequest={{ method: 'POST', path: '/empresa' }}
        />
      );
    });
    expect(container.textContent).toContain('Configuração do emissor fiscal');
    expect(container.textContent).toMatch(/URL base|token|ambiente/i);
    expect(container.textContent).not.toContain('POST /empresa');
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

  it('FR-NAT-ERR-01: mensagem só com inscricaoMunicipal mostra copy municipal e link operação', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="Validação Plugnotas: inscricaoMunicipal obrigatória no payload." />
      );
    });
    expect(container.textContent).toContain('cadastro municipal');
    expect(container.textContent).toContain('painel do emissor');
    expect(container.querySelector('a[href^="/guia-mei-nfse-nacional.html#emissor-nfse-nacional-spike-nat01"]')).toBeTruthy();
  });

  it('FR-PREF-UX-01: fields.nfse.config.prefeitura mostra copy específica (não só cadastro municipal genérico)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório" />
      );
    });
    expect(container.textContent).toContain('configuração da prefeitura no NFS-e');
    expect(container.textContent).toContain('inscrição municipal opcional');
    expect(container.textContent).toContain('painel do emissor');
    expect(container.querySelector('[role="region"][aria-label="Configuração de prefeitura no NFS-e"]')).toBeTruthy();
    expect(container.querySelector('a[href^="/guia-mei-nfse-nacional.html#emissor-nfse-nacional-spike-nat01"]')).toBeTruthy();
    expect(container.textContent).not.toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
  });

  it('FR-CID-UX-02: painel cadastro mostra hint IBGE após mensagem longa (endereco.codigoCidade)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="HTTP 400: fields.endereco.codigoCidade não localizado na tabela IBGE." />
      );
    });
    expect(container.textContent).toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
  });

  it('FR-TIBGE-UX-01: painel cadastro mostra hint IBGE com codigoIBGECidade (mensagem do emissor)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel message="HTTP 400: fields.endereco.codigoIBGECidade não consta na tabela de cidades do IBGE." />
      );
    });
    expect(container.textContent).toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
  });

  it('FR-CONS-P1: suprime hint IBGE cidade quando fiscalApiErrorCode é Serpro indisponível', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel
          message="HTTP 400: fields.endereco.codigoCidade não localizado na tabela IBGE."
          fiscalApiErrorCode={MEI_GUIDE_SERPRO_UNAVAILABLE}
        />
      );
    });
    expect(container.textContent).not.toContain(MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT);
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

  it('FR-MEI-CERT-GW-01: gateway upstream omite LongFiscalErrorMessage e mostra rodapé de indisponibilidade', async () => {
    const root = createRoot(container);
    const html = '<html><body>502 Bad Gateway</body></html>';
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel
          message={html}
          fiscalErrorCode="plugnotas_gateway_502"
          fiscalHttpStatus={502}
        />
      );
    });
    expect(container.textContent).toContain('Emissor fiscal temporariamente indisponível');
    expect(container.textContent).toContain('indisponibilidade temporária');
    expect(container.textContent).not.toContain('<html');
    expect(container.textContent).not.toMatch(/validação de JSON.*provedor de emissão fiscal/s);
    expect(
      Array.from(container.querySelectorAll('button')).some((b) => b.textContent?.includes('Ver detalhes completos'))
    ).toBe(false);
  });

  it('ROB: payload_contrato mostra revisão de dados em vez de narrativa genérica do provedor', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel
          message="Falha na validação do JSON de Empresa: endereco.logradouro inválido"
          fiscalErrorCode="payload_contrato"
          fiscalHttpStatus={400}
          plugnotasRequest={{ method: 'POST', path: '/empresa' }}
        />
      );
    });
    expect(container.textContent).toContain('Revise os dados do cadastro');
    expect(container.textContent).not.toContain('POST /empresa');
  });

  it('RTCAD a11y: mantém apenas um alerta principal por cenário', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <GuiaMeiEmpresaCadastroErrorPanel
          message="Token inválido (POST /empresa no emissor fiscal)"
          fiscalErrorCode="ambiente_configuracao"
          fiscalHttpStatus={401}
          plugnotasRequest={{ method: 'POST', path: '/empresa' }}
        />
      );
    });
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
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
