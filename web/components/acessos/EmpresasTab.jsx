'use client';

import { useState, useTransition } from 'react';
import { deleteEmpresaAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Button, Card, EmptyState, Pill, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { MEI_FILTERS, describeEmpresaLimits, empresaDisplayName, isEmpresaMeiActive } from '@/lib/acessos/acessos';
import s from './acessos.module.css';
import { ConfirmDialog, RowMenu, SearchField, TableFooter } from './shared';
import { EmpresaFormDialog } from './EmpresaFormDialog';

const MEI_LABEL = { todos: 'Todas as empresas', ativos: 'MEI ativo', inativos: 'MEI inativo' };

function LimitPills({ empresa }) {
  const [mei, clientes] = describeEmpresaLimits(empresa);
  return (
    <div className={s.pillStack}>
      <Pill tone={isEmpresaMeiActive(empresa) ? 'primary' : 'neutral'}>{mei}</Pill>
      <Pill tone="neutral">{clientes}</Pill>
    </div>
  );
}

/**
 * Aba Empresas (só superadmin) — porta do bloco de empresas do app atual: busca, filtro MEI,
 * cadastro/edição completa, ver usuários da empresa e exclusão com confirmação.
 */
export function EmpresasTab({ page, params, meiActiveCount, nav, onToast }) {
  const [dialog, setDialog] = useState(null); // { type: 'form' | 'delete', empresa? }
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const closeDialog = () => {
    setDialog(null);
    setError('');
  };

  const confirmDelete = () => {
    const emp = dialog?.empresa;
    if (!emp) return;
    setError('');
    start(async () => {
      const res = await deleteEmpresaAction(emp.id);
      if (res?.ok) {
        closeDialog();
        onToast({ tone: 'success', text: `Empresa “${empresaDisplayName(emp)}” excluída.` });
        nav.refresh();
      } else {
        setError(res?.error || 'Não foi possível excluir.');
      }
    });
  };

  const items = (emp) => [
    { key: 'users', icon: 'users', label: 'Ver usuários da empresa', onSelect: () => nav.navigate({ aba: 'usuarios', empresa: emp.id, q: '', status: 'todos', perfil: 'todos' }) },
    'sep',
    { key: 'del', icon: 'trash', tone: 'danger', label: 'Excluir empresa', onSelect: () => setDialog({ type: 'delete', empresa: emp }) },
  ];

  const renderActions = (emp) => (
    <div className={s.rowActions}>
      <button type="button" className={s.iconBtn} title="Editar empresa" aria-label={`Editar ${empresaDisplayName(emp)}`} onClick={() => setDialog({ type: 'form', empresa: emp })}>
        <Icon name="pencil" size={17} />
      </button>
      <RowMenu label={`Mais ações para ${empresaDisplayName(emp)}`} items={items(emp)} note="A cobrança MEI (Stripe) continua no app atual." />
    </div>
  );

  return (
    <Card aria-label="Empresas">
      <div className={s.toolbar}>
        <SearchField value={params.q} onChange={(q) => nav.navigate({ q })} placeholder="Buscar empresa por nome ou razão social" ariaLabel="Buscar empresas" />
        <Select className={s.filterSelect} value={params.mei} onChange={(e) => nav.navigate({ mei: e.target.value })} aria-label="Filtrar por MEI">
          {MEI_FILTERS.map((v) => (
            <option key={v} value={v}>{MEI_LABEL[v]}</option>
          ))}
        </Select>
        <Select className={s.filterSelect} value={params.ordem} onChange={(e) => nav.navigate({ ordem: e.target.value })} aria-label="Ordenar">
          <option value="asc">Nome A–Z</option>
          <option value="desc">Nome Z–A</option>
        </Select>
        {typeof meiActiveCount === 'number' ? <Pill tone="primary">MEI ativo: {meiActiveCount}</Pill> : null}
        <span className={s.toolbarSpacer} />
        <Button icon="plus" onClick={() => setDialog({ type: 'form', empresa: null })}>
          Nova empresa
        </Button>
      </div>

      <div className={s.tableWrap} aria-busy={nav.pending}>
        {nav.pending ? <div className={s.loadingOverlay} aria-hidden="true" /> : null}
        {page.items.length === 0 ? (
          <EmptyState
            icon="building"
            title={page.hasFilters ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            text={page.hasFilters ? 'Ajuste a busca ou o filtro.' : 'Cadastre a primeira empresa para vincular usuários.'}
          />
        ) : (
          <>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th className={s.colLimites}>Limites</th>
                  <th className={s.colActions}><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className={s.userText}>
                        <span className={s.userName}>{empresaDisplayName(emp)}</span>
                        {emp.nome_fantasia && emp.empresa && emp.empresa !== emp.nome_fantasia ? <span className={s.userEmail}>{emp.empresa}</span> : null}
                      </div>
                    </td>
                    <td className={s.colLimites}><LimitPills empresa={emp} /></td>
                    <td className={cx(s.colActions, s.cellActions)}>{renderActions(emp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={s.cards}>
              {page.items.map((emp) => (
                <article key={emp.id} className={s.itemCard}>
                  <div className={s.itemCardTop}>
                    <div className={s.userText}>
                      <span className={s.userName}>{empresaDisplayName(emp)}</span>
                      {emp.empresa && emp.empresa !== emp.nome_fantasia ? <span className={s.userEmail}>{emp.empresa}</span> : null}
                    </div>
                    {renderActions(emp)}
                  </div>
                  <LimitPills empresa={emp} />
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <TableFooter page={page} singular="empresa" plural="empresas" params={params} onNavigate={nav.navigate} />

      {dialog?.type === 'form' ? (
        <EmpresaFormDialog
          empresaId={dialog.empresa?.id || null}
          onClose={(res) => {
            closeDialog();
            if (res?.ok) {
              onToast({ tone: 'success', text: res.message });
              nav.refresh();
            }
          }}
        />
      ) : null}

      {dialog?.type === 'delete' ? (
        <ConfirmDialog
          title="Excluir empresa?"
          tone="danger"
          confirmLabel="Excluir"
          pendingLabel="Excluindo…"
          pending={pending}
          error={error}
          onClose={closeDialog}
          onConfirm={confirmDelete}
        >
          Excluir <strong>{empresaDisplayName(dialog.empresa)}</strong> remove também os vínculos de todos os usuários dela. Não dá para desfazer.
        </ConfirmDialog>
      ) : null}
    </Card>
  );
}
