'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, Pill } from '@/components/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import s from './dashboard.module.css';

/**
 * Chama a Edge Function `manage-access-requests` com JWT explícito
 * (mesmo contrato de `frontend/lib/manage-access-requests.ts`).
 */
async function invokeManageAccessRequests(body) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente.');

  const { data, error } = await supabase.functions.invoke('manage-access-requests', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    let msg = 'Não foi possível concluir a operação. Tente novamente.';
    try {
      const json = await error.context?.json?.();
      if (json?.error) msg = json.error;
    } catch {
      /* mantém mensagem padrão */
    }
    throw new Error(msg);
  }
  return data || {};
}

/** Só superadmin, e só aparece quando há solicitações pendentes (paridade com o Expo). */
export function AccessRequestsCard() {
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);

  useEffect(() => {
    let cancelled = false;
    invokeManageAccessRequests({ action: 'list' })
      .then((data) => {
        if (!cancelled) setRequests(Array.isArray(data.requests) ? data.requests : []);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const act = async (action, req) => {
    setActingId(req.userId);
    setError(null);
    try {
      await invokeManageAccessRequests({ action, userId: req.userId });
      setRequests((prev) => prev.filter((r) => r.userId !== req.userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
      setConfirmReject(null);
    }
  };

  if (!loaded || requests.length === 0) return null;

  return (
    <Card aria-labelledby="access-title">
      <CardHeader title="Solicitações de acesso" id="access-title" icon="users" iconTone="primary" action={<Pill tone="primary">{requests.length}</Pill>} />
      {error ? (
        <p className={s.budgetMeta} role="alert" style={{ color: 'var(--mf-danger)' }}>
          {error}
        </p>
      ) : null}
      <ul className={s.list}>
        {requests.map((req) => {
          const acting = actingId === req.userId;
          const confirming = confirmReject === req.userId;
          return (
            <li key={req.userId} className={s.listItem}>
              <div className={s.listText}>
                <span className={s.listTitle} title={req.fullName || req.email || ''}>
                  {req.fullName || req.email || 'Sem nome'}
                </span>
                <span className={s.listMeta}>{req.empresa?.nome || 'Empresa não informada'}</span>
              </div>
              {confirming ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setConfirmReject(null)} disabled={acting}>
                    Voltar
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => act('reject', req)} disabled={acting} style={{ background: 'var(--mf-danger)' }}>
                    Negar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" icon="user-x" aria-label={`Negar ${req.fullName || req.email || ''}`} onClick={() => setConfirmReject(req.userId)} disabled={acting} />
                  <Button size="sm" variant="primary" icon="user-check" aria-label={`Aprovar ${req.fullName || req.email || ''}`} onClick={() => act('approve', req)} disabled={acting} />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
