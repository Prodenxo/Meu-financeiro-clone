import { requireUser } from '@/lib/auth/session';
import { loadCategoriasData } from '@/lib/data/categorias';
import { nowInAppTimeZone, parseMonthParam } from '@/lib/date';
import { CategoriasView } from '@/components/categorias/CategoriasView';

export const metadata = { title: 'Categorias' };
export const dynamic = 'force-dynamic';

export default async function CategoriasPage({ searchParams }) {
  const params = await searchParams;
  const session = await requireUser();

  const now = nowInAppTimeZone();
  const currentMonth = { year: now.year, month: now.month };
  const initialMonth = parseMonthParam(typeof params?.mes === 'string' ? params.mes : '', currentMonth);
  const initialTipo = params?.tipo === 'entrada' ? 'entrada' : 'saida';

  const data = await loadCategoriasData(session.supabase, session.userId);

  return <CategoriasView data={data} userId={session.userId} initialMonth={initialMonth} initialTipo={initialTipo} currentMonth={currentMonth} />;
}
