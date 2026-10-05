'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatBrl } from '@/lib/finance/format';
import {
  pluggyConnectionsAction,
  pluggyRefreshBalancesAction,
  pluggyResyncExtratoAction,
} from '@/app/(app)/contas/openFinanceActions';
import { readPluggyItemId } from '@/lib/openFinance/pluggySession';
import s from './openFinance.module.css';

/** Segundos — ajuste em web/.env.local (NEXT_PUBLIC_OF_*). */
function pollMsFromEnv(key, fallbackSec) {
  const raw = Number(process.env[key]);
  return (Number.isFinite(raw) && raw > 0 ? raw : fallbackSec) * 1000;
}

/** Saldo: GET contas na Pluggy, sem pedir update no banco (leve). */
const POLL_BALANCE_MS = pollMsFromEnv('NEXT_PUBLIC_OF_POLL_BALANCE_SEC', 300);
/** Extrato completo: menos frequente; em prod o webhook costuma bastar. */
const POLL_FULL_MS = pollMsFromEnv('NEXT_PUBLIC_OF_POLL_FULL_SEC', 900);
const POLL_FULL_EVERY = Math.max(1, Math.round(POLL_FULL_MS / POLL_BALANCE_MS));

function describeLancamento(row) {
  const tipo = String(row?.tipo || '');
  const valor = Number(row?.valor);
  const obs = String(row?.obs || '').trim();
  const prefix = tipo === 'entrada' ? 'Entrada' : 'Saída';
  const valorTxt = Number.isFinite(valor) ? formatBrl(valor) : '';
  return obs ? `${prefix}: ${valorTxt} — ${obs}` : `${prefix}: ${valorTxt}`;
}

/**
 * Extrato/saldo automático vêm do **servidor** (webhook Pluggy + cron `/api/cron/open-finance-sync`).
 * Aqui só: toast Realtime quando chega lançamento + poll opcional para **atualizar a tela** com aba aberta.
 */
export function OpenFinanceAutoSync({ userId }) {
  const router = useRouter();
  const [alert, setAlert] = useState(null);
  const connectedRef = useRef(false);
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);

  const pushAlert = useCallback((row) => {
    setAlert({
      id: String(row?.id || Date.now()),
      text: describeLancamento(row),
      contaId: row?.conta_id ? String(row.conta_id) : null,
    });
  }, []);

  useEffect(() => {
    if (!alert) return undefined;
    const tm = setTimeout(() => setAlert(null), 8000);
    return () => clearTimeout(tm);
  }, [alert]);

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;

    (async () => {
      const conn = await pluggyConnectionsAction();
      if (cancelled) return;
      connectedRef.current = Boolean(conn?.connected);
    })();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`of-lanc-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lancamentos_id',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          if (row?.of_provider !== 'pluggy') return;
          pushAlert(row);
          router.refresh();
        },
      )
      .subscribe();

    const runPoll = async () => {
      const storedItemId = readPluggyItemId();
      if (!connectedRef.current) {
        const conn = await pluggyConnectionsAction();
        connectedRef.current = Boolean(conn?.connected) || Boolean(storedItemId);
        if (!connectedRef.current) return;
      }
      if (document.visibilityState !== 'visible') return;

      pollCountRef.current += 1;
      const fullSync = pollCountRef.current % POLL_FULL_EVERY === 0;
      const res = fullSync
        ? await pluggyResyncExtratoAction(storedItemId ? { itemId: storedItemId } : {})
        : await pluggyRefreshBalancesAction(storedItemId);

      if (!res?.ok) return;

      router.refresh();
    };

    pollingRef.current = setInterval(runPoll, POLL_BALANCE_MS);
    runPoll();

    return () => {
      cancelled = true;
      clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, pushAlert, router]);

  if (!alert) return null;

  const href = alert.contaId
    ? `/transacoes?conta=${encodeURIComponent(alert.contaId)}`
    : '/transacoes';

  return (
    <div className={s.toastWrap} role="status">
      <div className={s.toast}>
        <p className={s.toastTitle}>Nova movimentação do banco</p>
        <p className={s.toastText}>{alert.text}</p>
        <Link href={href} className={s.toastLink} onClick={() => setAlert(null)}>
          Ver transações
        </Link>
      </div>
    </div>
  );
}
