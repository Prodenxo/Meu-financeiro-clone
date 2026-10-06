'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Field, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import {
  openFinanceCheckoutAction,
  openFinancePayPendingAction,
  openFinancePlansAction,
} from '@/app/(app)/contas/billingActions';
import { isValidCnpjDigits, isValidCpfDigits, maskCnpj, maskCpf } from '@/lib/auth/validation';
import {
  SYNC_BASE_CENTS,
  SYNC_EXTRA_CENTS,
  SYNC_MAX_ACCOUNTS,
  accountsLabel,
  dueInLabel,
  formatCentsBrl,
  formatDueDate,
  renewalNotice,
  syncPlanId,
  syncPriceCents,
} from '@/lib/finance/syncPricing';
import { OpenFinanceConnect } from './OpenFinanceConnect';
import m from '@/components/dashboard/modal.module.css';
import s from './contas.module.css';

const FREE_FEATURES = [
  'Controle de receitas e despesas',
  'Categorias',
  'Orçamentos',
  'Agenda financeira',
  'Lançamentos manuais',
  'Relatórios',
];

const PLUS_FEATURES = [
  'Tudo do plano gratuito',
  'Conexão bancária automática',
  'Transações importadas automaticamente',
  'Menos lançamentos manuais',
  'Visão consolidada das contas',
  'Atualização automática das movimentações',
];

const EXTRAS_HINT = `1 conta incluída. Contas adicionais por ${formatCentsBrl(SYNC_EXTRA_CENTS)}/mês.`;

function maskCpfCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 11 ? maskCnpj(digits) : maskCpf(digits);
}

function isValidCpfCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 ? isValidCpfDigits(digits) : digits.length === 14 && isValidCnpjDigits(digits);
}

function FeatureList({ items }) {
  return (
    <ul className={s.syncFeatures}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" size={14} /> {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Sincronização bancária automática: oferta, pagamento e conexão do banco.
 * Abre também via `?sincronizar=1` (convites do dashboard e da tela de contas).
 */
export function OpenFinanceShop({ block = true, onSynced }) {
  const searchParams = useSearchParams();
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('offer'); // offer | checkout
  const [accounts, setAccounts] = useState(1);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [asaasConfigured, setAsaasConfigured] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('asaas');
  const [pixCheckout, setPixCheckout] = useState(null);
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [checkoutDisabledMessage, setCheckoutDisabledMessage] = useState('');
  const [entitlement, setEntitlement] = useState(null);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cpfTouched, setCpfTouched] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadPlans = useCallback(async ({ fresh = false } = {}) => {
    const res = await openFinancePlansAction({ fresh });
    if (!res?.ok) {
      setError(res?.error || 'Não foi possível carregar as opções de sincronização.');
      return null;
    }
    setEntitlement(res.entitlement || null);
    setStripeConfigured(Boolean(res.stripeConfigured));
    setAsaasConfigured(Boolean(res.asaasConfigured));
    if (res.asaasConfigured) setPaymentProvider('asaas');
    else if (res.stripeConfigured) setPaymentProvider('stripe');
    setCheckoutEnabled(Boolean(res.checkoutEnabled));
    setCheckoutDisabledMessage(String(res.checkoutDisabledMessage || '').trim());
    return res;
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (searchParams.get('of_paid') === '1') {
      setInfo('Pagamento recebido. Agora é só conectar seu banco.');
      setOpen(true);
    } else if (searchParams.get('sincronizar') === '1') {
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
    setStep('offer');
    setPixCheckout(null);
    setError('');
    dialogRef.current?.close();
    if (searchParams.get('sincronizar') === '1' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('sincronizar');
      window.history.replaceState(null, '', url.toString());
    }
  };

  const licensed = Boolean(entitlement?.licensed);
  const slots = Number(entitlement?.slots) || 0;
  const used = Number(entitlement?.used) || 0;
  const isUpgrade = licensed && !entitlement?.canConnect;
  const canPay =
    (paymentProvider === 'asaas' && asaasConfigured) || (paymentProvider === 'stripe' && stripeConfigured);
  const needsDocument = paymentProvider === 'asaas' && !(licensed && entitlement?.source === 'asaas');
  const documentValid = isValidCpfCnpj(cpfCnpj);
  const renewal = renewalNotice(entitlement?.billing);

  const payPending = () => {
    setError('');
    setInfo('');
    setPixCheckout(null);
    startTransition(async () => {
      const res = await openFinancePayPendingAction();
      if (!res?.ok || !res.pix?.payload) {
        setError(res?.error || 'Não foi possível gerar o PIX da mensalidade.');
        return;
      }
      setPixCheckout(res.pix);
    });
  };

  const pay = (targetAccounts, provider) => {
    if (!checkoutEnabled) return;
    if (provider === 'asaas' && needsDocument && !documentValid) {
      setCpfTouched(true);
      return;
    }
    setError('');
    setInfo('');
    setPixCheckout(null);
    startTransition(async () => {
      const res = await openFinanceCheckoutAction(syncPlanId(targetAccounts), provider, cpfCnpj);
      if (!res?.ok) {
        setError(res?.error || 'Pagamento indisponível no momento.');
        return;
      }
      if (res.provider === 'asaas' && res.upgraded) {
        await loadPlans({ fresh: true });
        setInfo('Nova conta liberada. O novo valor entra na próxima fatura.');
        return;
      }
      if (res.provider === 'asaas' && res.pix?.payload) {
        setPixCheckout(res.pix);
        setInfo('Pague o PIX abaixo para ativar a sincronização. Assim que confirmar, você já pode conectar seu banco.');
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

  const verifyPayment = async () => {
    const res = await loadPlans({ fresh: true });
    const ent = res?.entitlement;
    if (ent?.licensed && ent.billing?.paymentId !== entitlement?.billing?.paymentId) {
      setPixCheckout(null);
      setStep('offer');
      setInfo(
        ent.canConnect && ent.used === 0
          ? 'Pagamento confirmado. Agora é só conectar seu banco.'
          : 'Pagamento confirmado. Sua sincronização automática segue ativa.',
      );
    } else {
      setInfo('Ainda não recebemos a confirmação do PIX. Pode levar alguns instantes.');
    }
  };

  const pixBox = pixCheckout?.payload ? (
    <div className={s.ofPixBox}>
      {pixCheckout.encodedImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.ofPixQr} src={`data:image/png;base64,${pixCheckout.encodedImage}`} alt="QR Code PIX" />
      ) : null}
      <p className={s.ofPixCopy}>{pixCheckout.payload}</p>
      <Button variant="outline" icon="copy" block onClick={copyPix}>
        Copiar código PIX
      </Button>
      <Button variant="ghost" block onClick={verifyPayment}>
        Já paguei, verificar
      </Button>
    </div>
  ) : null;

  const renderOffer = () => (
    <>
      <p className={s.syncHeadline}>
        Seu financeiro continua gratuito.
        <br />
        Pague apenas se quiser automatizar.
      </p>
      <p className={s.ofShopLead}>
        Conecte suas contas bancárias e mantenha suas movimentações atualizadas automaticamente, sem precisar lançar
        tudo manualmente.
      </p>
      <div className={s.syncPlans}>
        <section className={s.syncPlan} aria-labelledby="sync-free-title">
          <p className={s.syncPlanName} id="sync-free-title">
            Meu Financeiro
          </p>
          <p className={s.syncPlanTag}>Grátis</p>
          <p className={s.syncPlanPrice}>R$ 0/mês</p>
          <FeatureList items={FREE_FEATURES} />
          <Button variant="outline" block onClick={close}>
            Continuar grátis
          </Button>
        </section>
        <section className={cx(s.syncPlan, s.syncPlanPlus)} aria-labelledby="sync-plus-title">
          <p className={s.syncPlanName} id="sync-plus-title">
            Meu Financeiro+
          </p>
          <p className={s.syncPlanTag}>Sincronização automática</p>
          <p className={s.syncPlanPrice}>
            <span className={s.syncPlanFrom}>A partir de</span>
            {formatCentsBrl(SYNC_BASE_CENTS)}/mês
          </p>
          <FeatureList items={PLUS_FEATURES} />
          <p className={s.ofQuickHint}>{EXTRAS_HINT}</p>
          <Button block icon="link" onClick={() => setStep('checkout')}>
            Conectar meu banco
          </Button>
        </section>
      </div>
    </>
  );

  const renderPaymentFields = () => (
    <>
      {asaasConfigured && stripeConfigured ? (
        <div className={s.ofPayTabs} role="tablist" aria-label="Forma de pagamento">
          {[
            ['asaas', 'PIX'],
            ['stripe', 'Cartão / boleto'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={paymentProvider === id}
              className={cx(s.ofPayTab, paymentProvider === id && s.ofPayTabActive)}
              onClick={() => {
                setPaymentProvider(id);
                setPixCheckout(null);
              }}
            >
              {label}
            </button>
          ))}
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

      {!asaasConfigured && !stripeConfigured ? (
        <Alert tone="info">Pagamento ainda não disponível. Tente novamente mais tarde.</Alert>
      ) : null}
    </>
  );

  const renderCheckout = () => (
    <>
      <button type="button" className={s.syncBack} onClick={() => setStep('offer')} disabled={isPending}>
        <Icon name="chevron-left" size={16} /> Voltar
      </button>
      <p className={s.syncStepTitle}>Quantas contas você quer conectar?</p>
      <div className={s.syncQty}>
        <button
          type="button"
          className={s.syncQtyBtn}
          aria-label="Menos uma conta"
          disabled={accounts <= 1 || isPending}
          onClick={() => setAccounts((n) => Math.max(1, n - 1))}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className={s.syncQtyValue} aria-live="polite">
          {accounts === 1 ? '1 conta' : `${accounts} contas`}
        </span>
        <button
          type="button"
          className={s.syncQtyBtn}
          aria-label="Mais uma conta"
          disabled={accounts >= SYNC_MAX_ACCOUNTS || isPending}
          onClick={() => setAccounts((n) => Math.min(SYNC_MAX_ACCOUNTS, n + 1))}
        >
          <Icon name="plus" size={16} />
        </button>
        <span className={s.syncQtyPrice}>{formatCentsBrl(syncPriceCents(accounts))}/mês</span>
      </div>
      <p className={cx(s.ofQuickHint, s.syncQtyHint)}>{EXTRAS_HINT}</p>

      {renderPaymentFields()}

      <Button
        icon={paymentProvider === 'asaas' ? 'credit-card' : 'shopping-cart'}
        block
        disabled={!canPay || isPending}
        onClick={() => pay(accounts, paymentProvider)}
        aria-busy={isPending}
      >
        {isPending ? 'Gerando cobrança…' : paymentProvider === 'asaas' ? 'Gerar PIX' : 'Ir para pagamento'}
      </Button>

      {pixBox}

      <p className={cx(s.ofQuickHint, s.syncFootHint)}>
        Depois que o pagamento for confirmado, o botão para conectar o banco aparece aqui.
      </p>
    </>
  );

  const renewalBox =
    renewal?.kind === 'due-soon' ? (
      <div className={s.syncRenewal}>
        <p className={s.syncRenewalText}>
          Sua mensalidade
          {renewal.amountCents ? ` de ${formatCentsBrl(renewal.amountCents)}` : ''} vence{' '}
          <strong>{dueInLabel(renewal.daysLeft)}</strong> ({formatDueDate(renewal.dueDate)}).
        </p>
        {pixCheckout?.payload ? null : (
          <Button variant="outline" size="sm" icon="credit-card" disabled={isPending} onClick={payPending}>
            Pagar PIX agora
          </Button>
        )}
      </div>
    ) : null;

  const renderPaused = () => (
    <>
      <p className={s.syncHeadline}>Sua sincronização está pausada.</p>
      <p className={s.ofShopLead}>
        A mensalidade
        {renewal?.amountCents ? ` de ${formatCentsBrl(renewal.amountCents)}` : ''}
        {renewal?.dueDate ? ` venceu em ${formatDueDate(renewal.dueDate)}` : ' está em aberto'}. Pague o PIX e suas
        contas voltam a ser atualizadas automaticamente.
      </p>
      {pixCheckout?.payload ? null : (
        <Button block icon="credit-card" disabled={isPending} aria-busy={isPending} onClick={payPending}>
          {isPending ? 'Gerando PIX…' : 'Pagar e reativar'}
        </Button>
      )}
      {pixBox}
    </>
  );

  const renderActive = () => (
    <>
      {renewalBox}
      {pixBox}
      <div className={s.syncSummary}>
        <span className={s.syncSummaryLabel}>{accountsLabel(used)}</span>
        <span className={s.syncSummaryValue}>{formatCentsBrl(syncPriceCents(slots))}/mês</span>
      </div>
      <p className={s.ofQuickHint}>
        {slots - used === 1
          ? 'Você ainda pode conectar 1 conta na sua assinatura.'
          : `Você ainda pode conectar ${slots - used} contas na sua assinatura.`}
      </p>
      <OpenFinanceConnect
        block
        label={used > 0 ? 'Conectar nova conta' : 'Conectar meu banco'}
        onSynced={() => {
          onSynced?.();
          setInfo('Banco conectado. Suas movimentações vão chegar automaticamente.');
          loadPlans({ fresh: true });
        }}
      />
    </>
  );

  const renderUpgrade = () => {
    const upgradeProvider = entitlement?.source === 'asaas' ? 'asaas' : paymentProvider;
    return (
      <>
        {renewalBox}
        <div className={s.syncSummary}>
          <span className={s.syncSummaryLabel}>{accountsLabel(used)}</span>
          <span className={s.syncSummaryValue}>{formatCentsBrl(syncPriceCents(slots))}/mês</span>
        </div>
        <p className={s.syncStepTitle}>Adicione mais uma conta por {formatCentsBrl(SYNC_EXTRA_CENTS)}/mês.</p>
        <div className={s.syncCompare}>
          <div>
            <span className={s.syncCompareLabel}>Sua assinatura atual</span>
            <span className={s.syncCompareValue}>{formatCentsBrl(syncPriceCents(slots))}/mês</span>
          </div>
          <Icon name="arrow-right" size={16} />
          <div>
            <span className={s.syncCompareLabel}>Com a nova conta</span>
            <span className={cx(s.syncCompareValue, s.syncCompareNew)}>
              {formatCentsBrl(syncPriceCents(slots + 1))}/mês
            </span>
          </div>
        </div>
        {slots < SYNC_MAX_ACCOUNTS ? (
          <Button
            block
            icon="plus"
            disabled={isPending}
            aria-busy={isPending}
            onClick={() => pay(slots + 1, upgradeProvider)}
          >
            {isPending ? 'Atualizando assinatura…' : 'Conectar nova conta'}
          </Button>
        ) : (
          <Alert tone="info">Você chegou ao limite de {SYNC_MAX_ACCOUNTS} contas. Fale com o suporte para ampliar.</Alert>
        )}
        {pixBox}
      </>
    );
  };

  let content = null;
  if (!checkoutEnabled) {
    content = (
      <>
        <p className={s.syncHeadline}>Seu financeiro continua gratuito.</p>
        <Alert tone="info">
          {checkoutDisabledMessage || 'A sincronização bancária automática chega em breve. Fique de olho!'}
        </Alert>
      </>
    );
  } else if (!licensed && renewal?.kind === 'paused') {
    content = renderPaused();
  } else if (licensed && entitlement?.canConnect) {
    content = renderActive();
  } else if (isUpgrade) {
    content = renderUpgrade();
  } else if (step === 'checkout') {
    content = renderCheckout();
  } else {
    content = renderOffer();
  }

  return (
    <>
      <div className={cx(block && s.ofConnect)}>
        <Button variant="outline" icon="refresh-cw" block={block} onClick={() => setOpen(true)}>
          {licensed ? 'Sincronização automática' : 'Conectar meu banco'}
        </Button>
      </div>

      {open ? (
        <dialog
          ref={dialogRef}
          className={cx(m.dialog, s.syncDialog)}
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
                {licensed || renewal?.kind === 'paused' ? 'Sincronização automática' : 'Automatize seu financeiro'}
              </h2>
              <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={isPending}>
                <Icon name="x" size={18} />
              </button>
            </header>

            {info ? <Alert tone="success">{info}</Alert> : null}
            {error ? <Alert tone="error">{error}</Alert> : null}

            {content}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
