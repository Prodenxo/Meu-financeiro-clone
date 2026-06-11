import { useMemo, useState } from 'react';
import {
  buildParcelaLedgerRows,
  filterParcelaLedgerRows,
  isParcelamentoEmAberto,
  parcelaLedgerStatusLabel,
  parcelaRowPermiteDownload,
  type ParcelaLedgerRow,
  type ParcelaStatusFilter,
} from '../../lib/meiParcelamentosDisplay';
import type {
  ParcelamentoItem,
  ParcelamentoParcelaOption,
} from '../../services/guidesMeiService';

type Props = {
  parcelamentos: ParcelamentoItem[];
  parcelamentosLoading: boolean;
  parcelasPorNumero: Record<string, ParcelamentoParcelaOption[]>;
  parcelasLoading: boolean;
  downloadRowKey: string | null;
  bulkDownloadLoading: boolean;
  onRefresh: () => void;
  onDownloadRow: (row: ParcelaLedgerRow) => void;
  onDownloadAll: () => void;
};

export function MeiParcelamentosLedger({
  parcelamentos,
  parcelamentosLoading,
  parcelasPorNumero,
  parcelasLoading,
  downloadRowKey,
  bulkDownloadLoading,
  onRefresh,
  onDownloadRow,
  onDownloadAll,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<ParcelaStatusFilter>('todos');
  const loading = parcelamentosLoading || parcelasLoading;

  const pedidosAtivos = useMemo(
    () => parcelamentos.filter((p) => isParcelamentoEmAberto(p.situacao)),
    [parcelamentos]
  );
  const pedidoAtivo = pedidosAtivos.length === 1 ? pedidosAtivos[0] : null;

  const ledgerRows = useMemo(
    () => buildParcelaLedgerRows(parcelamentos, parcelasPorNumero),
    [parcelamentos, parcelasPorNumero]
  );
  const filteredRows = useMemo(
    () => filterParcelaLedgerRows(ledgerRows, statusFilter),
    [ledgerRows, statusFilter]
  );

  const aPagarCount = ledgerRows.filter(
    (row) => row.status === 'a_pagar' || row.status === 'liberada'
  ).length;
  const pagoCount = ledgerRows.filter((row) => row.status === 'pago').length;
  const baixaveisCount = ledgerRows.filter((row) => parcelaRowPermiteDownload(row)).length;
  const tudoEmDia = !loading && ledgerRows.length > 0 && aPagarCount === 0;

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      {!loading && aPagarCount > 0 ? (
        <div className="mei-das-alert" role="status">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {aPagarCount === 1 ? '1 parcela em aberto' : `${aPagarCount} parcelas em aberto`}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Clique em Baixar na linha do mês — o PDF do DAS parcelado será salvo no seu dispositivo.
            </p>
          </div>
        </div>
      ) : null}

      {tudoEmDia ? (
        <div className="mei-das-alert mei-das-alert-success" role="status">
          <p className="font-bold text-emerald-800 dark:text-emerald-200">Parcelas em dia</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Nenhuma parcela pendente no momento.
          </p>
        </div>
      ) : null}

      <div className="mei-simple-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Parcelas do parcelamento
            </p>
            {!loading && ledgerRows.length > 0 ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {pagoCount} pago{pagoCount === 1 ? '' : 's'} · {aPagarCount} em aberto
              </p>
            ) : pedidoAtivo ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Pedido nº {pedidoAtivo.numero}
                {pedidoAtivo.modalidade ? ` · ${pedidoAtivo.modalidade}` : ''}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="planner-button-secondary-compact shrink-0"
            onClick={onRefresh}
            disabled={loading || bulkDownloadLoading}
            aria-label="Atualizar parcelamentos"
          >
            {loading ? '…' : 'Atualizar'}
          </button>
        </div>

        {ledgerRows.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              ['todos', 'Todos'],
              ['a_pagar', 'Em aberto'],
              ['pago', 'Pagos'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  statusFilter === key
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                    : 'border-slate-200/80 text-slate-500 dark:border-slate-700/80 dark:text-slate-400',
                ].join(' ')}
                aria-pressed={statusFilter === key}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {baixaveisCount > 1 ? (
          <button
            type="button"
            className="planner-button mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDownloadAll}
            disabled={bulkDownloadLoading || baixaveisCount === 0}
          >
            {bulkDownloadLoading ? 'Baixando…' : `Baixar todas (${baixaveisCount})`}
          </button>
        ) : null}

        {loading && ledgerRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Consultando parcelas na Receita…
          </p>
        ) : pedidosAtivos.length === 0 && !parcelamentosLoading ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Nenhum parcelamento ativo. Pedidos encerrados não aparecem aqui.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Nenhuma parcela neste filtro.
          </p>
        ) : (
          <ul className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
            {filteredRows.map((row) => {
              const canDownload = parcelaRowPermiteDownload(row);
              const downloading = downloadRowKey === row.id;
              const statusClass =
                row.status === 'pago'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : row.status === 'liberada'
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-amber-600 dark:text-amber-400';
              const dotClass =
                row.status === 'pago'
                  ? 'bg-emerald-500'
                  : row.status === 'liberada'
                    ? 'bg-cyan-500'
                    : 'bg-amber-500';

              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-slate-700/80 dark:bg-slate-900/40"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.label}
                    </p>
                    <p className={`text-xs font-bold ${statusClass}`}>
                      {parcelaLedgerStatusLabel(row.status)}
                    </p>
                    {pedidosAtivos.length > 1 ? (
                      <p className="text-[11px] text-slate-400">Pedido nº {row.pedidoNumero}</p>
                    ) : null}
                  </div>
                  {canDownload ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 disabled:opacity-60"
                      onClick={() => onDownloadRow(row)}
                      disabled={downloading || bulkDownloadLoading}
                    >
                      {downloading ? '…' : 'Baixar'}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
