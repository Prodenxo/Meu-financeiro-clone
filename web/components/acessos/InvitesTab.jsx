'use client';

import { useState, useTransition } from 'react';
import { createInviteAction, revokeInviteAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Alert, Button, Card, CardHeader, EmptyState, Field, Pill, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { buildInviteUrl, empresaDisplayName, formatPtDate, formatPtDateTime } from '@/lib/acessos/acessos';
import s from './acessos.module.css';
import { ConfirmDialog, CopyLinkBox, RowMenu } from './shared';

function origin() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Aba Convites — porta de `frontend/components/admin/InvitesTab.tsx`: gerar link (admin na
 * própria empresa; superadmin escolhe), copiar, atualizar e revogar os pendentes.
 */
export function InvitesTab({ invites, invitesError, role, empresas, nav, onToast }) {
  const isSuperadmin = role === 'superadmin';
  const [empresaId, setEmpresaId] = useState('');
  const [reusable, setReusable] = useState(false);
  const [created, setCreated] = useState(null); // { url, reusable }
  const [formError, setFormError] = useState('');
  const [revoking, setRevoking] = useState(null);
  const [revokeError, setRevokeError] = useState('');
  const [pending, start] = useTransition();

  const generate = (e) => {
    e.preventDefault();
    setFormError('');
    if (isSuperadmin && !empresaId) {
      setFormError('Escolha a empresa do convite.');
      return;
    }
    start(async () => {
      const res = await createInviteAction({ empresaId: isSuperadmin ? empresaId : undefined, isReusable: reusable });
      if (!res?.ok) {
        setFormError(res?.error || 'Não foi possível gerar o convite.');
        return;
      }
      if (!res.rawToken) {
        setFormError('Convite criado, mas o link não veio do servidor. Atualize a lista.');
        nav.refresh();
        return;
      }
      setCreated({ url: buildInviteUrl(origin(), res.rawToken), reusable });
      onToast({ tone: 'success', text: 'Link de convite gerado.' });
      nav.refresh();
    });
  };

  const confirmRevoke = () => {
    if (!revoking) return;
    setRevokeError('');
    start(async () => {
      const res = await revokeInviteAction(revoking.id);
      if (res?.ok) {
        setRevoking(null);
        onToast({ tone: 'success', text: 'Convite revogado. O link deixou de funcionar.' });
        nav.refresh();
      } else {
        setRevokeError(res?.error || 'Não foi possível revogar.');
      }
    });
  };

  const copyInvite = async (invite) => {
    const url = buildInviteUrl(origin(), invite.raw_token);
    try {
      await navigator.clipboard.writeText(url);
      onToast({ tone: 'success', text: 'Link copiado.' });
    } catch {
      onToast({ tone: 'error', text: 'Não foi possível copiar. Selecione o link manualmente.' });
    }
  };

  const empresaName = (id) => {
    const emp = empresas.find((e) => e.id === id);
    return emp ? empresaDisplayName(emp) : '—';
  };

  const inviteItems = (invite) => [
    invite.raw_token ? { key: 'copy', icon: 'copy', label: 'Copiar link', onSelect: () => copyInvite(invite) } : null,
    { key: 'revoke', icon: 'x', tone: 'danger', label: 'Revogar convite', onSelect: () => setRevoking(invite) },
  ];

  const list = Array.isArray(invites) ? invites : [];

  return (
    <div className={s.inviteGrid}>
      <Card aria-labelledby="inv-new-title">
        <CardHeader title="Gerar link de convite" icon="link" iconTone="primary" id="inv-new-title" />
        <form className={s.inviteForm} onSubmit={generate} noValidate>
          <p className={s.hint}>
            {isSuperadmin
              ? 'Escolha a empresa. Quem abrir o link cria a conta já vinculado a ela.'
              : 'Quem abrir o link cria a conta já vinculado à sua empresa.'}
          </p>
          {isSuperadmin ? (
            <Field label="Empresa" htmlFor="inv-empresa">
              <Select id="inv-empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} required>
                <option value="">Selecione a empresa…</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{empresaDisplayName(emp)}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          <label className={s.switchRow}>
            <span className={s.switchText}>
              <span>Link reutilizável</span>
              <span className={s.switchHint}>Desligado: o link vale para um único cadastro.</span>
            </span>
            <input type="checkbox" checked={reusable} onChange={(e) => setReusable(e.target.checked)} />
          </label>
          {formError ? <Alert tone="error">{formError}</Alert> : null}
          <Button type="submit" icon="link" disabled={pending} aria-busy={pending}>
            {pending ? 'Gerando…' : 'Gerar link'}
          </Button>
          {created ? (
            <>
              <CopyLinkBox url={created.url} />
              <p className={s.hint}>
                {created.reusable ? 'Link reutilizável: pode ser enviado a várias pessoas.' : 'Link de uso único: guarde agora — ele não aparece de novo na lista.'}
              </p>
            </>
          ) : null}
        </form>
      </Card>

      <Card aria-labelledby="inv-list-title">
        <CardHeader
          title="Convites pendentes"
          icon="mail"
          id="inv-list-title"
          action={(
            <Button variant="outline" size="sm" icon="refresh-cw" onClick={nav.refresh} disabled={nav.pending} aria-busy={nav.pending}>
              Atualizar
            </Button>
          )}
        />
        {invitesError ? (
          <Alert tone="error">
            {invitesError}{' '}
            <button type="button" className={s.copyBtn} onClick={nav.refresh} style={{ marginLeft: 8 }}>Tentar novamente</button>
          </Alert>
        ) : list.length === 0 ? (
          <EmptyState icon="mail" title="Nenhum convite pendente" text="Os links gerados e ainda não usados aparecem aqui." />
        ) : (
          <div className={s.tableWrap} aria-busy={nav.pending}>
            {nav.pending ? <div className={s.loadingOverlay} aria-hidden="true" /> : null}
            <table className={cx(s.table, s.tableAuto)}>
              <thead>
                <tr>
                  {isSuperadmin ? <th>Empresa</th> : null}
                  <th className={s.colDate}>Criado em</th>
                  <th className={cx(s.colDate, s.colExpira)}>Expira em</th>
                  <th className={s.colSmall}>Tipo</th>
                  <th className={s.colSmall}>Usos</th>
                  <th className={s.colActions}><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((invite) => (
                  <tr key={invite.id}>
                    {isSuperadmin ? <td className={s.ellipsis}>{empresaName(invite.empresas_id)}</td> : null}
                    <td className={s.colDate}>{formatPtDateTime(invite.created_at)}</td>
                    <td className={cx(s.colDate, s.colExpira)}>{formatPtDate(invite.expires_at)}</td>
                    <td className={s.colSmall}>{invite.is_reusable ? <Pill tone="primary">Reutilizável</Pill> : <Pill tone="neutral">Único</Pill>}</td>
                    <td className={s.colSmall}>{Number(invite.uses_count || 0)}</td>
                    <td className={cx(s.colActions, s.cellActions)}>
                      <div className={s.rowActions}>
                        {invite.raw_token ? (
                          <button type="button" className={s.iconBtn} title="Copiar link" aria-label="Copiar link do convite" onClick={() => copyInvite(invite)}>
                            <Icon name="copy" size={16} />
                          </button>
                        ) : null}
                        <RowMenu label="Mais ações do convite" items={inviteItems(invite)} note={null} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={s.cards}>
              {list.map((invite) => (
                <article key={invite.id} className={s.itemCard}>
                  <div className={s.itemCardTop}>
                    <div className={s.userText}>
                      <span className={s.userName}>{isSuperadmin ? empresaName(invite.empresas_id) : invite.is_reusable ? 'Link reutilizável' : 'Link único'}</span>
                      <span className={s.userEmail}>Criado em {formatPtDateTime(invite.created_at)}</span>
                    </div>
                    <RowMenu label="Mais ações do convite" items={inviteItems(invite)} note={null} />
                  </div>
                  <div className={s.itemMeta}>
                    <div><span className={s.itemMetaLabel}>Expira em</span>{formatPtDate(invite.expires_at)}</div>
                    <div><span className={s.itemMetaLabel}>Usos</span>{Number(invite.uses_count || 0)}</div>
                    <div><span className={s.itemMetaLabel}>Tipo</span>{invite.is_reusable ? 'Reutilizável' : 'Único'}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </Card>

      {revoking ? (
        <ConfirmDialog
          title="Revogar este convite?"
          tone="danger"
          confirmLabel="Revogar"
          pendingLabel="Revogando…"
          pending={pending}
          error={revokeError}
          onClose={() => {
            if (!pending) {
              setRevoking(null);
              setRevokeError('');
            }
          }}
          onConfirm={confirmRevoke}
        >
          O link deixará de funcionar imediatamente. Quem já usou continua com a conta.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
