'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Alert, Button, Card, EmptyState, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { BankChips } from '@/components/dashboard/KpiRow';
import { deleteContaAction } from '@/app/(app)/contas/actions';
import { pluggyDisconnectContaAction, pluggySyncContaAction } from '@/app/(app)/contas/openFinanceActions';
import { DisconnectOpenFinanceDialog } from './DisconnectOpenFinanceDialog';
import { formatBrl } from '@/lib/finance/format';
import { CONTA_TIPO_LABELS } from '@/lib/finance/contas';
import { buildContasModel } from '@/lib/finance/contasPage';
import { dayKeyToDate } from '@/lib/finance/transactions';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { AccountSummaryCard, AccountsMiniBars } from './AccountSummaryCard';
import { AccountCard } from './AccountCard';
import { AccountActions } from './AccountActions';
import { InstitutionSummary } from './InstitutionSummary';
import { AccountBalanceChart } from './AccountBalanceChart';
import { RecentAccountMovements } from './RecentAccountMovements';
import { ContaModal } from './ContaModal';
import { DeleteContaDialog } from './DeleteContaDialog';
import s from './contas.module.css';

/**
 * Tela "Contas". Dados vêm do servidor; filtros e gráfico são calculados no cliente.
 * Cadastro, edição e exclusão são Server Actions que revalidam a rota.
 */
export function ContasView({ data, todayKey }) {
  const today = useMemo(() => dayKeyToDate(todayKey), [todayKey]);
  const [tipoFilter, setTipoFilter] = useState('all');
  const [chartRange, setChartRange] = useState('30d');
  const [chartConta, setChartConta] = useState('all');
  const [menuFor, setMenuFor] = useState(null);
  const [modal, setModal] = useState(null); // { conta } | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [ofDisconnectTarget, setOfDisconnectTarget] = useState(null);
  const [ofDisconnectError, setOfDisconnectError] = useState('');
  const [ofBusyContaId, setOfBusyContaId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Se a conta filtrada no gráfico for excluída, volta para "todas" sem precisar de efeito.
  const effectiveChartConta = chartConta === 'all' || data.contas.some((c) => c.id === chartConta && c.ativo) ? chartConta : 'all';

  const model = useMemo(
    () => buildContasModel({ contas: data.contas, transactions: data.transactions, today, tipoFilter, chartRange, chartConta: effectiveChartConta }),
    [data, today, tipoFilter, chartRange, effectiveChartConta],
  );

  const contasAtivas = useMemo(() => model.cards.map((c) => c.conta), [model.cards]);
  const chipContas = useMemo(() => model.cards.map((c) => ({ ...c.conta, saldoAtual: c.saldo })), [model.cards]);

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(tm);
  }, [toast]);

  const openNew = () => setModal({ conta: null });
  const closeModal = useCallback(() => setModal(null), []);
  const closeMenu = useCallback(() => setMenuFor(null), []);

  const onEdit = (item) => {
    setMenuFor(null);
    setModal({ conta: item.conta });
  };
  const onDelete = (item) => {
    setMenuFor(null);
    setDeleteError('');
    setDeleteTarget(item.conta);
  };

  const onSyncOpenFinance = (item) => {
    setMenuFor(null);
    setOfBusyContaId(item.conta.id);
    startTransition(async () => {
      const res = await pluggySyncContaAction(item.conta.id, { mode: 'full' });
      setOfBusyContaId(null);
      if (res?.ok) {
        const n = res.data?.transactionsCreated ?? 0;
        setToast({
          tone: 'success',
          text: n > 0 ? `Extrato atualizado: ${n} movimentação(ões) nova(s).` : 'Extrato atualizado. Nenhuma movimentação nova no banco ainda.',
        });
      } else {
        setToast({ tone: 'error', text: res?.error || 'Não foi possível atualizar o extrato.' });
      }
    });
  };

  const onDisconnectOpenFinance = (item) => {
    setMenuFor(null);
    setOfDisconnectError('');
    setOfDisconnectTarget(item.conta);
  };

  const confirmOfDisconnect = () => {
    const conta = ofDisconnectTarget;
    if (!conta) return;
    startTransition(async () => {
      const res = await pluggyDisconnectContaAction(conta.id);
      if (res?.ok) {
        setOfDisconnectTarget(null);
        setToast({ tone: 'success', text: `Open Finance desconectado de “${conta.nome}”. Você pode conectar de novo quando quiser.` });
      } else {
        setOfDisconnectError(res?.error || 'Não foi possível desconectar.');
      }
    });
  };

  const confirmDelete = () => {
    const conta = deleteTarget;
    if (!conta) return;
    startTransition(async () => {
      const res = await deleteContaAction(conta.id);
      if (res?.ok) {
        setDeleteTarget(null);
        setToast({ tone: 'success', text: `Conta “${conta.nome}” excluída.` });
      } else {
        setDeleteError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const hasAccounts = model.count > 0;

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Início / Minhas contas</p>
          <h1 className={t.title}>Contas</h1>
          <p className={t.subtitle}>Gerencie suas contas bancárias, cartões e acompanhe seus saldos.</p>
        </div>
        <div className={t.headerActions}>
          <Button icon="plus" onClick={openNew}>
            Nova conta
          </Button>
        </div>
      </header>

      {isPending ? <div className={t.pendingBar} role="status" aria-label="Salvando" /> : null}

      <div className={d.layout}>
        <div className={d.mainCol}>
          <div className={s.summary}>
            <AccountSummaryCard
              navy
              label="Saldo nas contas"
              icon="wallet"
              value={formatBrl(model.total)}
              hint="Soma dos saldos cadastrados"
              foot={
                <>
                  {hasAccounts ? <BankChips contas={chipContas} /> : <span className={d.kpiFootText}>Nenhuma conta cadastrada</span>}
                  <a href="#minhas-contas" className={d.kpiFootLink}>
                    Ver contas <Icon name="arrow-right" size={14} />
                  </a>
                </>
              }
            />
            <AccountSummaryCard
              label="Contas cadastradas"
              icon="landmark"
              value={String(model.count)}
              hint={model.count === 1 ? '1 conta ativa' : 'Contas ativas'}
              extra={hasAccounts ? <AccountsMiniBars cards={model.cards} /> : null}
              foot={
                <span className={d.kpiFootText}>
                  {model.tiposPresentes.length > 0 ? model.tiposPresentes.map((tp) => CONTA_TIPO_LABELS[tp] || tp).join(' · ') : 'Cadastre a primeira conta'}
                </span>
              }
            />
          </div>

          <Card id="minhas-contas" aria-labelledby="minhas-contas-title" className={cx(isPending && d.busy)} aria-busy={isPending}>
            <div className={s.sectionHead}>
              <div>
                <h2 className={d.sectionTitle} id="minhas-contas-title">
                  Minhas contas
                </h2>
                <p className={d.sectionSub}>Acompanhe seus saldos e gerencie suas contas e cartões.</p>
              </div>
              {hasAccounts ? (
                <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} aria-label="Filtrar por tipo de conta" style={{ width: 'auto', minWidth: 180 }}>
                  <option value="all">Todas as contas</option>
                  {model.tiposPresentes.map((tp) => (
                    <option key={tp} value={tp}>
                      {CONTA_TIPO_LABELS[tp] || tp}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>

            {!hasAccounts ? (
              <EmptyState
                icon="landmark"
                title="Nenhuma conta ainda"
                text="Cadastre contas e cartões para acompanhar saldos por instituição."
                action={
                  <Button icon="plus" onClick={openNew}>
                    Cadastrar primeira conta
                  </Button>
                }
              />
            ) : model.visibleCards.length === 0 ? (
              <EmptyState
                icon="filter"
                title="Nenhuma conta desse tipo"
                action={
                  <Button variant="outline" onClick={() => setTipoFilter('all')}>
                    Ver todas as contas
                  </Button>
                }
              />
            ) : (
              <div className={s.accountsGrid}>
                {model.visibleCards.map((item) => (
                  <AccountCard
                    key={item.conta.id}
                    item={item}
                    menuOpen={menuFor === item.conta.id}
                    onToggleMenu={() => setMenuFor((cur) => (cur === item.conta.id ? null : item.conta.id))}
                    onCloseMenu={closeMenu}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSyncOpenFinance={onSyncOpenFinance}
                    onDisconnectOpenFinance={onDisconnectOpenFinance}
                    busy={isPending}
                    ofBusy={ofBusyContaId === item.conta.id}
                  />
                ))}
              </div>
            )}
          </Card>

          <AccountBalanceChart
            history={model.history}
            range={chartRange}
            onChangeRange={setChartRange}
            contas={contasAtivas}
            contaFilter={effectiveChartConta}
            onChangeContaFilter={setChartConta}
            hasAccounts={hasAccounts}
          />
        </div>

        <aside className={d.asideCol}>
          <AccountActions
            onNew={openNew}
            onOpenFinanceSynced={() => setToast({ tone: 'success', text: 'Contas do Open Finance atualizadas.' })}
          />
          <InstitutionSummary institutions={model.institutions} total={model.total} />
          <RecentAccountMovements items={model.recent} />
        </aside>
      </div>

      {modal ? <ContaModal key={modal.conta?.id || 'new'} conta={modal.conta} onClose={closeModal} /> : null}

      {deleteTarget ? (
        <DeleteContaDialog conta={deleteTarget} pending={isPending} error={deleteError} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />
      ) : null}

      {ofDisconnectTarget ? (
        <DisconnectOpenFinanceDialog
          conta={ofDisconnectTarget}
          pending={isPending}
          error={ofDisconnectError}
          onConfirm={confirmOfDisconnect}
          onClose={() => setOfDisconnectTarget(null)}
        />
      ) : null}

      {toast ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}
