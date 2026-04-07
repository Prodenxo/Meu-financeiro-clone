import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import UserFacingErrorBlock from './UserFacingErrorBlock';

const reportUserErrorShown = vi.fn();

vi.mock('../lib/reportUserErrorShown', () => ({
  reportUserErrorShown: (...args: unknown[]) => reportUserErrorShown(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('UserFacingErrorBlock', () => {
  it('expõe título com id e aria-labelledby no contentor', () => {
    const titleId = 'test-err-title';
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="validacao_servidor"
        source="backend"
        severity="error"
        recoverable
        title="Não foi possível concluir o pedido"
        description="Os dados enviados não foram aceites. Verifique as informações."
        titleId={titleId}
      />
    );

    const region = screen.getByRole('alert');
    expect(region.getAttribute('aria-labelledby')).toBe(titleId);
    const heading = document.getElementById(titleId);
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toBe('Não foi possível concluir o pedido');
  });

  it('não mostra Copiar para suporte só por ter technicalDetail (opt-in)', () => {
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="desconhecido"
        source="backend"
        severity="error"
        recoverable
        title="T"
        description="D"
        technicalDetail='{"message":"x"}'
      />
    );
    expect(screen.queryByTestId('user-facing-copy-support')).toBeNull();
  });

  it('mostra Copiar quando showCopyForSupport e technicalDetail', () => {
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="desconhecido"
        source="backend"
        severity="error"
        recoverable
        title="T"
        description="D"
        technicalDetail="detalhe técnico"
        showCopyForSupport
      />
    );
    expect(screen.getByTestId('user-facing-copy-support')).toBeTruthy();
  });

  it('handler personalizado mostra cópia sem showCopyForSupport', () => {
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="desconhecido"
        source="backend"
        severity="error"
        recoverable
        title="T"
        description="D"
        onCopySupportDetail={() => {}}
      />
    );
    expect(screen.getByTestId('user-facing-copy-support')).toBeTruthy();
  });

  it('com analyticsSurfaceId dispara report só com category e surfaceId (sem título no payload)', () => {
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="validacao_servidor"
        source="backend"
        severity="error"
        recoverable
        title="Título sensível do servidor"
        description="Descrição longa com dados"
        analyticsSurfaceId="test.surface"
      />
    );

    expect(reportUserErrorShown).toHaveBeenCalled();
    const payload = reportUserErrorShown.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.category).toBe('validacao_servidor');
    expect(payload.surfaceId).toBe('test.surface');
    expect(payload).not.toHaveProperty('title');
    expect(payload).not.toHaveProperty('description');
  });

  it('sem analyticsSurfaceId não dispara report', () => {
    render(
      <UserFacingErrorBlock
        variant="page_banner"
        category="rede"
        source="network"
        severity="error"
        recoverable
        title="X"
        description="Y"
      />
    );
    expect(reportUserErrorShown).not.toHaveBeenCalled();
  });
});
