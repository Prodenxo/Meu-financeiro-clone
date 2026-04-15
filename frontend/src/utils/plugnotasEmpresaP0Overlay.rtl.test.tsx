// @vitest-environment jsdom
/**
 * RTL smoke para critérios de aceite «flag off / on» e P0-L2 (sem montar `GuidesMei` completo).
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  PLUGNOTAS_P0_L1_ARIA_LABEL,
  PLUGNOTAS_P0_L1_TITLE,
  PLUGNOTAS_P0_L2_STATUS_MESSAGE,
  resolvePlugnotasEmpresaP0Overlay,
  type ResolvePlugnotasEmpresaP0OverlayInput
} from './plugnotasEmpresaP0Overlay';

/** Espelha a regra de visibilidade P0-L1 / P0-L2 usada em `GuidesMei.tsx`. */
function PlugnotasEmpresaP0OverlayHarness(input: ResolvePlugnotasEmpresaP0OverlayInput) {
  const overlay = resolvePlugnotasEmpresaP0Overlay(input);
  return (
    <div data-testid="harness-root">
      {overlay.kind === 'impossibility' ? (
        <div role="region" aria-label={PLUGNOTAS_P0_L1_ARIA_LABEL}>
          <p className="text-sm font-semibold">{PLUGNOTAS_P0_L1_TITLE}</p>
        </div>
      ) : null}
      {overlay.kind === 'phaseSuccess' ? (
        <p role="status">{PLUGNOTAS_P0_L2_STATUS_MESSAGE}</p>
      ) : null}
    </div>
  );
}

describe('P0 overlay — RTL (aceite: flag / L2)', () => {
  it('flag off + painel retry: sem P0-L1 (região)', () => {
    render(
      <PlugnotasEmpresaP0OverlayHarness
        configuracaoCadastroBloqueadoExternamente={false}
        lastPostEmpresaPhase2Ok={false}
        lastGetEmpresaHasData={false}
        postErrorPanelVisible
      />
    );
    expect(screen.queryByRole('region', { name: PLUGNOTAS_P0_L1_ARIA_LABEL })).toBeNull();
  });

  it('flag on + ramo impossibility: P0-L1 visível', () => {
    render(
      <PlugnotasEmpresaP0OverlayHarness
        configuracaoCadastroBloqueadoExternamente
        lastPostEmpresaPhase2Ok={false}
        lastGetEmpresaHasData={false}
        postErrorPanelVisible
      />
    );
    const region = screen.getByRole('region', { name: PLUGNOTAS_P0_L1_ARIA_LABEL });
    expect(region.textContent ?? '').toContain(PLUGNOTAS_P0_L1_TITLE);
  });

  it('transição mockada para P0-L2: mensagem de sucesso em role="status"', () => {
    render(
      <PlugnotasEmpresaP0OverlayHarness
        configuracaoCadastroBloqueadoExternamente={false}
        lastPostEmpresaPhase2Ok
        lastGetEmpresaHasData
        postErrorPanelVisible={false}
      />
    );
    const status = screen.getByRole('status');
    expect(status.textContent ?? '').toContain(PLUGNOTAS_P0_L2_STATUS_MESSAGE);
  });
});
