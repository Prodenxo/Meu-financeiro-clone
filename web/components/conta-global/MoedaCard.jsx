'use client';

import { useEffect, useRef } from 'react';
import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { formatCotacaoBrl, formatMoedaComCodigo } from '@/lib/finance/moedas';
import t from '@/components/transactions/transactions.module.css';
import s from './contaGlobal.module.css';
import { MoedaFlag } from './MoedaFlag';

const HIDDEN = '••••••';

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

/**
 * Card de uma moeda: bandeira, código, nome/apelido, saldo na moeda, ≈ em reais e cotação aplicada.
 * Menu com editar/excluir (mesmas operações do app atual).
 */
export function MoedaCard({ row, hideValues, menuOpen, onToggleMenu, onCloseMenu, onEdit, onDelete, busy }) {
  const menuRef = useDismiss(menuOpen, onCloseMenu);
  const valorLabel = formatMoedaComCodigo(row.valor, row.moeda);
  const temCotacao = row.rate != null;

  return (
    <article className={s.moedaCard} aria-label={`${row.moeda} — ${row.label}`}>
      <div className={s.moedaTop}>
        <MoedaFlag moeda={row.moeda} size={36} label={row.nomeMoeda} />
        <div className={s.moedaIdentity}>
          <span className={s.moedaCode}>{row.moeda}</span>
          <span className={s.moedaName} title={row.label}>
            {row.label}
          </span>
        </div>
        <div className={t.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={t.menuBtn}
            aria-label={`Ações de ${row.moeda}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
            disabled={busy}
          >
            <Icon name="ellipsis" size={18} />
          </button>
          {menuOpen ? (
            <div className={t.menu} role="menu">
              <button type="button" role="menuitem" className={t.menuItem} onClick={() => onEdit(row)} autoFocus>
                <Icon name="pencil" size={16} /> Editar moeda
              </button>
              <button type="button" role="menuitem" className={cx(t.menuItem, t.menuDanger)} onClick={() => onDelete(row)}>
                <Icon name="trash" size={16} /> Excluir moeda
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className={cx(s.moedaValor, row.valor < 0 && s.moedaValorNegativo)} title={valorLabel}>
        {hideValues ? `${HIDDEN} ${row.moeda}` : valorLabel}
      </p>
      <p className={cx(s.moedaBrl, !temCotacao && s.moedaBrlMissing)} title={temCotacao ? formatBrl(row.valorBrl) : undefined}>
        {temCotacao ? `≈ ${hideValues ? `R$ ${HIDDEN}` : formatBrl(row.valorBrl)}` : 'Cotação indisponível'}
      </p>

      <div className={s.moedaFoot}>{temCotacao ? `1 ${row.moeda} ≈ ${formatCotacaoBrl(row.rate)}` : 'Sem cotação de referência agora'}</div>
    </article>
  );
}

/** Card tracejado que abre o mesmo cadastro do botão do cabeçalho. */
export function AddMoedaCard({ onClick, busy }) {
  return (
    <button type="button" className={s.addCard} onClick={onClick} disabled={busy} aria-label="Adicionar moeda">
      <span className={s.addIcon}>
        <Icon name="plus" size={20} />
      </span>
      Adicionar moeda
    </button>
  );
}
