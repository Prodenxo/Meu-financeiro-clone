/** Cores por categoria — porta de `frontend/lib/categoryColors.ts` (paleta clara). */
const LIGHT_SLICE = ['#2563EB', '#10B981', '#F59E0B', '#0EA5E9', '#1E40AF', '#059669', '#DC2626', '#0284C7'];

export function getCategorySliceColor(index) {
  return LIGHT_SLICE[Math.abs(index) % LIGHT_SLICE.length];
}

/** Cor estável para um id de categoria (mesmo hash do Expo). */
export function getCategorySliceColorForId(categoryId) {
  const raw = String(categoryId);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash + raw.charCodeAt(i) * (i + 1)) % 9973;
  }
  return getCategorySliceColor(hash);
}
