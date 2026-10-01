'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, IconBubble, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { buildAcessosHref, canSeeEmpresasTab } from '@/lib/acessos/acessos';
import t from '@/components/transactions/transactions.module.css';
import s from './acessos.module.css';
import { useAcessosNav } from './shared';
import { UsersTab } from './UsersTab';
import { InvitesTab } from './InvitesTab';
import { EmpresasTab } from './EmpresasTab';
import { UserFormDialog } from './UserFormDialog';

const KPIS = [
  { key: 'usuarios', label: 'Usuários', icon: 'users', tone: 'primary' },
  { key: 'empresas', label: 'Empresas', icon: 'building', tone: 'neutral' },
  { key: 'ativos', label: 'Ativos', icon: 'user-check', tone: 'success' },
  { key: 'bloqueados', label: 'Bloqueados', icon: 'ban', tone: 'warning' },
  { key: 'administradores', label: 'Administradores', icon: 'shield-check', tone: 'primary' },
];

function KpiCards({ stats }) {
  return (
    <section className={s.kpis} aria-label="Resumo dos acessos">
      {KPIS.map((k) => (
        <article key={k.key} className={s.kpi}>
          <IconBubble name={k.icon} tone={k.tone} size={40} iconSize={18} />
          <div className={s.kpiText}>
            <span className={s.kpiLabel}>{k.label}</span>
            <span className={s.kpiValue}>{typeof stats?.[k.key] === 'number' ? stats[k.key].toLocaleString('pt-BR') : '—'}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function Tabs({ params, counts, role }) {
  const tabs = [
    { id: 'usuarios', label: 'Usuários', count: counts.usuarios },
    { id: 'convites', label: 'Convites', count: counts.convites },
    canSeeEmpresasTab(role) ? { id: 'empresas', label: 'Empresas', count: counts.empresas } : null,
  ].filter(Boolean);

  return (
    <nav className={s.tabs} aria-label="Seções">
      {tabs.map((tab) => {
        const active = params.aba === tab.id;
        return (
          <Link
            key={tab.id}
            href={buildAcessosHref({ aba: tab.id })}
            className={cx(s.tab, active && s.tabActive)}
            aria-current={active ? 'page' : undefined}
            scroll={false}
          >
            {tab.label}
            {typeof tab.count === 'number' ? <span className={s.tabCount}>{tab.count.toLocaleString('pt-BR')}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Tela "Gerenciar acessos". O servidor já resolveu papel, escopo, KPIs e a página atual;
 * aqui ficam só a navegação por URL, os diálogos e o aviso de sucesso/erro.
 */
export function AcessosView({ data }) {
  const { params, role, userId, stats, counts, usersPage, empresasPage, empresas, invites, invitesError, empresaFilterName, meiActiveCount } = data;
  const nav = useAcessosNav(params);
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const tm = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(tm);
  }, [toast]);

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div className={s.headerRow}>
          <Link href="/configuracoes" className={s.back} aria-label="Voltar para Configurações" title="Voltar para Configurações">
            <Icon name="arrow-left" size={18} />
          </Link>
          <div className={s.titleBlock}>
            <p className={t.crumb}>Meu espaço / Configurações / Gerenciar acessos</p>
            <div className={s.titleLine}>
              <h1 className={t.title}>Gerenciar acessos</h1>
              <span className={s.adminTag}>
                <Icon name="shield-check" size={12} />
                Administração
              </span>
            </div>
            <p className={t.subtitle}>Gerencie usuários, convites e empresas da plataforma.</p>
          </div>
        </div>
        <div className={s.headerActions}>
          <Button icon="user-plus" onClick={() => setCreating(true)}>
            Novo usuário
          </Button>
        </div>
      </header>

      <KpiCards stats={stats} />

      <Tabs params={params} counts={counts} role={role} />

      {params.aba === 'usuarios' ? (
        <UsersTab page={usersPage} params={params} role={role} actorUserId={userId} empresas={empresas} empresaFilterName={empresaFilterName} nav={nav} onToast={setToast} />
      ) : null}
      {params.aba === 'convites' ? (
        <InvitesTab invites={invites} invitesError={invitesError} role={role} empresas={empresas} nav={nav} onToast={setToast} />
      ) : null}
      {params.aba === 'empresas' && canSeeEmpresasTab(role) ? (
        <EmpresasTab page={empresasPage} params={params} meiActiveCount={meiActiveCount} nav={nav} onToast={setToast} />
      ) : null}

      {creating ? (
        <UserFormDialog
          actorRole={role}
          actorUserId={userId}
          empresas={empresas}
          onClose={(res) => {
            setCreating(false);
            if (res?.ok) {
              setToast({ tone: 'success', text: res.message });
              nav.refresh();
            }
          }}
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
