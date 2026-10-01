'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { formatTutorialDbError } from '@/lib/data/tutoriais';
import { canManageTutorials, isTutorialId, validateTutorialInput } from '@/lib/tutoriais/tutoriais';

function revalidateTutorial(id) {
  revalidatePath('/tutoriais');
  revalidatePath('/tutoriais/gerenciar');
  if (id) revalidatePath(`/tutoriais/${id}`);
}

function denied() {
  return { ok: false, error: 'Acesso negado.' };
}

async function requireSuperadmin() {
  const session = await requireUser();
  if (!canManageTutorials(session.role)) return { session: null, error: denied() };
  return { session, error: null };
}

function readSteps(formData) {
  try {
    const parsed = JSON.parse(String(formData.get('etapas') || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Cria ou edita. Publicar só passa se o conteúdo do tipo existir. */
export async function saveTutorialAction(_prev, formData) {
  const gate = await requireSuperadmin();
  if (gate.error) return gate.error;

  const id = String(formData.get('id') || '').trim();
  if (id && !isTutorialId(id)) return { ok: false, errors: { form: 'Tutorial inválido.' } };

  const publishing = String(formData.get('status') || '') === 'publicado';
  const parsed = validateTutorialInput({
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao'),
    modulo: formData.get('modulo'),
    tipo: formData.get('tipo'),
    capaUrl: formData.get('capa_url'),
    videoUrl: formData.get('video_url'),
    etapas: readSteps(formData),
    ordem: formData.get('ordem'),
    destaque: formData.get('destaque'),
  }, { publishing });

  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const payload = { ...parsed.value, atualizado_em: new Date().toISOString() };

  if (payload.destaque && payload.publicado) {
    let clear = gate.session.supabase.from('tutoriais').update({ destaque: false }).eq('destaque', true);
    if (id) clear = clear.neq('id', id);
    const { error: clearError } = await clear;
    if (clearError) return { ok: false, errors: { form: formatTutorialDbError(clearError) } };
  }

  let error;
  let savedId = id;

  if (id) {
    ({ error } = await gate.session.supabase.from('tutoriais').update(payload).eq('id', id));
  } else {
    const inserted = await gate.session.supabase
      .from('tutoriais')
      .insert({ ...payload, criado_por: gate.session.userId })
      .select('id')
      .maybeSingle();
    error = inserted.error;
    savedId = inserted.data?.id || '';
  }

  if (error) return { ok: false, errors: { form: formatTutorialDbError(error) } };
  revalidateTutorial(savedId);
  return { ok: true, id: savedId };
}

/** Publica ou tira do ar. Publicar repete a validação do conteúdo. */
export async function setTutorialPublishedAction(id, published) {
  const gate = await requireSuperadmin();
  if (gate.error) return gate.error;
  if (!isTutorialId(id)) return { ok: false, error: 'Tutorial inválido.' };

  const { data, error: readError } = await gate.session.supabase
    .from('tutoriais')
    .select('id, titulo, descricao, modulo, tipo, capa_url, video_url, etapas, ordem, destaque')
    .eq('id', id)
    .maybeSingle();

  if (readError) return { ok: false, error: formatTutorialDbError(readError) };
  if (!data) return { ok: false, error: 'Tutorial não encontrado.' };

  if (published) {
    const parsed = validateTutorialInput({
      titulo: data.titulo,
      descricao: data.descricao,
      modulo: data.modulo,
      tipo: data.tipo,
      capaUrl: data.capa_url,
      videoUrl: data.video_url,
      etapas: data.etapas,
      ordem: data.ordem,
      destaque: data.destaque,
    }, { publishing: true });
    if (!parsed.ok) {
      const first = Object.values(parsed.errors)[0];
      return { ok: false, error: first || 'Complete o tutorial antes de publicar.' };
    }
  }

  const { error } = await gate.session.supabase
    .from('tutoriais')
    .update({
      publicado: published === true,
      destaque: published === true ? data.destaque === true : false,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { ok: false, error: formatTutorialDbError(error) };
  revalidateTutorial(id);
  return { ok: true, published: published === true };
}

export async function deleteTutorialAction(id) {
  const gate = await requireSuperadmin();
  if (gate.error) return gate.error;
  if (!isTutorialId(id)) return { ok: false, error: 'Tutorial inválido.' };

  const { error } = await gate.session.supabase.from('tutoriais').delete().eq('id', id);
  if (error) return { ok: false, error: formatTutorialDbError(error) };
  revalidateTutorial(id);
  return { ok: true };
}
