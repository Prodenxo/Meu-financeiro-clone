'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { deleteMoedaGlobalAction } from '@/app/(app)/conta-global/actions';
import { Alert, Button, Card, EmptyState, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { buildContaGlobalModel } from '@/lib/finance/contaGlobal';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './contaGlobal.module.css';
import { ContaGlobalSummary } from './ContaGlobalSummary';
import { CotacoesCard } from './CotacoesCard';
import { DeleteMoedaDialog } from './DeleteMoedaDialog';
import { InfoCard } from './InfoCard';
import { AddMoedaCard, MoedaCard } from './MoedaCard';
import { MoedaModal } from './MoedaModal';

/**
 * Tela "Conta global". Moedas, cotações e catálogo vêm do servidor; busca e cálculos no cliente.
 * O saldo daqui fica separado da Visão geral (regra do app atual).
 */
export function ContaGlobalView({ data }) {
  const [search, setSearch] = useState('');
  const [hideValues, setHideValues] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [modal, setModal] = useState(null); // { conta } | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  const model = useMemo(() => buildContaGlobalModel({ contas: data.contas, rates: data.rates, search }), [data.contas, data.rates, search]);
  const usedCodes = useMemo(() => model.rows.map((r) => r.moeda), [model.rows]);

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(tm);
  }, [toast]);

  const openNew = () => setModal({ conta: null });
  const closeModal = useCallback(() => setModal(null), []);
  const closeMenu = useCallback(() => setMenuFor(null), []);
  const onSaved = useCallback((res) => {
    setToast({ tone: 'success', text: res.mode === 'edit' ? `${res.moeda} atualizada.` : `${res.moeda} adicionada à Conta global.` });
  }, []);

  const onEdit = (row) => {
    setMenuFor(null);
    setModal({ conta: row.conta });
  };
  const onDelete = (row) => {
    setMenuFor(null);
    setDeleteError('');
    setDeleteTarget(row);
  };
  const confirmDelete = () => {
    const row = deleteTarget;
    if (!row) return;
    startTransition(async () => {
      const res = await deleteMoedaGlobalAction(row.id);
      if (res?.ok) {
        setDeleteTarget(null);
        setToast({ tone: 'success', text: `${row.moeda} removida da Conta global.` });
      } else {
        setDeleteError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const hasMoedas = model.count > 0;
  const searching = search.trim().length > 0;

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Início / Conta global</p>
          <h1 className={t.title}>Conta global</h1>
          <p className={t.subtitle}>Acompanhe seus saldos em moedas estrangeiras.</p>
        </div>
        <div className={t.headerActions}>
          <Button icon="plus" onClick={openNew}>
            Adicionar moeda
          </Button>
        </div>
      </header>

      {isPending ? <div className={t.pendingBar} role="status" aria-label="Salvando" /> : null}

      <ContaGlobalSummary model={model} hideValues={hideValues} onToggleHide={() => setHideValues((v) => !v)} />

      <p className={s.notice} role="note">
        <span className={s.noticeIcon}>
          <Icon name="alert-circle" size={16} />
        </span>
        <span>
          Saldo separado da <Link href="/visao-geral">Visão Geral</Link>. Conversões usam cotações de referência.
        </span>
      </p>

      {data.ratesError && hasMoedas && model.missingRates.length > 0 ? (
        <Alert tone="error">
          {data.ratesError} Os saldos aparecem na moeda original; a conversão em reais volta quando a cotação estiver disponível.
        </Alert>
      ) : null}

      <div className={d.layout}>
        <div className={d.mainCol}>
          <Card aria-labelledby="cg-moedas-title">
            <div className={s.moedasHead}>
              <h2 className={d.sectionTitle} id="cg-moedas-title">
                Suas moedas
              </h2>
              {hasMoedas ? (
                <div className={`${t.searchWrap} ${s.moedasSearch}`}>
                  <span className={t.searchIcon}>
                    <Icon name="search" size={15} />
                  </span>
                  <Input type="search" placeholder="Buscar moeda" aria-label="Buscar moeda por código ou nome" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              ) : null}
            </div>

            {!hasMoedas ? (
              <EmptyState
                icon="globe"
                title="Nenhuma moeda cadastrada"
                text="Registre quanto você tem em dólar, euro e outras moedas — separado do saldo em reais."
                action={
                  <Button icon="plus" onClick={openNew}>
                    Adicionar primeira moeda
                  </Button>
                }
              />
            ) : model.filtered.length === 0 ? (
              <EmptyState
                icon="search"
                title="Nenhuma moeda encontrada"
                text={`Nada corresponde a “${search.trim()}”. Tente o código (ex.: USD) ou o nome da moeda.`}
                action={
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Limpar busca
                  </Button>
                }
              />
            ) : (
              <div className={s.moedasGrid}>
                {model.filtered.map((row) => (
                  <MoedaCard
                    key={row.id}
                    row={row}
                    hideValues={hideValues}
                    menuOpen={menuFor === row.id}
                    onToggleMenu={() => setMenuFor((cur) => (cur === row.id ? null : row.id))}
                    onCloseMenu={closeMenu}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    busy={isPending}
                  />
                ))}
                {!searching ? <AddMoedaCard onClick={openNew} busy={isPending} /> : null}
              </div>
            )}
          </Card>

          <p className={s.footNote}>Valores exibidos para acompanhamento financeiro.</p>
        </div>

        <aside className={d.asideCol}>
          <CotacoesCard cotacoes={model.cotacoes} sources={data.rateSources} />
          <InfoCard />
        </aside>
      </div>

      {modal ? <MoedaModal key={modal.conta?.id || 'new'} conta={modal.conta} catalog={data.catalog} rates={data.rates} usedCodes={usedCodes} onClose={closeModal} onSaved={onSaved} /> : null}

      {deleteTarget ? <DeleteMoedaDialog row={deleteTarget} pending={isPending} error={deleteError} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} /> : null}

      {toast ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}
