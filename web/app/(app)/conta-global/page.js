import { requireUser } from '@/lib/auth/session';
import { loadContaGlobalData } from '@/lib/data/contaGlobal';
import { ContaGlobalView } from '@/components/conta-global/ContaGlobalView';

export const metadata = { title: 'Conta global' };
export const dynamic = 'force-dynamic';

export default async function ContaGlobalPage() {
  const session = await requireUser();
  const data = await loadContaGlobalData(session.supabase, session.userId);
  return <ContaGlobalView data={data} />;
}
