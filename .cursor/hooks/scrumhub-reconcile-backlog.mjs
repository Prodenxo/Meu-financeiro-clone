#!/usr/bin/env node
/**
 * Alinha tickets internos do ScrumHub (projeto 40) com o backlog real do clone.
 *
 * Uso:
 *   node .cursor/hooks/scrumhub-reconcile-backlog.mjs           # simula (dry-run)
 *   node .cursor/hooks/scrumhub-reconcile-backlog.mjs --apply   # grava no ScrumHub
 *
 * Duplicatas são removidas (DELETE), não ficam como [dup] na lista.
 *
 * Credenciais: ~/.cursor/scrumhub/scrumhub.local.env
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ID = 40;
const ORIGIN = 'https://scrumhub.com.br';
const API_FALLBACK = 'https://scrumhub-scrumhub-backend.sf83tr.easypanel.host';
const envFile = path.join(os.homedir(), '.cursor', 'scrumhub', 'scrumhub.local.env');

const APPLY = process.argv.includes('--apply');

/** Backlog canónico (site Next + backend neste repo). status: pendente | concluido */
const BACKLOG = [
  {
    match: /visão bpo|visao bpo|bpo matrix|bpo na visão/i,
    nome: 'Visão BPO na Visão geral (site Next)',
    descricao:
      'Matriz anual BPO em /visao-geral?vista=bpo, gráficos e busca por categoria. Porta do app Expo.\n\nRepo: web/components/dashboard/Bpo*.jsx, web/lib/finance/bpo.js',
    status: 'concluido',
  },
  {
    match: /open finance|pluggy|webhook pluggy|conectar banco/i,
    nome: 'Open Finance (Pluggy) — conectar, saldo e extrato',
    descricao:
      'Backend: sync, webhook, cron. Web: Conectar banco, poll, Realtime.\nSaldo e lançamentos juntos no sync. Logos da instituição (URL Pluggy).\n\nDeploy: backend Easypanel + migrations Supabase OF.',
    status: 'concluido',
  },
  {
    match: /easypanel|docker.*web|standalone|meiinfinito|frontsite/i,
    nome: 'Publicar site Next (web/) no Easypanel',
    descricao:
      'Dockerfile web/, porta 3000, NEXT_PUBLIC_SUPABASE_* + MEI_API_URL.\nDomínio meiinfinito.com.br → serviço frontsiteappmeufinanceiro.',
    status: 'pendente',
  },
  {
    match: /acessos|imperson|solicitações de acesso|configuracoes\/acessos/i,
    nome: 'Central de acessos e impersonação (site)',
    descricao: 'Rota /configuracoes/acessos — KPIs, convites, acessar como usuário, banner voltar.',
    status: 'concluido',
  },
  {
    match: /transaç|transacoes|lançamentos na tela/i,
    nome: 'Tela de transações no site Next',
    descricao: 'Filtros, resumo, recorrências, editar, exportar Excel — paridade com Expo.',
    status: 'concluido',
  },
  {
    match: /tela de contas|contas no site|\/contas/i,
    nome: 'Tela de contas no site Next',
    descricao: 'Cards, saldo, gráfico, Open Finance, resumo por instituição.',
    status: 'concluido',
  },
  {
    match: /orçamento|orcamento|budget/i,
    nome: 'Orçamentos no site Next',
    descricao: 'Tela /orcamentos, modal, colar planilha, categorias.',
    status: 'concluido',
  },
  {
    match: /categorias no site|categorias.*next/i,
    nome: 'Categorias no site Next',
    descricao: 'Gestão de categorias de receita/despesa no web/.',
    status: 'concluido',
  },
  {
    match: /agenda|google calendar/i,
    nome: 'Agenda e Google Calendar no site',
    descricao: 'Integração calendário + modal transações.',
    status: 'concluido',
  },
  {
    match: /tutoriais|central de tutoriais/i,
    nome: 'Central de tutoriais no site',
    descricao: 'Listagem, gerenciar, suporte.\n\nRepo: web/app/tutoriais, web/components/tutoriais',
    status: 'concluido',
  },
  {
    match: /dashboard visão geral|dashboard visao geral|visão geral no site|visao geral no site|kpis.*visão geral/i,
    excludeTitle: /bpo/i,
    nome: 'Dashboard Visão geral no site Next',
    descricao:
      'KPIs, gráficos e navegação (incl. link para vista BPO).\n\nRepo: web/app/visao-geral, web/components/dashboard',
    status: 'concluido',
  },
  {
    match: /realtime|supabase realtime|lançamentos.*tempo/i,
    nome: 'Realtime de lançamentos (Supabase)',
    descricao: 'Subscription em transações/lançamentos após sync Open Finance.\n\nRepo: migrations lancamentos_realtime',
    status: 'concluido',
  },
  {
    match: /health|healthcheck|api\/health/i,
    nome: 'Healthcheck do site Next (Easypanel)',
    descricao: 'Rota GET /api/health sem depender de Supabase; Dockerfile HEALTHCHECK.\n\nRepo: web/app/api/health',
    status: 'pendente',
  },
  {
    match: /chamado|suporte|scrumhub.*duplic|ticket.*suporte/i,
    nome: 'Chamados de suporte (ScrumHub) sem duplicar',
    descricao: 'Modal Abrir chamado: idempotência + hook Cursor sem spam de tickets iguais.',
    status: 'concluido',
  },
  {
    match: /migra|expo.*next|site novo|web\/\)/i,
    nome: 'Migração do app Expo para site Next (web/)',
    descricao: 'Monorepo: web/ Next.js + backend/ API. Repo focado no site novo.',
    status: 'concluido',
  },
];

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
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')]
        : [];
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

async function login(email, password) {
  const payload = email.includes('@') ? { email, password } : { telefone: email, password };
  const result = await requestWithFallback('/auth/login', { method: 'POST', body: payload });
  if (!result.ok || result.json?.success === false) {
    throw new Error(result.json?.error || result.json?.message || `HTTP ${result.status}`);
  }
  const cookie =
    result.cookie ||
    (result.json?.token ? `token=${result.json.token}` : '') ||
    (result.json?.data?.token ? `token=${result.json.data.token}` : '');
  if (!cookie) throw new Error('Login ok, mas sem cookie de sessão');
  return cookie;
}

function normalizeTitle(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isInterno(ticket) {
  const v = ticket?.is_externo;
  if (v === undefined || v === null) return true;
  return v === false || Number(v) === 0;
}

function isDupMarker(ticket) {
  return /^\[dup\]/i.test(String(ticket?.nome || '').trim());
}

function pickKeepTicket(group) {
  const live = group.filter((t) => !isDupMarker(t));
  const pool = live.length ? live : group;
  pool.sort((a, b) => Number(b.id) - Number(a.id));
  return pool[0];
}

function statusNome(ticket, statusById) {
  const id = Number(ticket?.status_id);
  if (id && statusById.has(id)) return statusById.get(id);
  return String(ticket?.status?.nome || ticket?.status_nome || '').toLowerCase();
}

async function main() {
  const env = { ...loadEnvFile(envFile), ...process.env };
  const email = String(env.SCRUMHUB_EMAIL || env.SCRUMHUB_USER || '').trim();
  const password = String(env.SCRUMHUB_PASSWORD || env.SCRUMHUB_SENHA || '').trim();
  if (!email || !password) {
    console.error('Defina SCRUMHUB_EMAIL e SCRUMHUB_PASSWORD em', envFile);
    process.exit(1);
  }

  const cookie = await login(email, password);

  const statusRes = await requestWithFallback(`/status/projeto/${PROJECT_ID}`, { cookie });
  const statusList = Array.isArray(statusRes.json?.data) ? statusRes.json.data : [];
  const statusById = new Map(statusList.map((s) => [Number(s.id), String(s.nome || '').toLowerCase()]));
  const statusIdByName = (name) => {
    const n = name.toLowerCase();
    const hit = statusList.find((s) => String(s.nome || '').toLowerCase() === n);
    return hit ? Number(hit.id) : null;
  };
  const idPendente = statusIdByName('pendente');
  const idConcluido = statusIdByName('concluído') || statusIdByName('concluido');

  const listRes = await requestWithFallback(`/tickets-pai/projeto/${PROJECT_ID}`, { cookie });
  const tickets = (Array.isArray(listRes.json?.data) ? listRes.json.data : listRes.json?.tickets || []).filter(
    isInterno,
  );

  const actions = [];

  for (const t of tickets) {
    if (isDupMarker(t)) {
      actions.push({ type: 'delete-duplicate', id: t.id, nome: t.nome, reason: 'marcador [dup]' });
    }
  }

  // 1) Duplicatas óbvias: mesmo título normalizado (ex.: vários "Visão BPO dentro...")
  const byTitle = new Map();
  for (const t of tickets) {
    const key = normalizeTitle(t.nome).slice(0, 48);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(t);
  }

  for (const [, group] of byTitle) {
    if (group.length < 2) continue;
    const keep = pickKeepTicket(group);
    const backlogHit = BACKLOG.find((b) => b.match.test(keep.nome || ''));
    for (const dup of group) {
      if (Number(dup.id) === Number(keep.id)) continue;
      actions.push({
        type: 'delete-duplicate',
        id: dup.id,
        nome: dup.nome,
        keepId: keep.id,
        reason: `título igual → #${keep.id}`,
      });
    }
    if (backlogHit && !isDupMarker(keep)) {
      actions.push({
        type: 'update',
        id: keep.id,
        nome: backlogHit.nome,
        descricao: backlogHit.descricao,
        status_id: backlogHit.status === 'concluido' ? idConcluido : idPendente,
      });
    }
  }

  // 2) Garantir um ticket por item do backlog (match por regex no título/descrição)
  for (const item of BACKLOG) {
    const candidates = tickets.filter((t) => {
      if (isDupMarker(t)) return false;
      const title = String(t.nome || '');
      if (item.excludeTitle?.test(title)) return false;
      return item.match.test(title) || item.match.test(t.descricao || '');
    });
    const existing =
      candidates.find((t) => normalizeTitle(t.nome) === normalizeTitle(item.nome)) ||
      candidates.sort((a, b) => Number(b.id) - Number(a.id))[0];
    if (existing) {
      const st = statusNome(existing, statusById);
      const wantConcluido = item.status === 'concluido';
      const needsStatus =
        (wantConcluido && !st.includes('conclu')) || (!wantConcluido && st.includes('conclu'));
      if (
        normalizeTitle(existing.nome) !== normalizeTitle(item.nome) ||
        needsStatus ||
        String(existing.descricao || '').trim().length < 40
      ) {
        actions.push({
          type: 'update',
          id: existing.id,
          nome: item.nome,
          descricao: item.descricao,
          status_id: wantConcluido ? idConcluido : idPendente,
        });
      }
      continue;
    }
    actions.push({
      type: 'create',
      nome: item.nome,
      descricao: item.descricao,
      status_id: item.status === 'concluido' ? idConcluido : idPendente,
    });
  }

  const unique = [];
  const seen = new Set();
  for (const a of actions) {
    const key = `${a.type}:${a.id || a.nome}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (use --apply) ===');
  for (const a of unique) {
    console.log(`- ${a.type}`, a.id ? `#${a.id}` : '', a.nome?.slice(0, 60) || '');
  }

  if (!APPLY) {
    console.log('\nNenhuma alteração enviada. Rode com --apply para executar.');
    return;
  }

  const prazo = new Date();
  prazo.setDate(prazo.getDate() + 7);

  for (const a of unique) {
    if (a.type === 'delete-duplicate') {
      const removed = await request(`${ORIGIN}/tickets-pai/${a.id}`, {
        method: 'DELETE',
        cookie,
      });
      if (!removed.ok) console.error('Falha apagar dup', a.id, removed.json);
      else console.log('Duplicata apagada', a.id, a.keepId ? `→ keep #${a.keepId}` : a.reason || '');
      continue;
    }
    if (a.type === 'create') {
      const created = await requestWithFallback('/tickets-pai', {
        method: 'POST',
        cookie,
        body: {
          projeto_id: PROJECT_ID,
          nome: a.nome,
          descricao: a.descricao,
          prioridade: 'media',
          prazo: prazo.toISOString().slice(0, 10),
          is_externo: 0,
          ...(a.status_id ? { status_id: a.status_id } : {}),
        },
      });
      if (!created.ok) console.error('Falha create', a.nome, created.json);
      else console.log('Criado', a.nome);
    } else {
      const body = {
        nome: a.nome,
        descricao: a.descricao,
        prioridade: 'media',
        ...(a.status_id ? { status_id: a.status_id } : {}),
      };
      const updated = await requestWithFallback(`/tickets-pai/${a.id}`, {
        method: 'PUT',
        cookie,
        body,
      });
      if (!updated.ok) console.error('Falha update', a.id, updated.json);
      else console.log('Atualizado', a.id, a.type);
    }
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
