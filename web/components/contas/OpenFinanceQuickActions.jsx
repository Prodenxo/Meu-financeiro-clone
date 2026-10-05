'use client';

import { useEffect, useState, useTransition } from 'react';
import { Alert, Button } from '@/components/ui';
import {
  pluggyConnectionsAction,
  pluggyDisconnectAllAction,
  pluggyResyncExtratoAction,
} from '@/app/(app)/contas/openFinanceActions';
import s from './contas.module.css';

/** Sync manual de extrato quando há conexão Pluggy (mesmo se o card não marcar OF). */
export function OpenFinanceQuickActions({ onSynced }) {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const conn = await pluggyConnectionsAction();
      if (!cancelled) setConnected(Boolean(conn?.connected));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const disconnectAll = () => {
    const ok = window.confirm(
      'Desconectar Open Finance? As contas deixam de receber extrato automático. Os lançamentos já importados permanecem. Você pode conectar de novo depois.',
    );
    if (!ok) return;
    setError('');
    setMessage('');
    startTransition(async () => {
      const res = await pluggyDisconnectAllAction();
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível desconectar.');
        return;
      }
      setConnected(false);
      setMessage('Open Finance desconectado. Use "Conectar banco" para autorizar de novo.');
      onSynced?.();
    });
  };

  const refreshExtrato = () => {
    setError('');
    setMessage('');
    startTransition(async () => {
      const res = await pluggyResyncExtratoAction({ mode: 'full' });
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível atualizar o extrato.');
        return;
      }
      const items = res.data?.items ?? (res.data?.itemId ? [res.data] : []);
      const created = items.reduce((n, it) => n + (it?.transactionsCreated ?? 0), 0);
      const skipped = items.reduce((n, it) => n + (it?.transactionsSkipped ?? 0), 0);
      const merged = items.reduce((n, it) => n + (it?.contasMerged ?? 0), 0);
      let text =
        created > 0
          ? `Importamos ${created} lançamento(s) do banco`
          : 'Nenhum lançamento novo no banco nesta sincronização.';
      if (skipped > 0) text += ` (${skipped} já estavam no app).`;
      if (merged > 0) text += ` Unificamos ${merged} conta(s) Open Finance duplicada(s).`;
      if (created > 80) {
        text +=
          ' Se parecer repetido, confira Transações — na 1ª carga pode vir até ~90 dias de extrato.';
      }
      setMessage(text);
      onSynced?.();
    });
  };

  if (!connected) return null;

  return (
    <div className={s.ofQuickActions}>
      <Button variant="outline" icon="refresh-cw" block disabled={isPending} onClick={refreshExtrato}>
        {isPending ? 'Atualizando extrato…' : 'Atualizar extrato Open Finance'}
      </Button>
      <Button variant="ghost" icon="unplug" block disabled={isPending} onClick={disconnectAll}>
        Desconectar Open Finance
      </Button>
      <p className={s.ofQuickHint}>Atualizar extrato puxa movimentações novas (todas as conexões).</p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
    </div>
  );
}
