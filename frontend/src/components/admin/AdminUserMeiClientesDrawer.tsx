import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Pencil, PlusCircle, Trash2, Users, X } from 'lucide-react';
import MeiCatalogoClienteModal from '../MeiCatalogoClienteModal';
import MeiCatalogoDeleteClienteConfirmDialog from '../MeiCatalogoDeleteClienteConfirmDialog';
import {
  deleteAdminMeiCatalogoCliente,
  fetchAdminMeiCatalogoClientes
} from '../../services/adminUserDataService';
import type { NfseCatalogCliente } from '../../services/meiNotasService';
import { meiFiscalToastMessage } from '../../lib/fiscalUserError';
import { toast } from '../../lib/toast';

const SEARCH_DEBOUNCE_MS = 300;
const LIST_LIMIT = 50;

function ariaLabelExcluirCliente(row: NfseCatalogCliente): string {
  const n = (row.nome || 'Cliente').trim();
  const short = n.length > 80 ? `${n.slice(0, 77)}…` : n;
  return `Excluir cliente ${short} do catálogo`;
}

export interface AdminUserMeiClientesDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** Nome ou e-mail do utilizador alvo (copy UX §7). */
  userDisplayName: string;
  meiEnabled: boolean;
  formatDocument: (digitsOnly: string) => string;
  /** Foco devolvido ao fechar (botão “Gerir clientes”). */
  returnFocusRef: React.RefObject<HTMLElement | null>;
  /** Após mutação ou fecho — invalidar combobox no modal Emitir. */
  onInvalidateCatalog: () => void;
}

export function AdminUserMeiClientesDrawer({
  open,
  onClose,
  userId,
  userDisplayName,
  meiEnabled,
  formatDocument,
  returnFocusRef,
  onInvalidateCatalog
}: AdminUserMeiClientesDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<NfseCatalogCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NfseCatalogCliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NfseCatalogCliente | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onClose();
    onInvalidateCatalog();
    window.setTimeout(() => {
      returnFocusRef.current?.focus?.();
    }, 0);
  }, [onClose, onInvalidateCatalog, returnFocusRef]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadClientes = useCallback(async () => {
    if (!userId.trim() || !meiEnabled) return;
    setLoading(true);
    setListError(null);
    try {
      const data = await fetchAdminMeiCatalogoClientes(userId, {
        ...(debouncedQ ? { q: debouncedQ } : {}),
        limit: LIST_LIMIT,
        documentType: 'NFSE'
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(meiFiscalToastMessage(err, 'Erro ao carregar clientes.'));
    } finally {
      setLoading(false);
    }
  }, [userId, debouncedQ, meiEnabled]);

  useEffect(() => {
    if (!open || !meiEnabled || !userId.trim()) return;
    void loadClientes();
  }, [open, loadClientes, meiEnabled, userId]);

  useEffect(() => {
    if (!open) return;
    const t = window.requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) {
        return;
      }
      if (modalOpen) {
        e.preventDefault();
        e.stopPropagation();
        setModalOpen(false);
        setEditing(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    };
    document.addEventListener('keydown', onDocKey, true);
    return () => document.removeEventListener('keydown', onDocKey, true);
  }, [open, handleClose, modalOpen, deleteTarget]);

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const root = panelRef.current;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusables);
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSaved = (kind: 'create' | 'edit') => {
    toast.success(kind === 'create' ? 'Cliente registado.' : 'Cliente atualizado.');
    void loadClientes();
    onInvalidateCatalog();
  };

  const closeDeleteConfirm = () => {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteCliente = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await deleteAdminMeiCatalogoCliente(userId, deleteTarget.id);
      toast.success('Cliente removido do catálogo.');
      setDeleteTarget(null);
      setDeleteError(null);
      setModalOpen(false);
      setEditing(null);
      void loadClientes();
      onInvalidateCatalog();
    } catch (err) {
      const msg = meiFiscalToastMessage(err, 'Não foi possível eliminar o cliente.');
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (!open || !meiEnabled) return null;

  const drawerTitleId = 'admin-mei-clientes-drawer-title';
  const drawerDescId = 'admin-mei-clientes-drawer-desc';

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/40"
        aria-hidden="true"
        onClick={handleClose}
        role="presentation"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        aria-describedby={drawerDescId}
        className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onKeyDown={handlePanelKeyDown}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700">
          <div className="min-w-0">
            <h2
              ref={titleRef}
              id={drawerTitleId}
              tabIndex={-1}
              className="text-lg font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-white"
            >
              Clientes para NFS-e
            </h2>
            <p id={drawerDescId} className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Catálogo do utilizador <span className="font-medium text-slate-800 dark:text-slate-200">{userDisplayName}</span>.
              As alterações guardadas aparecem no Guia MEI ao autenticar como este utilizador.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar painel de clientes"
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="admin-mei-cli-drawer-q" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Pesquisar cliente
              </label>
              <input
                id="admin-mei-cli-drawer-q"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nome ou documento…"
                className="planner-input-compact w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="planner-button-secondary-compact mt-5 inline-flex items-center gap-1"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              Novo cliente
            </button>
          </div>

          {listError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
              {listError}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            {loading ? (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
                A carregar…
              </p>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500 dark:text-slate-400">
                <Users className="h-10 w-10 opacity-50" aria-hidden />
                <p className="text-sm">Nenhum cliente neste catálogo. Crie um novo ou ajuste a pesquisa.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => {
                  const raw = String(row.documento || '').replace(/\D/g, '');
                  const docLine = raw ? formatDocument(raw) : '—';
                  return (
                    <li key={row.id} className="flex flex-wrap items-center gap-2 px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{row.nome?.trim() || 'Sem nome'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{docLine}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`Editar ${(row.nome || 'cliente').trim()}`}
                          onClick={() => {
                            setEditing(row);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:text-red-400 dark:hover:bg-red-950/40"
                          aria-label={ariaLabelExcluirCliente(row)}
                          onClick={() => {
                            setDeleteTarget(row);
                            setDeleteError(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <MeiCatalogoClienteModal
        open={modalOpen}
        catalogAdminUserId={userId}
        elevatedStack
        editing={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        onRequestDelete={
          editing
            ? () => {
                setDeleteTarget(editing);
                setDeleteError(null);
              }
            : undefined
        }
      />

      <MeiCatalogoDeleteClienteConfirmDialog
        open={Boolean(deleteTarget)}
        cliente={deleteTarget}
        isDeleting={deleteSubmitting}
        errorMessage={deleteError}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDeleteCliente}
        overlayZIndexClass="z-[75]"
      />
    </>
  );
}
