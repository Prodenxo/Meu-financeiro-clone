import s from './tutoriais.module.css';

/** Player só para fonte já validada (YouTube, Vimeo ou arquivo https). */
export function VideoFrame({ source, title }) {
  if (!source?.src) return null;
  if (source.kind === 'file') {
    return <video className={s.video} controls preload="metadata" src={source.src} />;
  }
  return (
    <iframe
      className={s.video}
      src={source.src}
      title={title || 'Vídeo do tutorial'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
