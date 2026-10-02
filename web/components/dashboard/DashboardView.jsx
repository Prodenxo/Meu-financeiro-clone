'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { buildDashboardModel } from '@/lib/finance/dashboard';
import { toMonthParam } from '@/lib/date';
import { cx } from '@/components/ui';
import { DashboardHeader } from './DashboardHeader';
import { KpiRow } from './KpiRow';
import { SaldoChart } from './SaldoChart';
import { IndicatorStrip } from './IndicatorStrip';
import { RecentTable } from './RecentTable';
import { QuickActions } from './QuickActions';
import { AttentionCard } from './AttentionCard';
import { BudgetsCard } from './BudgetsCard';
import { TodayCard } from './TodayCard';
import { ExpensesByCategoryCard } from './ExpensesByCategoryCard';
import { AccessRequestsCard } from './AccessRequestsCard';
import { NewTransactionModal } from './NewTransactionModal';
import s from './dashboard.module.css';

function dateFromKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/**
 * Tela "Visão geral". Recebe os dados brutos do servidor e monta o modelo
 * no cliente para que o filtro por conta seja instantâneo (sem nova requisição).
 * A troca de mês é um filtro real: navega para `?mes=AAAA-MM` e o servidor recarrega.
 */
export function DashboardView({
  data,
  selectedMonth,
  currentMonth,
  todayKey,
  greeting,
  userFirstName,
  role,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contaFilter, setContaFilter] = useState('all');
  const [hideValues, setHideValues] = useState(false);
  const [modal, setModal] = useState(null); // null | { tipo: 'entrada' | 'saida' | null }

  const today = useMemo(() => dateFromKey(todayKey), [todayKey]);

  const model = useMemo(
    () =>
      buildDashboardModel({
        transactions: data.transactions,
        contas: data.contas,
        categoriasMap: data.categories.categoriasMap,
        categoriasTipoMap: data.categories.categoriasTipoMap,
        budgetSummary: data.budgetSummary,
        selectedMonth,
        contaFilter,
        today,
      }),
    [data, selectedMonth, contaFilter, today],
  );

  const goToMonth = (month) => {
    startTransition(() => {
      router.push(`/visao-geral?mes=${toMonthParam(month)}`);
    });
  };

  const isCurrentMonth = selectedMonth.year === currentMonth.year && selectedMonth.month === currentMonth.month;

  return (
    <>
      <DashboardHeader
        greeting={greeting}
        userFirstName={userFirstName}
        selectedMonth={selectedMonth}
        currentMonth={currentMonth}
        onChangeMonth={goToMonth}
        pending={isPending}
      />

      {isPending ? <div className={s.pendingBar} role="status" aria-label="Carregando mês" /> : null}

      <div className={cx(s.layout, isPending && s.busy)} aria-busy={isPending}>
        <div className={s.mainCol}>
          <KpiRow
            model={model}
            selectedMonth={selectedMonth}
            hideValues={hideValues}
            onToggleHide={() => setHideValues((v) => !v)}
          />

          <SaldoChart
            series={model.saldoSeries}
            contas={model.contasComSaldo}
            contaFilter={contaFilter}
            onChangeContaFilter={setContaFilter}
            balanceMode={model.balance.mode}
            hideValues={hideValues}
            monthCount={model.monthCount}
          />

          <IndicatorStrip insights={model.insights} hideValues={hideValues} />

          <RecentTable rows={model.recent} hideValues={hideValues} allHref={`/transacoes?mes=${toMonthParam(selectedMonth)}`} />

          <ExpensesByCategoryCard data={model.expensesByCategory} hideValues={hideValues} />
        </div>

        <aside className={s.asideCol} aria-label="Resumo e ações">
          <QuickActions onNew={(tipo) => setModal({ tipo })} />
          <AttentionCard pending={model.pending} hideValues={hideValues} />
          <BudgetsCard budgets={model.budgets} hideValues={hideValues} />
          <TodayCard flow={model.todayFlow} isCurrentMonth={isCurrentMonth} hideValues={hideValues} />
          {role === 'superadmin' ? <AccessRequestsCard /> : null}
        </aside>
      </div>

      {modal ? (
        <NewTransactionModal
          initialTipo={modal.tipo}
          categories={data.categories.list}
          contas={model.contasComSaldo}
          todayKey={todayKey}
          onClose={() => setModal(null)}
        />
      ) : null}
    </>
  );
}
