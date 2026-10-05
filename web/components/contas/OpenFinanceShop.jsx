'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { openFinanceCheckoutAction, openFinancePlansAction } from '@/app/(app)/contas/billingActions';
import { OpenFinanceConnect } from './OpenFinanceConnect';
import m from '@/components/dashboard/modal.module.css';
import s from './contas.module.css';

function formatBrlFromCents(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100);
}

/** Carrinho / assinatura Open Finance (Stripe). Conectar banco fica dentro do modal, após pagamento. */
export function OpenFinanceShop({ block = true, onSynced }) {
  const searchParams = useSearchParams();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadPlans = useCallback(async () => {
    const res = await openFinancePlansAction();
    if (!res?.ok) {
      setError(res?.error || 'Erro ao carregar planos.');
      return;
    }
    setPlans(res.plans || []);
    setStripeConfigured(Boolean(res.stripeConfigured));
    if (res.plans?.length && !selected) setSelected(res.plans[0].id);
  }, [selected]);

  useEffect(() => {
    if (searchParams.get('of_paid') === '1') {
      setInfo('Pagamento recebido. Agora conecte seu banco no passo abaixo.');
      setOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!open) return undefined;
    loadPlans();
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
    return undefined;
  }, [open, loadPlans]);

  const close = () => {
    if (isPending) return;
    setOpen(false);
    dialogRef.current?.close();
  };

  const checkout = () => {
    if (!selected) return;
    setError('');
    startTransition(async () => {
      const res = await openFinanceCheckoutAction(selected);
      if (!res?.ok) {
        setError(res?.error || 'Pagamento indisponível.');
        return;
      }
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
    });
  };

  return (
    <>
      <div className={cx(block && s.ofConnect)}>
        <Button variant="outline" icon="shopping-cart" block={block} onClick={() => setOpen(true)}>
          Open Finance
        </Button>
      </div>

      {open ? (
        <dialog
          ref={dialogRef}
          className={m.dialog}
          aria-labelledby="of-shop-title"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
          onClick={(e) => {
            if (e.target === dialogRef.current) close();
          }}
        >
          <div className={m.body}>
            <header className={m.head}>
              <h2 className={m.title} id="of-shop-title">
                Conectar contas via Open Finance
              </h2>
              <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={isPending}>
                <Icon name="x" size={18} />
              </button>
            </header>

            <p className={s.ofShopLead}>
              Escolha quantas contas bancárias você quer sincronizar (extrato e saldo automáticos). Pagamento mensal
              pelo Stripe: <strong>cartão</strong> ou <strong>boleto</strong>. PIX automático na assinatura ainda não
              está disponível neste fluxo.
            </p>

            {info ? <Alert tone="success">{info}</Alert> : null}
            {error ? <Alert tone="error">{error}</Alert> : null}

            <div className={s.ofPlanGrid} role="radiogroup" aria-label="Planos Open Finance">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={cx(s.ofPlanCard, selected === plan.id && s.ofPlanCardActive)}
                >
                  <input
                    type="radio"
                    name="of-plan"
                    value={plan.id}
                    checked={selected === plan.id}
                    onChange={() => setSelected(plan.id)}
                  />
                  <span className={s.ofPlanName}>{plan.label}</span>
                  <span className={s.ofPlanPrice}>{formatBrlFromCents(plan.amountCents)}/mês</span>
                </label>
              ))}
            </div>

            <Button
              icon="shopping-cart"
              block
              disabled={!stripeConfigured || !selected || isPending}
              onClick={checkout}
              aria-busy={isPending}
            >
              {isPending ? 'Abrindo pagamento…' : 'Ir para pagamento'}
            </Button>

            {!stripeConfigured ? (
              <Alert tone="info">
                Pagamento ainda não configurado no servidor (STRIPE_SECRET_KEY). Peça ao suporte para ativar a
                cobrança.
              </Alert>
            ) : null}

            <div className={s.ofShopConnect}>
              <p className={s.ofQuickHint}>Já assinou? Conecte seu banco:</p>
              <OpenFinanceConnect block label="Conectar banco" onSynced={() => { onSynced?.(); setInfo('Banco conectado com sucesso.'); }} />
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
