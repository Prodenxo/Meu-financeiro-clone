/** Contrato alinhado a `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` §5. */

export type UserErrorCategory =
  | 'rede'
  | 'indisponivel'
  | 'sessao'
  | 'permissao'
  | 'validacao_cliente'
  | 'provedor_fiscal'
  | 'validacao_servidor'
  | 'desconhecido';

export type UserErrorSource = 'app' | 'network' | 'backend' | 'provedor_fiscal' | 'third_party';

export type UserErrorSeverity = 'error' | 'warning' | 'info';

export type UserErrorVariant = 'inline' | 'page_banner' | 'modal_body' | 'toast';

export type UserErrorAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Se true, apresentação secundária (estilo link). */
  secondary?: boolean;
};

export type UserFacingErrorProps = {
  variant: UserErrorVariant;
  category: UserErrorCategory;
  source: UserErrorSource;
  severity: UserErrorSeverity;
  recoverable: boolean;
  title: string;
  description: string;
  /** Texto longo do servidor, JSON legível, etc. */
  technicalDetail?: string | null;
  primaryAction?: UserErrorAction | null;
  secondaryAction?: UserErrorAction | null;
  /** Callback quando o utilizador aciona “Copiar para suporte” (texto já sanitizado é responsabilidade do handler, se aplicável). */
  onCopySupportDetail?: () => void;
  /**
   * Se true e existir `technicalDetail`, mostra a acção terciária com sanitização (NFR-ERR-03).
   * Omitido/false = não mostrar cópia por defeito (mitigação QA: evita ruído na UI).
   */
  showCopyForSupport?: boolean;
  /** id estável para testes e `aria-labelledby`. */
  titleId?: string;
  className?: string;
  /**
   * Substitui o rodapé de fonte por defeito (`USER_ERROR_SOURCE_LABEL`) quando definido
   * (ex.: gateway upstream Plugnotas — UX spec certificado 2026-04-08).
   */
  sourceFootnote?: string | null;
  /**
   * Se definido, dispara `reportUserErrorShown` no mount (FR-ERR-B08 / P2).
   * Usar o mesmo valor que `surfaceId` do mapper quando existir.
   */
  analyticsSurfaceId?: string;
};
