import type { UserErrorVariant } from '../types/userFacingError';
import type { ApiErrorPayload } from '../utils/buildApiErrorMessage';

export type MapUserFacingContext = {
  variant: UserErrorVariant;
  /** Propagado para `UserFacingErrorProps.analyticsSurfaceId` (FR-ERR-B08 / P2). */
  surfaceId?: string;
  httpStatus?: number;
  errorPayload?: ApiErrorPayload | null;
  onRetry?: () => void;
  retryLabel?: string;
  titleId?: string;
  className?: string;
};
