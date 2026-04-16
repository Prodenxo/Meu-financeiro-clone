/**
 * Estados UX SOL (cadastro no emissor) — encadeamento POST falhou → GET "não encontrado".
 * @see docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md
 * @see docs/technical/architecture-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md
 */

export type PlugnotasEmpresaCadastroSolUxState = 'L0' | 'L1' | 'L2' | 'L3' | 'none';

export type PlugnotasEmpresaCadastroSolUxInput = {
  /** `true` quando o último POST empresa fase 2 foi bem-sucedido; `false` quando falhou; `null` se desconhecido. */
  lastPostEmpresaPhase2Ok: boolean | null;
  lastGetEmpresaNotFound: boolean;
  /** Painel âmbar de retry (cadastro empresa pendente) visível. */
  postErrorPanelVisible: boolean;
  /** Story FR-SOL-P1: falha recente persistida em sessão após reload. */
  sessionPostFailedFlag: boolean;
};

/**
 * Prioridade: L0 → ausência de "not found" → L1 (painel POST + consulta) → L2 (sessão) → L3 (frio).
 */
export function resolvePlugnotasEmpresaCadastroSolUxState(
  input: PlugnotasEmpresaCadastroSolUxInput
): PlugnotasEmpresaCadastroSolUxState {
  const {
    lastPostEmpresaPhase2Ok,
    lastGetEmpresaNotFound,
    postErrorPanelVisible,
    sessionPostFailedFlag
  } = input;

  if (lastPostEmpresaPhase2Ok === true && !lastGetEmpresaNotFound) {
    return 'L0';
  }
  if (lastPostEmpresaPhase2Ok === true && lastGetEmpresaNotFound) {
    return 'none';
  }
  if (!lastGetEmpresaNotFound) {
    return 'none';
  }
  if (postErrorPanelVisible) {
    return 'L1';
  }
  if (sessionPostFailedFlag) {
    return 'L2';
  }
  return 'L3';
}

/** Spec UX §4.1 — título do encadeamento POST → GET. */
export const PLUGNOTAS_SOL_L1_TITLE = 'Cadastro ainda não foi criado no emissor';

/** Spec UX §4.1 — corpo. */
export const PLUGNOTAS_SOL_L1_BODY =
  'Enquanto o registro da empresa não for concluído com sucesso, a consulta pode mostrar que a empresa não foi encontrada. Isso não indica problema com o seu CNPJ em si — indica que o passo anterior precisa ser corrigido ou tentado de novo.';

/** Spec UX §4.2 — linha compacta (ex.: separador Emissão fiscal). */
export const PLUGNOTAS_SOL_COMPACT_CHAIN_LINE =
  'O cadastro no emissor ainda não foi concluído. Veja a mensagem de erro acima e tente registrar de novo.';

/** Linha compacta quando o estado seria L2 (story P1) — mesmo tom sem truncar. */
export const PLUGNOTAS_SOL_COMPACT_L2_LINE =
  'O registro da empresa ainda está pendente. Resolva o erro de envio antes de esperar dados na consulta.';

/** Spec UX §5.1 SOL-L2 — título. */
export const PLUGNOTAS_SOL_L2_TITLE = 'Registro da empresa ainda pendente';

/** Spec UX §5.1 SOL-L2 — corpo. */
export const PLUGNOTAS_SOL_L2_BODY =
  'A consulta não encontrou a empresa no emissor fiscal. Se você já tentou enviar os dados e viu uma mensagem de erro, resolva esse ponto primeiro e use “Tentar registrar empresa novamente”. Só depois a consulta deve mostrar os dados.';

/** Spec UX §5.2 SOL-L3 — título. */
export const PLUGNOTAS_SOL_L3_TITLE = 'Conclua o registro da empresa';

/** Spec UX §5.2 SOL-L3 — corpo. */
export const PLUGNOTAS_SOL_L3_BODY =
  'Para aparecer aqui, a empresa precisa ser registrada no emissor fiscal com os dados que você informar abaixo. Preencha o formulário e envie.';

/** Spec UX §7 — passos do playbook (ordem fixa). */
export const PLUGNOTAS_SOL_PLAYBOOK_STEPS: readonly string[] = [
  'No painel do emissor, confira se NFS-e Nacional está ativo para este CNPJ e se o ambiente (produção ou homologação) corresponde ao que o site usa.',
  'Se apareceu mensagem de erro ao enviar, leia o texto da mensagem — ele indica o que o emissor pediu.',
  'Se tudo parecer correto, use o suporte do emissor ou o guia de operação fiscal.'
] as const;
