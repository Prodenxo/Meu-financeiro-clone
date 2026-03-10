export interface AppUpdate {
  id: string;
  date: string;
  title: string;
  summary: string;
  details: string;
}

// Lista de novidades do sistema, ordenada da mais recente para a mais antiga
export const APP_UPDATES: AppUpdate[] = [
  {
    id: '2026-03-09-filtros-transacoes',
    date: '2026-03-09',
    title: 'Transações',
    summary: 'Deixamos a tela de transações mais fácil para buscar, filtrar e organizar suas movimentações.',
    details:
      '• Agora ficou mais simples encontrar um lançamento digitando partes do nome ou das observações, mesmo que você não escreva exatamente igual.\n' +
      '• No campo de busca, incluímos um ícone de filtro para você escolher se quer procurar por descrição, observações, status ou valor.\n' +
      '• Você pode organizar a lista clicando no nome das colunas (como Descrição, Valor ou Data), mudando entre ordem crescente, decrescente ou voltando ao modo padrão.\n' +
      '• Adicionamos botões para ver apenas Receitas, apenas Despesas ou tudo junto, com cores verde para receitas e vermelho para despesas.',
  },
];

