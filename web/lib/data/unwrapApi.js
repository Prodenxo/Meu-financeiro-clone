/**
 * A API Express responde com `{ success, data, message }` (`sendSuccess`).
 * Algumas rotas antigas devolvem a lista direto. `null` = formato inesperado.
 */
export function unwrapApiList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) return payload.data;
  return null;
}
