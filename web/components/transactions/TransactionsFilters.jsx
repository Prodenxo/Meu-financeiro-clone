'use client';

import { Card, Input, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { PERIOD_PRESETS } from '@/lib/finance/transactions';
import s from './transactions.module.css';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saídas' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'pago', label: 'Pagas' },
  { value: 'pendente', label: 'Pendentes' },
];

export function TransactionsFilters({ filters, period, rangeInvalid, contas, hasUnassigned, canClear, onChange, onPreset, onRange, onClear }) {
  const shownStart = filters.dateRange.start || period.start;
  const shownEnd = filters.dateRange.end || period.end;

  return (
    <Card aria-labelledby="tx-filters-title">
      <div className={s.filtersHead}>
        <h2 className={s.filtersTitle} id="tx-filters-title">
          <Icon name="filter" size={16} />
          Filtros
        </h2>
        <button type="button" className={s.linkButton} onClick={onClear} disabled={!canClear}>
          Limpar filtros
        </button>
      </div>

      <div className={s.filtersRow}>
        <div className={s.filterGroup}>
          <span className={s.filterLabel} id="tx-period-label">
            Período
          </span>
          <Segmented
            ariaLabel="Período rápido"
            value={period.mode === 'custom' ? null : filters.period}
            onChange={onPreset}
            options={PERIOD_PRESETS.map((p) => ({ value: p, label: p }))}
          />
        </div>

        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Intervalo</span>
          <div className={s.dateRange}>
            <Input
              type="date"
              aria-label="Data inicial"
              value={shownStart}
              onChange={(e) => onRange({ start: e.target.value, end: shownEnd })}
              invalid={rangeInvalid}
            />
            <span className={s.dateSep}>até</span>
            <Input
              type="date"
              aria-label="Data final"
              value={shownEnd}
              onChange={(e) => onRange({ start: shownStart, end: e.target.value })}
              invalid={rangeInvalid}
            />
          </div>
        </div>

        <div className={s.searchWrap}>
          <Icon name="search" size={16} className={s.searchIcon} />
          <Input
            type="search"
            aria-label="Pesquisar descrição da transação"
            placeholder="Pesquisar descrição da transação..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
      </div>
      {rangeInvalid ? <p className={s.filterHint} role="alert">A data final precisa ser igual ou depois da inicial.</p> : null}

      <div className={s.filtersRow}>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Tipo</span>
          <Segmented ariaLabel="Tipo" value={filters.typeFilter} onChange={(v) => onChange({ typeFilter: v })} options={TYPE_OPTIONS} />
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Status</span>
          <Segmented ariaLabel="Status" value={filters.statusFilter} onChange={(v) => onChange({ statusFilter: v })} options={STATUS_OPTIONS} />
        </div>
        <div className={s.filterGroup}>
          <label className={s.filterLabel} htmlFor="tx-conta">
            Conta
          </label>
          <Select id="tx-conta" className={s.contaSelect} value={filters.contaFilter} onChange={(e) => onChange({ contaFilter: e.target.value })}>
            <option value="all">Todas as contas</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.ativo ? '' : ' (inativa)'}
              </option>
            ))}
            {hasUnassigned ? <option value="unassigned">Sem conta vinculada</option> : null}
          </Select>
        </div>
      </div>
    </Card>
  );
}
