import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import FetchErrorBanner from '../components/FetchErrorBanner';
import MeiCatalogoProdutoModal from '../components/MeiCatalogoProdutoModal';
import MeiCatalogoDeleteProdutoConfirmDialog from '../components/MeiCatalogoDeleteProdutoConfirmDialog';
import {
  eliminarCatalogoNfseProduto,
  listarCatalogoNfseProdutos,
  type NfseCatalogProduto
} from '../services/meiNotasService';
import { formatBrlDisplay } from '../lib/formatMoneyPtBr';
import { toast } from '../lib/toast';
import { userFacingToastSummary } from '../lib/mapUnknownErrorToUserFacing';
import {
  MEI_CATALOG_DOC_FILTER_OPTIONS,
  meiCatalogListFilterEmptyMessage,
  meiFiscalDocumentTypeShortLabel,
  type MeiFiscalListDocumentFilter
} from '../utils/meiFiscalDocumentTypeUi';

const SEARCH_DEBOUNCE_MS = 300;
const LIST_LIMIT = 50;
const DISC_PREVIEW_LEN = 56;

function summarizeDiscriminacao(s: string | null | undefined): string {
  const t = (s || '').trim();
  if (t.length <= DISC_PREVIEW_LEN) return t;
  return `${t.slice(0, DISC_PREVIEW_LEN - 1)}…`;
}

function formatAliquotaLista(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} %`;
}

function ariaLabelExcluirItem(row: NfseCatalogProduto): string {
  const preview = summarizeDiscriminacao(row.discriminacao);
  const short = preview.length > 80 ? `${preview.slice(0, 77)}…` : preview;
  return `Excluir item ${short} do catálogo`;
}

export default function MeiCatalogoServicosProdutos() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [docFilter, setDocFilter] = useState<MeiFiscalListDocumentFilter>('all');
  const [rows, setRows] = useState<NfseCatalogProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<unknown | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NfseCatalogProduto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NfseCatalogProduto | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** UX spec §12.3: evita segundo DELETE antes do re-render com isDeleting (duplo clique rápido). */
  const deleteRequestInFlightRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadProdutos = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await listarCatalogoNfseProdutos({
        ...(debouncedQ ? { q: debouncedQ } : {}),
        limit: LIST_LIMIT,
        ...(docFilter !== 'all' ? { documentType: docFilter } : {})
      });
      setRows(data);
    } catch (err) {
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, docFilter]);

  useEffect(() => {
    void loadProdutos();
  }, [loadProdutos]);

  const handleSaved = (kind: 'create' | 'edit') => {
    toast.success(kind === 'create' ? 'Item registado no catálogo.' : 'Item atualizado.');
    void loadProdutos();
  };

  const closeDeleteConfirm = () => {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDeleteProduto = async () => {
    if (!deleteTarget || deleteRequestInFlightRef.current) return;
    deleteRequestInFlightRef.current = true;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await eliminarCatalogoNfseProduto(deleteTarget.id);
      toast.success('Item removido do catálogo.');
      setDeleteTarget(null);
      setDeleteError(null);
      setModalOpen(false);
      setEditing(null);
      void loadProdutos();
    } catch (err) {
      const msg = userFacingToastSummary(err, 'Não foi possível eliminar o item.');
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      deleteRequestInFlightRef.current = false;
      setDeleteSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: NfseCatalogProduto) => {
    setEditing(row);
    setModalOpen(true);
  };

  const emptyWithQuery = Boolean(debouncedQ) && !loading && rows.length === 0;
  const emptyNoQuery = !debouncedQ && !loading && rows.length === 0;
  const emptyCatalogMessage = meiCatalogListFilterEmptyMessage(docFilter);

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

      <PageTitle subtitle="Serviços e produtos usados na emissão de NFS-e, NF-e e NFC-e">
        Catálogo — serviços e produtos
      </PageTitle>

      {listError != null ? (
        <FetchErrorBanner
          error={listError}
          onRetry={() => void loadProdutos()}
          surfaceId="mei_catalogo.produtos.page"
        />
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="mei-catalogo-prod-busca" className="mb-1 block text-sm font-medium dark:text-slate-200">
            Pesquisar
          </label>
          <input
            id="mei-catalogo-prod-busca"
            type="search"
            className="planner-input-compact w-full"
            placeholder="Discriminação, CNAE ou código…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
            aria-describedby="mei-catalogo-prod-busca-hint"
          />
          <p id="mei-catalogo-prod-busca-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A pesquisa envia o pedido após {SEARCH_DEBOUNCE_MS} ms sem digitar.
          </p>
        </div>
        <button type="button" className="planner-button flex shrink-0 items-center gap-2" onClick={openCreate}>
          <PlusCircle size={18} aria-hidden />
          Novo item
        </button>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Filtrar por tipo de documento"
      >
        {MEI_CATALOG_DOC_FILTER_OPTIONS.map((opt) => {
          const active = docFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={
                active
                  ? 'rounded-lg border border-blue-500/60 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:border-blue-400/50 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
              }
              onClick={() => setDocFilter(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">Carregando…</div>
      ) : emptyWithQuery ? (
        <EmptyState
          icon={Package}
          title="Nenhum resultado"
          description="Não há itens que correspondam a esta pesquisa. Tente outro termo ou limpe o campo."
          action={
            <button type="button" className="planner-button" onClick={() => setSearchInput('')}>
              Limpar pesquisa
            </button>
          }
        />
      ) : emptyNoQuery ? (
        <EmptyState
          icon={Package}
          title="Nenhum item no catálogo"
          description={emptyCatalogMessage}
          action={
            <button type="button" className="planner-button" onClick={openCreate}>
              Novo item
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile: cartões */}
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="planner-card-muted p-4 shadow-sm"
              >
                <p className="font-medium text-slate-900 dark:text-white">{summarizeDiscriminacao(row.discriminacao)}</p>
                <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {meiFiscalDocumentTypeShortLabel(row.document_type)}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <dt className="text-slate-500 dark:text-slate-400">CNAE</dt>
                  <dd className="tabular-nums">{row.cnae?.trim() ? row.cnae : '—'}</dd>
                  <dt className="text-slate-500 dark:text-slate-400">Alíquota</dt>
                  <dd className="tabular-nums">{formatAliquotaLista(row.aliquota ?? null)}</dd>
                  <dt className="text-slate-500 dark:text-slate-400">Valor sugerido</dt>
                  <dd className="tabular-nums">{formatBrlDisplay(row.valor_sugerido ?? null)}</dd>
                  <dt className="text-slate-500 dark:text-slate-400">Código</dt>
                  <dd className="truncate">{row.codigo?.trim() ? row.codigo : '—'}</dd>
                </dl>
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
                    aria-label={ariaLabelExcluirItem(row)}
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

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 md:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/50">
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Discriminação
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    CNAE
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Alíquota
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Valor sugerido
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                    Código
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
                    <td className="max-w-[220px] px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <span title={row.discriminacao || undefined}>{summarizeDiscriminacao(row.discriminacao)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {meiFiscalDocumentTypeShortLabel(row.document_type)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {row.cnae?.trim() ? row.cnae : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatAliquotaLista(row.aliquota ?? null)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatBrlDisplay(row.valor_sugerido ?? null)}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {row.codigo?.trim() ? row.codigo : '—'}
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
                        aria-label={ariaLabelExcluirItem(row)}
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

      <MeiCatalogoProdutoModal
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

      <MeiCatalogoDeleteProdutoConfirmDialog
        open={Boolean(deleteTarget)}
        produto={deleteTarget}
        isDeleting={deleteSubmitting}
        errorMessage={deleteError}
        onCancel={closeDeleteConfirm}
        onConfirm={() => void confirmDeleteProduto()}
      />
    </PageShell>
  );
}
