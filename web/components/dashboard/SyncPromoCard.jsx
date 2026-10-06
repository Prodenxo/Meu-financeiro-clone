'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './dashboard.module.css';

const COPY = {
  default: {
    title: 'Chega de lançar tudo manualmente.',
    text: 'Conecte seus bancos e deixe o Meu Financeiro atualizar suas movimentações automaticamente.',
    cta: 'Automatizar meu financeiro',
  },
  'many-manual': {
    title: 'Quer economizar tempo?',
    text: 'Conecte sua conta e importe suas movimentações automaticamente.',
    cta: 'Conhecer sincronização',
  },
  contas: {
    title: 'Todas as suas contas. Um único lugar.',
    text: 'Conecte seus bancos e acompanhe sua vida financeira sem precisar atualizar tudo manualmente.',
    cta: 'Conectar meu banco',
  },
};

const DISMISS_EVENT = 'mf-sync-promo-dismiss';
const storageKey = (variant) => `mf:sync-promo-dismissed:${variant}`;

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener(DISMISS_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(DISMISS_EVENT, callback);
  };
}

/** Convite discreto para a sincronização bancária. Some quando o usuário dispensa. */
export function SyncPromoCard({ variant = 'default', href = '/contas?sincronizar=1' }) {
  const router = useRouter();
  const copy = COPY[variant] || COPY.default;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(storageKey(variant)) === '1',
    () => true,
  );

  const dismiss = useCallback(() => {
    window.localStorage.setItem(storageKey(variant), '1');
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }, [variant]);

  if (dismissed) return null;

  return (
    <Card className={s.syncPromo} aria-labelledby={`sync-promo-${variant}`}>
      <button type="button" className={s.syncPromoClose} onClick={dismiss} aria-label="Dispensar convite">
        <Icon name="x" size={16} />
      </button>
      <span className={s.syncPromoIcon} aria-hidden="true">
        <Icon name="refresh-cw" size={18} />
      </span>
      <h2 className={s.syncPromoTitle} id={`sync-promo-${variant}`}>
        {copy.title}
      </h2>
      <p className={s.syncPromoText}>{copy.text}</p>
      <Button block icon="link" onClick={() => router.push(href)}>
        {copy.cta}
      </Button>
      <p className={s.syncPromoFoot}>Seu financeiro continua gratuito. Pague apenas se quiser automatizar.</p>
    </Card>
  );
}
