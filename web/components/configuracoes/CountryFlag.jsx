'use client';

import { useState } from 'react';
import { getCountryFlagUrls } from '@/lib/phone/phone';
import s from './configuracoes.module.css';

/** Bandeira redonda do país (SVG → PNG → sigla). */
export function CountryFlag({ iso, label, size = 20 }) {
  const urls = getCountryFlagUrls(iso);
  const [failed, setFailed] = useState({});
  const idx = failed[iso] || 0;
  const src = urls[idx];

  return (
    <span className={s.flag} style={{ width: size, height: size }} role="img" aria-label={label || iso}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN externa de bandeiras, igual ao app atual
        <img key={src} src={src} alt="" width={size} height={size} loading="lazy" onError={() => setFailed((p) => ({ ...p, [iso]: idx + 1 }))} />
      ) : (
        <span className={s.flagFallback} aria-hidden="true">
          {String(iso || '').toUpperCase()}
        </span>
      )}
    </span>
  );
}
