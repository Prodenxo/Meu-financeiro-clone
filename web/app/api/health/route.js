/** Probe de saúde (Docker/Easypanel) — não depende de Supabase. */
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, service: 'meu-financeiro-web' }, { status: 200 });
}
