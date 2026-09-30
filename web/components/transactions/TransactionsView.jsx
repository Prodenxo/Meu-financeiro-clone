'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Alert, cx } from '@/components/ui';
import { NewTransactionModal } from '@/components/dashboard/NewTransactionModal';
import {
  deleteRecurringTransactionAction,
  deleteTransactionsAction,
  markTransactionsPaidAction,
} from '@/app/(app)/transacoes/actions';
import { nextMonth, prevMonth } from '@/lib/finance/dashboard';
import { toMonthParam } from '@/lib/date';
import { MONTH_NAMES } from '@/lib/finance/format';
import { normalizarTipo, normalizarValor, parseTransactionDate, toDayKey } from '@/lib/finance/normalize';
import { getTransactionStatusLabel, getTransactionStatusTone } from '@/lib/finance/status';
import { buildDuplicateDraft, buildMaterializationDraft, isProjecao } from '@/lib/finance/recorrencias';
import {
  DEFAULT_FILTERS,
  buildTransactionsModel,
  dayKeyToDate,
  hasActiveFilters,
  isPaidStatus,
  monthsAhead,
  paginate,
} from '@/lib/finance/transactions';
import { TransactionsHeader } from './TransactionsHeader';
import { TransactionsKpis } from './TransactionsKpis';
import { TransactionsFilters } from './TransactionsFilters';
import { TransactionsTable } from './TransactionsTable';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import s from './transactions.module.css';

const PAGE_SIZE = 20;

function toRow(t, categoriasMap, contasById) {
  const isProjection = isProjecao(t);
  const tipo = normalizarTipo(t.tipo);
  const obs = String(t.obs || '').trim();
  return {
    id: t.id,
    raw: t,
    isProjection,
    isRecurring: Boolean(t.recorrencia_id),
    tipo,
    valor: normalizarValor(t.valor),
    title: t.classificacao || 'Lançamento',
    subtitle: obs || (isProjection ? 'Recorrência prevista' : tipo === 'entrada' ? 'Recebimento' : 'Pagamento'),
    categoryName: (t.categoria != null && categoriasMap[String(t.categoria)]) || t.classificacao || 'Sem categoria',
    dateKey: toDayKey(parseTransactionDate(t)),
    conta: t.conta_id ? contasById[String(t.conta_id)] || null : null,
    isPaid: isPaidStatus(t.status),
    statusLabel: getTransactionStatusLabel(t.tipo, t.status),
    statusTone: getTransactionStatusTone(t.tipo, t.status),
  };
}

/**
 * Tela "Transações". Recebe os dados brutos do servidor e aplica período, busca e
 * filtros no cliente (instantâneo). Gravações são Server Actions que revalidam a rota.
 */
export function TransactionsView({ data, initialMonth, initialContaFilter = 'all', currentMonth, todayKey }) {
  const today = useMemo(() => dayKeyToDate(todayKey), [todayKey]);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, contaFilter: initialContaFilter }));
  const [sort, setSort] = useState('recentes');
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const [selected, setSelected] = useState(() => new Set());
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { categoriasMap, list: categoryList } = data.categories;

  const contasById = useMemo(() => Object.fromEntries(data.contas.map((c) => [String(c.id), c])), [data.contas]);

  const filterContas = useMemo(() => {
    const used = new Set(data.transactions.map((t) => t.conta_id).filter(Boolean));
    return data.contas.filter((c) => c.ativo || used.has(String(c.id)));
  }, [data.contas, data.transactions]);

  const hasUnassigned = useMemo(() => data.transactions.some((t) => !t.conta_id), [data.transactions]);

  const model = useMemo(
    () =>
      buildTransactionsModel({
        transactions: data.transactions,
        recorrencias: data.recorrencias,
        skips: data.skips,
        filters,
        selectedMonth,
        today,
        sort,
      }),
    [data, filters, selectedMonth, today, sort],
  );

  const rangeInvalid = Boolean(filters.dateRange.start && filters.dateRange.end && filters.dateRange.start > filters.dateRange.end);

  const pageKey = JSON.stringify([filters, sort, selectedMonth]);
  const { items, page, totalPages } = paginate(model.rows, pageState.key === pageKey ? pageState.page : 1, PAGE_SIZE);
  const rows = items.map((t) => toRow(t, categoriasMap, contasById));

  const realIds = useMemo(() => new Set(model.rows.filter((t) => !isProjecao(t)).map((t) => t.id)), [model.rows]);
  const visibleSelected = useMemo(() => new Set([...selected].filter((id) => realIds.has(id))), [selected, realIds]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const goToMonth = (month) => {
    setSelectedMonth(month);
    setFilters((f) => ({ ...f, period: 'Esse mês', dateRange: { start: '', end: '' } }));
    window.history.replaceState(null, '', `/transacoes?mes=${toMonthParam(month)}`);
  };

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelected(new Set());
  };

  const runAction = (fn, successText) => {
    startTransition(async () => {
      const res = await fn();
      if (res?.ok) {
        setSelected(new Set());
        setToast({ tone: 'success', text: successText(res) });
      } else {
        setToast({ tone: 'error', text: res?.error || 'Não foi possível concluir a ação.' });
      }
    });
  };

  const openNew = () => setModal({ mode: 'create', draft: null });

  const onAction = (action, row) => {
    if (action === 'edit') setModal({ mode: 'edit', draft: row.raw });
    else if (action === 'duplicate') setModal({ mode: 'duplicate', draft: buildDuplicateDraft(row.raw) });
    else if (action === 'materialize') setModal({ mode: 'materialize', draft: buildMaterializationDraft(row.raw) });
    else if (action === 'markPaid')
      runAction(() => markTransactionsPaidAction([row.id]), () => `Marcada como ${row.tipo === 'entrada' ? 'recebida' : 'paga'}.`);
    else if (action === 'delete') {
      setDeleteError('');
      setDeleteTarget({ rows: [row] });
    }
  };

  const selectedRows = () =>
    model.rows.filter((t) => visibleSelected.has(t.id)).map((t) => toRow(t, categoriasMap, contasById));

  const onBulk = (action) => {
    const list = selectedRows();
    if (action === 'markPaid') {
      const ids = list.filter((r) => !r.isPaid).map((r) => r.id);
      runAction(() => markTransactionsPaidAction(ids), (res) => `${res.count} ${res.count === 1 ? 'transação atualizada' : 'transações atualizadas'}.`);
    } else if (action === 'delete') {
      setDeleteError('');
      setDeleteTarget({ rows: list });
    }
  };

  const confirmDelete = (scope) => {
    const target = deleteTarget;
    if (!target) return;
    const single = target.rows.length === 1 ? target.rows[0] : null;
    startTransition(async () => {
      const res =
        single?.isRecurring
          ? await deleteRecurringTransactionAction(single.id, scope)
          : await deleteTransactionsAction(target.rows.map((r) => r.id));
      if (res?.ok) {
        setDeleteTarget(null);
        setSelected(new Set());
        setToast({ tone: 'success', text: single ? 'Transação excluída.' : `${target.rows.length} transações excluídas.` });
      } else {
        setDeleteError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const onExport = async () => {
    if (model.exportRows.length === 0) {
      setToast({ tone: 'info', text: 'Nenhuma transação para exportar com os filtros atuais.' });
      return;
    }
    setExporting(true);
    try {
      const { exportTransactionsToExcel } = await import('./exportExcel');
      await exportTransactionsToExcel(model.exportRows, todayKey);
    } catch (err) {
      console.error('[exportExcel]', err);
      setToast({ tone: 'error', text: 'Não foi possível gerar a planilha. Tente de novo.' });
    } finally {
      setExporting(false);
    }
  };

  const closeModal = useCallback(() => setModal(null), []);

  const modalContas = useMemo(() => {
    const ativas = data.contas.filter((c) => c.ativo);
    const draftConta = modal?.draft?.conta_id ? contasById[String(modal.draft.conta_id)] : null;
    return draftConta && !draftConta.ativo ? [...ativas, draftConta] : ativas;
  }, [data.contas, contasById, modal]);

  const isMonthMode = model.period.mode === 'month';
  const isCurrentMonth = selectedMonth.year === currentMonth.year && selectedMonth.month === currentMonth.month;
  const periodHint = isMonthMode
    ? `Resultado de ${MONTH_NAMES[selectedMonth.month - 1].toLowerCase()} de ${selectedMonth.year}`
    : `Resultado de ${model.period.label.toLowerCase()}`;

  return (
    <div className={s.page}>
      <TransactionsHeader
        periodLabel={model.period.label}
        isMonthMode={isMonthMode}
        isCurrentMonth={isCurrentMonth}
        onPrev={() => goToMonth(prevMonth(selectedMonth))}
        onNext={() => goToMonth(nextMonth(selectedMonth))}
        onToday={() => goToMonth(currentMonth)}
        onExport={onExport}
        exporting={exporting}
        onNew={openNew}
      />

      {isPending ? <div className={s.pendingBar} role="status" aria-label="Salvando" /> : null}

      {isMonthMode && monthsAhead(selectedMonth, today) > 24 ? (
        <Alert tone="info">
          Você está vendo um mês distante. Os valores projetados de recorrências não consideram inflação — o preço real pode ser diferente.
        </Alert>
      ) : null}

      <TransactionsKpis kpis={model.kpis} series={model.series} periodHint={periodHint} />

      <TransactionsFilters
        filters={filters}
        period={model.period}
        rangeInvalid={rangeInvalid}
        contas={filterContas}
        hasUnassigned={hasUnassigned}
        canClear={hasActiveFilters(filters) || Boolean(filters.dateRange.start || filters.dateRange.end)}
        onChange={updateFilters}
        onPreset={(period) => updateFilters({ period, dateRange: { start: '', end: '' } })}
        onRange={(dateRange) => updateFilters({ dateRange })}
        onClear={clearFilters}
      />

      <div className={cx(isPending && s.busy)} aria-busy={isPending}>
        <TransactionsTable
          rows={rows}
          total={model.rows.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPageState({ key: pageKey, page: p })}
          sort={sort}
          onSort={setSort}
          selected={visibleSelected}
          onSelect={(id) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onSelectPage={(ids, checked) =>
            setSelected((prev) => {
              const next = new Set(prev);
              ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
              return next;
            })
          }
          onClearSelection={() => setSelected(new Set())}
          onAction={onAction}
          onBulk={onBulk}
          busy={isPending}
          filtered={hasActiveFilters(filters)}
          onClearFilters={clearFilters}
          onNew={openNew}
        />
      </div>

      {modal ? (
        <NewTransactionModal
          key={`${modal.mode}-${modal.draft?.id || ''}`}
          mode={modal.mode}
          draft={modal.draft}
          categories={categoryList}
          contas={modalContas}
          todayKey={todayKey}
          onClose={closeModal}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteTransactionDialog
          target={deleteTarget}
          pending={isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}

      {toast ? (
        <div className={s.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}
