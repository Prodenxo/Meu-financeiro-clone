import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBackendApiBase } from '@/lib/auth/backendApi';

export const dynamic = 'force-dynamic';

const PRIORIDADES = new Set(['baixa', 'media', 'alta', 'critica']);
const MAX_ANEXO_BYTES = 50 * 1024 * 1024;
const MAX_ANEXOS = 10;

/**
 * Abrir chamado — repassa o formulário (com anexos) para `POST /api/support/tickets` do backend,
 * que fala com o ScrumHub. Route Handler (e não Server Action) porque anexos podem ter até 50 MB.
 */
export async function POST(request) {
  const base = getBackendApiBase();
  if (!base) return NextResponse.json({ error: 'API do Meu Financeiro não configurada (MEI_API_URL).' }, { status: 503 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

  let incoming;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulário inválido.' }, { status: 400 });
  }

  const nome = String(incoming.get('nome') || '').trim();
  const prioridade = String(incoming.get('prioridade') || 'media').trim().toLowerCase();
  const prazo = String(incoming.get('prazo') || '').trim();
  if (!nome) return NextResponse.json({ error: 'Informe o assunto do chamado.' }, { status: 400 });
  if (!PRIORIDADES.has(prioridade)) return NextResponse.json({ error: 'Prioridade inválida.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return NextResponse.json({ error: 'Selecione uma data de prazo válida.' }, { status: 400 });

  const outgoing = new FormData();
  outgoing.append('nome', nome);
  outgoing.append('prioridade', prioridade);
  outgoing.append('prazo', prazo);
  for (const key of ['descricao', 'nome_solicitante', 'email_solicitante', 'contato_solicitante']) {
    const value = String(incoming.get(key) || '').trim();
    if (value) outgoing.append(key, value);
  }

  const files = incoming.getAll('anexos').filter((f) => typeof f === 'object' && f && typeof f.arrayBuffer === 'function' && f.size > 0);
  if (files.length > MAX_ANEXOS) return NextResponse.json({ error: `Envie no máximo ${MAX_ANEXOS} anexos.` }, { status: 400 });
  for (const file of files) {
    if (file.size > MAX_ANEXO_BYTES) {
      return NextResponse.json({ error: `Anexo "${file.name || 'arquivo'}" excede 50MB.` }, { status: 400 });
    }
    outgoing.append('anexos', file, file.name || 'anexo');
  }

  let res;
  try {
    res = await fetch(`${base}/support/tickets`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: outgoing,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error in support/tickets:', error);
    return NextResponse.json({ error: 'Não foi possível falar com o suporte agora. Tente novamente.' }, { status: 502 });
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || payload?.success === false) {
    return NextResponse.json({ error: payload?.message || payload?.error || 'Não foi possível abrir o chamado.' }, { status: res.status || 502 });
  }
  const data = payload?.data ?? payload ?? {};
  return NextResponse.json({ ok: true, message: data.message || payload?.message || 'Chamado criado com sucesso.', url: data.url || null });
}
