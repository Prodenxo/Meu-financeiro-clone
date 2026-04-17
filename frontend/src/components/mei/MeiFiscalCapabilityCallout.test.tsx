// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MeiFiscalCapabilityCallout } from './MeiFiscalCapabilityCallout';

describe('MeiFiscalCapabilityCallout (FR-GUIA-FISC-07 / UX §3)', () => {
  it('modo loading: contentor com aria-busy', () => {
    render(<MeiFiscalCapabilityCallout documentLabel="NF-e" mode="loading" />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-busy')).toBe('true');
  });

  it('modo fetch_error: Tentar de novo chama onTentarNovamente', () => {
    const onTentarNovamente = vi.fn();
    render(
      <MeiFiscalCapabilityCallout
        documentLabel="NF-e"
        mode="fetch_error"
        onTentarNovamente={onTentarNovamente}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/i }));
    expect(onTentarNovamente).toHaveBeenCalledTimes(1);
  });

  it('modo blocked: D2 — Configurar emissão chama onConfigurarEmissao (FR-GUIA-FISC-14)', () => {
    const onConfigurarEmissao = vi.fn();
    render(
      <MeiFiscalCapabilityCallout
        documentLabel="NFC-e"
        mode="blocked"
        onConfigurarEmissao={onConfigurarEmissao}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Configurar emissão de NFC-e/i }));
    expect(onConfigurarEmissao).toHaveBeenCalledTimes(1);
  });
});
