'use client';

import { useState } from 'react';
import { Button, EmptyState, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import {
  BPO_COLUMNS,
  BPO_COLUMN_LABELS,
  bpoMonthHeaderLabel,
  buildBpoTable,
  formatBpoMetricValue,
  toggleBpoColumn,
} from '@/lib/finance/bpo';
import s from './bpo.module.css';

function Cells({ months, annual, columns, tone }) {
  const blocks = [...months, annual];
  return blocks.map((metrics, block) =>
    columns.map((col, i) => {
      const text = formatBpoMetricValue(col, metrics);
      const negative = col === 'variacao' && metrics.variacao !== null && metrics.variacao < 0;
      return (
        <td key={`${block}-${col}`} className={`${s.num} ${i === 0 ? s.monthStart : ''} ${negative ? s.neg : ''} ${tone || ''}`}>
          {text}
        </td>
      );
    }),
  );
}

function Group({ label, open, onToggle, tone, rows, subtotal, annual, columns, condensed }) {
  const showRows = open && !condensed;
  return (
    <>
      <tr>
        <th scope="row" className={`${s.cat} ${tone}`}>
          <button type="button" className={s.groupBtn} aria-expanded={open} onClick={onToggle}>
            <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
            {label}
          </button>
        </th>
        <td className={tone} colSpan={columns.length * 13} />
      </tr>
      {showRows
        ? rows.map((row) => (
            <tr key={row.categoriasId}>
              <th scope="row" className={s.cat}>
                {row.nome}
              </th>
              <Cells months={row.byMonth} annual={row.annual} columns={columns} />
            </tr>
          ))
        : null}
      {showRows ? (
        <tr>
          <th scope="row" className={`${s.cat} ${tone} ${s.subtotal}`}>
            {label.startsWith('(+)') ? 'Subtotal receitas' : 'Subtotal despesas'}
          </th>
          <Cells months={subtotal} annual={annual} columns={columns} tone={`${tone} ${s.subtotal}`} />
        </tr>
      ) : null}
    </>
  );
}

export function BpoMatrix({ model, year, error, onRetry }) {
  const [categoryId, setCategoryId] = useState('');
  const [columns, setColumns] = useState(BPO_COLUMNS);
  const [condensed, setCondensed] = useState(false);
  const [openReceitas, setOpenReceitas] = useState(true);
  const [openDespesas, setOpenDespesas] = useState(true);

  if (error) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Não foi possível carregar a matriz"
        text={error}
        action={
          <Button variant="outline" icon="refresh-cw" onClick={onRetry}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const table = buildBpoTable(model, categoryId);
  const hasCategories = model.receitas.length > 0 || model.despesas.length > 0;

  return (
    <>
      <div className={s.toolbar}>
        <Select
          className={s.search}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Filtrar por categoria"
          disabled={!hasCategories}
        >
          <option value="">Todas as categorias</option>
          {model.receitas.length > 0 ? (
            <optgroup label="Receitas">
              {model.receitas.map((row) => (
                <option key={row.categoriasId} value={row.categoriasId}>
                  {row.nome}
                </option>
              ))}
            </optgroup>
          ) : null}
          {model.despesas.length > 0 ? (
            <optgroup label="Despesas">
              {model.despesas.map((row) => (
                <option key={row.categoriasId} value={row.categoriasId}>
                  {row.nome}
                </option>
              ))}
            </optgroup>
          ) : null}
        </Select>
        <div className={s.toggles} role="group" aria-label="Colunas visíveis">
          {BPO_COLUMNS.map((col) => (
            <button
              key={col}
              type="button"
              className={s.toggle}
              aria-pressed={columns.includes(col)}
              onClick={() => setColumns((current) => toggleBpoColumn(current, col))}
            >
              {BPO_COLUMN_LABELS[col]}
            </button>
          ))}
          <button type="button" className={s.condensar} aria-pressed={condensed} onClick={() => setCondensed((v) => !v)}>
            {condensed ? 'Expandir' : 'Condensar'}
          </button>
        </div>
      </div>

      {table.isEmpty ? (
        <EmptyState
          icon="columns"
          title={categoryId ? 'Categoria sem dados neste ano.' : `Sem dados para ${year}.`}
          text={
            categoryId
              ? 'Escolha outra categoria ou volte para "Todas as categorias".'
              : 'Defina orçamentos ou registre movimentos neste ano. O realizado continua aparecendo mesmo sem orçamento.'
          }
        />
      ) : (
        <div className={s.scroll}>
          <table className={s.table}>
            <caption className="sr-only">
              Matriz anual de {year}: orçado, realizado e variação por categoria e mês
            </caption>
            <thead>
              <tr>
                <th className={s.cat} rowSpan={2} scope="col">
                  Categoria
                </th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className={s.monthStart} colSpan={columns.length} scope="colgroup">
                    {bpoMonthHeaderLabel(i, year)}
                  </th>
                ))}
                <th className={s.monthStart} colSpan={columns.length} scope="colgroup">
                  Total
                </th>
              </tr>
              <tr className={s.subHead}>
                {Array.from({ length: 13 }, (_, block) =>
                  columns.map((col) => (
                    <th key={`${block}-${col}`} scope="col" className={s.num}>
                      {BPO_COLUMN_LABELS[col]}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              <Group
                label="(+) Receitas"
                open={openReceitas}
                onToggle={() => setOpenReceitas((v) => !v)}
                tone={s.receita}
                rows={table.receitas}
                subtotal={table.receitaSubtotal}
                annual={table.receitaAnual}
                columns={columns}
                condensed={condensed}
              />
              <Group
                label="(−) Despesas"
                open={openDespesas}
                onToggle={() => setOpenDespesas((v) => !v)}
                tone={s.despesa}
                rows={table.despesas}
                subtotal={table.despesaSubtotal}
                annual={table.despesaAnual}
                columns={columns}
                condensed={condensed}
              />
              <tr>
                <th scope="row" className={`${s.cat} ${s.resultado}`}>
                  (=) Resultado
                </th>
                <Cells months={table.resultado} annual={table.resultadoAnual} columns={columns} tone={s.resultado} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className={s.foot}>
        <span>— Sem orçamento definido</span>
        <span>R$ 0,00 Valor realizado zero</span>
      </p>
    </>
  );
}
