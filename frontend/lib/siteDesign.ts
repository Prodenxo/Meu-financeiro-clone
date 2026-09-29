import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { mfRadius, mfSpacing } from './theme'

/**
 * Paleta premium/neon do Site — `designTokens` + `card-premium` / `btn-premium` / `bg-grid-pattern`.
 * @see Site/shared/theme/tokens.ts
 * @see Site/frontend/src/index.css
 */
export type SiteTokens = {
  neon: string
  neonHover: string
  neonGlow: string
  neonDim: string
  neonBorder: string
  primary: string
  primarySoft: string
  background: string
  panelBg: string
  panelBorder: string
  inputBg: string
  inputBorder: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  divider: string
  glassShadow: string
}

const PREMIUM = {
  neon: '#3B82F6',
  neonHover: '#60A5FA',
  neonGlow: 'rgba(59, 130, 246, 0.5)',
  neonDim: 'rgba(59, 130, 246, 0.1)',
  neonBorder: 'rgba(59, 130, 246, 0.3)',
  bgApp: '#05050A',
  card: '#111827',
  cardMuted: '#0B101A',
  borderGlass: 'rgba(255, 255, 255, 0.05)',
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#F8FAFC',
  textMuted: '#94A3B8',
  glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
  neonShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
} as const

export function getSiteTokens (isDarkMode: boolean): SiteTokens {
  if (isDarkMode) {
    return {
      neon: PREMIUM.neon,
      neonHover: PREMIUM.neonHover,
      neonGlow: PREMIUM.neonGlow,
      neonDim: PREMIUM.neonDim,
      neonBorder: PREMIUM.neonBorder,
      primary: PREMIUM.neon,
      primarySoft: PREMIUM.neonDim,
      background: PREMIUM.bgApp,
      panelBg: PREMIUM.card,
      panelBorder: PREMIUM.borderGlass,
      inputBg: PREMIUM.cardMuted,
      inputBorder: 'rgba(59, 130, 246, 0.18)',
      textPrimary: PREMIUM.textPrimary,
      textSecondary: PREMIUM.textMuted,
      textMuted: '#64748B',
      divider: 'rgba(255, 255, 255, 0.06)',
      glassShadow: PREMIUM.glassShadow,
    }
  }

  return {
    neon: PREMIUM.neon,
    neonHover: PREMIUM.neonHover,
    neonGlow: PREMIUM.neonGlow,
    neonDim: PREMIUM.neonDim,
    neonBorder: PREMIUM.neonBorder,
    primary: PREMIUM.neon,
    primarySoft: PREMIUM.neonDim,
    background: '#F1F5F9',
    panelBg: 'rgba(255, 255, 255, 0.82)',
    panelBorder: 'rgba(226, 232, 240, 0.9)',
    inputBg: 'rgba(248, 250, 252, 0.95)',
    inputBorder: 'rgba(203, 213, 225, 0.9)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    divider: 'rgba(226, 232, 240, 0.65)',
    glassShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
  }
}

/** `card-premium` — glass + borda sutil + fundo card do Site. */
export function mfSitePanel (isDarkMode: boolean): ViewStyle {
  const t = getSiteTokens(isDarkMode)
  return {
    borderRadius: mfRadius.lg,
    borderWidth: 1,
    borderColor: isDarkMode ? t.panelBorder : t.panelBorder,
    borderLeftWidth: 2,
    borderLeftColor: t.neonBorder,
    backgroundColor: t.panelBg,
    padding: mfSpacing.lg,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: isDarkMode
            ? `${t.glassShadow}, inset 0 1px 0 rgba(255,255,255,0.04)`
            : t.glassShadow,
        } as ViewStyle)
      : null),
  }
}

export function mfSiteInput (isDarkMode: boolean): ViewStyle {
  const t = getSiteTokens(isDarkMode)
  return {
    borderWidth: 1,
    borderColor: t.inputBorder,
    backgroundColor: t.inputBg,
    borderRadius: mfRadius.md,
  }
}

/** `btn-premium` — CTA neon outline com glow. */
export function mfSiteNeonBtn (isDarkMode: boolean): ViewStyle {
  const t = getSiteTokens(isDarkMode)
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mfSpacing.sm,
    paddingVertical: mfSpacing.sm,
    paddingHorizontal: mfSpacing.md,
    borderRadius: mfRadius.pill,
    borderWidth: 1,
    borderColor: t.neonBorder,
    backgroundColor: t.neonDim,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: PREMIUM.neonShadow } as ViewStyle)
      : null),
  }
}

export function mfSiteSecondaryBtn (isDarkMode: boolean): ViewStyle {
  return mfSiteNeonBtn(isDarkMode)
}

/** Botão sólido neon para ação principal. */
export function mfSitePrimaryBtn (isDarkMode: boolean, pressed?: boolean): ViewStyle {
  const t = getSiteTokens(isDarkMode)
  return {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: mfSpacing.lg,
    borderRadius: mfRadius.pill,
    backgroundColor: t.neon,
    opacity: pressed ? 0.92 : 1,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: PREMIUM.neonShadow } as ViewStyle)
      : null),
  }
}

export function getSiteCanvasStyle (isDarkMode: boolean): ViewStyle {
  if (!isDarkMode) {
    return Platform.OS === 'web'
      ? ({
          backgroundColor: '#F1F5F9',
          backgroundImage: 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 55%, #f1f5f9 100%)',
        } as ViewStyle)
      : { backgroundColor: '#F1F5F9' }
  }

  if (Platform.OS === 'web') {
    return {
      backgroundColor: PREMIUM.bgApp,
      backgroundImage: [
        'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-gradient(ellipse 90% 55% at 50% -15%, rgba(59,130,246,0.18), transparent 58%)',
        'radial-gradient(ellipse 50% 40% at 100% 0%, rgba(59,130,246,0.08), transparent 50%)',
      ].join(', '),
      backgroundSize: '40px 40px, 40px 40px, auto, auto',
    } as ViewStyle
  }

  return { backgroundColor: PREMIUM.bgApp }
}

export const siteHeadingStyle: TextStyle = {
  fontSize: 24,
  fontWeight: '600',
  letterSpacing: -0.4,
}

export const siteLeadStyle: TextStyle = {
  fontSize: 14,
  lineHeight: 20,
}

export const sitePanelTitleStyle: TextStyle = {
  fontSize: 16,
  fontWeight: '600',
}

export const siteFieldLabelStyle: TextStyle = {
  fontSize: 13,
  fontWeight: '500',
}

export const siteHintStyle: TextStyle = {
  fontSize: 12,
  lineHeight: 16,
}

export const siteNeonBtnText: TextStyle = {
  fontSize: 14,
  fontWeight: '600',
}
