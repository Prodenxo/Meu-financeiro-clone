import type { TextStyle, ViewStyle } from 'react-native';

/** Raio e espaçamento — iguais em light/dark (MF Luxury). */
export const mfRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const mfSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const mfTypography = {
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  subtitle: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  title: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  titleLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  money: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.5 },
  moneyLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.6 },
} as const;

export type FinanceSemantic = 'open' | 'received' | 'overdue' | 'forecast';

export interface Theme {
  background: string;
  /** Áreas secundárias (listas, inputs agrupados) — não substitui o fundo principal em light premium. */
  backgroundMuted: string;
  surface: string;
  card: string;

  text: string;
  textSecondary: string;
  textTertiary: string;

  border: string;
  borderLight: string;

  primary: string;
  primaryLight: string;
  primaryDark: string;

  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;

  /** Semântica financeira (referência Assessor, paleta MF). */
  financeOpen: string;
  financeOpenLight: string;
  financeReceived: string;
  financeReceivedLight: string;
  financeOverdue: string;
  financeOverdueLight: string;
  financeForecast: string;
  financeForecastLight: string;

  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;

  calendarBackground: string;
  calendarText: string;
  calendarSelected: string;
  calendarToday: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  /** Cor base para sombras de card (light: slate suave; dark: preto). */
  shadowColor: string;
}

/** Light premium: fundo branco, cards com borda suave e sombra leve. */
export const lightTheme: Theme = {
  background: '#FFFFFF',
  backgroundMuted: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  border: '#E8ECF0',
  borderLight: '#F1F5F9',

  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',

  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',

  financeOpen: '#2563EB',
  financeOpenLight: '#EFF6FF',
  financeReceived: '#10B981',
  financeReceivedLight: '#D1FAE5',
  financeOverdue: '#EF4444',
  financeOverdueLight: '#FEE2E2',
  financeForecast: '#1E40AF',
  financeForecastLight: '#DBEAFE',

  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  placeholder: '#94A3B8',

  calendarBackground: '#FFFFFF',
  calendarText: '#334155',
  calendarSelected: '#2563EB',
  calendarToday: '#2563EB',

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E8ECF0',
  tabActive: '#2563EB',
  tabInactive: '#94A3B8',

  shadowColor: '#0F172A',
};

/**
 * Dark: fundo preto, superfícies em camadas azul‑ardósia; acentos azuis.
 */
export const darkTheme: Theme = {
  background: '#000000',
  backgroundMuted: '#0a0f16',
  surface: '#151b26',
  card: '#1a2230',

  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',

  border: '#2d3a4d',
  borderLight: '#3d4f66',

  primary: '#60a5fa',
  primaryLight: 'rgba(59, 130, 246, 0.22)',
  primaryDark: '#2563eb',

  success: '#34d399',
  successLight: 'rgba(52, 211, 153, 0.16)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.16)',
  warning: '#fbbf24',

  financeOpen: '#60a5fa',
  financeOpenLight: 'rgba(59, 130, 246, 0.18)',
  financeReceived: '#34d399',
  financeReceivedLight: 'rgba(52, 211, 153, 0.16)',
  financeOverdue: '#f87171',
  financeOverdueLight: 'rgba(248, 113, 113, 0.16)',
  financeForecast: '#93c5fd',
  financeForecastLight: 'rgba(147, 197, 253, 0.14)',

  inputBackground: '#0a0a0a',
  inputBorder: '#2d3a4d',
  inputText: '#f1f5f9',
  placeholder: '#64748b',

  calendarBackground: '#151b26',
  calendarText: '#e2e8f0',
  calendarSelected: '#3b82f6',
  calendarToday: '#60a5fa',

  tabBarBackground: '#000000',
  tabBarBorder: '#1f2937',
  tabActive: '#60a5fa',
  tabInactive: '#64748b',

  shadowColor: '#000000',
};

export const getTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? darkTheme : lightTheme;
};

export function getFinanceSemanticColor(theme: Theme, semantic: FinanceSemantic): string {
  switch (semantic) {
    case 'open':
      return theme.financeOpen;
    case 'received':
      return theme.financeReceived;
    case 'overdue':
      return theme.financeOverdue;
    case 'forecast':
      return theme.financeForecast;
    default:
      return theme.primary;
  }
}

export function getFinanceSemanticTint(theme: Theme, semantic: FinanceSemantic): string {
  switch (semantic) {
    case 'open':
      return theme.financeOpenLight;
    case 'received':
      return theme.financeReceivedLight;
    case 'overdue':
      return theme.financeOverdueLight;
    case 'forecast':
      return theme.financeForecastLight;
    default:
      return theme.primaryLight;
  }
}

/** Sombra difusa para MfCard — light premium vs dark elevado. */
export function mfCardElevation(theme: Theme, isDarkMode: boolean): Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
> {
  if (isDarkMode) {
    return {
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 6,
    };
  }
  return {
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  };
}

/** Agenda / modais — sombra visível (overflow não corta no web). */
export function mfAgendaPanelChrome(isDarkMode: boolean): ViewStyle {
  const chrome: ViewStyle = { overflow: 'visible' };
  if (typeof document !== 'undefined') {
    chrome.boxShadow = isDarkMode
      ? '0 12px 48px rgba(0, 0, 0, 0.55), 0 4px 16px rgba(0, 0, 0, 0.42)'
      : '0 8px 32px rgba(15, 23, 42, 0.14), 0 2px 10px rgba(15, 23, 42, 0.08)';
  }
  return chrome;
}

export function mfMoneyTextStyle(theme: Theme, size: 'default' | 'large' = 'default'): TextStyle {
  return {
    ...(size === 'large' ? mfTypography.moneyLarge : mfTypography.money),
    color: theme.text,
    fontVariant: ['tabular-nums'],
  };
}
