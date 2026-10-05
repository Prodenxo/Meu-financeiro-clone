'use client';

import { useEffect, useState } from 'react';

/**
 * Logo do banco: Pluggy (URL) → SVG local (/api/bank-icon) → iniciais.
 */
export function BankLogoImage({ logoUrl, slug, initials, size = 40, className, imgClassName }) {
  const iconSize = size >= 40 ? 96 : 48;
  const localSrc = slug ? `/api/bank-icon/${slug}?size=${iconSize}` : null;

  const [mode, setMode] = useState(() => {
    if (logoUrl) return 'remote';
    if (localSrc) return 'local';
    return 'initials';
  });

  useEffect(() => {
    if (logoUrl) setMode('remote');
    else if (localSrc) setMode('local');
    else setMode('initials');
  }, [logoUrl, localSrc]);

  const onImgError = () => {
    if (mode === 'remote' && localSrc) setMode('local');
    else setMode('initials');
  };

  if (mode === 'remote' && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo externa Pluggy/CDN
      <img
        className={imgClassName}
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={onImgError}
      />
    );
  }

  if (mode === 'local' && localSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no servidor
      <img
        className={imgClassName}
        src={localSrc}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={onImgError}
      />
    );
  }

  return (
    <span className={className} aria-hidden="true">
      {initials}
    </span>
  );
}
