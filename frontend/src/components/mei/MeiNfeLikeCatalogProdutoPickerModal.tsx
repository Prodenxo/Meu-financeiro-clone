import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UserFacingErrorBlock from '../UserFacingErrorBlock';
import { mapMeiCatalogApiErrorToUserFacing } from '../../lib/mapMeiCatalogApiErrorToUserFacing';
import {
  listarCatalogoNfseProdutos,
  type NfseCatalogProduto
} from '../../services/meiNotasService';
import { isCatalogProdutoUsableForNfeLike } from '../../utils/nfeCatalogProdutoMetadata';

export type MeiNfeLikeCatalogProdutoPickerModalProps = {
  open: boolean;
  onClose: () => void;
  /** Filtro API — produtos com `document_type` NFE ou NFCE. */
  documentType: 'NFE' | 'NFCE';
  documentLabel: 'NF-e' | 'NFC-e';
  onSelectProduct: (produto: NfseCatalogProduto) => void;
};

const CATALOG_ROUTE = '/mei-catalogo/servicos-produtos';

export function MeiNfeLikeCatalogProdutoPickerModal({
  open,
  onClose,
  documentType,
  documentLabel,
  onSelectProduct
}: MeiNfeLikeCatalogProdutoPickerModalProps) {
  const titleId = useId();
  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<NfseCatalogProduto[]>([]);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listarCatalogoNfseProdutos({
        documentType,
        limit: 50
      });
      setRows(Array.isArray(data) ? data.filter(isCatalogProdutoUsableForNfeLike) : []);
    } catch (e) {
      setLoadError(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [documentType]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /** WCAG: manter Tab dentro do diálogo quando há ≥2 elementos focáveis (FR-GUIA-FISC-12 / QA). */
  useEffect(() => {
    if (!open) return;
    const panel = dialogPanelRef.current;
    if (!panel) return;

    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Tab') return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusables.length < 2) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      if (!ev.shiftKey && active === last) {
        ev.preventDefault();
        first.focus();
      } else if (ev.shiftKey && active === first) {
        ev.preventDefault();
        last.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  const errId = 'mei-nfe-like-catalog-picker-api-err';

  const pick = (p: NfseCatalogProduto) => {
    onSelectProduct(p);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogPanelRef}
        className="planner-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="mei-nfe-like-catalog-picker"
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Fechar"
          className="absolute right-3 top-3 text-slate-400 dark:text-slate-300"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id={titleId} className="mb-2 pr-8 text-lg font-bold text-slate-800 dark:text-white">
          Adicionar do catálogo — {documentLabel}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Só produtos cadastrados com tipo <strong>{documentType}</strong> e dados NF-e completos (NCM, CFOP,
          tributos). Cadastre ou edite no catálogo de produtos.
        </p>

        {loadError != null ? (
          <div id={errId} className="mb-4" role="alert">
            <UserFacingErrorBlock
              {...mapMeiCatalogApiErrorToUserFacing(
                loadError,
                'Não foi possível carregar o catálogo.',
                'mei_nfe_like.catalog_picker'
              )}
            />
            <button type="button" className="planner-button-secondary-compact mt-2" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
            A carregar…
          </p>
        ) : !loadError && rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300/80 p-4 text-center dark:border-slate-600/80">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Não há produtos compatíveis com {documentLabel} no catálogo. Crie entradas com este tipo na página do
              catálogo.
            </p>
            <Link
              to={CATALOG_ROUTE}
              className="planner-button-secondary-compact mt-3 inline-block no-underline"
              onClick={onClose}
            >
              Ir ao catálogo
            </Link>
          </div>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1" role="list">
            {rows.map((p) => {
              const label = [p.codigo, p.discriminacao].filter(Boolean).join(' — ') || p.id;
              const vu =
                p.valor_sugerido != null && Number.isFinite(p.valor_sugerido)
                  ? p.valor_sugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—';
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:bg-slate-800/60"
                    onClick={() => pick(p)}
                  >
                    <span className="line-clamp-2 font-medium">{label}</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Valor sugerido: {vu}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
