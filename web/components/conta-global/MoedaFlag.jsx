'use client';

import { useState } from 'react';
import { cx } from '@/components/ui';
import { getMoedaCountryIso, getMoedaFlagUrls } from '@/lib/finance/moedas';
import s from './contaGlobal.module.css';

/**
 * Bandeira circular da moeda (mesmas fontes do app atual: circle-flags SVG → flagcdn PNG).
 * Sem país ou sem imagem, mostra as duas letras do país/moeda.
 */
export function MoedaFlag({ moeda, size = 36, label, className }) {
  const urls = getMoedaFlagUrls(moeda);
  // Índice da fonte que falhou, guardado por moeda (sem efeito para "resetar" ao trocar de moeda).
  const [failed, setFailed] = useState({});
  const idx = failed[moeda] || 0;
  const setIdx = (fn) => setFailed((prev) => ({ ...prev, [moeda]: fn(prev[moeda] || 0) }));

  const src = urls[idx];
  const alt = label || moeda;
  const fallbackCode = (getMoedaCountryIso(moeda) || String(moeda || '')).slice(0, 2).toUpperCase();

  return (
    <span className={cx(s.flag, className)} style={{ width: size, height: size }} role="img" aria-label={alt}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN externa de bandeiras, igual ao app atual
        <img key={src} src={src} alt="" width={size} height={size} loading="lazy" onError={() => setIdx((i) => i + 1)} />
      ) : (
        <span className={s.flagFallback} style={{ fontSize: Math.max(9, size * 0.3) }} aria-hidden="true">
          {fallbackCode}
        </span>
      )}
    </span>
  );
}
