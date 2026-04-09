import type { PlugnotasEmpresaCadastroSolUxState } from '../utils/plugnotasEmpresaCadastroSolUx';
import {
  PLUGNOTAS_SOL_COMPACT_CHAIN_LINE,
  PLUGNOTAS_SOL_COMPACT_L2_LINE,
  PLUGNOTAS_SOL_L1_BODY,
  PLUGNOTAS_SOL_L1_TITLE,
  PLUGNOTAS_SOL_L2_BODY,
  PLUGNOTAS_SOL_L2_TITLE,
  PLUGNOTAS_SOL_L3_BODY,
  PLUGNOTAS_SOL_L3_TITLE,
  PLUGNOTAS_SOL_PLAYBOOK_STEPS
} from '../utils/plugnotasEmpresaCadastroSolUx';
import { getNfseNacionalOperacaoHelpHref } from '../utils/nfseNacionalPlugnotasErrorHints';

export type PlugnotasEmpresaCadastroSolContextPanelProps = {
  state: PlugnotasEmpresaCadastroSolUxState;
  /** Spec UX §4.2 — uma linha (ex.: área densa Emissão fiscal). */
  compact?: boolean;
  /** FR-SOL-PLAY-01 — bloco <details> com três passos. */
  showPlaybook?: boolean;
};

/** FR-BRIEF-OP-05: nome acessível não deve sugerir que a consulta é a causa principal sem o contexto de cadastro pendente. */
const REGION_LABEL_L1 =
  'Cadastro ainda não concluído no emissor; a consulta pode indicar que a empresa não foi encontrada';
const REGION_LABEL_L2 = 'Cadastro da empresa ainda pendente no emissor';
const REGION_LABEL_L3 = 'Como concluir o registro da empresa no emissor';

/**
 * Copy contextual FR-SOL — encadeamento POST → GET 404 (sem role="alert"; o painel de erro principal já alerta).
 */
export function PlugnotasEmpresaCadastroSolContextPanel({
  state,
  compact = false,
  showPlaybook = true
}: PlugnotasEmpresaCadastroSolContextPanelProps) {
  if (state === 'none' || state === 'L0') {
    return null;
  }

  if (compact && (state === 'L1' || state === 'L3' || state === 'L2')) {
    const line =
      state === 'L2' ? PLUGNOTAS_SOL_COMPACT_L2_LINE : PLUGNOTAS_SOL_COMPACT_CHAIN_LINE;
    return (
      <p className="mt-2 text-xs leading-relaxed text-rose-800/90 dark:text-rose-300/85" role="status">
        {line}
      </p>
    );
  }

  if (state === 'L2') {
    return (
      <div
        role="region"
        aria-label={REGION_LABEL_L2}
        className="mt-3 space-y-2 rounded-md border border-slate-200/90 bg-slate-50/90 p-3 text-sm dark:border-slate-700/80 dark:bg-slate-900/40"
      >
        <p className="font-semibold text-slate-800 dark:text-slate-100">{PLUGNOTAS_SOL_L2_TITLE}</p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{PLUGNOTAS_SOL_L2_BODY}</p>
        {showPlaybook ? <SolPlaybookDetails /> : null}
      </div>
    );
  }

  if (state === 'L3') {
    return (
      <div
        role="region"
        aria-label={REGION_LABEL_L3}
        className="mt-3 space-y-2 rounded-md border border-slate-200/90 bg-slate-50/90 p-3 text-sm dark:border-slate-700/80 dark:bg-slate-900/40"
      >
        <p className="font-semibold text-slate-800 dark:text-slate-100">{PLUGNOTAS_SOL_L3_TITLE}</p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{PLUGNOTAS_SOL_L3_BODY}</p>
        {showPlaybook ? <SolPlaybookDetails /> : null}
      </div>
    );
  }

  /* L1 */
  return (
    <div
      role="region"
      aria-label={REGION_LABEL_L1}
      className="mt-3 space-y-2 rounded-md border border-slate-200/90 bg-slate-50/90 p-3 text-sm dark:border-slate-700/80 dark:bg-slate-900/40"
    >
      <p className="font-semibold text-slate-800 dark:text-slate-100">{PLUGNOTAS_SOL_L1_TITLE}</p>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{PLUGNOTAS_SOL_L1_BODY}</p>
      {showPlaybook ? <SolPlaybookDetails /> : null}
    </div>
  );
}

function SolPlaybookDetails() {
  const href = getNfseNacionalOperacaoHelpHref();
  return (
    <details className="text-xs text-slate-600 dark:text-slate-300">
      <summary className="cursor-pointer font-medium text-slate-700 underline decoration-slate-400/70 underline-offset-2 hover:text-slate-900 dark:text-slate-200 dark:decoration-slate-500 dark:hover:text-slate-100">
        O que fazer agora?
      </summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
        {PLUGNOTAS_SOL_PLAYBOOK_STEPS.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="mt-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ver guia de operação fiscal
        </a>
      </p>
    </details>
  );
}
