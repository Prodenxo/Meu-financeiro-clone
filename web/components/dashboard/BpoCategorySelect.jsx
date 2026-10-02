'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './bpo.module.css';

function filterRows(rows, query) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.nome.toLowerCase().includes(q));
}

export function BpoCategorySelect({ receitas, despesas, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const receitasFiltered = useMemo(() => filterRows(receitas, query), [receitas, query]);
  const despesasFiltered = useMemo(() => filterRows(despesas, query), [despesas, query]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const hit = [...receitas, ...despesas].find((row) => String(row.categoriasId) === String(value));
    return hit?.nome || '';
  }, [value, receitas, despesas]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const pick = (id) => {
    onChange(id ? String(id) : '');
    setOpen(false);
    setQuery('');
  };

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((current) => !current);
    if (open) setQuery('');
  };

  const empty = receitasFiltered.length === 0 && despesasFiltered.length === 0;

  return (
    <div ref={rootRef} className={`${s.search} ${s.categorySelect}`}>
      <button
        type="button"
        className={s.categoryTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filtrar por categoria"
        disabled={disabled}
        onClick={toggleOpen}
      >
        <span className={selectedLabel ? s.categoryTriggerValue : s.categoryTriggerPlaceholder}>
          {selectedLabel || 'Categoria…'}
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {value ? (
        <button
          type="button"
          className={s.categoryClear}
          aria-label="Limpar filtro de categoria"
          onClick={() => pick('')}
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
      {open ? (
        <div className={s.categoryPanel}>
          <div className={s.categorySearch}>
            <Icon name="search" size={16} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoria…"
              aria-label="Buscar categoria"
              autoComplete="off"
              autoFocus
            />
          </div>
          <ul className={s.categoryList} role="listbox" aria-label="Categorias">
            <li role="presentation">
              <button
                type="button"
                role="option"
                className={s.categoryOption}
                aria-selected={!value}
                onClick={() => pick('')}
              >
                Todas as categorias
              </button>
            </li>
            {receitasFiltered.length > 0 ? (
              <li role="presentation">
                <p className={s.categoryGroupLabel}>Receitas</p>
                <ul className={s.categoryGroupList}>
                  {receitasFiltered.map((row) => (
                    <li key={row.categoriasId} role="presentation">
                      <button
                        type="button"
                        role="option"
                        className={s.categoryOption}
                        aria-selected={String(row.categoriasId) === String(value)}
                        onClick={() => pick(row.categoriasId)}
                      >
                        {row.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
            {despesasFiltered.length > 0 ? (
              <li role="presentation">
                <p className={s.categoryGroupLabel}>Despesas</p>
                <ul className={s.categoryGroupList}>
                  {despesasFiltered.map((row) => (
                    <li key={row.categoriasId} role="presentation">
                      <button
                        type="button"
                        role="option"
                        className={s.categoryOption}
                        aria-selected={String(row.categoriasId) === String(value)}
                        onClick={() => pick(row.categoriasId)}
                      >
                        {row.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
            {empty ? <li className={s.categoryEmpty}>Nenhuma categoria encontrada.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
