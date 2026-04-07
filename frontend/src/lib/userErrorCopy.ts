import type { UserErrorCategory, UserErrorSource } from '../types/userFacingError';

/** Copy canónica v1.0 — spec UX §6 (título + descrição + rótulos de CTA). */
export const USER_ERROR_COPY: Record<
  UserErrorCategory,
  { title: string; description: string; primaryRetry: string }
> = {
  rede: {
    title: 'Ligação à internet instável',
    description:
      'Não foi possível comunicar com o servidor. Verifique se está ligado à internet e tente outra vez.',
    primaryRetry: 'Tentar novamente',
  },
  indisponivel: {
    title: 'Serviço temporariamente indisponível',
    description:
      'O serviço está a demorar mais do que o habitual ou não respondeu. Espere um momento e tente novamente.',
    primaryRetry: 'Tentar novamente',
  },
  sessao: {
    title: 'Sessão expirada ou inválida',
    description: 'Por segurança, precisa de voltar a entrar na conta para continuar.',
    primaryRetry: 'Entrar novamente',
  },
  permissao: {
    title: 'Não tem permissão para esta ação',
    description:
      'A sua conta não pode executar esta operação. Se precisar de acesso, fale com o administrador da empresa.',
    primaryRetry: 'Voltar',
  },
  validacao_cliente: {
    title: 'Revise os dados indicados',
    description:
      'Alguns campos estão em falta ou incorretos. Corrija os valores assinalados e envie de novo.',
    primaryRetry: 'Tentar novamente',
  },
  provedor_fiscal: {
    title: 'A nota não foi aceite pelo serviço de emissão',
    description:
      'O emissor fiscal devolveu uma validação. Leia os detalhes abaixo, ajuste os dados conforme a mensagem e tente emitir novamente.',
    primaryRetry: 'Tentar novamente',
  },
  validacao_servidor: {
    title: 'Não foi possível concluir o pedido',
    description:
      'Os dados enviados não foram aceites. Verifique as informações e tente outra vez. Se o problema continuar, contacte o suporte.',
    primaryRetry: 'Tentar novamente',
  },
  desconhecido: {
    title: 'Algo inesperado aconteceu',
    description:
      'Não conseguimos concluir esta operação. Tente novamente, verifique a ligação à internet ou contacte o suporte e diga o que estava a fazer.',
    primaryRetry: 'Tentar novamente',
  },
};

/** Linha opcional “fonte” — spec UX §3.1. */
export const USER_ERROR_SOURCE_LABEL: Record<UserErrorSource, string | null> = {
  app: null,
  network: 'Isto costuma estar ligado à sua ligação à internet.',
  backend: 'O servidor não conseguiu concluir o pedido.',
  provedor_fiscal:
    'Esta informação foi enviada pelo serviço de emissão de notas (emissor fiscal), não pelo Meu Financeiro.',
  third_party: 'Um serviço externo devolveu um aviso.',
};

export const USER_ERROR_SECONDARY = {
  voltarInicio: 'Voltar ao início',
  contactarSuporte: 'Contactar suporte',
} as const;
