'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ModuleArt } from './ModuleArt';
import s from './tutoriais.module.css';

/** O card usa `key={capaUrl}`, então cada URL monta uma instância nova (estado volta a "loading"). */
function CoverImage({ src }) {
  const [status, setStatus] = useState('loading');

  // Imagem vinda do cache já chega "completa" sem disparar onLoad/onError.
  const attach = useCallback((img) => {
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'ok' : 'error');
  }, []);

  if (status === 'error') return null;

  return (
    // Capa https informada pelo super admin, fora do domínio do Next/Image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={attach}
      className={status === 'ok' ? s.coverImg : s.coverImgPending}
      src={src}
      alt=""
      onLoad={() => setStatus('ok')}
      onError={() => setStatus('error')}
    />
  );
}

export function TutorialCard({ tutorial }) {

  return (
    <Link
      href={`/tutoriais/${tutorial.id}`}
      className={s.card}
      aria-label={`${tutorial.actionLabel}: ${tutorial.titulo}`}
    >
      <div className={s.cover}>
        <ModuleArt icon={tutorial.moduloIcon} />
        {tutorial.capaUrl ? <CoverImage key={tutorial.capaUrl} src={tutorial.capaUrl} /> : null}
        {tutorial.tipo === 'video' ? (
          <span className={s.play} aria-hidden="true">
            <Icon name="play" size={14} />
          </span>
        ) : null}
      </div>
      <div className={s.meta}>
        <span>{tutorial.moduloLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{tutorial.tipo === 'video' ? 'Vídeo' : 'Passo a passo'}</span>
      </div>
      <h3 className={s.cardTitle}>{tutorial.titulo}</h3>
      <p className={s.cardText}>{tutorial.descricao}</p>
      <span className={s.cardAction}>
        {tutorial.actionLabel}
        {tutorial.tipo === 'video' ? ' ›' : ' ›'}
      </span>
    </Link>
  );
}
