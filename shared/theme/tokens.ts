// Design tokens — cópia em Site/shared para build Docker (contexto só Site/).
// Fonte canónica do monorepo: ../../shared/theme/tokens.ts na raiz do repositório.

export const designTokens = {
  colors: {
    primary: {
      neon: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.5)',
      dim: 'rgba(59, 130, 246, 0.1)',
      hover: '#60A5FA',
    },
    background: {
      app: '#05050A',
      card: '#111827',
      surface: '#0F172A',
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.05)',
      subtle: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#F8FAFC',
      muted: '#94A3B8',
    },
    status: {
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  effects: {
    glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
    neonGlow: '0 0 15px rgba(59, 130, 246, 0.4)',
  },
  radii: {
    card: '1rem',
    pill: '9999px',
  },
};
