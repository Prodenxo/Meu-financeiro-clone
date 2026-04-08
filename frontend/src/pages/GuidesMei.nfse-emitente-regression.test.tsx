// @vitest-environment jsdom
/**
 * FR-AP-03 — regressão autopreenchimento prestador NFS-e (com/sem snapshot, edição, payload).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { within } from '@testing-library/dom';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';
import { emitirNfse } from '../services/meiNotasService';
import type { NfseEmitenteSnapshot } from '../services/guidesMeiService';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as const,
    mei: true
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

const frAp03 = vi.hoisted(() => ({
  nfseEmitente: null as NfseEmitenteSnapshot | null,
  documento: null as string | null
}));

const defaultNfsePrefillEmpty = () => ({
  prestadorCpfCnpj: null,
  prestadorRazaoSocial: null,
  prestadorEmail: null,
  prestadorInscricaoMunicipal: null,
  prestadorEndereco: null,
  sourceRowId: null
});

const { fetchNfsePrestadorPrefillMock } = vi.hoisted(() => ({
  fetchNfsePrestadorPrefillMock: vi.fn()
}));

const fullSnapshot = (): NfseEmitenteSnapshot => ({
  certDocument: '11222333000181',
  razaoSocial: 'Hydrate Co LTDA',
  nomeFantasia: 'Hydrate',
  email: 'emitente@hydrate.test',
  regimeTributario: '1',
  simplesNacional: true,
  cep: '01310100',
  tipoLogradouro: 'Rua',
  logradouro: 'Av Brigadeiro',
  numero: '500',
  complemento: '',
  bairro: 'Jardim Paulista',
  codigoCidade: '3550308',
  descricaoCidade: 'São Paulo',
  estado: 'SP',
  inscricaoMunicipal: ''
});

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  downloadParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  fetchMeiCertificateStatus: vi.fn(async () => ({
    hasUserCertificate: true,
    hasEnvCertificate: false,
    documento: frAp03.documento,
    certValidFrom: null,
    certValidTo: null,
    nfseEmitente: frAp03.nfseEmitente
  })),
  fetchMeiPeriods: vi.fn(async () => []),
  fetchMeiPeriodsByCnpj: vi.fn(async () => []),
  fetchParcelamentos: vi.fn(async () => ({ parcelamentos: [] })),
  removeMeiCertificate: vi.fn(async () => ({
    hasUserCertificate: false,
    hasEnvCertificate: false,
    documento: null,
    nfseEmitente: null
  })),
  uploadMeiCertificate: vi.fn(async () => ({ documento: null })),
  patchMeiCertificateEmitenteNfse: vi.fn(async () => ({})),
  validateMeiGuide: vi.fn(async () => ({ valid: true }))
}));

vi.mock('../services/meiPrestadorPrefillService', () => ({
  fetchNfsePrestadorPrefill: fetchNfsePrestadorPrefillMock
}));

vi.mock('../services/meiNotasService', () => ({
  arquivarNfse: vi.fn(async () => ({})),
  atualizarNfse: vi.fn(async () => ({})),
  atualizarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarCertificadoEmissaoNf: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
  cadastrarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok' })),
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: vi.fn(async () => ({ id: 'nfse-1', protocol: 'P-1' })),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

const emitirNfseMock = vi.mocked(emitirNfse);

async function openNfsePanel(container: HTMLElement) {
  await act(async () => {
    await Promise.resolve();
  });
  const nfseTab = container.querySelector('#mei-tab-nfse');
  expect(nfseTab).toBeTruthy();
  await act(async () => {
    nfseTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('GuidesMei regressão autopreenchimento NFS-e (FR-AP-03)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    frAp03.nfseEmitente = null;
    frAp03.documento = null;
    emitirNfseMock.mockClear();
    fetchNfsePrestadorPrefillMock.mockImplementation(async () => defaultNfsePrefillEmpty());
  });

  it('sem nfseEmitente, prestador permanece vazio para preenchimento manual (sem erro de montagem)', async () => {
    frAp03.nfseEmitente = null;
    frAp03.documento = null;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);
    const cnpjPrestador = view.getByPlaceholderText('00.000.000/0001-00') as HTMLInputElement;
    expect(cnpjPrestador.value).toBe('');

    const razaoFields = view.getAllByPlaceholderText('Razão social') as HTMLInputElement[];
    expect(razaoFields[0].value).toBe('');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('com nfseEmitente, edição manual da razão social do prestador é preservada na UI', async () => {
    frAp03.nfseEmitente = fullSnapshot();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);
    const razaoPrestador = view.getAllByPlaceholderText('Razão social')[0] as HTMLInputElement;
    expect(razaoPrestador.value).toBe('Hydrate Co LTDA');

    await act(async () => {
      fireEvent.change(razaoPrestador, { target: { value: 'Razão Editada Manualmente' } });
    });
    expect(razaoPrestador.value).toBe('Razão Editada Manualmente');

    await act(async () => {
      await Promise.resolve();
    });
    expect(razaoPrestador.value).toBe('Razão Editada Manualmente');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('emitir NFS-e envia payload com valores atuais do formulário (prestador editado após hidratação)', async () => {
    frAp03.nfseEmitente = fullSnapshot();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);

    const razaoPrestador = view.getAllByPlaceholderText('Razão social')[0] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(razaoPrestador, { target: { value: 'Payload Razão Final' } });
    });

    const tomadorDoc = view.getByPlaceholderText('000.000.000-00') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(tomadorDoc, { target: { value: '529.982.247-25' } });
    });

    const razaoTomador = view.getAllByPlaceholderText('Razão social')[1] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(razaoTomador, { target: { value: 'Tomador Teste SA' } });
    });

    const codigoServico = view.getByPlaceholderText(/01\.02\.03/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(codigoServico, { target: { value: '010203' } });
    });

    const cnae = view.getByPlaceholderText('6201500') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(cnae, { target: { value: '6201500' } });
    });

    const valor = view.getByPlaceholderText('1500,00') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(valor, { target: { value: '100,50' } });
    });

    const disc = view.getByPlaceholderText('Descreva o serviço prestado') as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(disc, { target: { value: 'Discriminação contrato teste FR-AP-03' } });
    });

    const emitBtn = view.getByRole('button', { name: /Emitir NFSe/i });
    expect((emitBtn as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(emitBtn);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(emitirNfseMock).toHaveBeenCalledTimes(1);
    const payload = emitirNfseMock.mock.calls[0][0];
    expect(payload.prestadorRazaoSocial).toBe('Payload Razão Final');
    expect(String(payload.prestadorCpfCnpj || '').replace(/\D/g, '')).toBe('11222333000181');
    expect(String(payload.tomadorCpfCnpj || '').replace(/\D/g, '')).toBe('52998224725');
    expect(payload.tomadorRazaoSocial).toBe('Tomador Teste SA');
    expect(payload.servico.codigo.trim()).toBe('010203');
    expect(payload.servico.discriminacao.trim()).toBe('Discriminação contrato teste FR-AP-03');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('emitir NFS-e envia prestadorInscricaoMunicipal quando o BFF prefill a preenche (mitigação QA Story 2.3)', async () => {
    frAp03.nfseEmitente = fullSnapshot();
    fetchNfsePrestadorPrefillMock.mockImplementation(async () => ({
      ...defaultNfsePrefillEmpty(),
      prestadorInscricaoMunicipal: 'IM-PREFILL-99'
    }));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);

    const tomadorDoc = view.getByPlaceholderText('000.000.000-00') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(tomadorDoc, { target: { value: '529.982.247-25' } });
    });

    const razaoTomador = view.getAllByPlaceholderText('Razão social')[1] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(razaoTomador, { target: { value: 'Tomador IM SA' } });
    });

    const codigoServico = view.getByPlaceholderText(/01\.02\.03/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(codigoServico, { target: { value: '010203' } });
    });

    const cnae = view.getByPlaceholderText('6201500') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(cnae, { target: { value: '6201500' } });
    });

    const valor = view.getByPlaceholderText('1500,00') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(valor, { target: { value: '100,50' } });
    });

    const disc = view.getByPlaceholderText('Descreva o serviço prestado') as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(disc, { target: { value: 'Serviço teste IM' } });
    });

    const emitBtn = view.getByRole('button', { name: /Emitir NFSe/i });
    await act(async () => {
      fireEvent.click(emitBtn);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(emitirNfseMock).toHaveBeenCalledTimes(1);
    const payload = emitirNfseMock.mock.calls[0][0];
    expect(payload.prestadorInscricaoMunicipal).toBe('IM-PREFILL-99');
    expect(String(payload.prestadorCpfCnpj || '').replace(/\D/g, '')).toBe('11222333000181');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
