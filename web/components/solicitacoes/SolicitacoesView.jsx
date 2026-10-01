'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Skeleton, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/acessos/shared';
import a from '@/components/acessos/acessos.module.css';
import t from '@/components/transactions/transactions.module.css';
import { approveAccessRequestAction, rejectAccessRequestAction } from '@/app/(app)/configuracoes/solicitacoes/actions';
import { formatPhoneDisplay } from '@/lib/acessos/acessos';
import {
  HISTORY_LIMIT,
  buildSolicitacoesHref,
  empresaDocLabel,
  empresaName,
  formatDate,
  formatEmpresaDoc,
  requesterName,
} from '@/lib/acessos/solicitacoes';
import { PendingRequests } from './PendingRequests';
import { HistoryList } from './HistoryList';
import c from './solicitacoes.module.css';

function EmptyBlock({ icon = 'shield-check', danger, title, text, action }) {
  return (
    <div className={c.empty} role="status">
      <span className={cx(c.emptyIcon, danger && c.emptyIconDanger)}>
        <Icon name={icon} size={40} strokeWidth={1.6} />
      </span>
      <p className={c.emptyTitle}>{title}</p>
      {text ? <p className={c.emptyText}>{text}</p> : null}
      {action ? <div className={c.emptyAction}>{action}</div> : null}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} height={96} radius={12} />
      ))}
    </div>
  );
}

function RequestSummary({ req }) {
  const emp = req.empresa;
  return (
    <dl className={c.summary}>
      <dt>Solicitante</dt>
      <dd>{req.fullName || 'Sem nome'}</dd>
      {req.email ? (
        <>
          <dt>E-mail</dt>
          <dd>{req.email}</dd>
        </>
      ) : null}
      {req.phone ? (
        <>
          <dt>Telefone</dt>
          <dd>{formatPhoneDisplay(req.phone)}</dd>
        </>
      ) : null}
      <dt>Empresa</dt>
      <dd>{empresaName(emp) || '—'}</dd>
      <dt>{empresaDocLabel(emp.cnpj)}</dt>
      <dd>{formatEmpresaDoc(emp.cnpj)}</dd>
      {req.requestedAt ? (
        <>
          <dt>Solicitado em</dt>
          <dd>{formatDate(req.requestedAt)}</dd>
        </>
      ) : null}
    </dl>
  );
}

/**
 * Tela "Solicitações de acesso". O servidor já conferiu que é superadmin e trouxe os dados;
 * aqui ficam as abas, a atualização (uma por vez) e as decisões com confirmação.
 */
export function SolicitacoesView({ data }) {
  const { params, pending, pendingError, history, historyError } = data;
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [switching, startSwitch] = useTransition();
  const [navTab, setNavTab] = useState(null);
  const [decision, setDecision] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [toast, setToast] = useState(null);

  const tab = switching && navTab ? navTab : params.aba;
  const loadingContent = switching || refreshing;

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(tm);
  }, [toast]);

  const refresh = useCallback(() => {
    if (refreshing || actingId) return;
    startRefresh(() => router.refresh());
  }, [refreshing, actingId, router]);

  const goTab = (e, id) => {
    e.preventDefault();
    if (id === tab) return;
    setNavTab(id);
    startSwitch(() => router.push(buildSolicitacoesHref({ aba: id }), { scroll: false }));
  };

  const confirmDecision = async () => {
    if (!decision || actingId) return;
    const { kind, req } = decision;
    setActingId(req.userId);
    setDialogError(null);
    const res = kind === 'approve' ? await approveAccessRequestAction(req.userId) : await rejectAccessRequestAction(req.userId);
    setActingId(null);
    if (res?.ok) {
      setDecision(null);
      setToast({ tone: 'success', text: res.message });
      return;
    }
    if (res?.stale) {
      setDecision(null);
      setToast({ tone: 'error', text: res.error });
      return;
    }
    setDialogError(res?.error || 'Não foi possível concluir a operação.');
  };

  const openDecision = (kind, req) => {
    if (actingId) return;
    setDialogError(null);
    setDecision({ kind, req });
  };

  const pendingCount = Array.isArray(pending) ? pending.length : null;
  const tabs = [
    { id: 'pendentes', label: 'Pendentes', icon: 'building', count: pendingCount },
    { id: 'historico', label: 'Histórico', icon: 'clock', count: null },
  ];

  const retryButton = (
    <Button variant="outline" icon="refresh-cw" onClick={refresh} disabled={refreshing} aria-busy={refreshing || undefined}>
      {refreshing ? 'Atualizando…' : 'Tentar novamente'}
    </Button>
  );

  let body;
  if (loadingContent && (switching || (tab === 'pendentes' ? !pending : !history))) {
    body = <ListSkeleton />;
  } else if (tab === 'pendentes') {
    if (pendingError) {
      body = <EmptyBlock icon="alert-circle" danger title="Não foi possível carregar as solicitações." text={pendingError} action={retryButton} />;
    } else if (!pending || pending.length === 0) {
      body = (
        <EmptyBlock
          title="Nenhuma solicitação pendente."
          text="Os novos pedidos de acesso aparecerão aqui."
          action={(
            <Button variant="outline" icon="refresh-cw" onClick={refresh} disabled={refreshing} aria-busy={refreshing || undefined}>
              {refreshing ? 'Atualizando…' : 'Atualizar lista'}
            </Button>
          )}
        />
      );
    } else {
      body = (
        <PendingRequests
          requests={pending}
          actingId={actingId}
          busy={refreshing}
          onApprove={(req) => openDecision('approve', req)}
          onReject={(req) => openDecision('reject', req)}
        />
      );
    }
  } else if (historyError) {
    body = <EmptyBlock icon="alert-circle" danger title="Não foi possível carregar o histórico." text={historyError} action={retryButton} />;
  } else if (!history || history.length === 0) {
    body = (
      <EmptyBlock
        icon="clock"
        title="Nenhuma solicitação no histórico."
        text="Pedidos enviados e aprovados aparecem aqui."
        action={(
          <Button variant="outline" icon="refresh-cw" onClick={refresh} disabled={refreshing} aria-busy={refreshing || undefined}>
            {refreshing ? 'Atualizando…' : 'Atualizar lista'}
          </Button>
        )}
      />
    );
  } else {
    body = <HistoryList entries={history} />;
  }

  const footText =
    tab === 'pendentes'
      ? 'Consulte a aba Histórico para ver as solicitações já analisadas.'
      : Array.isArray(history) && history.length >= HISTORY_LIMIT
        ? `Mostrando as ${HISTORY_LIMIT} solicitações mais recentes. Pedidos negados são excluídos e não aparecem aqui.`
        : 'Pedidos negados são excluídos do sistema e não aparecem no histórico.';

  const req = decision?.req;
  const acting = Boolean(req && actingId === req.userId);

  return (
    <div className={a.page}>
      <header className={t.header}>
        <div className={a.headerRow}>
          <Link href="/configuracoes" className={a.back} aria-label="Voltar para Configurações" title="Voltar para Configurações">
            <Icon name="arrow-left" size={18} />
          </Link>
          <div className={a.titleBlock}>
            <p className={t.crumb}>Meu espaço / Configurações / Solicitações de acesso</p>
            <h1 className={t.title}>Solicitações de acesso</h1>
            <p className={t.subtitle}>Analise os pedidos de acesso à plataforma.</p>
          </div>
        </div>
        <div className={a.headerActions}>
          <span className={c.exclusiveTag}>
            <Icon name="shield-check" size={14} />
            Exclusivo do superadmin
          </span>
          <Button variant="outline" icon="refresh-cw" onClick={refresh} disabled={refreshing || Boolean(actingId)} aria-busy={refreshing || undefined}>
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>
      </header>

      <Card className={c.panel}>
        <nav className={c.tabs} aria-label="Seções">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Link
                key={item.id}
                href={buildSolicitacoesHref({ aba: item.id })}
                className={cx(c.tab, active && c.tabActive)}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => goTab(e, item.id)}
                scroll={false}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
                {typeof item.count === 'number' ? (
                  <span className={c.tabCount} aria-label={`${item.count} pendentes`}>
                    {item.count.toLocaleString('pt-BR')}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={c.content} aria-busy={loadingContent || undefined} aria-live="polite">
          {loadingContent ? <div className={c.busyBar} role="progressbar" aria-label="Carregando solicitações" /> : null}
          {body}
        </div>

        <p className={c.panelFoot}>
          <Icon name="clock" size={16} />
          {footText}
        </p>
      </Card>

      <p className={c.pageNote}>
        <Icon name="shield-check" size={16} />
        Apenas o superadmin pode consultar e gerenciar solicitações de acesso.
      </p>

      {decision?.kind === 'approve' ? (
        <ConfirmDialog
          titleId="approve-title"
          title="Aprovar solicitação"
          confirmLabel="Aprovar acesso"
          pendingLabel="Aprovando…"
          tone="success"
          pending={acting}
          error={dialogError}
          onConfirm={confirmDecision}
          onClose={() => setDecision(null)}
        >
          <p style={{ margin: 0 }}>Confira os dados antes de liberar o acesso.</p>
          <RequestSummary req={req} />
          <p style={{ margin: 0 }}>
            Ao aprovar, <strong>{requesterName(req)}</strong> passa a ser <strong>administrador</strong> da empresa{' '}
            <strong>{empresaName(req.empresa) || 'informada'}</strong>, que fica ativa. Se o aviso por WhatsApp estiver ligado, o
            solicitante recebe a confirmação.
          </p>
        </ConfirmDialog>
      ) : null}

      {decision?.kind === 'reject' ? (
        <ConfirmDialog
          titleId="reject-title"
          title="Negar solicitação"
          confirmLabel="Negar e excluir"
          pendingLabel="Negando…"
          tone="danger"
          pending={acting}
          error={dialogError}
          onConfirm={confirmDecision}
          onClose={() => setDecision(null)}
        >
          <RequestSummary req={req} />
          <p style={{ margin: 0 }}>
            Negar e remover o cadastro de <strong>{requesterName(req)}</strong>? O usuário e a empresa serão excluídos do banco. Esta
            ação não pode ser desfeita.
          </p>
        </ConfirmDialog>
      ) : null}

      {toast ? (
        <div className={t.toast}>
          <Alert tone={toast.tone}>{toast.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}
