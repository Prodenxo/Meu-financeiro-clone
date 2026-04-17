// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MeiFiscalEmissionDocumentType } from '../components/mei/MeiFiscalEmissionTypeSegmented';
import { useMeiPlugnotasFiscalCapability } from './useMeiPlugnotasFiscalCapability';

const consultarEmpresaEmissaoNf = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  consultarEmpresaEmissaoNf: (...args: unknown[]) => consultarEmpresaEmissaoNf(...args)
}));

describe('useMeiPlugnotasFiscalCapability', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('incrementar capabilityRefetchKey dispara nova chamada a consultarEmpresaEmissaoNf', async () => {
    consultarEmpresaEmissaoNf.mockResolvedValue({ data: { nfe: { ativo: true }, nfce: { ativo: false } } });

    const { rerender } = renderHook(
      ({ key }: { key: number }) =>
        useMeiPlugnotasFiscalCapability({
          cnpjDigits: '12345678000199',
          emissionDocumentType: 'NFE',
          fetchEnabled: true,
          capabilityRefetchKey: key
        }),
      { initialProps: { key: 0 } }
    );

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(1);
    });
    expect(consultarEmpresaEmissaoNf).toHaveBeenCalledWith('12345678000199');

    rerender({ key: 1 });
    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(2);
    });
    expect(consultarEmpresaEmissaoNf).toHaveBeenLastCalledWith('12345678000199');
  });

  it('resposta cancelada (troca de tipo durante fetch) não corrompe o estado final', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    consultarEmpresaEmissaoNf.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );

    const { rerender, result } = renderHook(
      ({ docType }: { docType: MeiFiscalEmissionDocumentType }) =>
        useMeiPlugnotasFiscalCapability({
          cnpjDigits: '12345678000199',
          emissionDocumentType: docType,
          fetchEnabled: true,
          capabilityRefetchKey: 0
        }),
      { initialProps: { docType: 'NFE' as MeiFiscalEmissionDocumentType } }
    );

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(1);
    });

    act(() => {
      rerender({ docType: 'NFSE' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.capabilities).toBeNull();

    act(() => {
      resolveFirst?.({ data: { nfe: { ativo: true }, nfce: { ativo: true } } });
    });

    await waitFor(() => {
      expect(result.current.capabilities).toBeNull();
    });
  });

  it('vários incrementos consecutivos da chave disparam várias chamadas; última resposta aplicada', async () => {
    consultarEmpresaEmissaoNf
      .mockResolvedValueOnce({ data: { nfe: { ativo: false }, nfce: { ativo: false } } })
      .mockResolvedValueOnce({ data: { nfe: { ativo: true }, nfce: { ativo: false } } })
      .mockResolvedValueOnce({ data: { nfe: { ativo: true }, nfce: { ativo: false } } });

    const { rerender, result } = renderHook(
      ({ key }: { key: number }) =>
        useMeiPlugnotasFiscalCapability({
          cnpjDigits: '12345678000199',
          emissionDocumentType: 'NFE',
          fetchEnabled: true,
          capabilityRefetchKey: key
        }),
      { initialProps: { key: 0 } }
    );

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(1);
    });
    rerender({ key: 1 });
    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(2);
    });
    rerender({ key: 2 });
    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(3);
    });
    await waitFor(() => {
      expect(result.current.capabilities?.nfe).toBe('active');
    });
  });

  it('com NFS-e seleccionado não chama consultarEmpresaEmissaoNf mesmo com refetchKey', async () => {
    const { rerender } = renderHook(
      ({ key }: { key: number }) =>
        useMeiPlugnotasFiscalCapability({
          cnpjDigits: '12345678000199',
          emissionDocumentType: 'NFSE',
          fetchEnabled: true,
          capabilityRefetchKey: key
        }),
      { initialProps: { key: 0 } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(consultarEmpresaEmissaoNf).not.toHaveBeenCalled();

    rerender({ key: 99 });
    await act(async () => {
      await Promise.resolve();
    });
    expect(consultarEmpresaEmissaoNf).not.toHaveBeenCalled();
  });
});
