#!/usr/bin/env node
/**
 * Ticket interno no ScrumHub (empresa 10 / projeto 40 "Meu Financeiro").
 *
 * Hook `stop` do Cursor neste clone. Regras para não poluir o quadro:
 * - Só conta arquivo de código (backend/, frontend/, web/, supabase/). Doc,
 *   .gitignore, .cursor/, README e afins não abrem ticket.
 * - Remoção pura (só arquivos apagados) não abre ticket.
 * - Enquanto não houver commit novo, o mesmo ticket é atualizado em vez de
 *   abrir outro. Commit novo = ticket novo.
 * - Título e texto em linguagem de gente: o que a pessoa vê na tela.
 *   Se existir ~/.cursor/scrumhub/nota-em-andamento.txt, a primeira linha
 *   vira o título e o resto vira a descrição (e o arquivo é apagado).
 *   Sem essa nota, o ticket cai no resumo automático por arquivo.
 *
 * Login fica em ~/.cursor/scrumhub/scrumhub.local.env (nunca no git).
 * Uso manual: node .cursor/hooks/scrumhub-dev-ticket.mjs --commit <sha>
 * Simular sem criar: SCRUMHUB_DRY_RUN=1
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

const COMPANY_ID = 10;
const PROJECT_ID = 40;
const ORIGIN = 'https://scrumhub.com.br';
const API_FALLBACK = 'https://scrumhub-scrumhub-backend.sf83tr.easypanel.host';
const PRIORIDADE = 'media';
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const VALIDADE_TICKET_FIXADO_MS = 24 * 60 * 60 * 1000;
const REAPROVEITAR_TICKET_MS = 12 * 60 * 60 * 1000;

const configDir = path.join(os.homedir(), '.cursor', 'scrumhub');
const envFile = path.join(configDir, 'scrumhub.local.env');
const stateFile = path.join(configDir, '.ticket-state-meu-financeiro-clone.json');
const ticketFixadoFile = path.join(configDir, 'ticket-fixado-meu-financeiro-clone.txt');
const credentialsHint = '~/.cursor/scrumhub/scrumhub.local.env';

let repoRoot = '';

/* ---------- utilidades ---------- */

function reply(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function commitPedido() {
  const indice = process.argv.indexOf('--commit');
  if (indice < 0) return '';
  return String(process.argv[indice + 1] || '').trim();
}

async function drainStdin() {
  if (process.stdin.isTTY || commitPedido()) return;
  for await (const _ of process.stdin) { /* só consome */ }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function git(args, cwd = repoRoot) {
  if (!cwd) return '';
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) return '';
  return String(result.stdout || '').trim();
}

function resolveRepoRoot() {
  const top = git(['rev-parse', '--show-toplevel'], process.cwd());
  if (!top) return '';
  const remote = git(['remote', '-v'], top).toLowerCase();
  return remote.includes('meu-financeiro') || remote.includes('financas-pessoais') ? top : '';
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

/* ---------- o que mudou ---------- */

/** Só código de verdade. O resto (doc, config de editor, lock) não vira ticket. */
const CODIGO_RE = /^(backend|frontend|web|supabase)\/.*\.(js|jsx|mjs|cjs|ts|tsx|sql|css)$/;
const IGNORAR_RE = /(^|\/)(node_modules|\.next|dist|build|android|ios)\/|\.test\.(js|ts|tsx)$|\.d\.ts$/;

function ehImportante(file) {
  const norm = file.replace(/\\/g, '/');
  return CODIGO_RE.test(norm) && !IGNORAR_RE.test(norm);
}

/** Map arquivo -> 'novo' | 'alterado' | 'removido' | 'renomeado' (só os importantes). */
function mudancas() {
  const sha = commitPedido();
  const map = new Map();

  if (sha) {
    for (const line of git(['diff-tree', '--no-commit-id', '--name-status', '-r', sha]).split(/\r?\n/)) {
      const [code, ...rest] = line.split('\t');
      const file = (rest.at(-1) || '').trim();
      if (!file) continue;
      map.set(file, code.startsWith('A') ? 'novo' : code.startsWith('D') ? 'removido' : code.startsWith('R') ? 'renomeado' : 'alterado');
    }
  } else {
    const raw = git(['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '--untracked-files=all']);
    for (const line of raw.split(/\r?\n/)) {
      if (line.length < 4) continue;
      const code = line.slice(0, 2);
      let file = line.slice(3).trim();
      const arrow = file.indexOf(' -> ');
      if (arrow >= 0) file = file.slice(arrow + 4).trim();
      file = file.replace(/^"|"$/g, '');
      map.set(file, code.includes('?') || code.includes('A') ? 'novo' : code.includes('D') ? 'removido' : code.includes('R') ? 'renomeado' : 'alterado');
    }
  }

  for (const file of [...map.keys()]) {
    if (!ehImportante(file)) map.delete(file);
  }
  return map;
}

const AREAS = [
  [/^supabase\/|(^|\/)migrations\/|\.sql$/, 'Banco de dados', 1],
  [/^web\//, 'Site novo (Next.js)', 1],
  [/^frontend\//, 'Aplicativo (Expo)', 1],
  [/^backend\//, 'Servidor (API)', 1],
];

function areaDoArquivo(file) {
  const norm = file.replace(/\\/g, '/');
  return AREAS.find(([regex]) => regex.test(norm))?.[1] || 'Projeto';
}

const PASTAS_GENERICAS = new Set([
  'src', 'app', 'lib', 'components', 'screens', 'services', 'routes', 'controllers',
  'utils', 'hooks', 'store', 'stores', 'types', 'config', 'migrations', 'functions', 'public',
  '(app)', '(auth)', 'api', 'ui',
]);

/** "web/app/login/page.js" -> "login"; "backend/src/services/x.service.js" -> "x". */
function moduloDoArquivo(file) {
  const partes = file.replace(/\\/g, '/').split('/').slice(1);
  const nomeArquivo = partes.pop() || '';
  const pasta = partes.filter((p) => !PASTAS_GENERICAS.has(p.toLowerCase()) && !/^\[.*\]$/.test(p)).pop();
  if (pasta) return pasta;
  return nomeArquivo
    .replace(/\.(js|jsx|mjs|cjs|ts|tsx|sql|css)$/, '')
    .replace(/\.(service|controller|routes|route|test|module)$/, '')
    .replace(/^\d{8,}_?/, '');
}

function lista(itens, max = 3) {
  const vistos = [...new Set(itens)];
  const mostrados = vistos.slice(0, max);
  const resto = vistos.length - mostrados.length;
  const texto = mostrados.length > 1
    ? `${mostrados.slice(0, -1).join(', ')} e ${mostrados.at(-1)}`
    : mostrados[0] || '';
  return resto > 0 ? `${texto} (+${resto})` : texto;
}

function agruparPorArea(map) {
  const grupos = new Map();
  for (const [file, status] of map) {
    const area = areaDoArquivo(file);
    if (!grupos.has(area)) grupos.set(area, []);
    grupos.get(area).push({ file, status });
  }
  return grupos;
}

const notaFile = path.join(configDir, 'nota-em-andamento.txt');

/** Primeira linha = título. O resto = o que mudou, em linguagem de gente. */
function notaHumana() {
  if (!fs.existsSync(notaFile)) return null;
  const raw = fs.readFileSync(notaFile, 'utf8').trim();
  if (!raw) return null;
  const [primeira, ...resto] = raw.split(/\r?\n/);
  const nome = primeira.replace(/^#\s*/, '').trim().slice(0, 140);
  const descricao = resto.join('\n').replace(/^\s*\n/, '').trim();
  if (!nome) return null;
  return { nome, descricao: descricao || nome };
}

function tituloDoTicket(map) {
  const grupos = agruparPorArea(map);
  const partes = [...grupos].map(([area, itens]) => `${area}: ${lista(itens.map((i) => moduloDoArquivo(i.file)))}`);
  return partes.join(' · ').slice(0, 140);
}

function resumoDeLinhas() {
  const sha = commitPedido();
  const shortstat = sha ? git(['show', '--shortstat', '--format=', sha]) : git(['diff', '--shortstat', 'HEAD']);
  const mais = /(\d+) insert/.exec(shortstat)?.[1];
  const menos = /(\d+) delet/.exec(shortstat)?.[1];
  return [mais && `${mais} linhas a mais`, menos && `${menos} linhas a menos`].filter(Boolean).join(' e ');
}

function descricaoDoTicket(map) {
  const grupos = agruparPorArea(map);
  const statuses = [...map.values()];
  const novos = statuses.filter((s) => s === 'novo').length;
  const alterados = statuses.length - novos - statuses.filter((s) => s === 'removido').length;

  const abertura = novos && !alterados
    ? 'Funcionalidade nova em desenvolvimento no Meu Financeiro.'
    : 'Trabalho em andamento no Meu Financeiro.';

  const blocos = [];
  for (const [area, itens] of grupos) {
    blocos.push(`${area} — ${lista(itens.map((i) => moduloDoArquivo(i.file)), 6)}`);
    for (const { file, status } of itens.slice(0, 8)) blocos.push(`  - ${file}${status === 'novo' ? ' (novo)' : status === 'removido' ? ' (removido)' : ''}`);
    if (itens.length > 8) blocos.push(`  - e mais ${itens.length - 8} arquivos`);
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const sha = commitPedido();
  const rodape = [
    `${map.size === 1 ? '1 arquivo' : `${map.size} arquivos`}${resumoDeLinhas() ? `, ${resumoDeLinhas()}` : ''}.`,
    branch ? `Branch ${branch}.` : '',
    sha ? `Commit ${sha.slice(0, 8)}.` : 'Ainda sem commit.',
  ].filter(Boolean).join(' ');

  return [abertura, '', ...blocos, '', rodape].join('\n').slice(0, 8000);
}

/* ---------- ticket fixado (comentário em ticket existente) ---------- */

function ticketFixado() {
  if (!fs.existsSync(ticketFixadoFile)) return null;
  if (Date.now() - fs.statSync(ticketFixadoFile).mtimeMs > VALIDADE_TICKET_FIXADO_MS) return null;
  const id = Number(/\d+/.exec(fs.readFileSync(ticketFixadoFile, 'utf8'))?.[0]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function impressaoDoConteudo(files) {
  const partes = [git(['diff', 'HEAD']), files.join('|')];
  for (const file of files) {
    try {
      const info = fs.statSync(path.join(repoRoot, file));
      partes.push(`${file}:${info.size}:${Math.round(info.mtimeMs)}`);
    } catch {
      partes.push(`${file}:ausente`);
    }
  }
  return createHash('sha1').update(partes.join('\n')).digest('hex');
}

function comentarioParaCliente(map) {
  const areas = new Set([...map.keys()].map(areaDoArquivo));
  const onde = areas.size === 1 && areas.has('Aplicativo (Expo)') ? 'no aplicativo'
    : areas.size === 1 && areas.has('Site novo (Next.js)') ? 'no site' : 'no sistema';
  return [
    'Oi! Passando para avisar que já mexemos aqui por causa do seu chamado.',
    '',
    `O ajuste foi feito ${onde}. Assim que a atualização for publicada, a mudança aparece para você.`,
    '',
    'Se ainda notar alguma coisa estranha, é só responder por aqui que a gente olha de novo.',
  ].join('\n');
}

/* ---------- HTTP / sessão ---------- */

async function request(pathname, { method = 'GET', body, cookie } = {}, base = ORIGIN) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json; charset=utf-8' };
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const json = await response.json().catch(() => ({}));
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
  return {
    ok: response.ok,
    status: response.status,
    json,
    cookie: setCookies.map((raw) => String(raw).split(';')[0].trim()).filter(Boolean).join('; '),
  };
}

async function requestWithFallback(pathname, options) {
  let result = await request(pathname, options, ORIGIN);
  if (!result.ok && [404, 502, 503, 504].includes(result.status)) {
    result = await request(pathname, options, API_FALLBACK);
  }
  return result;
}

function isAuthFailure(result) {
  if (!result) return true;
  if ([401, 403].includes(result.status)) return true;
  const text = `${result.json?.error || ''} ${result.json?.message || ''}`.toLowerCase();
  return text.includes('token') || text.includes('acesso negado') || text.includes('não autenticado');
}

async function login(emailOrPhone, password) {
  const payload = /^[\d\s()\-+]+$/.test(emailOrPhone) && !emailOrPhone.includes('@')
    ? { telefone: emailOrPhone, password }
    : { email: emailOrPhone, password };
  const result = await requestWithFallback('/auth/login', { method: 'POST', body: payload });
  if (!result.ok || result.json?.success === false) {
    throw new Error(result.json?.error || result.json?.message || `HTTP ${result.status}`);
  }
  const cookie = result.cookie
    || (result.json?.token ? `token=${result.json.token}` : '')
    || (result.json?.data?.token ? `token=${result.json.data.token}` : '');
  if (!cookie) throw new Error('login ok, mas o ScrumHub não devolveu cookie de sessão');
  return cookie;
}

function credenciais(env) {
  return {
    email: String(env.SCRUMHUB_EMAIL || env.SCRUMHUB_USER || '').trim(),
    password: String(env.SCRUMHUB_PASSWORD || env.SCRUMHUB_SENHA || '').trim(),
  };
}

async function resolveSession(env, state) {
  const cached = String(state.sessionCookie || '').trim();
  if (cached && Date.now() - Number(state.sessionAt || 0) < SESSION_TTL_MS) return cached;
  const { email, password } = credenciais(env);
  if (email && password) {
    const cookie = await login(email, password);
    writeState({ ...state, sessionCookie: cookie, sessionAt: Date.now() });
    return cookie;
  }
  return String(env.SCRUMHUB_COOKIE || '').trim();
}

async function resolveStatusId(cookie) {
  const result = await requestWithFallback(`/status/projeto/${PROJECT_ID}`, { cookie });
  const list = Array.isArray(result.json?.data) ? result.json.data : [];
  const pendente = list.find((item) => String(item.nome || '').toLowerCase() === 'pendente');
  return { result, statusId: Number(pendente?.id || list[0]?.id) || null };
}

async function ticketEhExterno(id, cookie, state) {
  if ((state.criados || []).includes(id)) return false;
  const result = await requestWithFallback(`/tickets-pai/projeto/${PROJECT_ID}`, { cookie });
  const listaTickets = Array.isArray(result.json?.data) ? result.json.data : (result.json?.tickets || []);
  const ticket = listaTickets.find((item) => Number(item.id) === id);
  if (!ticket) return true;
  const valor = ticket.is_externo;
  if (valor === undefined || valor === null) return true;
  return valor === true || Number(valor) === 1;
}

/* ---------- principal ---------- */

async function main() {
  try {
    await drainStdin();

    repoRoot = resolveRepoRoot();
    if (!repoRoot) return reply({});

    const map = mudancas();
    const files = [...map.keys()].sort();
    if (!files.length) return reply({});
    if ([...map.values()].every((s) => s === 'removido')) return reply({});

    const sha = commitPedido();
    const head = git(['rev-parse', 'HEAD']);
    const ticketAlvo = sha ? null : ticketFixado();
    const fingerprint = ticketAlvo
      ? impressaoDoConteudo(files)
      : createHash('sha1').update(`${sha || head}|${files.map((f) => `${f}:${map.get(f)}`).join('|')}`).digest('hex');

    const state = readState();
    const jaRegistrado = ticketAlvo
      ? state.comentarios?.[ticketAlvo] === fingerprint
      : state.fingerprint === fingerprint;
    if (jaRegistrado) return reply({});

    const env = { ...loadEnvFile(envFile), ...process.env };
    let cookie = await resolveSession(env, state);
    if (!cookie) {
      return reply({ user_message: `Não criei o ticket interno: falta SCRUMHUB_EMAIL e SCRUMHUB_PASSWORD em ${credentialsHint}` });
    }

    let { result: statusResult, statusId } = await resolveStatusId(cookie);
    if (isAuthFailure(statusResult)) {
      const { email, password } = credenciais(env);
      if (!email || !password) {
        return reply({ user_message: `Sessão do ScrumHub caiu. Coloque e-mail e senha em ${credentialsHint}` });
      }
      cookie = await login(email, password);
      writeState({ ...readState(), sessionCookie: cookie, sessionAt: Date.now() });
      ({ statusId } = await resolveStatusId(cookie));
    }

    // Modo correção: comenta num ticket existente em vez de abrir outro.
    if (ticketAlvo) {
      const externo = await ticketEhExterno(ticketAlvo, cookie, state);
      const comentario = externo ? comentarioParaCliente(map) : descricaoDoTicket(map);
      if (process.env.SCRUMHUB_DRY_RUN) {
        return reply({ user_message: `[comentário no ticket #${ticketAlvo} — ${externo ? 'externo' : 'interno'}]\n\n${comentario}` });
      }
      const comentado = await requestWithFallback('/ticket-comentarios', {
        method: 'POST',
        body: { comentario, comentario_img: null, ticket_pai_id: ticketAlvo },
        cookie,
      });
      if (!comentado.ok || comentado.json?.success === false) {
        return reply({ user_message: `Não consegui comentar no ticket #${ticketAlvo}: ${comentado.json?.error || comentado.json?.message || `HTTP ${comentado.status}`}` });
      }
      const atual = readState();
      writeState({ ...atual, comentarios: { ...(atual.comentarios || {}), [ticketAlvo]: fingerprint }, sessionCookie: cookie, sessionAt: Date.now() });
      return reply({ user_message: `Correção anotada no ticket #${ticketAlvo} (sem abrir ticket novo).` });
    }

    const nota = notaHumana();
    const nome = nota?.nome || tituloDoTicket(map);
    const descricao = nota?.descricao || descricaoDoTicket(map);

    // Mesmo commit de base e ticket recente: atualiza o ticket em vez de abrir outro.
    const reaproveitar = !sha
      && state.ticketId
      && state.head === head
      && Date.now() - Date.parse(state.at || 0) < REAPROVEITAR_TICKET_MS;

    if (process.env.SCRUMHUB_DRY_RUN) {
      return reply({ user_message: `[${reaproveitar ? `atualizaria #${state.ticketId}` : 'criaria ticket'}]\n${nome}\n\n${descricao}` });
    }

    if (reaproveitar) {
      const atualizado = await requestWithFallback(`/tickets-pai/${state.ticketId}`, {
        method: 'PUT',
        body: { nome, descricao, prioridade: PRIORIDADE },
        cookie,
      });
      if (atualizado.ok && atualizado.json?.success !== false) {
        if (nota) fs.rmSync(notaFile, { force: true });
        writeState({ ...readState(), fingerprint, at: new Date().toISOString(), sessionCookie: cookie, sessionAt: Date.now() });
        return reply({ user_message: `Ticket #${state.ticketId} atualizado no ScrumHub.` });
      }
      // Se o ticket foi apagado lá, cai para criar um novo.
    }

    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 3);
    const created = await requestWithFallback('/tickets-pai', {
      method: 'POST',
      body: {
        projeto_id: PROJECT_ID,
        nome,
        descricao,
        prioridade: PRIORIDADE,
        prazo: prazo.toISOString().slice(0, 10),
        is_externo: 0,
        ...(statusId ? { status_id: statusId } : {}),
      },
      cookie,
    });
    if (!created.ok || created.json?.success === false) {
      return reply({ user_message: `Não consegui criar o ticket interno no ScrumHub: ${created.json?.error || created.json?.message || `HTTP ${created.status}`}` });
    }

    if (nota) fs.rmSync(notaFile, { force: true });
    const ticket = created.json?.data || created.json || {};
    const id = Number(ticket.id || ticket.ticket_id) || null;
    const anterior = readState();
    writeState({
      ...anterior,
      fingerprint,
      ticketId: id,
      head,
      at: new Date().toISOString(),
      criados: [...new Set([...(anterior.criados || []), id])].filter(Boolean).slice(-100),
      sessionCookie: cookie,
      sessionAt: Date.now(),
    });
    return reply({ user_message: `Ticket interno criado: ${ORIGIN}/companies/${COMPANY_ID}/projects/${PROJECT_ID} (#${id || 'novo'})` });
  } catch (error) {
    return reply({ user_message: `Falha ao criar ticket interno: ${error instanceof Error ? error.message : String(error)}` });
  }
}

await main();
