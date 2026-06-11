// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MeiNfseListRowActions } from './MeiNfseListRowActions';
import type { NfseRecord } from '../services/meiNotasService';

const baseItem = {
  id: 'n1',
  user_id: 'u1',
  document_type: 'NFE',
  plugnotas_id: 'plug-1'
} as NfseRecord;

function renderRow(overrides: Partial<Parameters<typeof MeiNfseListRowActions>[0]> = {}) {
  const onSync = vi.fn();
  const props = {
    item: baseItem,
    statusKey: 'processando',
    rowBusy: false,
    reviewRequested: false,
    isArchived: false,
    moreMenuOpenId: null,
    setMoreMenuOpenId: vi.fn(),
    isNfseActionLoading: () => false,
    onSync,
    onDownloadPdf: vi.fn(),
    onDownloadXml: vi.fn(),
    onToggleReview: vi.fn(),
    onCancel: vi.fn(),
    onArchive: vi.fn(),
    onMenuKeyDown: vi.fn(),
    menuFirstItemRef: { current: null },
    layout: 'table' as const,
    ...overrides
  };
  render(<MeiNfseListRowActions {...props} />);
  return { onSync, ...props };
}

describe('MeiNfseListRowActions — FR-GUIA-FISC-15 refresh', () => {
  afterEach(() => {
    cleanup();
  });

  it('expõe botão Atualizar status com rótulo visível', () => {
    renderRow();
    const btn = screen.getByRole('button', { name: /Atualizar status/i });
    expect(btn).toBeTruthy();
  });

  it('desactiva Atualizar status quando não há identificadores no emissor', () => {
    renderRow({
      item: { id: 'n1', user_id: 'u1', document_type: 'NFCE' } as NfseRecord
    });
    const btn = screen.getByRole('button', { name: /Atualizar status/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('invoca onSync ao clicar quando há plugnotas_id', () => {
    const { onSync } = renderRow();
    fireEvent.click(screen.getByRole('button', { name: /Atualizar status/i }));
    expect(onSync).toHaveBeenCalledTimes(1);
  });
});
