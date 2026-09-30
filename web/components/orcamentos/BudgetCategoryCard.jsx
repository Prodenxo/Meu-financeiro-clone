'use client';

import { useEffect, useRef } from 'react';
import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import t from '@/components/transactions/transactions.module.css';
import { BudgetProgress } from './BudgetProgress';
import s from './orcamentos.module.css';

function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

/** Ícone da categoria com a cor estável dela (mesma paleta do app atual). */
export function CategoryIcon({ item, className, size = 18 }) {
  return (
    <span className={className} style={{ background: `${item.color}1f`, borderColor: `${item.color}44`, color: item.color }}>
      <Icon name={getCategoryIconName(item.nome)} size={size} />
    </span>
  );
}

/** Menu ⋯ com Editar / Excluir — mesmo padrão das outras telas. */
export function BudgetRowMenu({ item, open, onToggle, onClose, onEdit, onDelete, busy }) {
  const ref = useDismiss(open, onClose);
  return (
    <div className={t.menuWrap} ref={ref}>
      <button type="button" className={t.menuBtn} aria-label={`Ações de ${item.nome}`} aria-haspopup="menu" aria-expanded={open} onClick={onToggle} disabled={busy}>
        <Icon name="ellipsis" size={18} />
      </button>
      {open ? (
        <div className={t.menu} role="menu">
          <button type="button" role="menuitem" className={t.menuItem} onClick={() => onEdit(item)} autoFocus>
            <Icon name="pencil" size={16} /> Editar limite
          </button>
          <button type="button" role="menuitem" className={cx(t.menuItem, t.menuDanger)} onClick={() => onDelete(item)}>
            <Icon name="trash" size={16} /> Remover orçamento
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Card horizontal de uma categoria com orçamento: ícone, nome, limite, utilizado,
 * barra + situação, editar, excluir e menu de ações.
 */
export function BudgetCategoryCard({ item, menuOpen, onToggleMenu, onCloseMenu, onEdit, onDelete, busy }) {
  const over = item.status.key === 'over';
  return (
    <article className={s.categoryCard} aria-label={item.nome}>
      <CategoryIcon item={item} className={s.categoryIcon} />
      <div className={s.categoryText}>
        <span className={s.categoryName} title={item.nome}>
          {item.nome}
        </span>
        <span className={s.categorySub}>{item.tipo === 'entrada' ? 'Meta de receita mensal' : 'Orçamento mensal'}</span>
      </div>
      <div className={cx(s.metric, s.metricLimit)}>
        <span className={s.metricValue}>{formatBrl(item.orcado)}</span>
        <span className={s.metricLabel}>Limite definido</span>
      </div>
      <div className={cx(s.metric, s.metricUsed)}>
        <span className={cx(s.metricValue, over ? t.negative : item.tipo === 'entrada' ? t.positive : undefined)}>{formatBrl(item.realizado)}</span>
        <span className={s.metricLabel}>Valor utilizado</span>
      </div>
      <BudgetProgress item={item} />
      <div className={s.actions}>
        <button type="button" className={s.iconBtn} aria-label={`Editar orçamento de ${item.nome}`} onClick={() => onEdit(item)} disabled={busy}>
          <Icon name="pencil" size={16} />
        </button>
        <button type="button" className={cx(s.iconBtn, s.iconBtnDanger)} aria-label={`Remover orçamento de ${item.nome}`} onClick={() => onDelete(item)} disabled={busy}>
          <Icon name="trash" size={16} />
        </button>
        <BudgetRowMenu item={item} open={menuOpen} onToggle={onToggleMenu} onClose={onCloseMenu} onEdit={onEdit} onDelete={onDelete} busy={busy} />
      </div>
    </article>
  );
}
