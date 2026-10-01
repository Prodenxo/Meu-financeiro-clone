'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTutorialAction } from '@/app/(app)/tutoriais/actions';
import { Alert, Button, Field, Input, Select } from '@/components/ui';
import { TUTORIAL_MODULES, TUTORIAL_TYPES } from '@/lib/tutoriais/tutoriais';
import t from '@/components/transactions/transactions.module.css';
import s from './tutoriais.module.css';

const emptyStep = () => ({ titulo: '', texto: '', imagemUrl: '' });

export function TutorialForm({ tutorial }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveTutorialAction, null);
  const [tipo, setTipo] = useState(tutorial?.tipo || 'passo-a-passo');
  const [status, setStatus] = useState(tutorial?.publicado ? 'publicado' : 'rascunho');
  const [steps, setSteps] = useState(tutorial?.etapas?.length ? tutorial.etapas : [emptyStep()]);
  const errors = state?.ok === false ? state.errors || {} : {};

  useEffect(() => {
    if (state?.ok && state.id) router.push('/tutoriais/gerenciar?aviso=salvo');
  }, [state, router]);

  const updateStep = (index, patch) => {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  return (
    <form className={s.form} action={action}>
      {tutorial?.id ? <input type="hidden" name="id" value={tutorial.id} /> : null}
      <input type="hidden" name="etapas" value={JSON.stringify(steps)} />

      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

      <Field label="Título" htmlFor="titulo" error={errors.titulo}>
        <Input id="titulo" name="titulo" defaultValue={tutorial?.titulo || ''} required minLength={3} maxLength={120} invalid={Boolean(errors.titulo)} />
      </Field>

      <Field label="Descrição curta" htmlFor="descricao" error={errors.descricao}>
        <Input id="descricao" name="descricao" defaultValue={tutorial?.descricao || ''} maxLength={280} invalid={Boolean(errors.descricao)} />
      </Field>

      <div className={s.row2}>
        <Field label="Módulo" htmlFor="modulo" error={errors.modulo}>
          <Select id="modulo" name="modulo" defaultValue={tutorial?.modulo || 'visao-geral'}>
            {TUTORIAL_MODULES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo}>
          <Select id="tipo" name="tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {TUTORIAL_TYPES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Capa (opcional)" htmlFor="capa_url" error={errors.capaUrl}>
        <Input id="capa_url" name="capa_url" type="url" inputMode="url" placeholder="https://" defaultValue={tutorial?.capaUrl || ''} invalid={Boolean(errors.capaUrl)} />
      </Field>

      {tipo === 'video' ? (
        <Field label="URL do vídeo" htmlFor="video_url" error={errors.videoUrl}>
          <Input id="video_url" name="video_url" type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=..." defaultValue={tutorial?.videoUrl || ''} invalid={Boolean(errors.videoUrl)} />
        </Field>
      ) : (
        <fieldset className={s.stepEditor}>
          <legend className={s.sectionTitle}>Etapas</legend>
          {errors.etapas ? <Alert tone="error">{errors.etapas}</Alert> : null}
          {steps.map((step, index) => (
            <div key={index} className={s.form}>
              <Field label={`Título da etapa ${index + 1}`} htmlFor={`etapa-titulo-${index}`}>
                <Input id={`etapa-titulo-${index}`} value={step.titulo} onChange={(event) => updateStep(index, { titulo: event.target.value })} />
              </Field>
              <Field label={`Texto da etapa ${index + 1}`} htmlFor={`etapa-texto-${index}`}>
                <textarea id={`etapa-texto-${index}`} className={s.textarea} value={step.texto} onChange={(event) => updateStep(index, { texto: event.target.value })} />
              </Field>
              <Field label={`Imagem da etapa ${index + 1} (opcional)`} htmlFor={`etapa-img-${index}`}>
                <Input id={`etapa-img-${index}`} type="url" inputMode="url" placeholder="https://" value={step.imagemUrl} onChange={(event) => updateStep(index, { imagemUrl: event.target.value })} />
              </Field>
              {steps.length > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}>
                  Remover etapa
                </Button>
              ) : null}
            </div>
          ))}
          {steps.length < 20 ? (
            <Button type="button" variant="outline" icon="plus" onClick={() => setSteps((current) => [...current, emptyStep()])}>
              Adicionar etapa
            </Button>
          ) : null}
        </fieldset>
      )}

      <div className={s.row2}>
        <Field label="Ordem de exibição" htmlFor="ordem">
          <Input id="ordem" name="ordem" type="number" min={0} max={9999} defaultValue={tutorial?.ordem ?? 0} />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicado</option>
          </Select>
        </Field>
      </div>

      <label className={s.check}>
        <input type="checkbox" name="destaque" value="1" defaultChecked={tutorial?.destaque === true} disabled={status !== 'publicado'} />
        <span>Destacar no banner “Comece por aqui”. Só um tutorial publicado fica em destaque.</span>
      </label>

      <div className={s.headerActions}>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Link className={s.linkBtnGhost} href="/tutoriais/gerenciar">Cancelar</Link>
      </div>
      <p className={t.subtitle}>Rascunho guarda o título. Publicar exige a descrição e o vídeo ou as etapas.</p>
    </form>
  );
}
