import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, CreditCard, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from '../../../lib/toast';
import {
  createMeiStripeCheckout,
  listStripeMeiSubscriptionLines,
  syncMaxMeiFromStripeLines,
  type BillingTimingOption,
  type StripeMeiSubscriptionLine
} from '../../../services/adminBillingService';
import { MEI_SLOT_PACKAGE_OPTIONS, resolveMeiPackagePrice } from '../../../lib/meiBillingPricing';

export interface EmpresaStripeMeiBillingContext {
  id: string;
  empresa: string;
  /** Limite MEI guardado no cadastro da empresa (`max_mei`) — é o que a tabela "Módulo MEI" usa. */
  maxMeiPlataforma?: number | null;
  /** Quantos utilizadores com flag MEI estão ligados a esta empresa agora. */
  meiUsuariosEmUso?: number | null;
}

interface EmpresaStripeMeiBillingModalProps {
  open: boolean;
  empresa: EmpresaStripeMeiBillingContext | null;
  onClose: () => void;
  /** Atualiza a lista de empresas (ex.: após alinhar `max_mei`). */
  onMaxMeiSynced?: () => void | Promise<void>;
}

const formatBrl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR');
};

const billingTypeLabel = (t: string) => {
  if (t === 'stripe_checkout') return 'Link de pagamento';
  if (t === 'stripe_next_cycle') return 'Próxima fatura';
  return t || '—';
};

const statusLabel = (s: string) => {
  if (s === 'active') return 'Ativo';
  if (s === 'pending') return 'Pendente';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelado';
  return s || '—';
};

export function EmpresaStripeMeiBillingModal({
  open,
  empresa,
  onClose,
  onMaxMeiSynced
}: EmpresaStripeMeiBillingModalProps) {
  const [lines, setLines] = useState<StripeMeiSubscriptionLine[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [meiSlots, setMeiSlots] = useState(5);
  const [billingTiming, setBillingTiming] = useState<BillingTimingOption>('checkout');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastCheckoutUrl, setLastCheckoutUrl] = useState<string | null>(null);

  const [syncMaxMeiLoading, setSyncMaxMeiLoading] = useState(false);

  const loadLines = useCallback(async () => {
    if (!empresa?.id) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await listStripeMeiSubscriptionLines(empresa.id);
      setLines(data.lines || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar linhas de assinatura';
      setListError(msg);
      setLines([]);
    } finally {
      setListLoading(false);
    }
  }, [empresa?.id]);

  useEffect(() => {
    if (!open || !empresa) return;
    setLastCheckoutUrl(null);
    void loadLines();
  }, [open, empresa?.id, loadLines]);

  const hasActiveSubscription = useMemo(
    () =>
      lines.some(
        (l) =>
          l.status === 'active' &&
          l.stripe_subscription_id &&
          String(l.stripe_subscription_id).trim().length > 0
      ),
    [lines]
  );

  const billingOptionsReady = !listLoading;
  const canUseCheckout = billingOptionsReady && !hasActiveSubscription;
  const canUseNextCycle = billingOptionsReady && hasActiveSubscription;

  useEffect(() => {
    if (!open || listLoading) return;
    setBillingTiming(hasActiveSubscription ? 'next_cycle' : 'checkout');
  }, [open, listLoading, hasActiveSubscription]);

  const pricePreview = useMemo(() => resolveMeiPackagePrice(meiSlots), [meiSlots]);

  /** Soma `mei_slots` das linhas de assinatura já ativas (alinhado ao sync `max_mei`). */
  const activeMeiSlotsTotal = useMemo(
    () =>
      lines
        .filter((l) => l.status === 'active')
        .reduce((sum, l) => sum + Number(l.mei_slots || 0), 0),
    [lines]
  );

  const projectedMeiSlotsTotal = activeMeiSlotsTotal + meiSlots;

  const plataformaLimite =
    empresa?.maxMeiPlataforma !== null && empresa?.maxMeiPlataforma !== undefined
      ? Number(empresa.maxMeiPlataforma)
      : null;

  const meiEmUsoNaEmpresa =
    empresa?.meiUsuariosEmUso !== null && empresa?.meiUsuariosEmUso !== undefined
      ? Number(empresa.meiUsuariosEmUso)
      : null;

  const handleSubmit = async () => {
    if (!empresa) return;
    if (!billingOptionsReady) return;
    if (billingTiming === 'next_cycle' && !hasActiveSubscription) {
      toast.error(
        'Esta empresa ainda não tem assinatura ativa com cartão. Use o link de pagamento primeiro.'
      );
      return;
    }
    if (billingTiming === 'checkout' && hasActiveSubscription) {
      toast.error(
        'Esta empresa já tem assinatura ativa com cartão. Acrescente vagas só em «Próxima fatura».'
      );
      return;
    }
    setSubmitLoading(true);
    setLastCheckoutUrl(null);
    try {
      const data = await createMeiStripeCheckout({
        empresaId: empresa.id,
        meiSlots,
        billingTiming
      });
      await loadLines();
      if (data.checkoutUrl) {
        setLastCheckoutUrl(data.checkoutUrl);
        toast.success('Link de pagamento gerado. Copie e envie ao responsável da empresa.');
      } else {
        toast.success(
          'Pacote incluído na assinatura. O valor entra na próxima fatura (sem prorata imediata).'
        );
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao processar cobrança MEI');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSyncMaxMeiFromLines = async () => {
    if (!empresa) return;
    setSyncMaxMeiLoading(true);
    try {
      const { max_mei: next } = await syncMaxMeiFromStripeLines(empresa.id);
      await onMaxMeiSynced?.();
      toast.success(
        `Limite MEI alinhado com a soma das linhas ativas na base (${next} vagas). Recarregue a lista de empresas se o número ainda não mudou.`
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alinhar limite MEI');
    } finally {
      setSyncMaxMeiLoading(false);
    }
  };

  const copyCheckoutUrl = async () => {
    if (!lastCheckoutUrl) return;
    try {
      await navigator.clipboard.writeText(lastCheckoutUrl);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  if (!open || !empresa) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mei-billing-title"
    >
      <div className="planner-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 id="mei-billing-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Cobrança MEI
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{empresa.empresa}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {empresa.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 shrink-0"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 space-y-8">
          <section aria-labelledby="stripe-lines-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h4 id="stripe-lines-heading" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Histórico de pacotes
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSyncMaxMeiFromLines()}
                  disabled={syncMaxMeiLoading || !empresa}
                  title="Recalcula o limite MEI da empresa na plataforma a partir dos pacotes Stripe já marcados como Ativos. Útil quando o pagamento já apareceu na Stripe mas o número na lista de empresas ficou desactualizado."
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/50 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  {syncMaxMeiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Alinhar limite MEI
                </button>
                <button
                  type="button"
                  onClick={() => void loadLines()}
                  disabled={listLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>
            {listError && (
              <p className="text-sm text-rose-600 dark:text-rose-400 mb-2" role="alert">
                {listError}
              </p>
            )}
            <div className="admin-table-shell rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80">
              <div className="overflow-x-auto max-h-48">
                <table className="admin-table text-sm">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>MEIs</th>
                      <th>Valor</th>
                      <th>Tipo</th>
                      <th>Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading && lines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2 align-middle" />
                          Carregando…
                        </td>
                      </tr>
                    ) : lines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhum pacote registrado ainda.
                        </td>
                      </tr>
                    ) : (
                      lines.map((row) => (
                        <tr key={row.id}>
                          <td>{statusLabel(row.status)}</td>
                          <td>{row.mei_slots}</td>
                          <td>{formatBrl(Number(row.value_numeric) || 0)}</td>
                          <td>{billingTypeLabel(row.billing_type)}</td>
                          <td className="whitespace-nowrap text-xs">{formatDateTime(row.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="stripe-panel-novo" className="space-y-4">
            <h4 id="stripe-new-heading" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Incluir novo pacote
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O campo <strong>Vagas no pacote</strong> é só o tamanho <em>desta</em> compra na assinatura, não o limite
              mostrado na lista de empresas. Ex.: para acrescentar mais 5 vagas, escolha <strong>5</strong> — não é
              preciso somar com o que já existe na assinatura.
            </p>

            {billingOptionsReady && (
              <p
                className={`text-xs rounded-lg px-3 py-2 border ${
                  hasActiveSubscription
                    ? 'bg-violet-50/80 dark:bg-violet-950/30 border-violet-200/70 dark:border-violet-500/25 text-violet-900 dark:text-violet-100'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                }`}
                role="status"
              >
                {hasActiveSubscription ? (
                  <>
                    <strong>Assinatura ativa com cartão.</strong> Novos pacotes entram só em{' '}
                    <strong>próxima fatura</strong> (não é necessário novo link de primeiro pagamento).
                  </>
                ) : (
                  <>
                    <strong>Sem assinatura ativa ainda.</strong> Gere o <strong>link de pagamento</strong> para o
                    cliente concluir o cadastro do cartão e ativar a assinatura.
                  </>
                )}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Vagas no pacote</span>
                <select
                  value={meiSlots}
                  onChange={(e) => setMeiSlots(Number(e.target.value))}
                  className="planner-input"
                >
                  {MEI_SLOT_PACKAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} MEI{n > 1 ? 's' : ''} —{' '}
                      {formatBrl(resolveMeiPackagePrice(n))}/mês
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Como cobrar</span>
                {listLoading && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">A verificar assinatura…</p>
                )}
                <fieldset className="space-y-2" disabled={listLoading}>
                  <label
                    className={`flex items-start gap-2 rounded-lg border border-transparent px-1 py-0.5 -mx-1 ${
                      canUseCheckout ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billingTiming"
                      checked={billingTiming === 'checkout'}
                      disabled={!canUseCheckout}
                      onChange={() => canUseCheckout && setBillingTiming('checkout')}
                      className="mt-1 shrink-0"
                      aria-describedby="stripe-billing-checkout-hint"
                    />
                    <span id="stripe-billing-checkout-hint">
                      <span className="font-medium text-slate-800 dark:text-slate-100">Link de pagamento</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        Página de pagamento — cadastro do cartão e primeira assinatura.
                      </span>
                      {billingOptionsReady && !canUseCheckout && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Indisponível: já existe assinatura ativa com cartão.
                        </span>
                      )}
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-2 rounded-lg border border-transparent px-1 py-0.5 -mx-1 ${
                      canUseNextCycle ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
                    }`}
                  >
                    <input
                      type="radio"
                      name="billingTiming"
                      checked={billingTiming === 'next_cycle'}
                      disabled={!canUseNextCycle}
                      onChange={() => canUseNextCycle && setBillingTiming('next_cycle')}
                      className="mt-1 shrink-0"
                      aria-describedby="stripe-billing-next-hint"
                    />
                    <span id="stripe-billing-next-hint">
                      <span className="font-medium text-slate-800 dark:text-slate-100">Próxima fatura</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        Acrescenta à assinatura já ativa; cobrança no próximo ciclo, sem prorata imediata.
                      </span>
                      {billingOptionsReady && !canUseNextCycle && (
                        <span className="block text-xs text-amber-700 dark:text-amber-300/90 mt-1">
                          Disponível após a primeira compra com link de pagamento (assinatura ativa com cartão).
                        </span>
                      )}
                    </span>
                  </label>
                </fieldset>
              </div>
            </div>

            <div className="space-y-3" aria-live="polite">
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/80 bg-slate-50/90 dark:bg-slate-900/40 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Cadastro na plataforma (tabela de empresas)
                </p>
                <dl className="grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Limite MEI guardado</dt>
                    <dd className="font-semibold tabular-nums">
                      {plataformaLimite !== null && Number.isFinite(plataformaLimite) ? plataformaLimite : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Utilizadores MEI agora</dt>
                    <dd className="font-semibold tabular-nums">
                      {meiEmUsoNaEmpresa !== null && Number.isFinite(meiEmUsoNaEmpresa)
                        ? meiEmUsoNaEmpresa
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-violet-200/80 dark:border-violet-500/25 bg-violet-50/60 dark:bg-violet-950/20 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                  Assinatura (soma dos pacotes ativos)
                </p>
                <dl className="grid gap-1.5 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Já contratado (ativos)</dt>
                    <dd className="font-semibold tabular-nums">{activeMeiSlotsTotal}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Este pacote</dt>
                    <dd className="font-semibold tabular-nums">+{meiSlots}</dd>
                  </div>
                  <div className="sm:border-l sm:border-violet-200/60 sm:dark:border-violet-500/20 sm:pl-4">
                    <dt className="text-xs text-violet-700 dark:text-violet-300">Total na assinatura após incluir</dt>
                    <dd className="text-lg font-bold tabular-nums text-violet-900 dark:text-violet-100">
                      {projectedMeiSlotsTotal} MEI{projectedMeiSlotsTotal !== 1 ? 's' : ''}
                    </dd>
                  </div>
                </dl>
                {billingTiming === 'checkout' ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Com link de pagamento, as vagas só ficam ativas na assinatura depois do pagamento concluído.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Na próxima fatura, o novo pacote entra como linha ativa assim que a operação for confirmada.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitLoading || listLoading}
                className="planner-button inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 disabled:opacity-60"
              >
                {submitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {billingTiming === 'checkout' ? 'Gerar link de pagamento' : 'Incluir na próxima fatura'}
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Total do pacote: <strong>{formatBrl(pricePreview)}</strong>/mês
              </span>
            </div>

            {lastCheckoutUrl && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 space-y-2">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Link de pagamento</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={lastCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 dark:text-violet-400 break-all underline"
                  >
                    Abrir em nova aba
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyCheckoutUrl()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
