import Link from 'next/link';
import s from './bpo.module.css';

/** Alterna Resumo e Visão BPO dentro do site novo (antes a BPO abria o app antigo). */
export function VistaSwitch({ vista, mes, ano }) {
  return (
    <div className={s.switch} role="tablist" aria-label="Tipo de visão">
      <Link href={`/visao-geral?mes=${mes}`} role="tab" aria-selected={vista === 'resumo'} aria-current={vista === 'resumo' ? 'page' : undefined}>
        Resumo
      </Link>
      <Link href={`/visao-geral?vista=bpo&ano=${ano}`} role="tab" aria-selected={vista === 'bpo'} aria-current={vista === 'bpo' ? 'page' : undefined}>
        Visão BPO
      </Link>
    </div>
  );
}
