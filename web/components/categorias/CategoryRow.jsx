'use client';

import { useEffect, useRef } from 'react';
import { Progress, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl, formatDayMonth } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import { hasMovement, shareOf } from '@/lib/finance/categorias';
import t from '@/components/transactions/transactions.module.css';
import s from './categorias.module.css';

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
export function CategoryIcon({ row, className, size = 16 }) {
  return (
    <span className={className} style={{ background: `${row.color}1f`, borderColor: `${row.color}44`, color: row.color }}>
      <Icon name={row.isOrphan ? 'tag' : getCategoryIconName(row.nome)} size={size} />
    </span>
  );
}

function txLabel(tx) {
  const obs = String(tx.obs || '').trim();
  return obs || formatDayMonth(String(tx.data || '').slice(0, 10));
}

/**
 * Linha de categoria: ícone, nome, nº de movimentações, barra de participação,
 * percentual, valor e ações (editar, excluir, mais opções). Expande para ver os lançamentos.
 */
export function CategoryRow({ row, total, expanded, onToggle, canManage, menuOpen, onToggleMenu, onCloseMenu, onEdit, onDelete, busy }) {
  const menuRef = useDismiss(menuOpen, onCloseMenu);
  const active = hasMovement(row);
  const pct = shareOf(row.amount, total);
  const moves = `${row.count} ${row.count === 1 ? 'movimentação' : 'movimentações'}`;
  const valueClass = row.tipo === 'entrada' ? t.positive : t.negative;

  return (
    <article className={cx(s.row, !active && s.rowDimmed)} aria-label={row.nome}>
      <CategoryIcon row={row} className={s.rowIcon} />
      <div className={s.rowText}>
        <span className={s.rowName} title={row.nome}>
          {row.nome}
        </span>
        <span className={s.rowMeta}>{moves}</span>
      </div>
      <div className={s.rowBar}>
        <Progress value={pct} color={active ? row.color : 'var(--mf-border)'} label={`${row.nome}: ${Math.round(pct)}% do total`} />
      </div>
      <span className={s.rowPct}>{Math.round(pct)}%</span>
      <span className={cx(s.rowAmount, active && valueClass)}>{formatBrl(row.amount)}</span>
      <div className={s.actions}>
        {canManage ? (
          <>
            <button type="button" className={s.iconBtn} aria-label={`Editar ${row.nome}`} onClick={() => onEdit(row)} disabled={busy}>
              <Icon name="pencil" size={16} />
            </button>
            <button type="button" className={cx(s.iconBtn, s.iconBtnDanger)} aria-label={`Excluir ${row.nome}`} onClick={() => onDelete(row)} disabled={busy}>
              <Icon name="trash" size={16} />
            </button>
          </>
        ) : null}
        <div className={t.menuWrap} ref={menuRef}>
          <button type="button" className={t.menuBtn} aria-label={`Mais opções de ${row.nome}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={onToggleMenu} disabled={busy}>
            <Icon name="ellipsis" size={18} />
          </button>
          {menuOpen ? (
            <div className={t.menu} role="menu">
              <button type="button" role="menuitem" className={t.menuItem} onClick={() => onToggle(row.id)} autoFocus disabled={row.count === 0}>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} /> {expanded ? 'Ocultar lançamentos' : 'Ver lançamentos'}
              </button>
              {canManage ? (
                <>
                  <button type="button" role="menuitem" className={t.menuItem} onClick={() => onEdit(row)}>
                    <Icon name="pencil" size={16} /> Editar categoria
                  </button>
                  <button type="button" role="menuitem" className={cx(t.menuItem, t.menuDanger)} onClick={() => onDelete(row)}>
                    <Icon name="trash" size={16} /> Excluir categoria
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {expanded && row.transactions.length > 0 ? (
        <ul className={s.txList} aria-label={`Lançamentos de ${row.nome}`}>
          {row.transactions.map((tx) => (
            <li key={tx.id} className={s.txRow}>
              <span title={txLabel(tx)}>{txLabel(tx)}</span>
              <span className={s.rowMeta}>{formatDayMonth(String(tx.data || '').slice(0, 10))}</span>
              <span className={s.txAmount}>{formatBrl(Number(tx.valor) || 0)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
