import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchAdminMeiCatalogoClientes } from '../../services/adminUserDataService';
import type { NfseCatalogCliente } from '../../services/meiNotasService';

const CATALOG_LIMIT = 30;
const MANUAL_KEY = '__manual__';

export interface AdminMeiCatalogClienteComboboxProps {
  userId: string;
  /** PRD §6.2 opção (a): quando `false`, o bloco do catálogo não é renderizado. */
  meiEnabled: boolean;
  formatDocument: (digitsOnly: string) => string;
  onApplyCliente: (fields: {
    tomadorCpfCnpj: string;
    tomadorRazaoSocial: string;
    tomadorEmail: string;
  }) => void;
  /** Incrementar após mutações no catálogo (ex.: drawer “Gerir clientes”) para refetch. */
  catalogRefreshToken?: number;
}

function buildClienteLabel(cliente: NfseCatalogCliente, formatDocument: (d: string) => string) {
  const nome = cliente.nome?.trim() || 'Sem nome';
  const raw = String(cliente.documento || '').replace(/\D/g, '');
  const doc = raw ? formatDocument(raw) : '';
  return doc ? `${nome} (${doc})` : nome;
}

export function AdminMeiCatalogClienteCombobox({
  userId,
  meiEnabled,
  formatDocument,
  onApplyCliente,
  catalogRefreshToken = 0
}: AdminMeiCatalogClienteComboboxProps) {
  const listboxId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [items, setItems] = useState<NfseCatalogCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [committedLabel, setCommittedLabel] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(filterText.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [filterText]);

  useEffect(() => {
    if (!meiEnabled || !userId.trim()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminMeiCatalogoClientes(userId, { q: debouncedQ, limit: CATALOG_LIMIT })
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            'Não foi possível carregar o catálogo. Tente novamente ou use preenchimento manual.'
          );
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, debouncedQ, meiEnabled, catalogRefreshToken]);

  const flatOptions = useMemo(() => {
    const manual = {
      key: MANUAL_KEY as const,
      label: 'Preencher manualmente',
      cliente: null as NfseCatalogCliente | null
    };
    return [
      manual,
      ...items.map((c) => ({
        key: c.id,
        label: buildClienteLabel(c, formatDocument),
        cliente: c
      }))
    ];
  }, [items, formatDocument]);

  useEffect(() => {
    setHighlightIndex((i) => Math.min(i, Math.max(0, flatOptions.length - 1)));
  }, [flatOptions.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFilterText('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isOpen]);

  const selectIndex = useCallback(
    (idx: number) => {
      const opt = flatOptions[idx];
      if (!opt) return;
      if (opt.key === MANUAL_KEY) {
        setCommittedLabel('Preencher manualmente');
      } else if (opt.cliente) {
        const raw = String(opt.cliente.documento || '').replace(/\D/g, '');
        onApplyCliente({
          tomadorCpfCnpj: formatDocument(raw),
          tomadorRazaoSocial: opt.cliente.nome?.trim() || '',
          tomadorEmail: opt.cliente.email?.trim() || ''
        });
        setCommittedLabel(opt.label);
      }
      setIsOpen(false);
      setFilterText('');
      setHighlightIndex(0);
    },
    [flatOptions, formatDocument, onApplyCliente]
  );

  const openList = useCallback(() => {
    setIsOpen(true);
    setFilterText('');
    setHighlightIndex(0);
  }, []);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setFilterText('');
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) openList();
      else setHighlightIndex((i) => Math.min(i + 1, flatOptions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) openList();
      else setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      selectIndex(highlightIndex);
    }
  };

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-option-index="${highlightIndex}"]`);
    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, isOpen]);

  if (!meiEnabled) return null;

  const inputValue = isOpen ? filterText : committedLabel ?? '';
  const emptyCatalog = !loading && !error && items.length === 0 && !debouncedQ;
  const noSearchResults = isOpen && !loading && !error && items.length === 0 && Boolean(debouncedQ);

  return (
    <div ref={rootRef} className="space-y-1">
      <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        Cliente do catálogo (opcional)
      </label>
      <div className="relative">
        <div className="flex gap-1">
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              isOpen && flatOptions[highlightIndex]
                ? `${listboxId}-opt-${highlightIndex}`
                : undefined
            }
            aria-busy={loading}
            disabled={!userId.trim()}
            value={inputValue}
            placeholder="Buscar cliente ou abrir lista…"
            onChange={(e) => {
              const v = e.target.value;
              setFilterText(v);
              setIsOpen(true);
              setHighlightIndex(0);
              setCommittedLabel(null);
            }}
            onKeyDown={onInputKeyDown}
            className="planner-input-compact min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
          />
          <button
            type="button"
            aria-label={isOpen ? 'Fechar lista de clientes' : 'Abrir lista de clientes'}
            disabled={!userId.trim()}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
                setFilterText('');
              } else {
                openList();
              }
            }}
            className="planner-button-secondary-compact flex shrink-0 items-center justify-center px-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen ? (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
          >
            {flatOptions.map((opt, idx) => (
              <li
                key={opt.key}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                data-option-index={idx}
                aria-selected={idx === highlightIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === highlightIndex
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
                onMouseEnter={() => setHighlightIndex(idx)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  selectIndex(idx);
                }}
              >
                {opt.label}
              </li>
            ))}
            {isOpen && emptyCatalog ? (
              <li
                role="presentation"
                className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
              >
                Este usuário ainda não tem clientes salvos para NFS-e. Preencha os dados manualmente.
              </li>
            ) : null}
            {noSearchResults ? (
              <li role="presentation" className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                Nenhum cliente corresponde à pesquisa. Preencha manualmente ou ajuste o termo.
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          Carregando clientes…
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      {emptyCatalog && !isOpen ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Este usuário ainda não tem clientes salvos para NFS-e. Preencha os dados manualmente.
        </p>
      ) : null}
    </div>
  );
}
