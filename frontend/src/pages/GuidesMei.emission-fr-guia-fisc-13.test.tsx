// @vitest-environment jsdom
/**
 * FR-GUIA-FISC-13 — anti-duplo clique na emissão e retry transitório (novo POST).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { within } from '@testing-library/dom';

import GuidesMei from './GuidesMei';
import { MEI_WORKSPACE_STORAGE_KEY } from './guidesMeiWorkspaceStorage';
import { ApiClientError } from '../utils/apiClientError';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const { useAuthStoreMock, authState } = vi.hoisted(() => {
  const state = {
    role: 'usuario' as 'superadmin' | 'admin' | 'usuario' | 'outsider',
    mei: true
  };
  const hook = Object.assign(() => state, { getState: () => state });
  return { useAuthStoreMock: hook, authState: state };
});

const frAp03 = vi.hoisted(() => ({
  nfseEmitente: null as import('../services/guidesMeiService').NfseEmitenteSnapshot | null,
  documento: null as string | null
}));

const fullSnapshot = (): import('../services/guidesMeiService').NfseEmitenteSnapshot => ({
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

const emitirNfseMock = vi.hoisted(() => vi.fn());
const emitirNfeMock = vi.hoisted(() => vi.fn());
const emitirNfceMock = vi.hoisted(() => vi.fn());

vi.mock('../services/meiNotasService', () => ({
  arquivarNfse: vi.fn(async () => ({})),
  atualizarNfse: vi.fn(async () => ({})),
  atualizarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
  baixarNfsePdf: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.pdf' })),
  baixarNfseXml: vi.fn(async () => ({ blob: new Blob(), filename: 'nota.xml' })),
  cadastrarCertificadoEmissaoNf: vi.fn(async () => ({ id: 'cert-1', message: 'ok' })),
  cadastrarEmpresaEmissaoNf: vi.fn(async () => ({ cnpj: '12345678000190', message: 'ok', raw: {} })),
  consultarEmpresaEmissaoNf: vi.fn(async () => ({ message: 'ok', data: {} })),
  cancelarNfse: vi.fn(async () => ({})),
  emitirNfse: (...args: unknown[]) => emitirNfseMock(...args),
  emitirNfe: (...args: unknown[]) => emitirNfeMock(...args),
  emitirNfce: (...args: unknown[]) => emitirNfceMock(...args),
  fetchLimiteFaturamentoMei: vi.fn(async () => null),
  listarCatalogoNfseClientes: vi.fn(async () => []),
  listarCatalogoNfseProdutos: vi.fn(async () => []),
  listarNfse: vi.fn(async () => []),
  obterNfse: vi.fn(async () => ({}))
}));

async function fillMinimalValidNfeLikeForm(container: HTMLElement, type: 'NFE' | 'NFCE') {
  const id = type === 'NFE' ? '#mei-fiscal-emission-type-NFE' : '#mei-fiscal-emission-type-NFCE';
  await act(async () => {
    fireEvent.click(container.querySelector(id)!);
  });
  const confirmTipo = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Alterar tipo'
  );
  if (confirmTipo) {
    await act(async () => {
      fireEvent.click(confirmTipo);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }
  await waitFor(() => {
    expect(container.querySelector('#mei-nfe-emitente-cnpj')).toBeTruthy();
  });

  const addItem = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Adicionar item')
  );
  expect(addItem).toBeTruthy();
  await act(async () => {
    fireEvent.click(addItem!);
  });

  await act(async () => {
    fireEvent.change(container.querySelector('#mei-nfe-emitente-cnpj')!, {
      target: { value: '11.222.333/0001-81' }
    });
    fireEvent.change(container.querySelector('#mei-nfe-emitente-razao')!, {
      target: { value: 'Emitente Teste' }
    });
    fireEvent.change(container.querySelector('#mei-nfe-dest-doc')!, {
      target: { value: '529.982.247-25' }
    });
    fireEvent.change(container.querySelector('#mei-nfe-dest-razao')!, {
      target: { value: 'Cliente Teste' }
    });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-codigo')!, { target: { value: 'SKU1' } });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-descricao')!, { target: { value: 'Produto' } });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-ncm')!, { target: { value: '12345678' } });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-cfop')!, { target: { value: '5102' } });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-qtd')!, { target: { value: '2' } });
    fireEvent.change(container.querySelector('#mei-nfe-item-0-vu')!, { target: { value: '10,50' } });
  });
}

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

describe('GuidesMei FR-GUIA-FISC-13 (emissão)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  beforeEach(() => {
    authState.role = 'superadmin';
    authState.mei = true;
    localStorage.removeItem(MEI_WORKSPACE_STORAGE_KEY);
    frAp03.nfseEmitente = fullSnapshot();
    frAp03.documento = null;
    emitirNfseMock.mockReset();
    emitirNfeMock.mockReset();
    emitirNfceMock.mockReset();
    emitirNfeMock.mockResolvedValue({ id: 'nfe-1', protocol: 'P' });
    emitirNfceMock.mockResolvedValue({ id: 'nfce-1', protocol: 'P' });
    fetchNfsePrestadorPrefillMock.mockImplementation(async () => defaultNfsePrefillEmpty());
  });

  it('duplo clique em Emitir: um único POST enquanto o primeiro pedido não conclui', async () => {
    emitirNfseMock.mockImplementation(() => new Promise(() => {}));

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
      fireEvent.change(razaoTomador, { target: { value: 'Tomador SA' } });
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
      fireEvent.change(disc, { target: { value: 'Disc teste FISC-13' } });
    });

    const emitBtn = view.getByRole('button', { name: /Emitir NFSe/i });
    await act(async () => {
      fireEvent.click(emitBtn);
      fireEvent.click(emitBtn);
    });

    expect(emitirNfseMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('erro 503 + Tentar novamente: segundo POST e omitir idIntegracao manual no retry', async () => {
    emitirNfseMock
      .mockRejectedValueOnce(new ApiClientError('indisponível', { httpStatus: 503 }))
      .mockResolvedValueOnce({ id: 'nfse-2', protocol: 'P-2' });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);

    const idInt = view.getByLabelText(/ID de integração/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(idInt, { target: { value: 'meu-id-fixo-manual' } });
    });

    const tomadorDoc = view.getByPlaceholderText('000.000.000-00') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(tomadorDoc, { target: { value: '529.982.247-25' } });
    });
    const razaoTomador = view.getAllByPlaceholderText('Razão social')[1] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(razaoTomador, { target: { value: 'Tomador SA' } });
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
      fireEvent.change(disc, { target: { value: 'Disc retry FISC-13' } });
    });

    const emitBtn = view.getByRole('button', { name: /Emitir NFSe/i });
    await act(async () => {
      fireEvent.click(emitBtn);
      await Promise.resolve();
      await Promise.resolve();
    });

    const retryBtn = await view.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(emitirNfseMock).toHaveBeenCalledTimes(2);
    expect(emitirNfseMock.mock.calls[0][0]).toMatchObject({ idIntegracao: 'meu-id-fixo-manual' });
    expect(emitirNfseMock.mock.calls[1][0]).not.toHaveProperty('idIntegracao');

    await waitFor(() => {
      const tier = panel.querySelector('[data-nfse-feedback-tier="success"]');
      expect(tier?.textContent).toMatch(/NFSe enviada\. Protocolo P-2/);
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('NF-e: duplo clique em Emitir — um único POST enquanto o primeiro pedido não conclui', async () => {
    emitirNfeMock.mockImplementation(() => new Promise(() => {}));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    await fillMinimalValidNfeLikeForm(container, 'NFE');

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NF-e')
    );
    expect(emitBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(emitBtn!);
      fireEvent.click(emitBtn!);
    });

    expect(emitirNfeMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('NFC-e: duplo clique em Emitir — um único POST enquanto o primeiro pedido não conclui', async () => {
    emitirNfceMock.mockImplementation(() => new Promise(() => {}));

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    await fillMinimalValidNfeLikeForm(container, 'NFCE');

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NFC-e')
    );
    expect(emitBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(emitBtn!);
      fireEvent.click(emitBtn!);
    });

    expect(emitirNfceMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('NF-e: erro 503 + Tentar novamente — segundo POST e feedback de sucesso (paridade POST-0)', async () => {
    emitirNfeMock
      .mockRejectedValueOnce(new ApiClientError('indisponível', { httpStatus: 503 }))
      .mockResolvedValueOnce({ id: 'nfe-retry', protocol: 'P-RETRY' });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuidesMei />);
    });
    await openNfsePanel(container);

    await fillMinimalValidNfeLikeForm(container, 'NFE');

    const panel = container.querySelector('#mei-panel-nfse') as HTMLElement;
    const view = within(panel);

    const emitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Emitir NF-e')
    );
    expect(emitBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(emitBtn!);
      await Promise.resolve();
      await Promise.resolve();
    });

    const retryBtn = await view.findByRole('button', { name: /Tentar novamente/i });
    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(emitirNfeMock).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      const tier = panel.querySelector('[data-nfse-feedback-tier="success"]');
      expect(tier?.textContent).toMatch(/NF-e: nota enviada\. Protocolo P-RETRY/);
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
