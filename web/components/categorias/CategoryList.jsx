'use client';

import { Button, Card, EmptyState } from '@/components/ui';
import d from '@/components/dashboard/dashboard.module.css';
import { CategoryRow } from './CategoryRow';
import s from './categorias.module.css';

/** Card "Categorias de saída / de receita" com a lista de linhas. */
export function CategoryList({ viewTipo, rows, total, counts, search, userId, expandedId, onToggleExpand, menuFor, onToggleMenu, onCloseMenu, onEdit, onDelete, onNew, onClearSearch, busy }) {
  const isSaida = viewTipo === 'saida';
  const title = isSaida ? 'Categorias de saída' : 'Categorias de entrada';
  const desc = isSaida ? 'Veja o total gasto em cada categoria e sua participação no período.' : 'Veja o total recebido em cada categoria e sua participação no período.';
  const countLabel = `${counts.ofTipo} ${counts.ofTipo === 1 ? 'categoria' : 'categorias'}${counts.active > 0 ? ` · ${counts.active} com movimento` : ''}`;

  return (
    <Card aria-labelledby="cat-list-title">
      <div className={s.sectionHead}>
        <div>
          <h2 className={d.sectionTitle} id="cat-list-title">
            {title}
          </h2>
          <p className={d.sectionSub}>{desc}</p>
        </div>
        <span className={s.countLabel}>{countLabel}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="tag"
          title={search.trim() ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria para este tipo'}
          text="Crie categorias personalizadas para organizar seus lançamentos."
          action={
            search.trim() ? (
              <Button variant="outline" onClick={onClearSearch}>
                Limpar busca
              </Button>
            ) : (
              <Button icon="plus" onClick={onNew}>
                Nova categoria
              </Button>
            )
          }
        />
      ) : (
        <div className={s.list} role="list">
          {rows.map((row) => (
            <CategoryRow
              key={row.id}
              row={row}
              total={total}
              expanded={expandedId === row.id}
              onToggle={onToggleExpand}
              canManage={!row.isOrphan && row.user_id === userId}
              menuOpen={menuFor === row.id}
              onToggleMenu={() => onToggleMenu(row.id)}
              onCloseMenu={onCloseMenu}
              onEdit={onEdit}
              onDelete={onDelete}
              busy={busy}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
