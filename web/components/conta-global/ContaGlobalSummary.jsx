'use client';

import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contaGlobal.module.css';
import { MoedaFlag } from './MoedaFlag';

const HIDDEN = 'R$ ••••••';

/** Mesma estrutura do KpiCard da Visão geral: cabeçalho 32px → valor 36px → descrição → rodapé. */
function SummaryCard({ navy, label, icon, iconNode, value, hint, code, extra, foot }) {
  return (
    <article className={cx(d.kpi, navy && d.kpiNavy)} aria-label={label}>
      <div className={d.kpiHead}>
        <span className={d.kpiLabel}>{label}</span>
        {iconNode || (
          <span className={d.kpiIcon}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <span className={code ? s.kpiCode : s.kpiCodePlaceholder} aria-hidden={code ? undefined : 'true'}>
        {code || '—'}
      </span>
      <div className={d.kpiValueRow} style={{ marginTop: 6 }}>
        <span className={cx(d.kpiValue, s.kpiValueOverride)} title={typeof value === 'string' ? value : undefined}>
          {value}
        </span>
        {extra}
      </div>
      <p className={d.kpiHint} title={hint}>
        {hint}
      </p>
      <div className={d.kpiFoot}>{foot}</div>
    </article>
  );
}

/**
 * Resumo superior: saldo convertido (azul-noturno), moedas cadastradas e maior saldo convertido.
 * Todos os valores vêm do `buildContaGlobalModel` (mesmas cotações dos cards).
 */
export function ContaGlobalSummary({ model, hideValues, onToggleHide }) {
  const money = (v) => (hideValues ? HIDDEN : formatBrl(v));
  const { count, total, maior, missingRates, convertidasCount, allRatesMissing } = model;

  const totalHint = allRatesMissing ? 'Cotações indisponíveis no momento' : 'Estimativa em reais';
  const totalFoot =
    missingRates.length > 0 && !allRatesMissing
      ? `Sem cotação para ${missingRates.join(', ')}`
      : convertidasCount > 0
        ? `${convertidasCount} de ${count} moeda${count === 1 ? '' : 's'} convertida${convertidasCount === 1 ? '' : 's'}`
        : 'Nenhuma moeda convertida';

  const eyeButton = (
    <button type="button" className={d.eyeBtn} onClick={onToggleHide} aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'} aria-pressed={hideValues}>
      <Icon name={hideValues ? 'eye-off' : 'eye'} size={15} />
    </button>
  );

  return (
    <section className={s.kpis} aria-label="Resumo da Conta global">
      <SummaryCard
        navy
        label="Saldo convertido"
        icon="globe"
        value={allRatesMissing ? '—' : money(total)}
        hint={totalHint}
        extra={eyeButton}
        foot={<span className={d.kpiFootText}>{totalFoot}</span>}
      />
      <SummaryCard
        label="Moedas cadastradas"
        icon="globe"
        value={String(count)}
        hint="Na sua conta global"
        foot={<span className={d.kpiFootText}>{count === 0 ? 'Nenhuma moeda ainda' : 'Separado das contas em reais'}</span>}
      />
      <SummaryCard
        label="Maior saldo convertido"
        iconNode={maior ? <MoedaFlag moeda={maior.moeda} size={32} label={maior.nomeMoeda} className={s.kpiFlag} /> : null}
        icon="trending-up"
        code={maior ? maior.moeda : null}
        value={maior ? money(maior.valorBrl) : '—'}
        hint={maior ? maior.label : count > 0 ? 'Aguardando cotações' : 'Cadastre uma moeda para ver'}
        foot={<span className={d.kpiFootText}>{maior ? 'Após conversão para reais' : ' '}</span>}
      />
    </section>
  );
}
