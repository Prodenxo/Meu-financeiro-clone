'use client';

import { Card, CardHeader, EmptyState } from '@/components/ui';
import { formatBrl } from '@/lib/finance/format';
import { formatShare } from '@/lib/finance/contasPage';
import { bankInitials } from '@/lib/finance/bankCatalog';
import { BankLogoImage } from './BankLogoImage';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contas.module.css';

function InstLogo({ item }) {
  return (
    <span className={s.instLogo} style={{ background: item.cor }}>
      <BankLogoImage
        logoUrl={item.logoUrl}
        slug={item.slug}
        initials={bankInitials(item.nome)}
        size={28}
      />
    </span>
  );
}

/** Distribuição do saldo por instituição — mesmo padrão de barras da Visão geral. */
export function InstitutionSummary({ institutions, total }) {
  return (
    <Card aria-labelledby="inst-title">
      <CardHeader title="Resumo por instituição" id="inst-title" />
      {institutions.length === 0 ? (
        <EmptyState icon="landmark" title="Sem contas cadastradas" text="Cadastre uma conta para ver a distribuição do saldo." />
      ) : (
        <>
          <div className={d.list} role="list">
            {institutions.map((item) => (
              <div key={item.key} className={d.catRow} role="listitem">
                <InstLogo item={item} />
                <span className={d.catName} title={item.nome}>
                  {item.nome}
                  {item.count ? ` (${item.count})` : ''}
                </span>
                <div className={d.catBar} aria-hidden="true">
                  <div className={d.catBarFill} style={{ width: `${Math.max(0, Math.min(100, item.share))}%` }} />
                </div>
                <span className={s.instShare} title={formatBrl(item.saldo)}>
                  {formatShare(item.share)}
                </span>
              </div>
            ))}
          </div>
          <p className={s.instMeta}>
            Total nas contas: <strong>{formatBrl(total)}</strong> · fatia calculada sobre os saldos positivos
          </p>
        </>
      )}
    </Card>
  );
}
