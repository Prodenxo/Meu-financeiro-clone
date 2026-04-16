// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

const listarCodigosMock = vi.fn();

vi.mock('../services/meiNotasService', () => ({
  listarCodigosServicosReferencia: (...args: unknown[]) => listarCodigosMock(...args)
}));

import { MeiCodigoServicoCombobox } from './MeiCodigoServicoCombobox';

describe('MeiCodigoServicoCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCodigosMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('mostra placeholder e chama API ao focar (lista aberta)', async () => {
    const onChange = vi.fn();
    render(
      <MeiCodigoServicoCombobox id="cod-test" value="" onChange={onChange} />
    );

    const input = screen.getByPlaceholderText(/Pesquisar código ou descrição/i);
    fireEvent.focus(input);

    await waitFor(() => expect(listarCodigosMock).toHaveBeenCalled());
    expect(listarCodigosMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it('após debounce, pesquisa envia q para a API', async () => {
    listarCodigosMock.mockResolvedValue([
      { codigo: '01.01', descricao: 'Consultoria' }
    ]);
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Pesquisar código ou descrição/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'cons' } });

    await waitFor(
      () => {
        expect(listarCodigosMock).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'cons', limit: 50 })
        );
      },
      { timeout: 4000 }
    );
  });

  it('selecionar opção define codigo via onChange', async () => {
    listarCodigosMock.mockResolvedValue([{ codigo: '10.05', descricao: 'Serviço X' }]);
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Pesquisar código ou descrição/i);
    fireEvent.focus(input);

    const opt = await screen.findByRole('option', { name: /10\.05/i });
    fireEvent.mouseDown(opt);

    expect(onChange).toHaveBeenCalledWith('10.05');
  });

  it('Limpar remove seleção', async () => {
    listarCodigosMock.mockImplementation(async ({ q }: { q?: string }) => {
      if (q === '01') return [{ codigo: '01', descricao: 'A' }];
      return [];
    });
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="01" onChange={onChange} />);

    await waitFor(() => {
      expect(listarCodigosMock).toHaveBeenCalled();
    });

    const clearBtn = screen.getByRole('button', { name: /^Limpar$/i });
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('código legado sem match mostra aviso', async () => {
    listarCodigosMock.mockImplementation(async ({ q }: { q?: string }) => {
      if (q === '99.99') return [];
      return [];
    });

    const onChange = vi.fn();
    render(<MeiCodigoServicoCombobox id="cod-test" value="99.99" onChange={onChange} />);

    expect(
      await screen.findByText(/Este código não consta na lista de referência/i)
    ).toBeTruthy();
  });

  it('falha de rede na resolução inicial (valor pré-preenchido) mostra erro de carga, não aviso legado', async () => {
    listarCodigosMock.mockRejectedValue(new Error('network'));
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="01.02" onChange={onChange} />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Não foi possível carregar os códigos/i);
    expect(screen.queryByText(/Este código não consta na lista de referência/i)).toBeNull();
  });

  it('falha de rede mostra mensagem de erro de carga', async () => {
    listarCodigosMock.mockRejectedValue(new Error('network'));
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Pesquisar código ou descrição/i);
    fireEvent.focus(input);

    expect(
      await screen.findByText(/Não foi possível carregar os códigos/i)
    ).toBeTruthy();
  });

  it('Escape com lista aberta fecha a lista sem chamar onChange', async () => {
    listarCodigosMock.mockResolvedValue([{ codigo: '01', descricao: 'A' }]);
    const onChange = vi.fn();

    render(<MeiCodigoServicoCombobox id="cod-test" value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/Pesquisar código ou descrição/i);
    fireEvent.focus(input);
    await screen.findByRole('listbox');

    fireEvent.keyDown(input, { key: 'Escape', bubbles: true });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
