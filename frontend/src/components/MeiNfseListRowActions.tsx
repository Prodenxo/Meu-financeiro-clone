import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
  SetStateAction
} from 'react';
import {
  Archive,
  Download,
  FileCode2,
  Pencil,
  RefreshCw,
  XCircle,
} from 'lucide-react';
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
  layout?: 'card' | 'table';
};

type ActionBtn = {
  key: string;
  label: string;
  loadingLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  destructive?: boolean;
  title?: string;
};

/**
 * Ações da linha na lista de notas — sempre com rótulo visível (sem ícone solto).
 */
export function MeiNfseListRowActions({
  item,
  statusKey,
  rowBusy,
  reviewRequested,
  isArchived,
  setMoreMenuOpenId,
  isNfseActionLoading,
  onSync,
  onDownloadPdf,
  onDownloadXml,
  onToggleReview,
  onCancel,
  onArchive,
  layout = 'card'
}: MeiNfseListRowActionsProps) {
  const podeSyncEmissor = notaFiscalPodeSincronizarEstadoEmissor(item);
  const syncLoading = isNfseActionLoading(`${item.id}:sync`);
  const processando = statusKey === 'processando';

  const actions: ActionBtn[] = [
    {
      key: 'sync',
      label: 'Atualizar status',
      loadingLabel: 'Atualizando…',
      icon: <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${syncLoading ? 'animate-spin' : ''}`} aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onSync();
      },
      disabled: rowBusy || !podeSyncEmissor,
      loading: syncLoading,
      title: !podeSyncEmissor
        ? 'Não dá para atualizar: falta identificador no emissor'
        : 'Consultar situação da nota na Receita / emissor',
    },
    {
      key: 'pdf',
      label: 'Baixar PDF',
      loadingLabel: 'Baixando PDF…',
      icon: <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onDownloadPdf();
      },
      disabled: rowBusy || processando,
      loading: isNfseActionLoading(`${item.id}:pdf`),
    },
    {
      key: 'xml',
      label: 'Baixar XML',
      loadingLabel: 'Baixando XML…',
      icon: <FileCode2 className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onDownloadXml();
      },
      disabled: rowBusy || processando,
      loading: isNfseActionLoading(`${item.id}:xml`),
    },
    {
      key: 'review',
      label: reviewRequested ? 'Remover revisão' : 'Marcar revisão',
      loadingLabel: 'Salvando…',
      icon: <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onToggleReview();
      },
      disabled: rowBusy || isArchived,
      loading: isNfseActionLoading(`${item.id}:update`),
    },
    {
      key: 'cancel',
      label: statusKey === 'cancelamento_pendente' ? 'Reenviar cancelamento' : 'Cancelar nota',
      loadingLabel: 'Cancelando…',
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onCancel();
      },
      disabled: rowBusy || statusKey === 'cancelado',
      loading: isNfseActionLoading(`${item.id}:cancel`),
      destructive: true,
    },
    {
      key: 'archive',
      label: isArchived ? 'Desarquivar' : 'Arquivar',
      loadingLabel: 'Salvando…',
      icon: <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden />,
      onClick: () => {
        setMoreMenuOpenId(null);
        onArchive();
      },
      disabled: rowBusy,
      loading: isNfseActionLoading(`${item.id}:archive`),
    },
  ];

  const wrapClass =
    layout === 'table'
      ? 'flex flex-wrap items-center justify-end gap-1.5'
      : 'flex flex-wrap gap-2';

  return (
    <div className={layout === 'card' ? 'mt-3 border-t border-slate-200/70 pt-3 dark:border-slate-700/60' : undefined}>
      {layout === 'card' ? (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          O que fazer com esta nota
        </p>
      ) : null}
      <div className={wrapClass}>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          className={[
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition',
            action.destructive
              ? 'border-red-200/80 bg-red-50/80 text-red-700 hover:bg-red-100/80 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
              : 'border-slate-200/90 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800',
            action.disabled ? 'cursor-not-allowed opacity-45' : '',
          ].join(' ')}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          aria-busy={action.loading || undefined}
          title={action.title}
        >
          {action.icon}
          <span>{action.loading ? action.loadingLabel : action.label}</span>
        </button>
      ))}
      </div>
    </div>
  );
}
