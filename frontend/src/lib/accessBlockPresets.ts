import type { AccessBlockedExplainerProps } from '../components/AccessBlockedExplainer';

/** Valores em `location.state.accessBlock` (UX-GLOBAL-04). */
export type AccessBlockKind = 'mei-required' | 'admin-settings-restricted';

export function meiRequiredAccessBlockProps(): Omit<AccessBlockedExplainerProps, 'onDismiss' | 'testId'> {
  return {
    title: 'Área Mei Infinito não disponível',
    explanation:
      'A Guia MEI, o catálogo para NFS-e e as ferramentas associadas só ficam disponíveis quando o perfil MEI está ativo na tua conta.',
    nextStep:
      'Para pedir ativação ou esclarecimentos, contacta o suporte ou um administrador da tua organização.',
    primaryCta: { label: 'Ir às transações', to: '/transacoes' },
  };
}

export function adminSettingsRestrictedAccessBlockProps(): Omit<
  AccessBlockedExplainerProps,
  'onDismiss' | 'testId'
> {
  return {
    title: 'Acesso reservado a administradores',
    explanation:
      'A página que tentaste abrir só está disponível para utilizadores com perfil de administrador.',
    nextStep: 'Se precisares deste acesso, pede a um administrador da organização.',
    primaryCta: { label: 'Voltar ao início', to: '/' },
  };
}
