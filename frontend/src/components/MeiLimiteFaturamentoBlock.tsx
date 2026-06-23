import { useEffect, useId, useMemo, useState } from 'react';
import { formatBrlDisplay } from '../lib/formatMoneyPtBr';
import type { MeiLimiteBandaOuIndeterminado, MeiLimiteProgresso } from '../utils/meiLimiteFaturamento';

export interface MeiLimiteFaturamentoBlockProps {
  /** Ano civil exibido no título (período FR-LIM-02). */
  anoCivil: number;
  /** Resultado de `computeMeiLimiteProgresso` (LIM-MEI-01). */
  progresso: MeiLimiteProgresso;
  /** De `getVigenciaLabelParaAno` — FR-LIM-03. */
  vigenciaLabel: string | null;
  loading?: boolean;
  /** Mensagem neutra; `role="alert"` no bloco de erro. */
  errorMessage?: string | null;
  canViewNfse?: boolean;
  onIrParaNfse?: () => void;
  /** Destino opcional para “Entenda o limite MEI”. */
  ajudaHref?: string;
}

function badgeClassForBanda(b: MeiLimiteBandaOuIndeterminado): string {
  switch (b) {
    case 'seguro':
      return 'admin-badge-success';
    case 'atencao':
      return 'admin-badge-warning';
    case 'critico':
      return 'admin-badge-danger';
    default:
      return 'admin-badge-neutral';
  }
}

function labelForBanda(b: MeiLimiteBandaOuIndeterminado): string {
  switch (b) {
    case 'seguro':
      return 'Confortável';
    case 'atencao':
      return 'Atenção';
    case 'critico':
      return 'Crítico';
    default:
      return 'Indeterminado';
  }
}

function messageForBanda(b: MeiLimiteBandaOuIndeterminado): string {
  switch (b) {
    case 'seguro':
      return 'Situação confortável face ao limite de referência do ano.';
    case 'atencao':
      return 'Você já utilizou grande parte do limite de referência do ano.';
    case 'critico':
      return 'Próximo do limite de referência — planeje próximos passos e consulte um contador se necessário.';
    default:
      return 'Limite de referência ou percentagem não disponível para este período.';
  }
}

function barFillClassForBanda(b: MeiLimiteBandaOuIndeterminado): string {
  switch (b) {
    case 'seguro':
      return 'bg-emerald-500 dark:bg-emerald-400';
    case 'atencao':
      return 'bg-amber-500 dark:bg-amber-400';
    case 'critico':
      return 'bg-rose-600 dark:bg-rose-500';
    default:
      return 'bg-slate-400 dark:bg-slate-500';
  }
}

function formatPercentDisplay(p: number | null): string {
  if (p === null || !Number.isFinite(p)) return '—';
  return `${p.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
}

export function MeiLimiteFaturamentoBlock({
  anoCivil,
  progresso,
  vigenciaLabel,
  loading = false,
  errorMessage = null,
  canViewNfse = false,
  onIrParaNfse,
  ajudaHref
}: MeiLimiteFaturamentoBlockProps) {
  const reactId = useId();
  const headingId = `mei-limite-title-${reactId}`;
  const baseDetailId = `mei-limite-base-${reactId}`;
  const liveId = `mei-limite-live-${reactId}`;
  const [baseOpen, setBaseOpen] = useState(false);

  useEffect(() => {
    if (!baseOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBaseOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [baseOpen]);

  const isEmpty =
    !loading
    && !errorMessage
    && progresso.notasConsideradas === 0
    && progresso.totalUtilizadoReais === 0;

  const barPercent = progresso.percentualUtilizadoParaBarra;
  const showBar = progresso.limiteReferenciaReais != null && progresso.limiteReferenciaReais > 0 && barPercent != null;

  const ariaValueText = useMemo(() => {
    const u = formatBrlDisplay(progresso.totalUtilizadoReais);
    const l = formatBrlDisplay(progresso.limiteReferenciaReais);
    const pct = formatPercentDisplay(progresso.percentualUtilizado);
    return `Ano civil ${anoCivil}. Utilizado ${u} de ${l}. Percentual ${pct}. Estado ${labelForBanda(progresso.banda)}.`;
  }, [anoCivil, progresso]);

  const aboveLimit =
    progresso.percentualUtilizado != null
    && progresso.percentualUtilizado > 100
    && progresso.limiteReferenciaReais != null
    && progresso.limiteReferenciaReais > 0;

  return (
    <section
      className="planner-card mb-6 space-y-4 p-4 md:p-5"
      aria-labelledby={headingId}
      aria-describedby={liveId}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={headingId} className="admin-section-title text-lg">
            Limite de faturamento (MEI)
          </h3>
          <p className="admin-section-subtitle mt-1 text-sm">
            Ano civil {anoCivil}
            {vigenciaLabel ? (
              <span className="text-slate-600 dark:text-slate-400"> · {vigenciaLabel}</span>
            ) : null}
          </p>
        </div>
        <span
          className={`shrink-0 self-start ${loading ? 'admin-badge-neutral' : badgeClassForBanda(progresso.banda)}`}
          data-testid="mei-limite-proximity-badge"
        >
          {loading ? 'A carregar…' : labelForBanda(progresso.banda)}
        </span>
      </div>

      <div id={liveId} aria-live="polite" className="sr-only">
        {loading ? 'A carregar dados do limite de faturamento.' : ariaValueText}
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-4 text-sm text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-300" role="status" aria-busy="true">
          A carregar progresso do limite…
        </div>
      ) : null}

      {errorMessage && !loading ? (
        <div className="admin-alert-danger px-3 py-2 text-sm" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage ? (
        <>
          {isEmpty ? (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Ainda não há NFS-e autorizadas neste ano para calcular o progresso. Quando emitir, o total aparece aqui.
            </p>
          ) : null}

          {showBar ? (
            <div className="space-y-2">
              <div
                className="admin-limit-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(barPercent ?? 0)}
                aria-valuetext={ariaValueText}
                aria-label="Progresso face ao limite de referência do ano"
              >
                <div
                  className={`admin-limit-progress-fill h-full rounded-full ${barFillClassForBanda(progresso.banda)}`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="admin-stat-value text-xl font-semibold tabular-nums">
                  {formatPercentDisplay(progresso.percentualUtilizado)}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {formatBrlDisplay(progresso.totalUtilizadoReais)} de {formatBrlDisplay(progresso.limiteReferenciaReais)}
                </span>
              </div>
              {aboveLimit ? (
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                  Acima do limite de referência — o percentual pode ultrapassar 100%.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <p className="admin-stat-value text-lg font-semibold tabular-nums">
                {formatBrlDisplay(progresso.totalUtilizadoReais)}
              </p>
              {progresso.limiteReferenciaReais == null ? (
                <p className="text-slate-600 dark:text-slate-400">Limite de referência não configurado para este ano civil.</p>
              ) : null}
            </div>
          )}

          <p className="text-sm text-slate-700 dark:text-slate-200">{messageForBanda(progresso.banda)}</p>

          <div className="space-y-2 border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
            <p id={`${baseDetailId}-line`} className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-medium">Base (MVP):</span>{' '}
              soma das <strong className="font-semibold">NFS-e</strong> com emissão concluída nesta conta no ano civil{' '}
              {anoCivil}. <strong className="font-semibold">Notas NF-e e NFC-e não entram neste total.</strong>
            </p>
            <div>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:text-blue-400 dark:hover:text-blue-300"
                aria-expanded={baseOpen}
                aria-controls={`${baseDetailId}-panel`}
                onClick={() => setBaseOpen((o) => !o)}
              >
                {baseOpen ? 'Fechar explicação' : 'Como calculamos'}
              </button>
              {baseOpen ? (
                <div
                  id={`${baseDetailId}-panel`}
                  className="mt-2 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/50 dark:text-slate-300"
                  role="region"
                  aria-labelledby={`${baseDetailId}-line`}
                >
                  <p>
                    Total das NFS-e autorizadas por esta conta no ano civil, comparado ao limite de referência configurado.
                    Notas arquivadas entram no total. Só notas em processamento ou canceladas ficam de fora.
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    NF-e e NFC-e seguem regras de ICMS/SEFAZ e <strong className="font-semibold">não são somadas</strong>{' '}
                    neste indicador. Se no futuro o produto passar a incluí-las, será anunciado na app.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Aviso:</span> indicador informativo. Não substitui
            contabilidade, obrigações legais nem conferência com a Receita Federal. O valor do limite é referência configurável
            {vigenciaLabel ? ` (${vigenciaLabel})` : ''}.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {canViewNfse && onIrParaNfse ? (
              <button
                type="button"
                className="planner-button-secondary-compact min-h-[44px] min-w-[44px] px-3"
                onClick={onIrParaNfse}
              >
                Ir para NFS-e
              </button>
            ) : null}
            {ajudaHref ? (
              <a
                href={ajudaHref}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 text-sm font-medium text-blue-600 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Entenda o limite MEI
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
