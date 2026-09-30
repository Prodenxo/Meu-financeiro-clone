'use client';

import { Button, Card, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { VIEW_TIPOS } from '@/lib/finance/categorias';
import t from '@/components/transactions/transactions.module.css';
import s from './categorias.module.css';

/** Busca, mês e abas Saídas / Receitas — mesma barra do app atual. */
export function CategoryFilters({ search, onSearch, monthLabel, isCurrentMonth, onPrev, onNext, onToday, viewTipo, onViewTipo }) {
  return (
    <Card aria-label="Filtros de categorias">
      <div className={s.filters}>
        <div className={cx(t.searchWrap, s.searchWrap)}>
          <Icon name="search" size={16} className={t.searchIcon} />
          <Input type="search" placeholder="Buscar categoria" aria-label="Buscar categoria" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
        {!isCurrentMonth ? (
          <Button variant="ghost" size="sm" icon="repeat" onClick={onToday}>
            Voltar para hoje
          </Button>
        ) : null}
        <div className={t.monthPicker} role="group" aria-label="Mês">
          <button type="button" className={t.monthNav} onClick={onPrev} aria-label="Mês anterior">
            <Icon name="chevron-left" size={16} />
          </button>
          <span className={t.monthLabel} aria-live="polite">
            {monthLabel}
          </span>
          <button type="button" className={t.monthNav} onClick={onNext} aria-label="Próximo mês">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <div className={s.tabs} role="tablist" aria-label="Tipo de categoria">
        {VIEW_TIPOS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={viewTipo === opt.value}
            className={cx(s.tab, opt.value === 'saida' ? s.tabSaida : s.tabEntrada)}
            onClick={() => onViewTipo(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
