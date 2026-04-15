/** Contrato BFF cadastro empresa — arquitetura ALNFB §6.3 (`runtimeDecision`). */
export type EmpresaCadastroRuntimeDecision = {
  scenario?: string;
  attemptMode?: 'nacional' | 'municipal';
  upstreamCallSkipped?: boolean;
  consultedMunicipio?: boolean;
  codigoIbge?: string;
  [key: string]: unknown;
};
