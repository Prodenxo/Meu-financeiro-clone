// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MeiFiscalModalidadesActivationWizard } from './MeiFiscalModalidadesActivationWizard';

const consultarEmpresaEmissaoNfMock = vi.fn();
const atualizarEmpresaEmissaoNfMock = vi.fn();

vi.mock('../../services/meiNotasService', () => ({
  consultarEmpresaEmissaoNf: (...args: unknown[]) => consultarEmpresaEmissaoNfMock(...args),
  atualizarEmpresaEmissaoNf: (...args: unknown[]) => atualizarEmpresaEmissaoNfMock(...args)
}));

function renderWizard(
  props: Partial<import('react').ComponentProps<typeof MeiFiscalModalidadesActivationWizard>> = {}
) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <MeiFiscalModalidadesActivationWizard
      open
      cnpjDigits="12345678000190"
      target="NFE"
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />
  );
  return { onClose, onSuccess };
}

describe('MeiFiscalModalidadesActivationWizard — FR-GUIA-FISC-14 D2', () => {
  beforeEach(() => {
    consultarEmpresaEmissaoNfMock.mockReset();
    atualizarEmpresaEmissaoNfMock.mockReset();
    consultarEmpresaEmissaoNfMock.mockResolvedValue({
      data: {
        empresa: {
          nfse: { ativo: true },
          nfe: { ativo: false },
          nfce: { ativo: false }
        }
      }
    });
    atualizarEmpresaEmissaoNfMock.mockResolvedValue({
      cnpj: '12345678000190',
      message: 'ok',
      raw: {}
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('checklist: Seguinte sem marcar itens mostra erro acessível', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Seguinte/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Seguinte$/i }));
    expect(screen.getByRole('alert').textContent || '').toMatch(/Confirme todos os itens/i);
  });

  it('fluxo feliz NFE: GET + PATCH com documentosAtivos e onSuccess', async () => {
    const { onSuccess } = renderWizard({ target: 'NFE' });

    fireEvent.click(screen.getByRole('button', { name: /Seguinte/i }));
    fireEvent.click(screen.getByLabelText(/Certificado A1 válido/i));
    fireEvent.click(screen.getByLabelText(/Dados cadastrais da empresa/i));
    fireEvent.click(screen.getByRole('button', { name: /^Seguinte$/i }));

    fireEvent.click(screen.getByRole('button', { name: /Solicitar activação/i }));

    await waitFor(() => {
      expect(consultarEmpresaEmissaoNfMock).toHaveBeenCalledWith('12345678000190');
    });
    await waitFor(() => {
      expect(atualizarEmpresaEmissaoNfMock).toHaveBeenCalledWith({
        cpfCnpj: '12345678000190',
        documentosAtivos: { nfse: true, nfe: true, nfce: false }
      });
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('status').textContent || '').toMatch(/Pedido enviado ao emissor fiscal integrado/i);
  });

  it('erro na consulta: mostra mensagem e não chama PATCH', async () => {
    consultarEmpresaEmissaoNfMock.mockRejectedValueOnce(new Error('Falha de rede'));

    const { onSuccess } = renderWizard();

    fireEvent.click(screen.getByRole('button', { name: /Seguinte/i }));
    fireEvent.click(screen.getByLabelText(/Certificado A1 válido/i));
    fireEvent.click(screen.getByLabelText(/Dados cadastrais da empresa/i));
    fireEvent.click(screen.getByRole('button', { name: /^Seguinte$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Solicitar activação/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(atualizarEmpresaEmissaoNfMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('NFC-e: exige terceiro checkbox antes de avançar', () => {
    renderWizard({ target: 'NFCE' });
    fireEvent.click(screen.getByRole('button', { name: /Seguinte/i }));
    fireEvent.click(screen.getByLabelText(/Certificado A1 válido/i));
    fireEvent.click(screen.getByLabelText(/Dados cadastrais da empresa/i));
    fireEvent.click(screen.getByRole('button', { name: /^Seguinte$/i }));
    expect(screen.getByRole('alert').textContent || '').toMatch(/Confirme todos os itens/i);

    fireEvent.click(screen.getByLabelText(/Para NFC-e: CSC e token/i));
    fireEvent.click(screen.getByRole('button', { name: /^Seguinte$/i }));
    expect(screen.getByRole('heading', { name: /Confirmar pedido/i })).toBeTruthy();
  });
});
