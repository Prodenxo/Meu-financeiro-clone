import type { UserFacingErrorProps } from '../types/userFacingError';
import { attachAnalyticsSurfaceFromCtx } from './attachAnalyticsSurfaceFromCtx';
import { getPlugnotasCodeFromUnknownError } from '../utils/apiClientError';
import { mapMeiFiscalErrorFromUnknown } from './fiscalUserError';
import { mapUnknownErrorToUserFacing } from './mapUnknownErrorToUserFacing';
import { meiFiscalUserCopyToUserFacing } from './meiFiscalUserCopyToUserFacing';

const MODAL_EMBED_CLASS =
  'mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent';

function plainMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === 'string' && err.trim()) return err.trim();
  return fallback;
}

/**
 * Catálogo MEI: Plugnotas → adapter fiscal; caso contrário mapper genérico (FR-ERR-P0-D).
 * @param surfaceId opcional — alinhado ao inventário (ex. `mei_catalogo.clientes.modal`) para analytics P2.
 */
export function mapMeiCatalogApiErrorToUserFacing(
  err: unknown,
  fallbackMessage: string,
  surfaceId?: string
): UserFacingErrorProps {
  const code = getPlugnotasCodeFromUnknownError(err);
  if (code) {
    const copy = mapMeiFiscalErrorFromUnknown(err, fallbackMessage);
    const raw = plainMessage(err, fallbackMessage);
    const props = meiFiscalUserCopyToUserFacing(copy, {
      variant: 'modal_body',
      rawMessage: raw,
      plugnotasCode: code,
      className: MODAL_EMBED_CLASS,
    });
    return attachAnalyticsSurfaceFromCtx(surfaceId, props);
  }
  return mapUnknownErrorToUserFacing(err ?? new Error(fallbackMessage), {
    variant: 'modal_body',
    className: MODAL_EMBED_CLASS,
    surfaceId,
  });
}
