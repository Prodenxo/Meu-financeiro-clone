'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { deleteBudgetAction, pasteBudgetsAction } from '@/app/(app)/orcamentos/actions';
import { Alert, Button, Card, EmptyState, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { MiniBars, Sparkline } from '@/components/transactions/TransactionsKpis';
import { toMonthParam } from '@/lib/date';
import { formatBrl, formatMonthLabel } from '@/lib/finance/format';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { BUDGET_FILTERS, buildOrcamentosModel } from '@/lib/finance/orcamentos';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { BudgetActions } from './BudgetActions';
import { BudgetCategoryCard } from './BudgetCategoryCard';
import { BudgetChart } from './BudgetChart';
import { BudgetModal } from './BudgetModal';
import { BudgetAttentionCard, BudgetMonthlySummary } from './BudgetSideCards';
import { BudgetSummaryCard } from './BudgetSummaryCard';
import { BudgetTable } from './BudgetTable';
import { DeleteBudgetDialog } from './DeleteBudgetDialog';
import s from './orcamentos.module.css';

function OrcamentosHeader({ monthLabel, isCurrentMonth, onPrev, onNext, onToday, onNew }) {
  return (
    <header className={t.header}>
      <div>
        <p className={t.crumb}>Início / Orçamentos</p>
        <h1 className={t.title}>Orçamentos</h1>
        <p className={t.subtitle}>Planeje seus gastos e acompanhe seus limites mensais.</p>
      </div>
      <div className={t.headerActions}>
        {!isCurrentMonth ? (
          <Button variant="ghost" size="sm" icon="repeat" onClick={onToday}>
            Voltar para hoje
          </Button>
        ) : null}
        <div className={t.monthPicker} role="group" aria-label="Mês">
          <button type="button" className={t.monthNav} onClick={onPrev} aria-label="Mês anterior">
            <Icon name="chevron-left" size={16} />
          </button>
          <span className={t.monthLabel} aria-live="polite">
            {monthLabel}
          </span>
          <button type="button" className={t.monthNav} onClick={onNext} aria-label="Próximo mês">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <Button icon="plus" onClick={onNew}>
          Novo orçamento
        </Button>
      </div>
    </header>
  );
}

function scrollToTable() {
  document.getElementById('todos-orcamentos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Tela Orçamentos. Recebe todas as linhas de `orçamentos` + lançamentos + categorias do
 * servidor e calcula o mês selecionado no cliente (troca de mês instantânea, URL `?mes=`).
 */
export function OrcamentosView({ data, userId, initialMonth, currentMonth, todayKey }) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('uso');
  const [chartRange, setChartRange] = useState('30d');
  const [menuFor, setMenuFor] = useState(null);
  const [modal, setModal] = useState(null); // { item: null | BudgetItem }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [isPending, startTransition] = useTransition();

  const categories = data.categories.list;

  const model = useMemo(
    () =>
      buildOrcamentosModel({
        budgetRows: data.budgetRows,
        transactions: data.transactions,
        categories,
        userId,
        selectedMonth,
        today: todayKey,
        filter,
        sort,
        chartRange,
      }),
    [data.budgetRows, data.transactions, categories, userId, selectedMonth, todayKey, filter, sort, chartRange],
  );

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(tm);
  }, [toast]);

  const goToMonth = (month) => {
    setSelectedMonth(month);
    setMenuFor(null);
    window.history.replaceState(null, '', `/orcamentos?mes=${toMonthParam(month)}`);
  };

  const mesParam = toMonthParam(selectedMonth);
  const monthLabel = formatMonthLabel(selectedMonth);
  const isCurrentMonth = selectedMonth.year === currentMonth.year && selectedMonth.month === currentMonth.month;

  const openNew = () => setModal({ item: null });
  const openEdit = (item) => {
    setMenuFor(null);
    setModal({ item });
  };
  const askDelete = (item) => {
    setMenuFor(null);
    setDeleteError('');
    setDeleteTarget(item);
  };
  const closeModal = useCallback(() => setModal(null), []);
  const closeMenu = useCallback(() => setMenuFor(null), []);
  const toggleMenu = (key) => setMenuFor((cur) => (cur === key ? null : key));

  const confirmDelete = () => {
    const item = deleteTarget;
    if (!item) return;
    startTransition(async () => {
      const res = await deleteBudgetAction(item.categorias_id, mesParam);
      if (res?.ok) {
        setDeleteTarget(null);
        setToast({ tone: 'success', text: `Orçamento de ${item.nome} removido.` });
      } else {
        setDeleteError(res?.error || 'Não foi possível remover.');
      }
    });
  };

  const { items, visible, totals, attention, trend, history, availableCategories } = model;
  const sameMonth = (a, b) => a?.year === b?.year && a?.month === b?.month;
  const canPaste = Boolean(clipboard) && !sameMonth(clipboard.month, selectedMonth);

  const copyCurrentMonth = () => {
    if (items.length === 0) {
      setToast({ tone: 'info', text: 'Este mês não tem orçamentos para copiar.' });
      return;
    }
    setClipboard({
      month: selectedMonth,
      label: monthLabel,
      entries: items.map((item) => ({ categorias_id: item.categorias_id, valor: item.orcado })),
    });
    setToast({ tone: 'success', text: `Orçamento de ${monthLabel} copiado. Troque de mês para colar.` });
  };

  const pasteClipboard = () => {
    if (!clipboard) return;
    startTransition(async () => {
      const res = await pasteBudgetsAction(mesParam, clipboard.entries);
      if (res?.ok) {
        const n = res.count;
        setToast({ tone: 'success', text: `${n} ${n === 1 ? 'limite colado' : 'limites colados'} de ${clipboard.label} em ${monthLabel}.` });
      } else {
        setToast({ tone: 'error', text: res?.error || 'Não foi possível colar o orçamento.' });
      }
    });
  };

  const pctUsed = Math.round(totals.percentual);
  const usedOver = totals.orcado > 0 && totals.realizado > totals.orcado;
  const hasBudgets = items.length > 0;

  return (
    <div className={s.page}>
      <OrcamentosHeader
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        onPrev={() => goToMonth(prevMonth(selectedMonth))}
        onNext={() => goToMonth(nextMonth(selectedMonth))}
        onToday={() => goToMonth(currentMonth)}
        onNew={openNew}
      />

      {isPending ? <div className={t.pendingBar} role="status" aria-label="Salvando" /> : null}

      <section className={t.kpis} aria-label="Resumo do mês">
        <BudgetSummaryCard
          label="Total orçado"
          icon="target"
          iconTone="primary"
          value={formatBrl(totals.orcado)}
          valueClass={s.valuePrimary}
          hint="Soma dos limites do mês"
          chart={<MiniBars values={items.map((i) => i.orcado)} color="var(--mf-primary)" />}
        />
        <BudgetSummaryCard
          label="Total utilizado"
          icon={usedOver ? 'alert-circle' : 'wallet'}
          iconTone={usedOver ? 'danger' : 'success'}
          value={formatBrl(totals.realizado)}
          valueClass={usedOver ? t.negative : t.positive}
          hint={totals.orcado > 0 ? `${pctUsed}% do orçamento` : 'Sem limite definido no mês'}
          chart={<Sparkline values={trend} color={usedOver ? 'var(--mf-danger)' : 'var(--mf-success)'} />}
        />
        <BudgetSummaryCard
          label="Categorias acompanhadas"
          icon="tag"
          iconTone="success"
          value={String(totals.count)}
          valueClass={t.positive}
          hint={totals.overCount > 0 ? `${totals.overCount} acima do limite` : 'Com orçamento ativo'}
          chart={<MiniBars values={items.map((i) => i.percentual)} color="var(--mf-success)" />}
        />
      </section>

      <div className={d.layout}>
        <div className={d.mainCol}>
          <Card aria-labelledby="budget-categories-title">
            <div className={s.sectionHead}>
              <div>
                <h2 className={d.sectionTitle} id="budget-categories-title">
                  Categorias com orçamento
                </h2>
                <p className={d.sectionSub}>Acompanhe seus limites e veja o quanto já foi utilizado.</p>
              </div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar categorias" style={{ width: 'auto', minWidth: 190 }}>
                {BUDGET_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            {!hasBudgets ? (
              <EmptyState
                icon="target"
                title="Nenhum orçamento neste mês"
                text="Defina limites por categoria para acompanhar gastos e receitas."
                action={
                  <Button icon="plus" onClick={openNew}>
                    Criar primeiro orçamento
                  </Button>
                }
              />
            ) : visible.length === 0 ? (
              <EmptyState icon="filter" title="Nenhuma categoria com esse filtro" action={<Button variant="outline" onClick={() => setFilter('all')}>Limpar filtro</Button>} />
            ) : (
              <div className={s.categoryList}>
                {visible.map((item) => (
                  <BudgetCategoryCard
                    key={item.categorias_id}
                    item={item}
                    menuOpen={menuFor === `card:${item.categorias_id}`}
                    onToggleMenu={() => toggleMenu(`card:${item.categorias_id}`)}
                    onCloseMenu={closeMenu}
                    onEdit={openEdit}
                    onDelete={askDelete}
                    busy={isPending}
                  />
                ))}
              </div>
            )}
          </Card>

          <BudgetChart history={history} range={chartRange} onChangeRange={setChartRange} />

          <BudgetTable
            items={visible}
            sort={sort}
            onSort={setSort}
            menuFor={menuFor}
            onToggleMenu={toggleMenu}
            onCloseMenu={closeMenu}
            onEdit={openEdit}
            onDelete={askDelete}
            busy={isPending}
          />
        </div>

        <aside className={d.asideCol}>
          <BudgetActions onNew={openNew} onCopy={copyCurrentMonth} onPaste={pasteClipboard} onAdjust={scrollToTable} canPaste={canPaste} canCopy={hasBudgets} busy={isPending} />
          <BudgetAttentionCard items={attention} onSelect={openEdit} onSeeAll={scrollToTable} />
          <BudgetMonthlySummary totals={totals} />
        </aside>
      </div>

      {modal ? (
        <BudgetModal
          item={modal.item}
          categories={availableCategories}
          hasCategories={categories.length > 0}
          mes={mesParam}
          monthLabel={monthLabel}
          onClose={closeModal}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteBudgetDialog
          item={deleteTarget}
          monthLabel={monthLabel}
          pending={isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}

      {toast ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}

      <span className={cx('sr-only')} aria-live="polite">
        {isPending ? 'Salvando alterações' : ''}
      </span>
    </div>
  );
}
