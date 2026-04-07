import type { UserFacingErrorProps } from '../types/userFacingError';

/** Propaga `ctx.surfaceId` → `analyticsSurfaceId` no bloco (FR-ERR-P2 / FR-ERR-B08). */
export function attachAnalyticsSurfaceFromCtx(
  surfaceId: string | undefined,
  props: UserFacingErrorProps
): UserFacingErrorProps {
  const s = surfaceId?.trim();
  if (!s) return props;
  return { ...props, analyticsSurfaceId: s };
}
