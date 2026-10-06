'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { openFinancePlansAction } from '@/app/(app)/contas/billingActions';
import { dueInLabel, formatCentsBrl, formatDueDate, renewalNotice } from '@/lib/finance/syncPricing';
import s from './dashboard.module.css';

const DISMISS_EVENT = 'mf-sync-renewal-dismiss';
const storageKey = (paymentId) => `mf:sync-renewal-dismissed:${paymentId}`;

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener(DISMISS_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(DISMISS_EVENT, callback);
  };
}

/** Lembrete da mensalidade da sincronização (dias antes de vencer) ou aviso de pausa. */
export function SyncRenewalNotice({ href = '/contas?sincronizar=1' }) {
  const router = useRouter();
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    let alive = true;
    openFinancePlansAction().then((res) => {
      if (alive && res?.ok) setBilling(res.entitlement?.billing || null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const notice = renewalNotice(billing);
  const paymentId = billing?.paymentId || '';
  const dismissed = useSyncExternalStore(
    subscribe,
    () => Boolean(paymentId) && window.localStorage.getItem(storageKey(paymentId)) === '1',
    () => false,
  );

  const dismiss = useCallback(() => {
    if (!paymentId) return;
    window.localStorage.setItem(storageKey(paymentId), '1');
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }, [paymentId]);

  if (!notice || (notice.kind === 'due-soon' && dismissed)) return null;

  const amount = notice.amountCents ? ` de ${formatCentsBrl(notice.amountCents)}` : '';
  const paused = notice.kind === 'paused';

  return (
    <Card className={s.syncPromo} aria-labelledby="sync-renewal-title">
      {paused ? null : (
        <button type="button" className={s.syncPromoClose} onClick={dismiss} aria-label="Dispensar aviso">
          <Icon name="x" size={16} />
        </button>
      )}
      <span className={s.syncPromoIcon} aria-hidden="true">
        <Icon name={paused ? 'alert-circle' : 'calendar-days'} size={18} />
      </span>
      <h2 className={s.syncPromoTitle} id="sync-renewal-title">
        {paused ? 'Sincronização pausada' : `Sua sincronização renova ${dueInLabel(notice.daysLeft)}`}
      </h2>
      <p className={s.syncPromoText}>
        {paused
          ? `A mensalidade${amount} está em aberto. Pague o PIX e suas contas voltam a ser atualizadas automaticamente.`
          : `Mensalidade${amount} vence em ${formatDueDate(notice.dueDate)}. Pague o PIX para continuar com tudo atualizado.`}
      </p>
      <Button block icon="credit-card" onClick={() => router.push(href)}>
        {paused ? 'Pagar e reativar' : 'Pagar PIX'}
      </Button>
    </Card>
  );
}
