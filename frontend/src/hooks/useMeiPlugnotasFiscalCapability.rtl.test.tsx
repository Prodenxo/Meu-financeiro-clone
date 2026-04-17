// @vitest-environment jsdom
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeiPlugnotasFiscalCapability } from './useMeiPlugnotasFiscalCapability';

const consultarEmpresaEmissaoNf = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  consultarEmpresaEmissaoNf: (...args: unknown[]) => consultarEmpresaEmissaoNf(...args)
}));

/** Simula o pai (`GuidesMei`): sucesso de save incrementa a chave como `bumpFiscalCapabilityRefetchIfApplicable`. */
function SimulatedEmpresaSaveHarness() {
  const [saveSuccessCount, setSaveSuccessCount] = useState(0);
  useMeiPlugnotasFiscalCapability({
    cnpjDigits: '12345678000199',
    emissionDocumentType: 'NFE',
    fetchEnabled: true,
    capabilityRefetchKey: saveSuccessCount
  });
  return (
    <button
      type="button"
      onClick={() => setSaveSuccessCount((c) => c + 1)}
      data-testid="sim-empresa-save-ok"
    >
      Guardar empresa (simulado)
    </button>
  );
}

describe('useMeiPlugnotasFiscalCapability — RTL (FR-GUIA-FISC-11)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('após simular um save bem-sucedido, há uma invocação adicional a consultarEmpresaEmissaoNf', async () => {
    consultarEmpresaEmissaoNf.mockResolvedValue({ data: { nfe: { ativo: true }, nfce: { ativo: false } } });

    render(<SimulatedEmpresaSaveHarness />);

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('sim-empresa-save-ok'));

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNf).toHaveBeenCalledTimes(2);
    });
    expect(consultarEmpresaEmissaoNf).toHaveBeenLastCalledWith('12345678000199');
  });
});
