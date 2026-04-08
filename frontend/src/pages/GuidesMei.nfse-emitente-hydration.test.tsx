// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { within } from '@testing-library/dom';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';

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

const emitenteStatus = vi.hoisted(() =>
  vi.fn(async () => ({
    hasUserCertificate: true,
    hasEnvCertificate: false,
    documento: '11222333000181',
    certValidFrom: null,
    certValidTo: null,
    nfseEmitente: {
      certDocument: '11222333000181',
      razaoSocial: 'Hydrate Co LTDA',
      nomeFantasia: 'Hydrate',
      email: 'emitente@hydrate.test',
      regimeTributario: '1' as const,
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
    }
  }))
);

vi.mock('../store/authStore', () => ({
  useAuthStore: useAuthStoreMock
}));

vi.mock('../services/guidesMeiService', () => ({
  downloadMeiGuide: vi.fn(async () => ({ blob: new Blob(), filename: 'guia-mei.pdf' })),
  downloadParcelamentoPdf: vi.fn(async () => ({ blob: new Blob(), filename: 'p.pdf' })),
  fetchMeiCertificateStatus: emitenteStatus,
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

describe('GuidesMei hidratação prestador NFS-e (FR-AP-02)', () => {
  beforeEach(() => {
    authState.role = 'usuario';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    emitenteStatus.mockClear();
  });

  it('preenche campos do prestador na NFS-e quando nfseEmitente vem no status', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const nfseTab = container.querySelector('#mei-tab-nfse');
    expect(nfseTab).toBeTruthy();
    await act(async () => {
      nfseTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const panel = container.querySelector('#mei-panel-nfse');
    expect(panel).toBeTruthy();
    const view = within(panel as HTMLElement);
    const cnpjInput = view.getByPlaceholderText('00.000.000/0001-00') as HTMLInputElement;
    expect(cnpjInput.value).toBe('11.222.333/0001-81');

    const razaoFields = view.getAllByPlaceholderText('Razão social') as HTMLInputElement[];
    expect(razaoFields[0].value).toBe('Hydrate Co LTDA');

    const email = view.getByPlaceholderText('email@prestador.com') as HTMLInputElement;
    expect(email.value).toBe('emitente@hydrate.test');

    const logr = view.getByPlaceholderText('Rua / Avenida') as HTMLInputElement;
    expect(logr.value).toBe('Av Brigadeiro');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
