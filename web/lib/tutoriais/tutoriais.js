/** Regras da Central de tutoriais. Sem UI e sem acesso ao banco. */

export const TUTORIAL_MODULES = [
  { id: 'visao-geral', label: 'Visão geral', icon: 'layout-dashboard' },
  { id: 'transacoes', label: 'Transações', icon: 'arrow-left-right' },
  { id: 'contas', label: 'Contas', icon: 'landmark' },
  { id: 'orcamentos', label: 'Orçamentos', icon: 'pie-chart' },
  { id: 'categorias', label: 'Categorias', icon: 'tag' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar-days' },
  { id: 'conta-global', label: 'Conta global', icon: 'globe' },
];

export const TUTORIAL_TYPES = [
  { id: 'video', label: 'Vídeo', action: 'Assistir vídeo' },
  { id: 'passo-a-passo', label: 'Passo a passo', action: 'Abrir tutorial' },
];

const MODULE_IDS = new Set(TUTORIAL_MODULES.map((item) => item.id));
const TYPE_IDS = new Set(TUTORIAL_TYPES.map((item) => item.id));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isTutorialId(value) {
  return UUID_RE.test(String(value || '').trim());
}

export function moduleById(id) {
  return TUTORIAL_MODULES.find((item) => item.id === id) || null;
}

export function typeById(id) {
  return TUTORIAL_TYPES.find((item) => item.id === id) || null;
}

/** Só o papel já resolvido no servidor (`requireUser` / `current_app_role`). */
export function canManageTutorials(role) {
  return role === 'superadmin';
}

/** Publicado para quem acessa a plataforma. Rascunho só para o super admin. */
export function canReadTutorial(tutorial, role) {
  if (!tutorial) return false;
  if (tutorial.publicado === true) return true;
  return canManageTutorials(role);
}

export function plainText(value, max) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

export function isSafeHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] || '';
  }
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'embed' || parts[0] === 'shorts') return parts[1] || '';
  return url.searchParams.get('v') || '';
}

/**
 * YouTube, Vimeo ou arquivo https (.mp4, .webm, .ogg).
 * Qualquer outro endereço é recusado.
 */
export function parseVideoSource(value) {
  const raw = String(value || '').trim();
  if (!isSafeHttpsUrl(raw)) return null;
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();

  const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com']);
  if (youtubeHosts.has(host)) {
    const id = youtubeId(url);
    if (!/^[\w-]{6,20}$/.test(id)) return null;
    return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  const vimeoHosts = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
  if (vimeoHosts.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    const id = host.startsWith('player.') ? parts[1] : parts[0];
    if (!/^\d{6,12}$/.test(id || '')) return null;
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` };
  }

  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    return { kind: 'file', src: url.toString() };
  }
  return null;
}

export function normalizeSteps(value) {
  const list = Array.isArray(value) ? value : [];
  return list.slice(0, 20).map((step) => {
    const imagem = String(step?.imagemUrl || step?.imagem_url || '').trim();
    return {
      titulo: plainText(step?.titulo, 120),
      texto: plainText(step?.texto, 2000),
      imagemUrl: isSafeHttpsUrl(imagem) ? imagem : '',
    };
  }).filter((step) => step.titulo || step.texto || step.imagemUrl);
}

function fold(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

export function filterTutorials(list, { query = '', modulo = 'todos' } = {}) {
  const q = fold(query);
  return (list || []).filter((item) => {
    if (modulo && modulo !== 'todos' && item.modulo !== modulo) return false;
    if (!q) return true;
    const moduloLabel = moduleById(item.modulo)?.label || '';
    const tipoLabel = typeById(item.tipo)?.label || '';
    return fold(`${item.titulo} ${item.descricao} ${moduloLabel} ${tipoLabel}`).includes(q);
  });
}

/** Destaque do banner: só publicado. Sem isso, o botão não tem destino. */
export function pickFeatured(list) {
  return (list || []).find((item) => item.publicado === true && item.destaque === true) || null;
}

export function normalizeTutorial(row) {
  if (!row) return null;
  const modulo = moduleById(row.modulo);
  const tipo = typeById(row.tipo);
  const capa = String(row.capa_url || '').trim();
  const video = String(row.video_url || '').trim();
  return {
    id: row.id,
    titulo: plainText(row.titulo, 120),
    descricao: plainText(row.descricao, 280),
    modulo: row.modulo,
    moduloLabel: modulo?.label || 'Tutorial',
    moduloIcon: modulo?.icon || 'book-open',
    tipo: row.tipo,
    tipoLabel: tipo?.label || 'Tutorial',
    actionLabel: tipo?.action || 'Abrir tutorial',
    capaUrl: isSafeHttpsUrl(capa) ? capa : '',
    videoUrl: parseVideoSource(video) ? video : '',
    video: parseVideoSource(video),
    etapas: normalizeSteps(row.etapas),
    ordem: Number.isFinite(Number(row.ordem)) ? Number(row.ordem) : 0,
    publicado: row.publicado === true,
    destaque: row.destaque === true && row.publicado === true,
  };
}

function parseOrdem(value) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(9999, Math.max(0, n));
}

/**
 * Rascunho exige título. Publicar exige descrição, módulo, tipo e o conteúdo do tipo.
 * @returns {{ ok: true, value: object } | { ok: false, errors: Record<string, string> }}
 */
export function validateTutorialInput(input, { publishing }) {
  const errors = {};
  const titulo = plainText(input?.titulo, 120);
  const descricao = plainText(input?.descricao, 280);
  const modulo = String(input?.modulo || '').trim();
  const tipo = String(input?.tipo || '').trim();
  const capaRaw = String(input?.capaUrl || '').trim();
  const videoRaw = String(input?.videoUrl || '').trim();
  const etapas = normalizeSteps(input?.etapas);
  const ordem = parseOrdem(input?.ordem);
  const destaque = input?.destaque === true || input?.destaque === '1' || input?.destaque === 'on';

  if (titulo.length < 3) errors.titulo = 'Informe um título com pelo menos 3 caracteres.';
  if (capaRaw && !isSafeHttpsUrl(capaRaw)) errors.capaUrl = 'A capa precisa ser um link https.';
  if (videoRaw && !parseVideoSource(videoRaw)) {
    errors.videoUrl = 'Use um link https do YouTube, do Vimeo ou um arquivo .mp4, .webm ou .ogg.';
  }
  if (modulo && !MODULE_IDS.has(modulo)) errors.modulo = 'Escolha um módulo da lista.';
  if (tipo && !TYPE_IDS.has(tipo)) errors.tipo = 'Escolha Vídeo ou Passo a passo.';

  const invalidImage = Array.isArray(input?.etapas) && input.etapas.some((step) => {
    const imagem = String(step?.imagemUrl || step?.imagem_url || '').trim();
    return imagem && !isSafeHttpsUrl(imagem);
  });
  if (invalidImage) errors.etapas = 'A imagem de cada etapa precisa ser um link https.';

  if (publishing) {
    if (descricao.length < 3) errors.descricao = 'Informe uma descrição curta.';
    if (!MODULE_IDS.has(modulo)) errors.modulo = 'Escolha o módulo.';
    if (!TYPE_IDS.has(tipo)) errors.tipo = 'Escolha o tipo do tutorial.';
    if (tipo === 'video' && !parseVideoSource(videoRaw)) {
      errors.videoUrl = 'Para publicar um vídeo, informe um link compatível.';
    }
    if (tipo === 'passo-a-passo' && !etapas.some((step) => step.texto)) {
      errors.etapas = 'Para publicar um passo a passo, inclua pelo menos uma etapa com texto.';
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      titulo,
      descricao,
      modulo: MODULE_IDS.has(modulo) ? modulo : 'visao-geral',
      tipo: TYPE_IDS.has(tipo) ? tipo : 'passo-a-passo',
      capa_url: capaRaw || null,
      video_url: videoRaw || null,
      etapas: etapas.map((step) => ({
        titulo: step.titulo,
        texto: step.texto,
        imagem_url: step.imagemUrl || null,
      })),
      ordem,
      publicado: publishing === true,
      destaque: publishing === true && destaque,
    },
  };
}
