import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MeiLimiteFaturamentoBlock } from './MeiLimiteFaturamentoBlock';
import type { MeiLimiteProgresso } from '../utils/meiLimiteFaturamento';

afterEach(() => {
  cleanup();
});

function progressoBase(over: Partial<MeiLimiteProgresso> = {}): MeiLimiteProgresso {
  return {
    anoCivil: 2026,
    totalUtilizadoReais: 0,
    limiteReferenciaReais: 81_000,
    percentualUtilizado: 0,
    percentualUtilizadoParaBarra: 0,
    banda: 'seguro',
    notasConsideradas: 0,
    ...over
  };
}

describe('MeiLimiteFaturamentoBlock', () => {
  it('empty state: mensagem honesta e progressbar com 0% quando há limite', () => {
    render(
      <MeiLimiteFaturamentoBlock
        anoCivil={2026}
        progresso={progressoBase({
          totalUtilizadoReais: 0,
          notasConsideradas: 0,
          percentualUtilizado: 0,
          percentualUtilizadoParaBarra: 0
        })}
        vigenciaLabel="Referência 2026"
      />
    );
    expect(screen.getByText(/Ainda não há NFS-e autorizadas neste ano/i)).toBeTruthy();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('estado seguro: mostra percentagem e rótulo Confortável', () => {
    render(
      <MeiLimiteFaturamentoBlock
        anoCivil={2026}
        progresso={progressoBase({
          totalUtilizadoReais: 40_000,
          notasConsideradas: 2,
          percentualUtilizado: (40_000 / 81_000) * 100,
          percentualUtilizadoParaBarra: (40_000 / 81_000) * 100,
          banda: 'seguro'
        })}
        vigenciaLabel="Referência 2026"
      />
    );
    expect(screen.getByTestId('mei-limite-proximity-badge').textContent).toContain('Confortável');
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('CTA Ir para NFS-e chama callback', () => {
    const onNfse = vi.fn();
    render(
      <MeiLimiteFaturamentoBlock
        anoCivil={2026}
        progresso={progressoBase()}
        vigenciaLabel={null}
        canViewNfse
        onIrParaNfse={onNfse}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /ir para nfs-e/i }));
    expect(onNfse).toHaveBeenCalledTimes(1);
  });

  it('erro: região com role alert', () => {
    render(
      <MeiLimiteFaturamentoBlock
        anoCivil={2026}
        progresso={progressoBase()}
        vigenciaLabel={null}
        errorMessage="Não foi possível carregar as notas."
      />
    );
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/Não foi possível carregar/i)).toBeTruthy();
  });

  it('Como calculamos: botão expande painel (UX §9.3)', () => {
    render(
      <MeiLimiteFaturamentoBlock anoCivil={2026} progresso={progressoBase()} vigenciaLabel={null} />
    );
    const btn = screen.getByRole('button', { name: /como calculamos/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Notas ainda em processamento ou canceladas/i)).toBeTruthy();
    expect(screen.getByText(/NF-e e NFC-e seguem regras de ICMS\/SEFAZ/i)).toBeTruthy();
    expect(screen.getByText(/será anunciado na app/i)).toBeTruthy();
  });

  it('Base (MVP): exclusão explícita de NF-e e NFC-e do total (FR-POSQA-05)', () => {
    render(
      <MeiLimiteFaturamentoBlock
        anoCivil={2026}
        progresso={progressoBase({
          totalUtilizadoReais: 10_000,
          notasConsideradas: 1,
          percentualUtilizado: (10_000 / 81_000) * 100,
          percentualUtilizadoParaBarra: (10_000 / 81_000) * 100
        })}
        vigenciaLabel={null}
      />
    );
    expect(screen.getByText(/Notas NF-e e NFC-e não entram neste total/i)).toBeTruthy();
  });
});
