// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MeiFiscalEmissionTypeSegmented } from './MeiFiscalEmissionTypeSegmented';

afterEach(() => {
  cleanup();
});

describe('MeiFiscalEmissionTypeSegmented (FR-GUIA-FISC-16)', () => {
  it('flag ligada: mostra NFS-e, NF-e e NFC-e', () => {
    const onChange = vi.fn();
    render(
      <MeiFiscalEmissionTypeSegmented value="NFSE" onChange={onChange} nfeNfceEmitEnabled />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /NFS-e/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /^NF-e$/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /NFC-e/i })).toBeDefined();
  });

  it('flag desligada: só NFS-e (sem segmentos NF-e/NFC-e)', () => {
    const onChange = vi.fn();
    render(
      <MeiFiscalEmissionTypeSegmented value="NFSE" onChange={onChange} nfeNfceEmitEnabled={false} />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    expect(screen.getByRole('radio', { name: /NFS-e/i })).toBeDefined();
    expect(screen.queryByRole('radio', { name: /^NF-e$/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /NFC-e/i })).toBeNull();
  });
});
