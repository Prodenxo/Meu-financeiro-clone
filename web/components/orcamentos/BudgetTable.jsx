'use client';

import { Card, EmptyState, Select, cx } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { BUDGET_SORTS } from '@/lib/finance/orcamentos';
import d from '@/components/dashboard/dashboard.module.css';
import t from '@/components/transactions/transactions.module.css';
import { BudgetRowMenu, CategoryIcon } from './BudgetCategoryCard';
import { BudgetStatusPill } from './BudgetProgress';
import s from './orcamentos.module.css';

/** Tabela "Todos os orçamentos" — mesmas classes de tabela das Transações. */
export function BudgetTable({ items, sort, onSort, menuFor, onToggleMenu, onCloseMenu, onEdit, onDelete, busy }) {
  return (
    <Card id="todos-orcamentos" aria-labelledby="budget-table-title">
      <div className={t.tableHead}>
        <div>
          <h2 className={d.sectionTitle} id="budget-table-title">
            Todos os orçamentos
          </h2>
          <p className={d.sectionSub}>
            {items.length} {items.length === 1 ? 'categoria' : 'categorias'} com orçamento neste mês
          </p>
        </div>
        <div className={t.tableTools}>
          <Select value={sort} onChange={(e) => onSort(e.target.value)} aria-label="Ordenar orçamentos" style={{ width: 'auto', minWidth: 160 }}>
            {BUDGET_SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="target" title="Nenhum orçamento para mostrar" />
      ) : (
        <div className={t.tableWrap}>
          {/* Celular: lista compacta (a tabela fica escondida abaixo de 768px, como nas Transações). */}
          <ul className={t.mobileList}>
            {items.map((item) => {
              const over = item.status.key === 'over';
              return (
                <li key={item.categorias_id} className={t.mobileItem}>
                  <CategoryIcon item={item} className={s.tableCatIcon} size={14} />
                  <div className={t.mobileText}>
                    <span className={t.cellEllipsis} title={item.nome}>
                      {item.nome}
                    </span>
                    <span className={t.mobileMeta}>
                      Limite {formatBrl(item.orcado)} · <BudgetStatusPill item={item} />
                    </span>
                  </div>
                  <div className={t.mobileRight}>
                    <span className={cx(s.tdStrong, over && t.negative)}>{formatBrl(item.realizado)}</span>
                    <span className={cx(s.metricLabel, item.disponivel < 0 ? t.negative : t.positive)}>
                      {item.disponivel < 0 ? '- ' : ''}
                      {formatBrl(Math.abs(item.disponivel))}
                    </span>
                  </div>
                  <BudgetRowMenu
                    item={item}
                    open={menuFor === `mobile:${item.categorias_id}`}
                    onToggle={() => onToggleMenu(`mobile:${item.categorias_id}`)}
                    onClose={onCloseMenu}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    busy={busy}
                  />
                </li>
              );
            })}
          </ul>
          <table className={t.table}>
            <thead>
              <tr>
                <th className={s.colCategory}>Categoria</th>
                <th className={s.colMoney}>Limite</th>
                <th className={s.colMoney}>Realizado</th>
                <th className={cx(s.colMoney, s.colMoneyHide)}>Disponível</th>
                <th className={s.colStatus}>Status</th>
                <th className={s.colActions}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const over = item.status.key === 'over';
                return (
                  <tr key={item.categorias_id}>
                    <td>
                      <div className={s.tableCategory}>
                        <CategoryIcon item={item} className={s.tableCatIcon} size={14} />
                        <span className={t.cellEllipsis} title={item.nome}>
                          {item.nome}
                        </span>
                      </div>
                    </td>
                    <td className={s.tdRight}>{formatBrl(item.orcado)}</td>
                    <td className={cx(s.tdRight, s.tdStrong, over && t.negative)}>{formatBrl(item.realizado)}</td>
                    <td className={cx(s.tdRight, s.tdStrong, s.colMoneyHide, item.disponivel < 0 ? t.negative : t.positive)}>
                      {item.disponivel < 0 ? '- ' : ''}
                      {formatBrl(Math.abs(item.disponivel))}
                    </td>
                    <td className={s.colStatus}>
                      <BudgetStatusPill item={item} />
                    </td>
                    <td className={s.colActions}>
                      <BudgetRowMenu
                        item={item}
                        open={menuFor === `table:${item.categorias_id}`}
                        onToggle={() => onToggleMenu(`table:${item.categorias_id}`)}
                        onClose={onCloseMenu}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        busy={busy}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
