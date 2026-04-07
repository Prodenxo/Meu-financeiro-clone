import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, PlusCircle, Trash2, Users } from 'lucide-react';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import FetchErrorBanner from '../components/FetchErrorBanner';
import MeiCatalogoClienteModal from '../components/MeiCatalogoClienteModal';
import MeiCatalogoDeleteClienteConfirmDialog from '../components/MeiCatalogoDeleteClienteConfirmDialog';
import {
  eliminarCatalogoNfseCliente,
  listarCatalogoNfseClientes,
  type NfseCatalogCliente
} from '../services/meiNotasService';
import { formatDocumentoListaPtBr } from '../lib/formatCpfCnpjPtBr';
import { toast } from '../lib/toast';
import { userFacingToastSummary } from '../lib/mapUnknownErrorToUserFacing';

const SEARCH_DEBOUNCE_MS = 300;
const LIST_LIMIT = 50;

function ariaLabelExcluirCliente(row: NfseCatalogCliente): string {
  const n = (row.nome || 'Cliente').trim();
  const short = n.length > 80 ? `${n.slice(0, 77)}…` : n;
  return `Excluir cliente ${short} do catálogo`;
}

export default function MeiCatalogoClientes() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<NfseCatalogCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<unknown | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NfseCatalogCliente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NfseCatalogCliente | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadClientes = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await listarCatalogoNfseClientes({
        ...(debouncedQ ? { q: debouncedQ } : {}),
        limit: LIST_LIMIT,
        documentType: 'NFSE'
      });
      setRows(data);
    } catch (err) {
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    void loadClientes();
  }, [loadClientes]);

  const handleSaved = (kind: 'create' | 'edit') => {
    toast.success(kind === 'create' ? 'Cliente registado.' : 'Cliente atualizado.');
    void loadClientes();
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
      await eliminarCatalogoNfseCliente(deleteTarget.id);
      toast.success('Cliente removido do catálogo.');
      setDeleteTarget(null);
      setDeleteError(null);
      setModalOpen(false);
      setEditing(null);
      void loadClientes();
    } catch (err) {
      const msg = userFacingToastSummary(err, 'Não foi possível eliminar o cliente.');
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: NfseCatalogCliente) => {
    setEditing(row);
    setModalOpen(true);
  };

  const emptyWithQuery = Boolean(debouncedQ) && !loading && rows.length === 0;
  const emptyNoQuery = !debouncedQ && !loading && rows.length === 0;

  return (
    <PageShell>
      <div className="mb-4">
        <Link
          to="/guias-mei"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft size={16} aria-hidden />
          Voltar ao Mei Infinito
        </Link>
      </div>

      <PageTitle subtitle="Tomadores usados na emissão de NFS-e">
        Clientes do catálogo
      </PageTitle>

      {listError != null ? (
        <FetchErrorBanner
          error={listError}
          onRetry={() => void loadClientes()}
          surfaceId="mei_catalogo.clientes.page"
        />
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="mei-catalogo-clientes-busca" className="mb-1 block text-sm font-medium dark:text-slate-200">
            Pesquisar
          </label>
          <input
            id="mei-catalogo-clientes-busca"
            type="search"
            className="planner-input-compact w-full"
            placeholder="Nome, e-mail ou documento…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
            aria-describedby="mei-catalogo-clientes-busca-hint"
          />
          <p id="mei-catalogo-clientes-busca-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A pesquisa envia o pedido após {SEARCH_DEBOUNCE_MS} ms sem digitar.
          </p>
        </div>
        <button type="button" className="planner-button flex shrink-0 items-center gap-2" onClick={openCreate}>
          <PlusCircle size={18} aria-hidden />
          Novo cliente
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">Carregando…</div>
      ) : emptyWithQuery ? (
        <EmptyState
          icon={Users}
          title="Nenhum resultado"
          description="Não há clientes que correspondam a esta pesquisa. Tente outro termo ou limpe o campo."
          action={
            <button type="button" className="planner-button" onClick={() => setSearchInput('')}>
              Limpar pesquisa
            </button>
          }
        />
      ) : emptyNoQuery ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente no catálogo"
          description="Adicione clientes para reutilizar tomadores ao emitir NFS-e, sem voltar a digitar os dados."
          action={
            <button type="button" className="planner-button" onClick={openCreate}>
              Novo cliente
            </button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="planner-card-muted p-4 shadow-sm"
              >
                <p className="font-medium text-slate-900 dark:text-white">{row.nome || '—'}</p>
                <p className="mt-1 text-sm tabular-nums text-slate-600 dark:text-slate-300">
                  {formatDocumentoListaPtBr(row.documento)}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                  {row.email?.trim() ? row.email : '—'}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg px-2 py-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    onClick={() => openEdit(row)}
                  >
                    <Pencil size={16} aria-hidden />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-lg px-2 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    aria-label={ariaLabelExcluirCliente(row)}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(row);
                    }}
                  >
                    <Trash2 size={16} aria-hidden />
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 md:block">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/50">
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Nome / razão social
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Documento
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    E-mail
                  </th>
                  <th scope="col" className="min-w-[140px] px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.nome || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatDocumentoListaPtBr(row.documento)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {row.email?.trim() ? row.email : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={16} aria-hidden />
                        Editar
                      </button>
                      <button
                        type="button"
                        className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        aria-label={ariaLabelExcluirCliente(row)}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(row);
                        }}
                      >
                        <Trash2 size={16} aria-hidden />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <MeiCatalogoClienteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        editing={editing}
        onRequestDelete={() => {
          if (editing) {
            setDeleteError(null);
            setDeleteTarget(editing);
          }
        }}
      />

      <MeiCatalogoDeleteClienteConfirmDialog
        open={Boolean(deleteTarget)}
        cliente={deleteTarget}
        isDeleting={deleteSubmitting}
        errorMessage={deleteError}
        onCancel={closeDeleteConfirm}
        onConfirm={() => void confirmDeleteCliente()}
      />
    </PageShell>
  );
}
