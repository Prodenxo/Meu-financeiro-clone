import { Icon } from '@/components/ui/Icon';
import s from './tutoriais.module.css';

/** Ilustração padrão do módulo quando o tutorial não tem capa. */
export function ModuleArt({ icon }) {
  return (
    <>
      <span className={s.art}>
        <Icon name={icon} size={22} />
      </span>
      <span className={s.dots} aria-hidden="true">
        <span className={s.dotRow}>
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.dot} />
        </span>
        <span className={s.line} />
        <span className={`${s.line} ${s.lineShort}`} />
      </span>
    </>
  );
}

export function BannerArt() {
  return (
    <svg className={s.bannerArt} viewBox="0 0 220 140" fill="none" aria-hidden="true">
      <ellipse cx="118" cy="78" rx="74" ry="40" fill="currentColor" opacity="0.12" />
      <path
        d="M34 42c18-9 40-8 58 4v62c-18-10-40-11-58-2V42z"
        fill="var(--mf-card)"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M92 46c18-12 46-12 66 0v62c-20-10-48-10-66 2V46z"
        fill="var(--mf-card)"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path d="M92 46v64" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />
      <circle cx="50" cy="66" r="2.5" fill="currentColor" />
      <circle cx="50" cy="80" r="2.5" fill="currentColor" />
      <circle cx="50" cy="94" r="2.5" fill="currentColor" />
      <path d="M58 66h24M58 80h18M58 94h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M110 66h34M110 80h28M110 94h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.72" />
      <path d="M162 88l20 9-8.2 2 5.6 9.4-4.8 2.8-5.8-9.6-7 5.6V88z" fill="currentColor" />
      <path d="M188 58v9M183.5 62.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M198 76l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="currentColor" />
    </svg>
  );
}
