'use client';

import { Card, CardHeader } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatCotacaoBrl } from '@/lib/finance/moedas';
import d from '@/components/dashboard/dashboard.module.css';
import s from './contaGlobal.module.css';
import { MoedaFlag } from './MoedaFlag';

function formatIsoDay(iso) {
  if (!iso) return null;
  const [y, m, day] = String(iso).split('-');
  return y && m && day ? `${day}/${m}/${y}` : null;
}

/**
 * Cotações de referência: as mesmas taxas usadas nos cards. Origem/data só aparecem quando a
 * fonte devolveu essa informação.
 */
export function CotacoesCard({ cotacoes, sources }) {
  const sourceLines = (sources || [])
    .filter((src) => src?.name)
    .map((src) => {
      const date = formatIsoDay(src.date);
      return `${src.name}${date ? ` · ${date}` : ''}`;
    });

  return (
    <Card aria-labelledby="cg-cotacoes-title">
      <CardHeader title="Cotações de referência" icon="arrow-left-right" iconTone="primary" id="cg-cotacoes-title" />
      <p className={d.sectionSub}>Valores aproximados.</p>

      {cotacoes.length === 0 ? (
        <p className={s.pickerEmpty}>Cadastre uma moeda para ver a cotação.</p>
      ) : (
        <div className={d.list} role="list">
          {cotacoes.map((c) => (
            <div key={c.moeda} className={s.rateRow} role="listitem">
              <MoedaFlag moeda={c.moeda} size={24} label={c.nomeMoeda} />
              <span className={s.rateCode}>
                <span className={s.rateCodeText}>{c.moeda}</span>
                <span className={s.rateName}>{c.nomeMoeda}</span>
              </span>
              {c.rate != null ? <span className={s.rateValue}>{formatCotacaoBrl(c.rate)}</span> : <span className={s.rateMissing}>Indisponível</span>}
            </div>
          ))}
        </div>
      )}

      <p className={s.rateNote}>
        <Icon name="circle-help" size={14} />
        A conversão pode variar conforme a cotação aplicada.
      </p>
      {sourceLines.length > 0 ? <p className={s.rateSource}>Fonte: {sourceLines.join(' · ')}</p> : null}
    </Card>
  );
}
