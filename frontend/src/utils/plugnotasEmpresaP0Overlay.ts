/**
 * P0 overlay UX (FR-P0-OUT-01 / FR-P0-OUT-02) — composição com SOL sem duplicar copy SOL.
 * @see docs/specs/ux-spec-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md — secções 3, 6, 7
 * @see docs/technical/architecture-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md — secção 6
 */

export type PlugnotasEmpresaP0UxOverlay =
  | { kind: 'none' }
  | { kind: 'impossibility' }
  | { kind: 'phaseSuccess' };

export type ResolvePlugnotasEmpresaP0OverlayInput = {
  /** `VITE_MEI_PLUGNOTAS_EMPRESA_CADASTRO_MODE === 'blocked_externally'` */
  configuracaoCadastroBloqueadoExternamente: boolean;
  lastPostEmpresaPhase2Ok: boolean | null;
  /** Sem erro de consulta GET, ou erro que não seja "empresa não encontrada" após POST (GET alinhado a dados). */
  lastGetEmpresaHasData: boolean;
  /** Painel âmbar de retry (fase 2) visível — utilizador ainda no ramo 400. */
  postErrorPanelVisible: boolean;
};

/**
 * Prioridade: sucesso de fase (P0-L2) > bloqueio honesto (P0-L1) > nenhum.
 */
export function resolvePlugnotasEmpresaP0Overlay(
  input: ResolvePlugnotasEmpresaP0OverlayInput
): PlugnotasEmpresaP0UxOverlay {
  const {
    configuracaoCadastroBloqueadoExternamente,
    lastPostEmpresaPhase2Ok,
    lastGetEmpresaHasData,
    postErrorPanelVisible
  } = input;

  if (lastPostEmpresaPhase2Ok === true && lastGetEmpresaHasData) {
    return { kind: 'phaseSuccess' };
  }
  /** POST já passou: não sobrepor com P0-L1 enquanto a consulta GET ainda não está alinhada. */
  if (lastPostEmpresaPhase2Ok === true) {
    return { kind: 'none' };
  }
  if (configuracaoCadastroBloqueadoExternamente && postErrorPanelVisible) {
    return { kind: 'impossibility' };
  }
  return { kind: 'none' };
}

/** Leitura central da env Vite — valores: `auto` (omissão) | `blocked_externally`. */
export function readMeiPlugnotasEmpresaCadastroBlockedExternally(): boolean {
  const raw = import.meta.env.VITE_MEI_PLUGNOTAS_EMPRESA_CADASTRO_MODE;
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return v === 'blocked_externally';
}

/** Spec UX secção 6 — título P0-L1. */
export const PLUGNOTAS_P0_L1_TITLE = 'Não foi possível concluir o cadastro automaticamente';

/** Spec UX secção 6 — parágrafos (corpo). */
export const PLUGNOTAS_P0_L1_BODY_PARAS: readonly string[] = [
  'Neste momento, o emissor fiscal não aceita concluir o registro da empresa só pelos dados que enviamos pelo site. Isso pode depender da configuração da sua conta ou do plano no painel do emissor.',
  'Siga o guia de operação fiscal ou fale com o suporte do emissor antes de tentar de novo.'
] as const;

/** Spec UX secção 6 — `aria-label` da região P0-L1. */
export const PLUGNOTAS_P0_L1_ARIA_LABEL = 'Cadastro no emissor fiscal indisponível neste cenário';

/** Spec UX secção 7 — mensagem curta P0-L2 (`role="status"`). */
export const PLUGNOTAS_P0_L2_STATUS_MESSAGE = 'Empresa registrada no emissor fiscal.';
