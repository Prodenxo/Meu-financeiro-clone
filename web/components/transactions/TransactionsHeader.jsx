'use client';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './transactions.module.css';

export function TransactionsHeader({ periodLabel, isMonthMode, isCurrentMonth, onPrev, onNext, onToday, onExport, exporting, onNew }) {
  return (
    <header className={s.header}>
      <div>
        <p className={s.crumb}>Início / Transações</p>
        <h1 className={s.title}>Transações</h1>
        <p className={s.subtitle}>Controle todas as entradas e saídas da sua conta em um só lugar.</p>
      </div>

      <div className={s.headerActions}>
        {isMonthMode && !isCurrentMonth ? (
          <Button variant="ghost" size="sm" icon="repeat" onClick={onToday}>
            Voltar para hoje
          </Button>
        ) : null}
        <div className={s.monthPicker} role="group" aria-label="Período">
          <button type="button" className={s.monthNav} onClick={onPrev} aria-label="Mês anterior">
            <Icon name="chevron-left" size={16} />
          </button>
          <span className={s.monthLabel} aria-live="polite">
            {periodLabel}
          </span>
          <button type="button" className={s.monthNav} onClick={onNext} aria-label="Próximo mês">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <Button variant="outline" icon="download" onClick={onExport} disabled={exporting} aria-busy={exporting}>
          {exporting ? 'Exportando…' : 'Exportar Excel'}
        </Button>
        <Button icon="plus" onClick={onNew}>
          Nova transação
        </Button>
      </div>
    </header>
  );
}
