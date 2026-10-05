'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState, useTransition } from 'react';
import { Button, Alert, cx } from '@/components/ui';
import s from './contas.module.css';
import {
  pluggyConnectTokenAction,
  pluggySyncItemAction,
  pluggyStatusAction,
} from '@/app/(app)/contas/openFinanceActions';
import { savePluggyItemId } from '@/lib/openFinance/pluggySession';

const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false },
);

/**
 * Abre o widget Pluggy Connect (Open Finance) e sincroniza contas na API após sucesso.
 */
export function OpenFinanceConnect({ onSynced, block = false, label = 'Conectar banco', icon = 'landmark' }) {
  const [connectToken, setConnectToken] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isPending, startTransition] = useTransition();

  const startConnect = () => {
    setError('');
    setInfo('');
    startTransition(async () => {
      const status = await pluggyStatusAction();
      if (status?.error) {
        setError(status.error);
        return;
      }
      if (!status?.configured) {
        setError(
          'Open Finance não está configurado na API. Coloque PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET em backend/.env e reinicie npm run dev:api.',
        );
        return;
      }
      const res = await pluggyConnectTokenAction();
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível iniciar a conexão.');
        return;
      }
      setConnectToken(res.accessToken);
      setWidgetOpen(true);
    });
  };

  const onSuccess = useCallback(
    (itemData) => {
      const itemId = itemData?.item?.id || itemData?.id;
      setWidgetOpen(false);
      setConnectToken(null);
      if (!itemId) {
        setError('Conexão concluída, mas o identificador do banco não veio. Tente sincronizar de novo.');
        return;
      }
      savePluggyItemId(itemId);
      startTransition(async () => {
        const sync = await pluggySyncItemAction(itemId);
        if (!sync?.ok) {
          setError(sync?.error || 'Falha ao importar contas.');
          return;
        }
        const { created, updated, accountsTotal, transactionsCreated } = sync.data || {};
        const txPart =
          transactionsCreated != null
            ? ` · ${transactionsCreated} movimentação(ões) importada(s).`
            : '';
        setInfo(
          `Open Finance: ${accountsTotal ?? 0} conta(s) — ${created ?? 0} nova(s), ${updated ?? 0} atualizada(s)${txPart}`,
        );
        onSynced?.();
      });
    },
    [onSynced],
  );

  const onClose = useCallback(() => {
    setWidgetOpen(false);
    setConnectToken(null);
  }, []);

  return (
    <div className={cx(block && s.ofConnect)}>
      <Button variant="outline" icon={icon} block={block} onClick={startConnect} disabled={isPending}>
        {isPending ? 'Aguarde…' : label}
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}
      {widgetOpen && connectToken ? (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox
          onSuccess={onSuccess}
          onError={(e) => {
            setWidgetOpen(false);
            setConnectToken(null);
            setError(e?.message || 'Erro ao conectar com o banco.');
          }}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}
