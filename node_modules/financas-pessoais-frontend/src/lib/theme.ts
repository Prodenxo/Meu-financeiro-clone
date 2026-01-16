// Configuração de cores para tema claro e escuro
export const theme = {
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    primary: '#2563eb',
    primaryDark: '#1e40af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#e5e7eb',
  },
  dark: {
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
  },
};

export type ThemeMode = 'light' | 'dark';

