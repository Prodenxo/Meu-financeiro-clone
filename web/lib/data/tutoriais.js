import 'server-only';
import { isTutorialId, normalizeTutorial } from '@/lib/tutoriais/tutoriais';

const COLUMNS = 'id, titulo, descricao, modulo, tipo, capa_url, video_url, etapas, ordem, publicado, destaque';

function missingTable(error) {
  const msg = `${error?.message || ''} ${error?.code || ''} ${error?.details || ''}`;
  return /PGRST205|schema cache|does not exist/i.test(msg);
}

export function formatTutorialDbError(error) {
  const msg = String(error?.message || error?.details || '');
  if (/row-level security|permission denied|42501/i.test(msg)) return 'Acesso negado.';
  if (missingTable(error)) return 'A central de tutoriais ainda não está disponível neste ambiente.';
  return 'Não foi possível concluir esta ação.';
}

async function read(builder) {
  const { data, error } = await builder;
  if (!error) return { data, unavailable: false };
  if (missingTable(error)) return { data: null, unavailable: true };
  const wrapped = new Error(formatTutorialDbError(error));
  wrapped.cause = error;
  throw wrapped;
}

export async function loadPublishedTutorials(supabase) {
  const { data, unavailable } = await read(
    supabase.from('tutoriais').select(COLUMNS).eq('publicado', true).order('ordem', { ascending: true }).order('titulo', { ascending: true }),
  );
  return { tutorials: (data || []).map(normalizeTutorial), unavailable };
}

export async function loadAllTutorials(supabase) {
  const { data, unavailable } = await read(
    supabase.from('tutoriais').select(COLUMNS).order('ordem', { ascending: true }).order('titulo', { ascending: true }),
  );
  return { tutorials: (data || []).map(normalizeTutorial), unavailable };
}

export async function loadTutorialById(supabase, id) {
  if (!isTutorialId(id)) return { tutorial: null, unavailable: false };
  const { data, unavailable } = await read(
    supabase.from('tutoriais').select(COLUMNS).eq('id', id).maybeSingle(),
  );
  return { tutorial: normalizeTutorial(data), unavailable };
}
