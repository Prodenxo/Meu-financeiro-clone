// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AccessBlockedExplainer } from './AccessBlockedExplainer';
import { meiRequiredAccessBlockProps } from '../lib/accessBlockPresets';

describe('AccessBlockedExplainer', () => {
  afterEach(() => cleanup());

  it('expõe região de estado e copy Mei Infinito (UX-GLOBAL-04)', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AccessBlockedExplainer {...meiRequiredAccessBlockProps()} />
      </MemoryRouter>
    );

    const region = screen.getByRole('status');
    expect(region).toBeTruthy();
    expect(region.textContent).toContain('Área Mei Infinito não disponível');
    expect(region.textContent).toContain('Ir às transações');
    expect(region.getAttribute('tabindex')).toBe('-1');
  });

  it('move foco para a região ao montar (pós-QA acessibilidade)', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AccessBlockedExplainer {...meiRequiredAccessBlockProps()} />
      </MemoryRouter>
    );

    const region = screen.getByRole('status');
    await waitFor(() => {
      expect(document.activeElement).toBe(region);
    });
  });
});
