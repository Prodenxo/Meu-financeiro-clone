'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Field, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { openFinanceCheckoutAction, openFinancePlansAction } from '@/app/(app)/contas/billingActions';
import { isValidCnpjDigits, isValidCpfDigits, maskCnpj, maskCpf } from '@/lib/auth/validation';
import { OpenFinanceConnect } from './OpenFinanceConnect';
import m from '@/components/dashboard/modal.module.css';
import s from './contas.module.css';

function formatBrlFromCents(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100);
}

function maskCpfCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 11 ? maskCnpj(digits) : maskCpf(digits);
}

function isValidCpfCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 ? isValidCpfDigits(digits) : digits.length === 14 && isValidCnpjDigits(digits);
}

/** Carrinho / assinatura Open Finance (Stripe). Conectar banco fica dentro do modal, após pagamento. */
export function OpenFinanceShop({ block = true, onSynced }) {
  const searchParams = useSearchParams();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [asaasConfigured, setAsaasConfigured] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('asaas');
  const [pixCheckout, setPixCheckout] = useState(null);
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [checkoutDisabledMessage, setCheckoutDisabledMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [entitlement, setEntitlement] = useState(null);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cpfTouched, setCpfTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadPlans = useCallback(async ({ fresh = false } = {}) => {
    const res = await openFinancePlansAction({ fresh });
    if (!res?.ok) {
      setError(res?.error || 'Erro ao carregar planos.');
      return;
    }
    setPlans(res.plans || []);
    setEntitlement(res.entitlement || null);
    setStripeConfigured(Boolean(res.stripeConfigured));
    setAsaasConfigured(Boolean(res.asaasConfigured));
    if (res.asaasConfigured) setPaymentProvider('asaas');
    else if (res.stripeConfigured) setPaymentProvider('stripe');
    setCheckoutEnabled(Boolean(res.checkoutEnabled));
    setCheckoutDisabledMessage(String(res.checkoutDisabledMessage || '').trim());
    if (res.plans?.length && !selected) setSelected(res.plans[0].id);
  }, [selected]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

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

  const canPay =
    (paymentProvider === 'asaas' && asaasConfigured) || (paymentProvider === 'stripe' && stripeConfigured);
  const needsDocument = paymentProvider === 'asaas';
  const documentValid = isValidCpfCnpj(cpfCnpj);

  const checkout = () => {
    if (!checkoutEnabled || !selected || !canPay) return;
    if (needsDocument && !documentValid) {
      setCpfTouched(true);
      return;
    }
    setError('');
    setPixCheckout(null);
    startTransition(async () => {
      const res = await openFinanceCheckoutAction(selected, paymentProvider, cpfCnpj);
      if (!res?.ok) {
        setError(res?.error || 'Pagamento indisponível.');
        return;
      }
      if (res.provider === 'asaas' && res.pix?.payload) {
        setPixCheckout(res.pix);
        setInfo('Pague o PIX abaixo para ativar a assinatura mensal. Depois conecte o banco.');
        return;
      }
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
    });
  };

  const copyPix = async () => {
    const code = pixCheckout?.payload;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setInfo('Código PIX copiado.');
    } catch {
      setError('Não foi possível copiar. Selecione o código manualmente.');
    }
  };

  return (
    <>
      <div className={cx(block && s.ofConnect)}>
        <Button variant="outline" icon="shopping-cart" block={block} onClick={() => setOpen(true)}>
          {checkoutEnabled ? 'Open Finance' : 'Open Finance (em breve)'}
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

            {checkoutEnabled ? (
              <p className={s.ofShopLead}>
                Escolha quantas contas bancárias quer sincronizar (extrato e saldo automáticos). Pagamento mensal:{' '}
                <strong>PIX</strong> (Asaas) ou <strong>cartão/boleto</strong> (Stripe).
              </p>
            ) : (
              <p className={s.ofShopLead}>
                Em breve você poderá contratar pacotes de contas bancárias com extrato e saldo automáticos por aqui.
              </p>
            )}

            {info ? <Alert tone="success">{info}</Alert> : null}
            {error ? <Alert tone="error">{error}</Alert> : null}

            {!checkoutEnabled ? (
              <Alert tone="info">
                {checkoutDisabledMessage ||
                  'A loja Open Finance está temporariamente fechada enquanto finalizamos o checkout. Fale com o suporte se precisar conectar bancos.'}
              </Alert>
            ) : null}

            {checkoutEnabled ? (
              <>
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

                {asaasConfigured && stripeConfigured ? (
                  <div className={s.ofPayTabs} role="tablist" aria-label="Forma de pagamento">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentProvider === 'asaas'}
                      className={cx(s.ofPayTab, paymentProvider === 'asaas' && s.ofPayTabActive)}
                      onClick={() => {
                        setPaymentProvider('asaas');
                        setPixCheckout(null);
                      }}
                    >
                      PIX (Asaas)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentProvider === 'stripe'}
                      className={cx(s.ofPayTab, paymentProvider === 'stripe' && s.ofPayTabActive)}
                      onClick={() => {
                        setPaymentProvider('stripe');
                        setPixCheckout(null);
                      }}
                    >
                      Cartão / boleto
                    </button>
                  </div>
                ) : null}

                {needsDocument ? (
                  <div className={s.ofDocField}>
                  <Field
                    label="CPF ou CNPJ de quem paga"
                    htmlFor="of-cpf-cnpj"
                    error={cpfTouched && !documentValid ? 'Informe um CPF ou CNPJ válido.' : ''}
                  >
                    <Input
                      id="of-cpf-cnpj"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      value={cpfCnpj}
                      invalid={cpfTouched && !documentValid}
                      onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                      onBlur={() => setCpfTouched(true)}
                    />
                  </Field>
                  </div>
                ) : null}

                <Button
                  icon={paymentProvider === 'asaas' ? 'credit-card' : 'shopping-cart'}
                  block
                  disabled={!canPay || !selected || isPending}
                  onClick={checkout}
                  aria-busy={isPending}
                >
                  {isPending
                    ? 'Gerando cobrança…'
                    : paymentProvider === 'asaas'
                      ? 'Gerar PIX da assinatura'
                      : 'Ir para pagamento'}
                </Button>

                {!asaasConfigured && !stripeConfigured ? (
                  <Alert tone="info">
                    Pagamento ainda não configurado no servidor (ASAAS_API_KEY ou STRIPE_SECRET_KEY).
                  </Alert>
                ) : null}

                {pixCheckout?.payload ? (
                  <div className={s.ofPixBox}>
                    {pixCheckout.encodedImage ? (
                      <img
                        className={s.ofPixQr}
                        src={`data:image/png;base64,${pixCheckout.encodedImage}`}
                        alt="QR Code PIX"
                      />
                    ) : null}
                    <p className={s.ofPixCopy}>{pixCheckout.payload}</p>
                    <Button variant="outline" block onClick={copyPix}>
                      Copiar código PIX
                    </Button>
                    <Button
                      variant="ghost"
                      block
                      onClick={async () => {
                        const res = await openFinancePlansAction({ fresh: true });
                        if (res?.entitlement?.canConnect) {
                          setEntitlement(res.entitlement);
                          setPixCheckout(null);
                          setInfo('Pagamento confirmado. Agora conecte seu banco abaixo.');
                        } else {
                          setInfo('Ainda não recebemos a confirmação do PIX. Pode levar alguns instantes.');
                        }
                      }}
                    >
                      Já paguei, verificar
                    </Button>
                  </div>
                ) : null}

                <div className={s.ofShopConnect}>
                  {entitlement?.canConnect ? (
                    <>
                      <p className={s.ofQuickHint}>
                        {`Plano ativo: ${entitlement.used} de ${entitlement.slots} ${entitlement.slots === 1 ? 'banco' : 'bancos'} em uso.`}
                      </p>
                      <OpenFinanceConnect
                        block
                        label="Conectar banco"
                        onSynced={() => {
                          onSynced?.();
                          setInfo('Banco conectado com sucesso.');
                          loadPlans();
                        }}
                      />
                    </>
                  ) : (
                    <p className={s.ofQuickHint}>
                      {entitlement?.licensed
                        ? `${entitlement.slots === 1 ? 'O banco do seu plano já está' : `Os ${entitlement.slots} bancos do seu plano já estão`} em uso. Desconecte um ou contrate um plano maior.`
                        : 'Depois que o pagamento for confirmado, o botão para conectar o banco aparece aqui.'}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
