import Link from 'next/link';
import { Alert, Card, Pill } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import t from '@/components/transactions/transactions.module.css';
import { VideoFrame } from './VideoFrame';
import s from './tutoriais.module.css';

function StepImage({ src, alt }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.stepImg} src={src} alt={alt} />
  );
}

export function TutorialDetail({ tutorial, canManage, unavailable = false }) {
  if (unavailable || !tutorial) {
    return (
      <div className={s.page}>
        <Link className={s.back} href="/tutoriais">
          <Icon name="chevron-left" size={16} />
          Voltar para a central
        </Link>
        <Card>
          <Alert tone="info">A central de tutoriais ainda não está disponível neste ambiente.</Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <Link className={s.back} href="/tutoriais">
        <Icon name="chevron-left" size={16} />
        Voltar para a central
      </Link>

      <article className={s.detailCard}>
        <div className={s.meta}>
          <span>{tutorial.moduloLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{tutorial.tipoLabel}</span>
          {!tutorial.publicado ? <Pill tone="warning">Rascunho</Pill> : null}
        </div>
        <h1 className={t.title}>{tutorial.titulo}</h1>
        {tutorial.descricao ? <p className={t.subtitle}>{tutorial.descricao}</p> : null}

        {canManage ? (
          <div className={s.headerActions}>
            <Link className={s.linkBtnGhost} href={`/tutoriais/gerenciar/${tutorial.id}`}>Editar</Link>
          </div>
        ) : null}

        {tutorial.tipo === 'video' && tutorial.video ? (
          <VideoFrame source={tutorial.video} title={tutorial.titulo} />
        ) : null}

        {tutorial.tipo === 'passo-a-passo' && tutorial.etapas.length > 0 ? (
          <ol className={s.steps}>
            {tutorial.etapas.map((step, index) => (
              <li key={`${step.titulo}-${index}`} className={s.step}>
                <span className={s.stepNum}>{index + 1}</span>
                <div>
                  {step.titulo ? <h2 className={s.cardTitle}>{step.titulo}</h2> : null}
                  {step.texto ? <p className={s.cardText}>{step.texto}</p> : null}
                  {step.imagemUrl ? <StepImage src={step.imagemUrl} alt={step.titulo || `Imagem da etapa ${index + 1}`} /> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </article>
    </div>
  );
}
