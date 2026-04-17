import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
  SetStateAction
} from 'react';
import { RefreshCw } from 'lucide-react';
import { notaFiscalPodeSincronizarEstadoEmissor, type NfseRecord } from '../services/meiNotasService';

export type MeiNfseListRowActionsProps = {
  item: NfseRecord;
  statusKey: string;
  rowBusy: boolean;
  reviewRequested: boolean;
  isArchived: boolean;
  moreMenuOpenId: string | null;
  setMoreMenuOpenId: Dispatch<SetStateAction<string | null>>;
  isNfseActionLoading: (actionKey: string) => boolean;
  onSync: () => void;
  onDownloadPdf: () => void;
  onDownloadXml: () => void;
  onToggleReview: () => void;
  onCancel: () => void;
  onArchive: () => void;
  onMenuKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  menuFirstItemRef: RefObject<HTMLButtonElement | null>;
  /** `table`: layout compacto para célula de tabela desktop. */
  layout?: 'card' | 'table';
};

/**
 * Ações da linha na lista de notas (NFSE / NFE / NFCE): paridade cartão e tabela — mesmos handlers.
 */
export function MeiNfseListRowActions({
  item,
  statusKey,
  rowBusy,
  reviewRequested,
  isArchived,
  moreMenuOpenId,
  setMoreMenuOpenId,
  isNfseActionLoading,
  onSync,
  onDownloadPdf,
  onDownloadXml,
  onToggleReview,
  onCancel,
  onArchive,
  onMenuKeyDown,
  menuFirstItemRef,
  layout = 'card'
}: MeiNfseListRowActionsProps) {
  /** Chave única por vista — cartão e tabela coexistem no DOM (responsive). */
  const menuKey = `${layout}:${item.id}`;
  const menuDomId = `nfse-more-actions-${layout}-${item.id}`;
  const isOpen = moreMenuOpenId === menuKey;
  const wrap =
    layout === 'table'
      ? 'flex flex-wrap items-center justify-end gap-1'
      : 'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start';
  const btn =
    layout === 'table'
      ? 'planner-button-secondary-compact whitespace-nowrap px-2 py-1 text-xs'
      : 'planner-button-secondary-compact w-full sm:w-auto';

  const podeSyncEmissor = notaFiscalPodeSincronizarEstadoEmissor(item);
  const syncLoading = isNfseActionLoading(`${item.id}:sync`);
  const syncDisabled = rowBusy || !podeSyncEmissor;
  const syncLabel = 'Actualizar estado';
  const syncAriaLabel = `${syncLabel} da nota fiscal (${item.document_type || 'NFSE'})`;

  return (
    <div className={wrap}>
      <button
        type="button"
        className={`${btn} inline-flex items-center justify-center gap-1.5`}
        onClick={() => {
          setMoreMenuOpenId(null);
          onSync();
        }}
        disabled={syncDisabled}
        aria-busy={syncLoading || undefined}
        aria-label={syncAriaLabel}
        title={
          !podeSyncEmissor
            ? 'Não é possível actualizar: falta identificador no emissor (ID, protocolo ou integração com CNPJ do prestador).'
            : undefined
        }
      >
        <RefreshCw
          className={`h-3.5 w-3.5 shrink-0 ${syncLoading ? 'animate-spin' : ''}`}
          aria-hidden
        />
        <span>{syncLoading ? 'A actualizar estado…' : syncLabel}</span>
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => {
          setMoreMenuOpenId(null);
          onDownloadPdf();
        }}
        disabled={rowBusy || statusKey === 'processando'}
        aria-disabled={rowBusy || statusKey === 'processando'}
      >
        {isNfseActionLoading(`${item.id}:pdf`) ? 'Baixando PDF...' : 'Baixar PDF'}
      </button>
      <div
        className={layout === 'table' ? 'relative inline-block' : 'relative w-full sm:w-auto'}
        data-nfse-more-menu-root={menuKey}
      >
        <button
          type="button"
          className={btn}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuDomId}
          onClick={() => setMoreMenuOpenId((open) => (open === menuKey ? null : menuKey))}
        >
          Mais ações
        </button>
        {isOpen ? (
          <div
            id={menuDomId}
            role="menu"
            aria-label={`Mais ações para a nota ${item.id_integracao || item.plugnotas_id || item.id}`}
            className="absolute right-0 top-full z-20 mt-1 flex min-w-[220px] flex-col gap-0.5 rounded-lg border border-slate-200/90 bg-white p-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
            onKeyDown={onMenuKeyDown}
          >
            <button
              type="button"
              role="menuitem"
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
              ref={isOpen ? (el) => { menuFirstItemRef.current = el; } : undefined}
              disabled={rowBusy || statusKey === 'processando'}
              aria-disabled={rowBusy || statusKey === 'processando'}
              onClick={() => {
                setMoreMenuOpenId(null);
                onDownloadXml();
              }}
            >
              {isNfseActionLoading(`${item.id}:xml`) ? 'Baixando XML...' : 'Baixar XML'}
            </button>
            <button
              type="button"
              role="menuitem"
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={rowBusy || isArchived}
              aria-disabled={rowBusy || isArchived}
              onClick={() => {
                setMoreMenuOpenId(null);
                onToggleReview();
              }}
            >
              {isNfseActionLoading(`${item.id}:update`)
                ? 'Salvando...'
                : reviewRequested
                  ? 'Remover revisão'
                  : 'Marcar revisão'}
            </button>
            <button
              type="button"
              role="menuitem"
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={rowBusy || statusKey === 'cancelado' || statusKey === 'cancelamento_pendente'}
              aria-disabled={rowBusy || statusKey === 'cancelado' || statusKey === 'cancelamento_pendente'}
              onClick={() => {
                setMoreMenuOpenId(null);
                onCancel();
              }}
            >
              {isNfseActionLoading(`${item.id}:cancel`) ? 'Cancelando...' : 'Cancelar nota'}
            </button>
            <button
              type="button"
              role="menuitem"
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={rowBusy}
              aria-disabled={rowBusy}
              onClick={() => {
                setMoreMenuOpenId(null);
                onArchive();
              }}
            >
              {isNfseActionLoading(`${item.id}:archive`)
                ? 'Salvando...'
                : isArchived
                  ? 'Desarquivar'
                  : 'Arquivar'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
