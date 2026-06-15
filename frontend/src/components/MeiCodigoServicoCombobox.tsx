import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from 'react';
import { ChevronDown } from 'lucide-react';
import {
  listarCodigosServicosReferencia,
  type CodigoServicoReferencia
} from '../services/meiNotasService';

const DEBOUNCE_MS = 300;
const CATALOG_LIMIT = 50;

const PLACEHOLDER = 'Pesquisar código ou descrição…';
const ERROR_LOAD = 'Não foi possível carregar os códigos. Tenta novamente.';
const LEGACY_HELPER =
  'Este código não consta na lista de referência. Podes substituir pesquisando ou limpar.';
const LEGACY_INLINE = '(código não encontrado na lista atual)';

function truncateMiddleLabel(text: string, max = 72): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildClosedLabel(
  codigo: string,
  descricao: string | null,
  legacy: boolean
): string {
  const c = codigo.trim();
  if (!c) return '';
  if (legacy) {
    return `${c} · ${LEGACY_INLINE}`;
  }
  const d = (descricao || '').trim();
  if (!d) return c;
  return truncateMiddleLabel(`${c} · ${d}`);
}

export interface MeiCodigoServicoComboboxProps {
  id: string;
  value: string;
  onChange: (nextCodigo: string) => void;
  /** Disparado ao escolher uma linha da lista (inclui sugestão NBS, quando houver). */
  onSelectReferencia?: (item: CodigoServicoReferencia) => void;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export const MeiCodigoServicoCombobox = forwardRef<HTMLInputElement, MeiCodigoServicoComboboxProps>(
  function MeiCodigoServicoCombobox(
    { id, value, onChange, onSelectReferencia, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy },
    ref
  ) {
    const listboxId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [items, setItems] = useState<CodigoServicoReferencia[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const [resolveLoading, setResolveLoading] = useState(false);
    const [resolvedDesc, setResolvedDesc] = useState<string | null>(null);
    const [legacyMode, setLegacyMode] = useState(false);
    /** Falha ao resolver código em edição (rede/API) — não confundir com legado (FR-CAT-COD-06). */
    const [resolveError, setResolveError] = useState<string | null>(null);

    useEffect(() => {
      const t = window.setTimeout(() => {
        setDebouncedQ(filterText.trim());
      }, DEBOUNCE_MS);
      return () => window.clearTimeout(t);
    }, [filterText]);

    useEffect(() => {
      if (!isOpen) return;
      let cancelled = false;
      setLoadingList(true);
      setListError(null);
      listarCodigosServicosReferencia({ q: debouncedQ, limit: CATALOG_LIMIT })
        .then((data) => {
          if (!cancelled) setItems(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!cancelled) {
            setListError(ERROR_LOAD);
            setItems([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingList(false);
        });
      return () => {
        cancelled = true;
      };
    }, [debouncedQ, isOpen]);

    const codeTrim = value.trim();

    useEffect(() => {
      if (!codeTrim) {
        setResolvedDesc(null);
        setLegacyMode(false);
        setResolveLoading(false);
        setResolveError(null);
        return;
      }
      let cancelled = false;
      setResolveLoading(true);
      setResolveError(null);
      listarCodigosServicosReferencia({ q: codeTrim, limit: CATALOG_LIMIT })
        .then((rows) => {
          if (cancelled) return;
          const exact = rows.find((r) => String(r.codigo).trim() === codeTrim);
          if (exact) {
            setResolvedDesc(String(exact.descricao ?? ''));
            setLegacyMode(false);
            setResolveError(null);
          } else {
            setResolvedDesc(null);
            setLegacyMode(true);
            setResolveError(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedDesc(null);
            setLegacyMode(false);
            setResolveError(ERROR_LOAD);
          }
        })
        .finally(() => {
          if (!cancelled) setResolveLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [codeTrim]);

    useEffect(() => {
      setHighlightIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
    }, [items.length]);

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

    useEffect(() => {
      if (!isOpen || !listRef.current) return;
      const el = listRef.current.querySelector(`[data-option-index="${highlightIndex}"]`);
      if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
        (el as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }, [highlightIndex, isOpen]);

    const openList = useCallback(() => {
      setIsOpen(true);
      setFilterText('');
      setDebouncedQ('');
      setHighlightIndex(0);
    }, []);

    const selectRow = useCallback(
      (row: CodigoServicoReferencia) => {
        onChange(String(row.codigo).trim());
        onSelectReferencia?.(row);
        setResolvedDesc(String(row.descricao ?? ''));
        setLegacyMode(false);
        setResolveError(null);
        setIsOpen(false);
        setFilterText('');
        setHighlightIndex(0);
      },
      [onChange, onSelectReferencia]
    );

    const clearSelection = useCallback(() => {
      onChange('');
      setResolvedDesc(null);
      setLegacyMode(false);
      setResolveError(null);
      setIsOpen(false);
      setFilterText('');
    }, [onChange]);

    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          setFilterText('');
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) openList();
        else setHighlightIndex((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) openList();
        else setHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && isOpen && items.length > 0) {
        e.preventDefault();
        const row = items[highlightIndex];
        if (row) selectRow(row);
      }
    };

    const closedDisplay = useMemo(
      () => buildClosedLabel(codeTrim, resolvedDesc, legacyMode),
      [codeTrim, resolvedDesc, legacyMode]
    );

    const inputValue = isOpen ? filterText : closedDisplay;
    const showClear = Boolean(codeTrim) && !isOpen;

    const emptyQuery = !debouncedQ;
    const noSearchResults =
      isOpen && !loadingList && !listError && items.length === 0 && !emptyQuery;
    const emptyAfterLoad = isOpen && !loadingList && !listError && items.length === 0 && emptyQuery;

    const titleFullClosed =
      codeTrim && !isOpen
        ? legacyMode
          ? codeTrim
          : `${codeTrim} · ${(resolvedDesc || '').trim()}`
        : undefined;

    const combinedDescribedBy =
      [
        ariaDescribedBy,
        !isOpen && resolveError && codeTrim ? `${id}-resolve-err` : null,
        !isOpen && legacyMode && codeTrim && !resolveError ? `${id}-legacy-hint` : null
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div ref={rootRef} className="space-y-1">
        <div className="relative">
          <div className="flex gap-1">
            <input
              ref={ref}
              id={id}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                isOpen && items[highlightIndex]
                  ? `${listboxId}-opt-${highlightIndex}`
                  : undefined
              }
              aria-busy={loadingList || resolveLoading}
              aria-invalid={ariaInvalid}
              aria-describedby={combinedDescribedBy}
              value={inputValue}
              placeholder={PLACEHOLDER}
              title={isOpen ? undefined : titleFullClosed}
              onFocus={() => {
                if (!isOpen) openList();
              }}
              onChange={(e) => {
                const v = e.target.value;
                setFilterText(v);
                setIsOpen(true);
                setHighlightIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              className="planner-input-compact min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
            />
            {showClear ? (
              <button
                type="button"
                className="planner-button-secondary-compact shrink-0 px-2 text-sm"
                onClick={clearSelection}
              >
                Limpar
              </button>
            ) : null}
            <button
              type="button"
              aria-label={isOpen ? 'Fechar lista de códigos' : 'Abrir lista de códigos'}
              onClick={() => {
                if (isOpen) {
                  setIsOpen(false);
                  setFilterText('');
                } else {
                  openList();
                }
              }}
              className="planner-button-secondary-compact flex shrink-0 items-center justify-center px-2"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isOpen ? (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {loadingList ? (
                <li role="presentation" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                  A carregar…
                </li>
              ) : null}
              {!loadingList &&
                items.map((row, idx) => {
                  const full = `${row.codigo} · ${row.descricao}`;
                  return (
                    <li
                      key={`${row.codigo}-${idx}`}
                      id={`${listboxId}-opt-${idx}`}
                      role="option"
                      data-option-index={idx}
                      aria-selected={idx === highlightIndex}
                      title={full}
                      className={`cursor-pointer px-3 py-2 text-sm ${
                        idx === highlightIndex
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        selectRow(row);
                      }}
                    >
                      <span className="tabular-nums text-slate-900 dark:text-slate-100">{row.codigo}</span>
                      <span className="text-slate-500 dark:text-slate-400"> · </span>
                      <span className="inline-block max-w-[min(100%,18rem)] truncate align-bottom">
                        {row.descricao}
                      </span>
                    </li>
                  );
                })}
              {listError ? (
                <li role="alert" className="px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                  {listError}
                </li>
              ) : null}
              {!loadingList && !listError && noSearchResults ? (
                <li role="presentation" className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  {`Nenhum resultado para «${debouncedQ}».`}
                </li>
              ) : null}
              {!loadingList && !listError && emptyAfterLoad ? (
                <li role="presentation" className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                  Nenhum resultado.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {resolveLoading && codeTrim ? (
          <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
            A carregar…
          </p>
        ) : null}

        {!isOpen && resolveError && codeTrim ? (
          <p
            id={`${id}-resolve-err`}
            role="alert"
            className="text-xs text-rose-600 dark:text-rose-400"
          >
            {resolveError}
          </p>
        ) : null}

        {!isOpen && legacyMode && codeTrim && !resolveError ? (
          <p className="text-xs text-amber-700 dark:text-amber-300/90" id={`${id}-legacy-hint`}>
            {LEGACY_HELPER}
          </p>
        ) : null}
      </div>
    );
  }
);
