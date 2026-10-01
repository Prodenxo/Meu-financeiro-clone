import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canManageTutorials,
  canReadTutorial,
  filterTutorials,
  parseVideoSource,
  pickFeatured,
  plainText,
  validateTutorialInput,
} from './tutoriais.js';

const video = {
  id: '1',
  titulo: 'Como registrar entradas e saídas',
  descricao: 'Registre receitas e despesas do dia a dia.',
  modulo: 'transacoes',
  tipo: 'video',
  publicado: true,
  destaque: false,
};

const guia = {
  id: '2',
  titulo: 'Como cadastrar sua primeira conta',
  descricao: 'Cadastre suas contas e organize seus saldos.',
  modulo: 'contas',
  tipo: 'passo-a-passo',
  publicado: true,
  destaque: true,
};

test('só o super admin administra tutoriais', () => {
  assert.equal(canManageTutorials('superadmin'), true);
  assert.equal(canManageTutorials('admin'), false);
  assert.equal(canManageTutorials('usuario'), false);
  assert.equal(canManageTutorials(null), false);
});

test('usuário comum lê publicado e não lê rascunho', () => {
  assert.equal(canReadTutorial({ publicado: true }, 'usuario'), true);
  assert.equal(canReadTutorial({ publicado: false }, 'usuario'), false);
  assert.equal(canReadTutorial({ publicado: false }, 'admin'), false);
  assert.equal(canReadTutorial({ publicado: false }, 'superadmin'), true);
  assert.equal(canReadTutorial(null, 'superadmin'), false);
});

test('busca e filtro de módulo funcionam juntos', () => {
  const list = [video, guia];
  assert.deepEqual(filterTutorials(list, { query: 'conta', modulo: 'transacoes' }).map((item) => item.id), []);
  assert.deepEqual(filterTutorials(list, { query: 'conta', modulo: 'contas' }).map((item) => item.id), ['2']);
  assert.deepEqual(filterTutorials(list, { query: 'entradas', modulo: 'todos' }).map((item) => item.id), ['1']);
  assert.equal(filterTutorials(list, { query: 'orçamento' }).length, 0);
});

test('banner só aponta para tutorial publicado em destaque', () => {
  assert.equal(pickFeatured([video, guia])?.id, '2');
  assert.equal(pickFeatured([{ ...guia, publicado: false }]), null);
  assert.equal(pickFeatured([video]), null);
});

test('aceita YouTube, Vimeo e arquivo https; recusa o resto', () => {
  assert.equal(parseVideoSource('https://www.youtube.com/watch?v=abcdefghijk')?.kind, 'iframe');
  assert.equal(parseVideoSource('https://youtu.be/abcdefghijk')?.src, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(parseVideoSource('https://vimeo.com/123456789')?.src, 'https://player.vimeo.com/video/123456789');
  assert.equal(parseVideoSource('https://cdn.exemplo.com/aula.mp4')?.kind, 'file');
  assert.equal(parseVideoSource('http://www.youtube.com/watch?v=abcdefghijk'), null);
  assert.equal(parseVideoSource('javascript:alert(1)'), null);
  assert.equal(parseVideoSource('https://evil.example/watch?v=abcdefghijk'), null);
});

test('rascunho pede título; publicar pede o conteúdo do tipo', () => {
  const draft = validateTutorialInput({ titulo: 'Oi' }, { publishing: false });
  assert.equal(draft.ok, false);

  const saved = validateTutorialInput({ titulo: 'Primeiros passos' }, { publishing: false });
  assert.equal(saved.ok, true);
  assert.equal(saved.value.publicado, false);
  assert.equal(saved.value.destaque, false);

  const semVideo = validateTutorialInput({
    titulo: 'Como lançar',
    descricao: 'Um vídeo curto.',
    modulo: 'transacoes',
    tipo: 'video',
    destaque: true,
  }, { publishing: true });
  assert.equal(semVideo.ok, false);
  assert.ok(semVideo.errors.videoUrl);

  const publicado = validateTutorialInput({
    titulo: 'Como lançar',
    descricao: 'Um vídeo curto.',
    modulo: 'transacoes',
    tipo: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
    destaque: '1',
    etapas: [{ texto: 'ignorar', imagemUrl: 'nota-url' }],
  }, { publishing: true });
  assert.equal(publicado.ok, false);

  const ok = validateTutorialInput({
    titulo: 'Como lançar <script>',
    descricao: 'Um vídeo curto.',
    modulo: 'transacoes',
    tipo: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
    destaque: '1',
  }, { publishing: true });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.titulo, 'Como lançar');
  assert.equal(ok.value.destaque, true);
  assert.equal(ok.value.publicado, true);
});

test('texto rico vira texto puro', () => {
  assert.equal(plainText('<img src=x onerror=alert(1)>Olá', 20), 'Olá');
});
