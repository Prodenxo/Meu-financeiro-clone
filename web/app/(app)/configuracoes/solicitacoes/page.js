import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getAccessToken } from '@/lib/data/acessos';
import { fetchAccessRequestHistory, fetchPendingAccessRequests } from '@/lib/data/solicitacoes';
import { canReviewAccessRequests, formatAccessRequestError, parseSolicitacoesParams } from '@/lib/acessos/solicitacoes';
import { AccessDeniedCard } from '@/components/acessos/AccessDeniedCard';
import { SolicitacoesView } from '@/components/solicitacoes/SolicitacoesView';

export const metadata = { title: 'Solicitações de acesso' };
export const dynamic = 'force-dynamic';

const DENIED = {
  screen: 'Solicitações de acesso',
  text: 'Só o superadmin pode consultar e gerenciar solicitações de acesso.',
};

/**
 * Solicitações de acesso — exclusivo do superadmin. O papel é conferido aqui antes de qualquer
 * consulta; a Edge Function e a API conferem de novo. Pendentes sempre carregam (contador da aba);
 * o histórico só quando a aba está aberta, porque o relatório é mais pesado.
 */
export default async function SolicitacoesPage({ searchParams }) {
  const sp = await searchParams;
  const session = await requireUser();
  if (!canReviewAccessRequests(session.role)) return <AccessDeniedCard {...DENIED} />;

  const params = parseSolicitacoesParams(sp);
  const token = await getAccessToken(session.supabase);
  if (!token) redirect('/login');

  const [pendingRes, historyRes] = await Promise.allSettled([
    fetchPendingAccessRequests(token),
    params.aba === 'historico' ? fetchAccessRequestHistory(token) : Promise.resolve(null),
  ]);

  const errorOf = (res, label) => {
    if (res.status === 'fulfilled') return null;
    console.error(`Error in solicitacoes/${label}:`, res.reason);
    return formatAccessRequestError(res.reason?.message);
  };

  const data = {
    params,
    pending: pendingRes.status === 'fulfilled' ? pendingRes.value : null,
    pendingError: errorOf(pendingRes, 'list'),
    history: historyRes.status === 'fulfilled' ? historyRes.value : null,
    historyError: errorOf(historyRes, 'report'),
  };

  return <SolicitacoesView data={data} />;
}
