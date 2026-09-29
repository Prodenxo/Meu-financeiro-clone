'use client';

import { ArrowLink, Card, CardHeader, EmptyState, IconBubble, Pill } from '@/components/ui';
import { formatSignedBrl } from '@/lib/finance/format';
import { getTransactionStatusLabel, getTransactionStatusTone } from '@/lib/finance/status';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import s from './dashboard.module.css';

function valueClass(tipo) {
  return tipo === 'entrada' ? s.trendUp : undefined;
}

export function RecentTable({ rows, hideValues, legacyAppUrl }) {
  const allHref = legacyAppUrl ? `${legacyAppUrl}/transacoes` : null;
  const money = (row) => (hideValues ? 'R$ ••••' : formatSignedBrl(row.valor, row.tipo));

  return (
    <Card aria-labelledby="recent-title">
      <CardHeader
        title="Últimas movimentações"
        id="recent-title"
        action={
          allHref ? (
            <ArrowLink href={allHref} external title="Transações — abre no app atual">
              Ver todas
            </ArrowLink>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhuma movimentação neste mês" text="Use “Nova transação” para registrar a primeira." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col" className={s.thDesc}>
                  Descrição
                </th>
                <th scope="col" className={s.thDate}>
                  Data
                </th>
                <th scope="col" className={s.thStatus}>
                  Situação
                </th>
                <th scope="col" className={s.thValue}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={s.descCell}>
                      <IconBubble name={getCategoryIconName(row.categoryName)} tone="outline" size={32} iconSize={15} />
                      <div className={s.descText}>
                        <span className={s.descTitle} title={row.title}>
                          {row.title}
                        </span>
                        <span className={s.descMeta}>{row.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
                      </div>
                    </div>
                  </td>
                  <td className={s.dateCell}>{row.dateLabel}</td>
                  <td>
                    <Pill tone={getTransactionStatusTone(row.tipoRaw, row.status)}>
                      {getTransactionStatusLabel(row.tipoRaw, row.status)}
                    </Pill>
                  </td>
                  <td className={`${s.tdValue} ${valueClass(row.tipo) || ''}`}>{money(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className={s.mobileList} aria-label="Últimas movimentações">
            {rows.map((row) => (
              <li key={row.id} className={s.listItem}>
                <IconBubble name={getCategoryIconName(row.categoryName)} tone="outline" size={32} iconSize={15} />
                <div className={s.listText}>
                  <span className={s.listTitle}>{row.title}</span>
                  <span className={s.listMeta}>
                    {row.dateLabel} · {getTransactionStatusLabel(row.tipoRaw, row.status)}
                  </span>
                </div>
                <span className={`${s.listValue} ${valueClass(row.tipo) || ''}`}>{money(row)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
