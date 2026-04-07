/**
 * Copy canónica — PRD §10.2, UX spec orçamentos remover planejamento.
 */

export const ORCAMENTO_REMOVE_PLANNING_TITLE = 'Remover planejamento deste mês?';

export const ORCAMENTO_REMOVE_PLANNING_CONFIRM_BUTTON = 'Remover planejamento';

export const ORCAMENTO_REMOVE_PLANNING_CANCEL_BUTTON = 'Cancelar';

export const ORCAMENTO_REMOVE_PLANNING_TOAST_SUCCESS = 'Planejamento removido.';

export const ORCAMENTO_REMOVE_PLANNING_ERROR_TOAST =
  'Não foi possível remover o planejamento. Tente novamente.';

/** Parágrafos do corpo (três esclarecimentos obrigatórios). */
export function buildOrcamentoRemovePlanningBodyParagraphs(
  nomeCategoria: string,
  mesExtenso: string,
  ano: number
): string[] {
  return [
    `Isto remove apenas o valor planejado de ${nomeCategoria} em ${mesExtenso} de ${ano}.`,
    'Os seus lançamentos e o valor realizado não são apagados.',
    'Não é a mesma coisa que excluir a categoria.'
  ];
}

export function buildOrcamentoRemovePlanningSummaryLine(
  nomeCategoria: string,
  mesExtenso: string,
  ano: number
): string {
  return `${nomeCategoria} · ${mesExtenso} de ${ano}`;
}

export function ariaLabelEditarPlanejamento(nomeCategoria: string): string {
  return `Editar planejamento de ${nomeCategoria}`;
}

export function ariaLabelRemoverPlanejamento(
  nomeCategoria: string,
  mesExtenso: string,
  ano: number
): string {
  return `Remover planejamento de ${nomeCategoria} em ${mesExtenso} de ${ano}`;
}
