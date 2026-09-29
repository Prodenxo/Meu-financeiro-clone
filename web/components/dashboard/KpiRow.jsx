'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { toMonthParam } from '@/lib/date';
import { cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { resolveBankVisual } from '@/lib/finance/bankCatalog';
import s from './dashboard.module.css';

const HIDDEN = 'R$ ••••••';

/**
 * Um único componente para os 3 cards: mesma estrutura (cabeçalho 32px → valor 36px →
 * descrição 18px → rodapé com altura mínima) garante largura e altura idênticas.
 */
function KpiCard({ navy, label, icon, iconTone, value, hint, foot, extra }) {
  return (
    <article className={cx(s.kpi, navy && s.kpiNavy)} aria-label={label}>
      <div className={s.kpiHead}>
        <span className={s.kpiLabel}>{label}</span>
        <span className={cx(s.kpiIcon, iconTone === 'success' && s.kpiIconSuccess, iconTone === 'danger' && s.kpiIconDanger)}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className={s.kpiValueRow}>
        <span className={s.kpiValue} title={typeof value === 'string' ? value : undefined}>
          {value}
        </span>
        {extra}
      </div>
      <p className={s.kpiHint} title={hint}>
        {hint}
      </p>
      <div className={s.kpiFoot}>{foot}</div>
    </article>
  );
}

function BankChips({ contas }) {
  const visible = contas.slice(0, 4);
  const rest = contas.length - visible.length;
  return (
    <div className={s.banks} aria-label={`${contas.length} conta${contas.length === 1 ? '' : 's'} ativa${contas.length === 1 ? '' : 's'}`}>
      {visible.map((conta) => {
        const visual = resolveBankVisual(conta);
        return (
          <span
            key={conta.id}
            className={s.bankChip}
            style={{ background: visual.accent }}
            title={`${conta.nome} · ${formatBrl(conta.saldoAtual)}`}
          >
            {visual.slug ? (
              // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no servidor, sem otimização
              <img src={`/api/bank-icon/${visual.slug}?size=48`} alt={visual.label} width={26} height={26} loading="lazy" />
            ) : (
              <span aria-hidden="true">{visual.initials}</span>
            )}
          </span>
        );
      })}
      {rest > 0 ? (
        <span className={cx(s.bankChip, s.bankMore)} title={`+${rest} conta${rest === 1 ? '' : 's'}`}>
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

function legacyHref(legacyAppUrl, path) {
  return legacyAppUrl ? `${legacyAppUrl}${path}` : null;
}

export function KpiRow({ model, selectedMonth, hideValues, onToggleHide, legacyAppUrl }) {
  const { balance, totals, contasComSaldo } = model;
  const money = (v) => (hideValues ? HIDDEN : formatBrl(v));
  const contasHref = legacyHref(legacyAppUrl, '/contas');
  const txHref = `/transacoes?mes=${toMonthParam(selectedMonth)}`;

  const eyeButton = (
    <button
      type="button"
      className={s.eyeBtn}
      onClick={onToggleHide}
      aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
      aria-pressed={hideValues}
    >
      <Icon name={hideValues ? 'eye-off' : 'eye'} size={15} />
    </button>
  );

  const contasLabel = contasComSaldo.length === 0 ? 'Nenhuma conta cadastrada' : null;

  return (
    <section className={s.kpis} aria-label="Resumo do mês">
      <KpiCard
        navy
        label={balance.label}
        icon="wallet"
        value={money(balance.value)}
        hint={balance.hint}
        extra={eyeButton}
        foot={
          <>
            {contasLabel ? <span className={s.kpiFootText}>{contasLabel}</span> : <BankChips contas={contasComSaldo} />}
            {contasHref ? (
              <a href={contasHref} className={s.kpiFootLink} title="Minhas contas — abre no app atual">
                Ver contas <Icon name="arrow-right" size={13} />
              </a>
            ) : null}
          </>
        }
      />

      <KpiCard
        label="Entradas"
        icon="arrow-up-right"
        iconTone="success"
        value={money(totals.income)}
        hint="Recebido no mês"
        foot={
          <>
            <span className={s.kpiFootText}>
              {totals.countIncome} recebimento{totals.countIncome === 1 ? '' : 's'}
            </span>
            <Link href={txHref} className={s.kpiFootLink}>
              Ver <Icon name="arrow-right" size={13} />
            </Link>
          </>
        }
      />

      <KpiCard
        label="Saídas"
        icon="arrow-down-right"
        iconTone="danger"
        value={money(totals.expenses)}
        hint="Pago no mês"
        foot={
          <>
            <span className={s.kpiFootText}>
              {totals.countExpenses} pagamento{totals.countExpenses === 1 ? '' : 's'}
            </span>
            <Link href={txHref} className={s.kpiFootLink}>
              Ver <Icon name="arrow-right" size={13} />
            </Link>
          </>
        }
      />
    </section>
  );
}
