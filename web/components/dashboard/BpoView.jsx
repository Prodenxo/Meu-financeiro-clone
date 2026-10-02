'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { buildBpoChartSeries, buildBpoMatrixViewModel, bpoYearOptions } from '@/lib/finance/bpo';
import { toMonthParam } from '@/lib/date';
import { VistaSwitch } from './VistaSwitch';
import { BpoCharts } from './BpoCharts';
import { BpoMatrix } from './BpoMatrix';
import d from './dashboard.module.css';
import a from '@/components/acessos/acessos.module.css';
import s from './bpo.module.css';

/**
 * Visão BPO dentro da Visão geral. O ano da URL atualiza gráficos e matriz juntos.
 * A busca de categoria só muda a matriz, como no painel antigo.
 */
export function BpoView({ year, currentYear, currentMonth, categories, cells, error }) {
  const router = useRouter();
  const model = buildBpoMatrixViewModel(categories, cells);
  const series = buildBpoChartSeries(model, year);

  const onYear = (event) => {
    router.push(`/visao-geral?vista=bpo&ano=${event.target.value}`);
  };

  return (
    <>
      <header className={d.header}>
        <div className={a.headerRow}>
          <Link href={`/visao-geral?mes=${toMonthParam(currentMonth)}`} className={a.back} aria-label="Voltar ao resumo" style={{ marginTop: 18 }}>
            <Icon name="arrow-left" size={18} />
          </Link>
          <div>
            <p className={d.crumb}>Meu espaço / Visão geral</p>
            <h1 className={d.title}>Visão geral</h1>
            <p className={d.subtitle}>Acompanhe o planejamento e os resultados do ano.</p>
          </div>
        </div>
        <div className={d.headerActions}>
          <VistaSwitch vista="bpo" mes={toMonthParam(currentMonth)} ano={year} />
          <label>
            <span className="sr-only">Ano</span>
            <select className={s.yearSelect} value={year} onChange={onYear} aria-label="Ano">
              {bpoYearOptions(currentYear).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <BpoCharts series={series} />

      <Card>
        <CardHeader title="Matriz anual" icon="columns" />
        <p className={d.subtitle} style={{ marginTop: -8, marginBottom: 16 }}>
          Compare o orçamento e o realizado por categoria.
        </p>
        <BpoMatrix
          model={model}
          year={year}
          error={error}
          onRetry={() => router.refresh()}
        />
      </Card>
    </>
  );
}
