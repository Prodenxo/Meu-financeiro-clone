'use client';

import { useState, useTransition } from 'react';
import { deleteUserAction, impersonateAction, setUserBlockedAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Button, Card, EmptyState, Pill, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import {
  PERFIL_FILTERS,
  STATUS_FILTERS,
  formatPhoneDisplay,
  formatPtDate,
  getManagedUserActions,
  isUserActive,
  roleLabel,
} from '@/lib/acessos/acessos';
import s from './acessos.module.css';
import { ConfirmDialog, RowMenu, SearchField, TableFooter, UserAvatar } from './shared';
import { UserFormDialog } from './UserFormDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';

const STATUS_LABEL = { todos: 'Todos os status', ativos: 'Ativos', bloqueados: 'Bloqueados' };
const PERFIL_LABEL = { todos: 'Todos os perfis', superadmin: 'Super admin', admin: 'Admin', usuario: 'Usuário', outsider: 'Convidado' };

function StatusPill({ user }) {
  if (isUserActive(user)) return <Pill tone="success">Ativo</Pill>;
  return <Pill tone="warning">Bloqueado</Pill>;
}

function MeiPill({ user }) {
  if (user.mei === true) return <Pill tone="primary">Habilitado</Pill>;
  return <Pill tone="neutral">Desativado</Pill>;
}

function RolePill({ user }) {
  const tone = user.role === 'superadmin' || user.role === 'admin' ? 'primary' : 'neutral';
  return <Pill tone={tone}>{roleLabel(user.role)}</Pill>;
}

function UserIdentity({ user, isSelf }) {
  return (
    <div className={s.userCell}>
      <UserAvatar user={user} />
      <div className={s.userText}>
        <span className={s.userName}>
          {user.displayName || user.email}
          {isSelf ? <span className={s.youTag}>(você)</span> : null}
        </span>
        <span className={s.userEmail}>{user.displayName ? user.email : formatPhoneDisplay(user.phone) || '—'}</span>
      </div>
    </div>
  );
}

/**
 * Aba Usuários. A lista já vem filtrada/ordenada/paginada do servidor; aqui só exibimos e
 * disparamos ações (todas validadas de novo na API). Ação direta: Editar; o resto no menu.
 */
export function UsersTab({ page, params, role, actorUserId, empresas, empresaFilterName, nav, onToast }) {
  const [dialog, setDialog] = useState(null); // { type, user }
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [lastPasswords, setLastPasswords] = useState({});

  const closeDialog = () => {
    setDialog(null);
    setError('');
  };

  const runAndRefresh = (fn, successText) => {
    setError('');
    start(async () => {
      const res = await fn();
      if (res?.ok) {
        closeDialog();
        onToast({ tone: 'success', text: successText });
        nav.refresh();
      } else {
        setError(res?.error || 'Não foi possível concluir a operação.');
      }
    });
  };

  const openUsersOfEmpresa = (user) => nav.navigate({ aba: 'usuarios', empresa: user.empresaId, q: '', status: 'todos', perfil: 'todos' });

  const rowActions = (user) => {
    const a = getManagedUserActions(role, user, actorUserId);
    const name = user.displayName || user.email;
    const items = [];
    if (a.canViewCompanyMembers) items.push({ key: 'team', icon: 'users', label: 'Ver equipe da empresa', title: `Listar usuários de ${user.empresaName || 'sua empresa'}`, onSelect: () => openUsersOfEmpresa(user) });
    if (a.canImpersonate) items.push({ key: 'imp', icon: 'log-in', label: 'Acessar como este usuário', title: 'Ver o app com os dados e permissões dele', onSelect: () => setDialog({ type: 'impersonate', user }) });
    if (a.canResetPassword) items.push({ key: 'pwd', icon: 'key', label: 'Redefinir senha', onSelect: () => setDialog({ type: 'reset', user }) });
    if (a.canBan) {
      items.push('sep');
      if (isUserActive(user)) items.push({ key: 'ban', icon: 'ban', tone: 'warning', label: 'Bloquear usuário', onSelect: () => setDialog({ type: 'ban', user }) });
      else items.push({ key: 'unban', icon: 'lock-open', tone: 'success', label: 'Liberar acesso', onSelect: () => setDialog({ type: 'unban', user }) });
    }
    if (a.canDelete) items.push({ key: 'del', icon: 'trash', tone: 'danger', label: 'Excluir usuário', onSelect: () => setDialog({ type: 'delete', user }) });
    return { actions: a, items, name };
  };

  const renderActions = (user) => {
    const { actions, items, name } = rowActions(user);
    const nothing = !actions.canEdit && items.length === 0 && !lastPasswords[user.id];
    if (nothing) return <span className={cx(s.muted, s.small)}>—</span>;
    return (
      <div className={s.rowActions}>
        {lastPasswords[user.id] ? (
          <button
            type="button"
            className={s.copyBtn}
            title="Copiar a última senha gerada nesta sessão"
            aria-label={`Copiar última senha gerada de ${name}`}
            onClick={() => navigator.clipboard?.writeText(lastPasswords[user.id]).then(() => onToast({ tone: 'success', text: 'Senha copiada.' }))}
          >
            <Icon name="copy" size={13} />
            Senha
          </button>
        ) : null}
        {actions.canEdit ? (
          <button type="button" className={s.iconBtn} title="Editar dados" aria-label={`Editar dados de ${name}`} onClick={() => setDialog({ type: 'edit', user })}>
            <Icon name="pencil" size={17} />
          </button>
        ) : null}
        <RowMenu label={`Mais ações para ${name}`} items={items} />
      </div>
    );
  };

  const emptyTitle = page.hasFilters ? 'Nenhum usuário encontrado' : 'Nenhum usuário por aqui';
  const emptyText = page.hasFilters ? 'Ajuste a busca ou os filtros para ver outros resultados.' : 'Quando houver usuários no seu escopo, eles aparecem nesta lista.';

  return (
    <Card aria-label="Usuários">
      <div className={s.toolbar}>
        <SearchField value={params.q} onChange={(q) => nav.navigate({ q })} placeholder="Buscar por nome, e-mail, telefone, empresa ou perfil" ariaLabel="Buscar usuários" />
        <Select className={s.filterSelect} value={params.status} onChange={(e) => nav.navigate({ status: e.target.value })} aria-label="Filtrar por status">
          {STATUS_FILTERS.map((v) => (
            <option key={v} value={v}>{STATUS_LABEL[v]}</option>
          ))}
        </Select>
        <Select className={s.filterSelect} value={params.perfil} onChange={(e) => nav.navigate({ perfil: e.target.value })} aria-label="Filtrar por perfil">
          {PERFIL_FILTERS.filter((v) => role === 'superadmin' || (v !== 'superadmin' && v !== 'outsider')).map((v) => (
            <option key={v} value={v}>{PERFIL_LABEL[v]}</option>
          ))}
        </Select>
        <Select className={s.filterSelect} value={params.ordem} onChange={(e) => nav.navigate({ ordem: e.target.value })} aria-label="Ordenar">
          <option value="asc">Nome A–Z</option>
          <option value="desc">Nome Z–A</option>
        </Select>
        {params.empresa ? (
          <span className={s.chip}>
            <Icon name="building" size={13} />
            <span>Empresa: {empresaFilterName || 'selecionada'}</span>
            <button type="button" className={s.chipClear} aria-label="Remover filtro de empresa" onClick={() => nav.navigate({ empresa: '' })}>
              <Icon name="x" size={12} />
            </button>
          </span>
        ) : null}
        {page.hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => nav.navigate({ q: '', status: 'todos', perfil: 'todos', empresa: '' })}>
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <div className={s.tableWrap} aria-busy={nav.pending}>
        {nav.pending ? <div className={s.loadingOverlay} aria-hidden="true" /> : null}

        {page.items.length === 0 ? (
          <EmptyState icon="users" title={emptyTitle} text={emptyText} />
        ) : (
          <>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.colUser}>Usuário</th>
                  <th className={s.colEmpresa}>Empresa</th>
                  <th className={s.colPerfil}>Perfil</th>
                  <th className={s.colStatus}>Status</th>
                  <th className={s.colMei}>MEI</th>
                  <th className={s.colActions}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((user) => {
                  const isSelf = user.id === actorUserId;
                  return (
                    <tr key={user.id}>
                      <td className={s.colUser}><UserIdentity user={user} isSelf={isSelf} /></td>
                      <td className={cx(s.colEmpresa, s.ellipsis)} title={user.empresaName || undefined}>
                        {user.empresaName || <span className={s.muted}>Sem empresa</span>}
                      </td>
                      <td className={s.colPerfil}><RolePill user={user} /></td>
                      <td className={s.colStatus}>
                        <div className={s.pillStack}>
                          <StatusPill user={user} />
                          {user.expiresAt && user.role === 'usuario' ? <Pill tone="neutral" icon="clock">até {formatPtDate(user.expiresAt)}</Pill> : null}
                        </div>
                      </td>
                      <td className={s.colMei}><MeiPill user={user} /></td>
                      <td className={cx(s.colActions, s.cellActions)}>{renderActions(user)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={s.cards}>
              {page.items.map((user) => {
                const isSelf = user.id === actorUserId;
                return (
                  <article key={user.id} className={s.itemCard} aria-label={user.displayName || user.email}>
                    <div className={s.itemCardTop}>
                      <UserIdentity user={user} isSelf={isSelf} />
                      {renderActions(user)}
                    </div>
                    <div className={s.itemMeta}>
                      <div>
                        <span className={s.itemMetaLabel}>Empresa</span>
                        {user.empresaName || <span className={s.muted}>Sem empresa</span>}
                      </div>
                      <div>
                        <span className={s.itemMetaLabel}>Perfil</span>
                        <RolePill user={user} />
                      </div>
                      <div>
                        <span className={s.itemMetaLabel}>Status</span>
                        <StatusPill user={user} />
                      </div>
                      <div>
                        <span className={s.itemMetaLabel}>MEI</span>
                        <MeiPill user={user} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <TableFooter page={page} singular="usuário" plural="usuários" params={params} onNavigate={nav.navigate} />

      {dialog?.type === 'edit' ? (
        <UserFormDialog
          user={dialog.user}
          actorRole={role}
          actorUserId={actorUserId}
          empresas={empresas}
          onClose={(res) => {
            closeDialog();
            if (res?.ok) {
              onToast({ tone: 'success', text: res.message });
              nav.refresh();
            }
          }}
        />
      ) : null}

      {dialog?.type === 'reset' ? (
        <ResetPasswordDialog
          user={dialog.user}
          onClose={(res) => {
            const u = dialog.user;
            closeDialog();
            if (res?.ok) {
              setLastPasswords((prev) => ({ ...prev, [u.id]: res.password }));
              onToast({ tone: 'success', text: `Senha de ${u.displayName || u.email} redefinida.` });
            }
          }}
        />
      ) : null}

      {dialog?.type === 'ban' ? (
        <ConfirmDialog
          title="Bloquear usuário?"
          tone="warning"
          confirmLabel="Bloquear"
          pendingLabel="Bloqueando…"
          pending={pending}
          error={error}
          onClose={closeDialog}
          onConfirm={() => runAndRefresh(() => setUserBlockedAction(dialog.user.id, true), `${dialog.user.displayName || dialog.user.email} foi bloqueado.`)}
        >
          <strong>{dialog.user.displayName || dialog.user.email}</strong> perde o acesso ao app até ser liberado de novo. Os dados dele continuam guardados.
        </ConfirmDialog>
      ) : null}

      {dialog?.type === 'unban' ? (
        <ConfirmDialog
          title="Liberar acesso?"
          tone="success"
          confirmLabel="Liberar"
          pendingLabel="Liberando…"
          pending={pending}
          error={error}
          onClose={closeDialog}
          onConfirm={() => runAndRefresh(() => setUserBlockedAction(dialog.user.id, false), `${dialog.user.displayName || dialog.user.email} voltou a ter acesso.`)}
        >
          <strong>{dialog.user.displayName || dialog.user.email}</strong> volta a entrar no app normalmente.
        </ConfirmDialog>
      ) : null}

      {dialog?.type === 'delete' ? (
        <ConfirmDialog
          title="Excluir usuário?"
          tone="danger"
          confirmLabel="Excluir"
          pendingLabel="Excluindo…"
          pending={pending}
          error={error}
          onClose={closeDialog}
          onConfirm={() => runAndRefresh(() => deleteUserAction(dialog.user.id), `${dialog.user.displayName || dialog.user.email} foi excluído.`)}
        >
          Isso remove a conta de <strong>{dialog.user.displayName || dialog.user.email}</strong> e todos os dados dele. Não dá para desfazer.
        </ConfirmDialog>
      ) : null}

      {dialog?.type === 'impersonate' ? (
        <ConfirmDialog
          title="Acessar como este usuário?"
          tone="primary"
          confirmLabel="Acessar"
          pendingLabel="Entrando…"
          pending={pending}
          error={error}
          onClose={closeDialog}
          onConfirm={() => {
            setError('');
            start(async () => {
              const res = await impersonateAction(dialog.user.id, dialog.user.displayName || dialog.user.email);
              // Em caso de sucesso a action redireciona; só chegamos aqui com erro.
              if (res && !res.ok) setError(res.error || 'Não foi possível entrar como este usuário.');
            });
          }}
        >
          Você verá o app com os dados e permissões de <strong>{dialog.user.displayName || dialog.user.email}</strong>. Use o aviso no topo para voltar à sua conta de administrador.
        </ConfirmDialog>
      ) : null}
    </Card>
  );
}
