'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Pill, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { resolveBankVisual } from '@/lib/finance/bankCatalog';
import { BankLogoImage } from './BankLogoImage';
import { formatDayKeyLong } from '@/lib/finance/contasPage';
import t from '@/components/transactions/transactions.module.css';
import s from './contas.module.css';

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

export function AccountLogo({ conta, className, size = 40 }) {
  const visual = resolveBankVisual(conta);
  return (
    <span className={className} style={{ background: visual.accent }}>
      <BankLogoImage
        logoUrl={visual.logoUrl}
        slug={visual.slug}
        initials={visual.initials}
        size={size}
      />
    </span>
  );
}

/**
 * Card de uma conta — logo, menu (editar/excluir), nome, tipo, saldo disponível e
 * última movimentação com atalho para as transações da conta.
 */
export function AccountCard({
  item,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onSyncOpenFinance,
  onDisconnectOpenFinance,
  busy,
  ofBusy,
}) {
  const { conta, isDefault, saldo, tipoLabel, lastMovementKey } = item;
  const menuRef = useDismiss(menuOpen, onCloseMenu);
  const movementsHref = `/transacoes?conta=${encodeURIComponent(conta.id)}`;
  const isOpenFinance = conta?.of_provider === 'pluggy' && conta?.of_external_id;

  return (
    <article className={s.accountCard} style={{ '--conta-cor': conta.cor || undefined }} aria-label={conta.nome}>
      <div className={s.accountTop}>
        <AccountLogo conta={conta} className={s.accountLogo} />
        <div className={t.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={t.menuBtn}
            aria-label={`Ações de ${conta.nome}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
            disabled={busy}
          >
            <Icon name="ellipsis" size={18} />
          </button>
          {menuOpen ? (
            <div className={t.menu} role="menu">
              <button type="button" role="menuitem" className={t.menuItem} onClick={() => onEdit(item)} autoFocus>
                <Icon name="pencil" size={16} /> Editar conta
              </button>
              <Link href={movementsHref} role="menuitem" className={t.menuItem} onClick={onCloseMenu}>
                <Icon name="arrow-left-right" size={16} /> Ver movimentações
              </Link>
              {isOpenFinance ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className={t.menuItem}
                    disabled={ofBusy}
                    onClick={() => onSyncOpenFinance?.(item)}
                  >
                    <Icon name="refresh-cw" size={16} /> Atualizar extrato
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={t.menuItem}
                    disabled={ofBusy}
                    onClick={() => onDisconnectOpenFinance?.(item)}
                  >
                    <Icon name="unplug" size={16} /> Desconectar banco
                  </button>
                </>
              ) : null}
              <button type="button" role="menuitem" className={cx(t.menuItem, t.menuDanger)} onClick={() => onDelete(item)}>
                <Icon name="trash" size={16} /> Excluir conta
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className={s.accountNameRow}>
        <span className={s.accountName} title={conta.nome}>
          {conta.nome}
        </span>
        {isDefault ? <Pill tone="primary">Padrão</Pill> : null}
        {isOpenFinance ? <Pill tone="neutral">Open Finance</Pill> : null}
      </div>
      <p className={s.accountType}>{tipoLabel}</p>

      <p className={s.balanceLabel}>Saldo disponível</p>
      <p className={cx(s.balanceValue, saldo >= 0 ? s.balancePositive : s.balanceNegative)} title={formatBrl(saldo)}>
        {formatBrl(saldo)}
      </p>
      {conta.tipo === 'cartao_credito' && conta.limite_credito != null ? (
        <p className={s.accountLimit}>Limite {formatBrl(conta.limite_credito)}</p>
      ) : null}

      <div className={s.accountFoot}>
        <span className={s.footText}>
          <span className={s.footLabel}>Última movimentação</span>
          <span className={s.footDate}>{lastMovementKey ? formatDayKeyLong(lastMovementKey) : 'Sem lançamentos'}</span>
        </span>
        <Link href={movementsHref} className={s.footArrow} aria-label={`Ver movimentações de ${conta.nome}`}>
          <Icon name="arrow-right" size={15} />
        </Link>
      </div>
    </article>
  );
}
