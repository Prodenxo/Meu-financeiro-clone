import UserFacingErrorBlock from './UserFacingErrorBlock';
import { mapUnknownErrorToUserFacing } from '../lib/mapUnknownErrorToUserFacing';

export type FetchErrorBannerProps =
  | {
      error: unknown;
      onRetry?: () => void;
      retryLabel?: string;
      className?: string;
      surfaceId?: string;
    }
  | {
      message: string;
      title?: string;
      onRetry?: () => void;
      retryLabel?: string;
      className?: string;
      surfaceId?: string;
    };

/**
 * Erro de rede/API: *wrapper* fino sobre {@link UserFacingErrorBlock} (FR-ERR-P0-B).
 */
export default function FetchErrorBanner(props: FetchErrorBannerProps) {
  const onRetry = props.onRetry;
  const retryLabel = props.retryLabel ?? 'Tentar novamente';
  const className = props.className ?? '';
  const surfaceId = props.surfaceId;

  const mapped =
    'error' in props
      ? mapUnknownErrorToUserFacing(props.error, {
          variant: 'page_banner',
          onRetry,
          retryLabel,
          surfaceId,
        })
      : mapUnknownErrorToUserFacing(props.message, {
          variant: 'page_banner',
          onRetry,
          retryLabel,
          surfaceId,
        });

  const merged =
    'error' in props ? mapped : props.title ? { ...mapped, title: props.title } : mapped;

  return <UserFacingErrorBlock {...merged} className={[merged.className, className].filter(Boolean).join(' ')} />;
}
