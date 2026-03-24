/**
 * Consulta GET /health do backend (`{ "status": "ok" }`).
 * Não envia credenciais; para indicador DEV apenas.
 */
export async function fetchBackendHealthOk(
  healthUrl: string,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal
    });
    if (!response.ok) return false;
    const data: unknown = await response.json().catch(() => null);
    return Boolean(
      data
      && typeof data === 'object'
      && !Array.isArray(data)
      && (data as { status?: string }).status === 'ok'
    );
  } catch {
    return false;
  }
}
