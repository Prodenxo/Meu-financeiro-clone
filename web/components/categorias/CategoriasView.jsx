'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { deleteCategoriaAction } from '@/app/(app)/categorias/actions';
import { Alert, Button, cx } from '@/components/ui';
import { MiniBars, Sparkline } from '@/components/transactions/TransactionsKpis';
import { toMonthParam } from '@/lib/date';
import { formatBrl, formatMonthLabel } from '@/lib/finance/format';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { buildCategoriasModel } from '@/lib/finance/categorias';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { CategoriaModal } from './CategoriaModal';
import { CategoryDistributionChart } from './CategoryDistributionChart';
import { CategoryFilters } from './CategoryFilters';
import { CategoryList } from './CategoryList';
import { CategoryShareCard } from './CategoryShareCard';
import { CategorySummaryCard } from './CategorySummaryCard';
import { DeleteCategoriaDialog } from './DeleteCategoriaDialog';
import { QuickCategoryActions } from './QuickCategoryActions';
import { RecentCategoryMovements } from './RecentCategoryMovements';
import s from './categorias.module.css';

function CategoriasHeader({ onNew }) {
  return (
    <header className={t.header}>
      <div>
        <p className={t.crumb}>Início / Categorias</p>
        <h1 className={t.title}>Categorias</h1>
        <p className={t.subtitle}>Organize seus gastos e acompanhe seus movimentos por categoria.</p>
      </div>
      <div className={t.headerActions}>
        <Button icon="plus" onClick={onNew}>
          Nova categoria
        </Button>
      </div>
    </header>
  );
}

function scrollToList() {
  document.getElementById('cat-list-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Tela Categorias. Recebe categorias (globais + do usuário) e todos os lançamentos do
 * servidor; mês, tipo e busca são calculados no cliente (URL `?mes=&tipo=`).
 */
export function CategoriasView({ data, userId, initialMonth, initialTipo, currentMonth }) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [viewTipo, setViewTipo] = useState(initialTipo);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [modal, setModal] = useState(null); // { categoria: null | row }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  const model = useMemo(
    () => buildCategoriasModel({ categories: data.categories, transactions: data.transactions, selectedMonth, viewTipo, search }),
    [data.categories, data.transactions, selectedMonth, viewTipo, search],
  );

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(tm);
  }, [toast]);

  const syncUrl = (month, tipo) => {
    window.history.replaceState(null, '', `/categorias?mes=${toMonthParam(month)}&tipo=${tipo}`);
  };

  const goToMonth = (month) => {
    setSelectedMonth(month);
    setMenuFor(null);
    setExpandedId(null);
    syncUrl(month, viewTipo);
  };

  const changeTipo = (tipo) => {
    setViewTipo(tipo);
    setMenuFor(null);
    setExpandedId(null);
    syncUrl(selectedMonth, tipo);
  };

  const monthLabel = formatMonthLabel(selectedMonth);
  const isCurrentMonth = selectedMonth.year === currentMonth.year && selectedMonth.month === currentMonth.month;
  const isSaida = viewTipo === 'saida';

  const openNew = () => setModal({ categoria: null });
  const openEdit = (row) => {
    setMenuFor(null);
    setModal({ categoria: row });
  };
  const askDelete = (row) => {
    setMenuFor(null);
    setDeleteError('');
    setDeleteTarget(row);
  };
  const closeModal = useCallback(() => setModal(null), []);
  const closeMenu = useCallback(() => setMenuFor(null), []);
  const toggleMenu = (id) => setMenuFor((cur) => (cur === id ? null : id));
  const toggleExpand = (id) => {
    setMenuFor(null);
    setExpandedId((cur) => (cur === id ? null : id));
  };
  const onSaved = useCallback((res) => {
    setToast({ tone: 'success', text: res.mode === 'edit' ? `Categoria “${res.nome}” atualizada.` : `Categoria “${res.nome}” criada.` });
  }, []);

  const confirmDelete = () => {
    const row = deleteTarget;
    if (!row) return;
    startTransition(async () => {
      const res = await deleteCategoriaAction(row.id);
      if (res?.ok) {
        setDeleteTarget(null);
        setToast({ tone: 'success', text: `Categoria “${row.nome}” excluída. Lançamentos movidos para “${res.movedTo}”.` });
      } else {
        setDeleteError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const { rows, total, counts, distribution, recent, trend } = model;
  const moneyClass = isSaida ? t.negative : t.positive;
  const moneyColor = isSaida ? 'var(--mf-danger)' : 'var(--mf-success)';

  return (
    <div className={s.page}>
      <CategoriasHeader onNew={openNew} />

      {isPending ? <div className={t.pendingBar} role="status" aria-label="Salvando" /> : null}

      <section className={t.kpis} aria-label="Resumo das categorias">
        <CategorySummaryCard
          label="Total de categorias"
          icon="tag"
          iconTone="primary"
          value={String(counts.total)}
          valueClass={s.valuePrimary}
          hint="Categorias cadastradas"
          chart={<MiniBars values={rows.map((r) => r.count)} color="var(--mf-primary)" />}
        />
        <CategorySummaryCard
          label="Categorias com movimento"
          icon="check"
          iconTone="success"
          value={String(counts.active)}
          valueClass={t.positive}
          hint="Categorias utilizadas no mês"
          chart={<MiniBars values={rows.map((r) => r.amount)} color="var(--mf-success)" />}
        />
        <CategorySummaryCard
          label="Total movimentado"
          icon={isSaida ? 'trending-down' : 'trending-up'}
          iconTone={isSaida ? 'danger' : 'success'}
          value={formatBrl(total)}
          valueClass={moneyClass}
          hint={isSaida ? 'Gastos no período' : 'Entradas no período'}
          chart={<Sparkline values={trend} color={moneyColor} />}
        />
      </section>

      <CategoryFilters
        search={search}
        onSearch={setSearch}
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        onPrev={() => goToMonth(prevMonth(selectedMonth))}
        onNext={() => goToMonth(nextMonth(selectedMonth))}
        onToday={() => goToMonth(currentMonth)}
        viewTipo={viewTipo}
        onViewTipo={changeTipo}
      />

      <div className={d.layout}>
        <div className={d.mainCol}>
          <CategoryList
            viewTipo={viewTipo}
            rows={rows}
            total={total}
            counts={counts}
            search={search}
            userId={userId}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
            menuFor={menuFor}
            onToggleMenu={toggleMenu}
            onCloseMenu={closeMenu}
            onEdit={openEdit}
            onDelete={askDelete}
            onNew={openNew}
            onClearSearch={() => setSearch('')}
            busy={isPending}
          />
        </div>

        <aside className={d.asideCol}>
          <QuickCategoryActions onNew={openNew} busy={isPending} />
          <CategoryShareCard distribution={distribution} viewTipo={viewTipo} onSeeAll={scrollToList} />
          <RecentCategoryMovements items={recent} />
        </aside>
      </div>

      <CategoryDistributionChart distribution={distribution} total={total} viewTipo={viewTipo} />

      {modal ? <CategoriaModal categoria={modal.categoria} defaultTipo={viewTipo} onClose={closeModal} onSaved={onSaved} /> : null}

      {deleteTarget ? (
        <DeleteCategoriaDialog categoria={deleteTarget} pending={isPending} error={deleteError} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />
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
