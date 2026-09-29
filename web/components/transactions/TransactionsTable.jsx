'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, EmptyState, IconBubble, Pill, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatSignedBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import { resolveBankVisual } from '@/lib/finance/bankCatalog';
import { formatDayKeyBr, pageWindow, SORT_OPTIONS } from '@/lib/finance/transactions';
import s from './transactions.module.css';

const OPTIONAL_COLUMNS = [
  { id: 'categoria', label: 'Categoria' },
  { id: 'conta', label: 'Conta' },
  { id: 'status', label: 'Status' },
];

/** Fecha popovers ao clicar fora ou apertar Esc. */
function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

function BankLogo({ conta }) {
  const visual = resolveBankVisual(conta);
  return (
    <span className={s.bankLogo} style={{ background: visual.accent }}>
      {visual.slug ? (
        // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no servidor, sem otimização
        <img src={`/api/bank-icon/${visual.slug}?size=48`} alt="" width={24} height={24} loading="lazy" />
      ) : (
        <span aria-hidden="true">{visual.initials}</span>
      )}
    </span>
  );
}

function StatusPill({ row }) {
  if (row.isProjection) {
    return (
      <Pill tone="primary" icon="repeat">
        Prevista
      </Pill>
    );
  }
  return (
    <Pill tone={row.statusTone} icon={row.isPaid ? 'check' : 'clock'}>
      {row.statusLabel}
    </Pill>
  );
}

function RowMenu({ row, open, onToggle, onClose, onAction, busy }) {
  const ref = useDismiss(open, onClose);
  const run = (action) => {
    onClose();
    onAction(action, row);
  };
  return (
    <div className={s.menuWrap} ref={ref}>
      <button
        type="button"
        className={s.menuBtn}
        aria-label={`Ações de ${row.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        disabled={busy}
      >
        <Icon name="ellipsis" size={18} />
      </button>
      {open ? (
        <div className={s.menu} role="menu">
          {row.isProjection ? (
            <button type="button" role="menuitem" className={s.menuItem} onClick={() => run('materialize')} autoFocus>
              <Icon name="plus" size={16} /> Lançar agora
            </button>
          ) : (
            <>
              <button type="button" role="menuitem" className={s.menuItem} onClick={() => run('edit')} autoFocus>
                <Icon name="pencil" size={16} /> Editar
              </button>
              <button type="button" role="menuitem" className={s.menuItem} onClick={() => run('duplicate')}>
                <Icon name="copy" size={16} /> Duplicar
              </button>
              {!row.isPaid ? (
                <button type="button" role="menuitem" className={s.menuItem} onClick={() => run('markPaid')}>
                  <Icon name="circle-check" size={16} /> Marcar como {row.tipo === 'entrada' ? 'recebido' : 'pago'}
                </button>
              ) : null}
              <button type="button" role="menuitem" className={cx(s.menuItem, s.menuDanger)} onClick={() => run('delete')}>
                <Icon name="trash" size={16} /> Excluir
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ColumnsMenu({ visible, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div className={s.menuWrap} ref={ref}>
      <button
        type="button"
        className={s.toolBtn}
        aria-label="Escolher colunas"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="columns" size={16} />
      </button>
      {open ? (
        <div className={s.menu}>
          <span className={s.menuTitle}>Colunas</span>
          {OPTIONAL_COLUMNS.map((col) => (
            <label key={col.id} className={s.menuCheck}>
              <input type="checkbox" className={s.check} checked={visible[col.id]} onChange={() => onToggle(col.id)} />
              {col.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={s.pagination} aria-label="Paginação">
      <button type="button" className={s.pageBtn} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
        <Icon name="chevron-left" size={16} />
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className={s.pageGap} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={cx(s.pageBtn, p === page && s.pageActive)}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Página ${p}`}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={s.pageBtn} onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Próxima página">
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}

export function TransactionsTable({
  rows,
  total,
  page,
  totalPages,
  onPage,
  sort,
  onSort,
  selected,
  onSelect,
  onSelectPage,
  onClearSelection,
  onAction,
  onBulk,
  busy,
  filtered,
  onClearFilters,
  onNew,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [visible, setVisible] = useState({ categoria: true, conta: true, status: true });

  const selectableIds = rows.filter((r) => !r.isProjection).map((r) => r.id);
  const selectedOnPage = selectableIds.filter((id) => selected.has(id));
  const allOnPage = selectableIds.length > 0 && selectedOnPage.length === selectableIds.length;
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const canMarkSelected = selectedRows.some((r) => !r.isPaid);

  const money = (row) => formatSignedBrl(row.valor, row.tipo);
  const valueClass = (row) => (row.tipo === 'entrada' ? s.positive : s.negative);
  const toggleDateSort = () => onSort(sort === 'recentes' ? 'antigas' : 'recentes');

  // Tabela e lista mobile renderizam menus separados; a chave inclui a origem.
  const menuFor = (row, where) => {
    const key = `${where}:${row.id}`;
    return (
      <RowMenu
        row={row}
        open={openMenu === key}
        onToggle={() => setOpenMenu((cur) => (cur === key ? null : key))}
        onClose={() => setOpenMenu((cur) => (cur === key ? null : cur))}
        onAction={onAction}
        busy={busy}
      />
    );
  };

  return (
    <Card aria-labelledby="tx-count">
      <div className={s.tableHead}>
        <p className={s.count} id="tx-count" aria-live="polite">
          {total} {total === 1 ? 'movimentação encontrada' : 'movimentações encontradas'}
        </p>
        <div className={s.tableTools}>
          <Select className={s.sortSelect} value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Ordenar por">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <ColumnsMenu visible={visible} onToggle={(id) => setVisible((v) => ({ ...v, [id]: !v[id] }))} />
        </div>
      </div>

      {selected.size > 0 ? (
        <div className={s.bulkBar} role="region" aria-label="Ações em lote">
          <span>
            {selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}
          </span>
          {canMarkSelected ? (
            <Button size="sm" variant="outline" icon="circle-check" onClick={() => onBulk('markPaid')} disabled={busy}>
              Marcar como pago
            </Button>
          ) : null}
          <Button size="sm" variant="outline" icon="trash" onClick={() => onBulk('delete')} disabled={busy}>
            Excluir
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearSelection} disabled={busy}>
            Limpar seleção
          </Button>
        </div>
      ) : null}

      {total === 0 ? (
        filtered ? (
          <EmptyState
            icon="search"
            title="Nenhuma movimentação com esses filtros"
            text="Tente outro período ou limpe os filtros para ver tudo."
            action={
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Nenhuma movimentação neste período"
            text="Registre a primeira entrada ou saída para acompanhar seu dinheiro."
            action={
              <Button size="sm" icon="plus" onClick={onNew}>
                Nova transação
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col" className={s.colCheck}>
                    <input
                      type="checkbox"
                      className={s.check}
                      checked={allOnPage}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedOnPage.length > 0 && !allOnPage;
                      }}
                      onChange={() => onSelectPage(selectableIds, !allOnPage)}
                      disabled={selectableIds.length === 0}
                      aria-label="Selecionar todas desta página"
                    />
                  </th>
                  <th scope="col" className={s.colDate} aria-sort={sort === 'recentes' ? 'descending' : sort === 'antigas' ? 'ascending' : 'none'}>
                    <button type="button" className={s.sortHeader} onClick={toggleDateSort}>
                      Data <Icon name="arrow-up-down" size={12} />
                    </button>
                  </th>
                  <th scope="col">Descrição</th>
                  {visible.categoria ? (
                    <th scope="col" className={s.colCategory}>
                      Categoria
                    </th>
                  ) : null}
                  {visible.conta ? (
                    <th scope="col" className={s.colConta}>
                      Conta
                    </th>
                  ) : null}
                  {visible.status ? (
                    <th scope="col" className={s.colStatus}>
                      Status
                    </th>
                  ) : null}
                  <th scope="col" className={s.colValue}>
                    Valor
                  </th>
                  <th scope="col" className={s.colMenu}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={cx(selected.has(row.id) && s.rowSelected, row.isProjection && s.rowProjected)}>
                    <td>
                      {row.isProjection ? null : (
                        <input
                          type="checkbox"
                          className={s.check}
                          checked={selected.has(row.id)}
                          onChange={() => onSelect(row.id)}
                          aria-label={`Selecionar ${row.title}`}
                        />
                      )}
                    </td>
                    <td className={s.dateCell}>{formatDayKeyBr(row.dateKey)}</td>
                    <td>
                      <div className={s.descCell}>
                        <IconBubble
                          name={getCategoryIconName(row.categoryName)}
                          tone={row.tipo === 'entrada' ? 'success' : 'danger'}
                          size={34}
                          iconSize={16}
                          style={row.isProjection ? { opacity: 0.6 } : undefined}
                        />
                        <div className={s.descText}>
                          <span className={s.descTitle} title={row.title}>
                            {row.title}
                          </span>
                          <span className={s.descMeta} title={row.subtitle}>
                            {row.isRecurring ? <Icon name="repeat" size={11} /> : null}
                            {row.subtitle}
                          </span>
                        </div>
                      </div>
                    </td>
                    {visible.categoria ? (
                      <td className={s.colCategory}>
                        <Pill tone={row.tipo === 'entrada' ? 'success' : 'neutral'} className={s.cellEllipsis}>
                          {row.categoryName}
                        </Pill>
                      </td>
                    ) : null}
                    {visible.conta ? (
                      <td className={s.colConta}>
                        {row.conta ? (
                          <span className={s.contaCell} title={row.conta.nome}>
                            <BankLogo conta={row.conta} />
                            <span>{row.conta.nome}</span>
                          </span>
                        ) : (
                          <span className={s.muted}>Sem conta</span>
                        )}
                      </td>
                    ) : null}
                    {visible.status ? (
                      <td className={s.colStatus}>
                        <StatusPill row={row} />
                      </td>
                    ) : null}
                    <td className={cx(s.tdValue, valueClass(row))}>{money(row)}</td>
                    <td>{menuFor(row, 'table')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className={s.mobileList} aria-label="Movimentações">
              {rows.map((row) => (
                <li key={row.id} className={s.mobileItem}>
                  <IconBubble name={getCategoryIconName(row.categoryName)} tone={row.tipo === 'entrada' ? 'success' : 'danger'} size={36} iconSize={16} />
                  <div className={s.mobileText}>
                    <span className={s.descTitle}>{row.title}</span>
                    <span className={s.mobileMeta}>
                      {formatDayKeyBr(row.dateKey)}
                      {row.conta ? ` · ${row.conta.nome}` : ''}
                    </span>
                    <span className={s.mobileMeta}>
                      <StatusPill row={row} />
                    </span>
                  </div>
                  <div className={s.mobileRight}>
                    <span className={cx(s.tdValue, valueClass(row))}>{money(row)}</span>
                    {menuFor(row, 'list')}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <footer className={s.tableFoot}>
            <span>
              Mostrando {rows.length} de {total} {total === 1 ? 'movimentação' : 'movimentações'}
            </span>
            <Pagination page={page} totalPages={totalPages} onPage={onPage} />
          </footer>
        </>
      )}
    </Card>
  );
}