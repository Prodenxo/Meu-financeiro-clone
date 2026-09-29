import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import type { Theme } from './theme';
import { mfRadius, mfSpacing } from './theme';

export type TechTokens = {
  accent: string;
  accentMuted: string;
  accentSoft: string;
  accentGlow: string;
  panelFill: string;
  panelBorder: string;
  insetFill: string;
  insetBorder: string;
  divider: string;
  canvasBase: string;
  gridCss: string;
  canvasGradientCss: string;
  panelShadow: string;
  /** Sombra dos KPIs internos (saldo hero, entrada, saída) */
  kpiFeaturedShadow: string;
  kpiMetricShadow: string;
  heroWashCss: string;
};

export function getTechTokens(isDarkMode: boolean): TechTokens {
  if (isDarkMode) {
    return {
      accent: '#22d3ee',
      accentMuted: 'rgba(34, 211, 238, 0.38)',
      accentSoft: 'rgba(34, 211, 238, 0.12)',
      accentGlow: 'rgba(34, 211, 238, 0.22)',
      panelFill: 'rgba(10, 15, 24, 0.94)',
      panelBorder: 'rgba(34, 211, 238, 0.18)',
      insetFill: 'rgba(6, 10, 18, 0.65)',
      insetBorder: 'rgba(148, 163, 184, 0.14)',
      divider: 'rgba(148, 163, 184, 0.14)',
      canvasBase: '#030508',
      gridCss: `repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(34, 211, 238, 0.07) 32px),
        repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(34, 211, 238, 0.07) 32px)`,
      canvasGradientCss: `radial-gradient(ellipse 100% 80% at 0% -20%, rgba(34, 211, 238, 0.18), transparent 55%),
        radial-gradient(ellipse 70% 60% at 100% 0%, rgba(59, 130, 246, 0.12), transparent 50%),
        linear-gradient(180deg, #030508 0%, #0a1018 45%, #05080d 100%)`,
      panelShadow:
        '0 12px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(34, 211, 238, 0.06), inset 0 1px 0 rgba(148, 163, 184, 0.12)',
      kpiFeaturedShadow:
        '0 1px 0 rgba(148, 163, 184, 0.16) inset, 0 10px 28px rgba(0, 0, 0, 0.72), 0 20px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(148, 163, 184, 0.18)',
      kpiMetricShadow:
        '0 1px 0 rgba(148, 163, 184, 0.16) inset, 0 10px 28px rgba(0, 0, 0, 0.72), 0 20px 48px rgba(0, 0, 0, 0.55), 0 0 40px rgba(34, 211, 238, 0.14), 0 0 0 1px rgba(148, 163, 184, 0.18)',
      heroWashCss:
        'linear-gradient(90deg, rgba(34, 211, 238, 0.16) 0%, rgba(34, 211, 238, 0.05) 14%, transparent 28%)',
    };
  }

  return {
    accent: '#1d4ed8',
    accentMuted: 'rgba(29, 78, 216, 0.35)',
    accentSoft: 'rgba(29, 78, 216, 0.1)',
    accentGlow: 'rgba(59, 130, 246, 0.2)',
    panelFill: 'rgba(255, 255, 255, 0.92)',
    panelBorder: 'rgba(29, 78, 216, 0.16)',
    insetFill: 'rgba(248, 250, 252, 0.95)',
    insetBorder: 'rgba(15, 23, 42, 0.08)',
    divider: 'rgba(15, 23, 42, 0.08)',
    canvasBase: '#e4eaf3',
    gridCss: `repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(29, 78, 216, 0.07) 32px),
      repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(29, 78, 216, 0.07) 32px)`,
    canvasGradientCss: `radial-gradient(ellipse 90% 70% at 100% -10%, rgba(59, 130, 246, 0.14), transparent 52%),
      radial-gradient(ellipse 60% 50% at 0% 100%, rgba(29, 78, 216, 0.08), transparent 48%),
      linear-gradient(180deg, #eef2f8 0%, #f8fafc 40%, #e4eaf3 100%)`,
    panelShadow:
      '0 12px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(29, 78, 216, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)',
    kpiFeaturedShadow:
      '0 1px 0 rgba(255, 255, 255, 0.95) inset, 0 20px 56px rgba(15, 23, 42, 0.28), 0 8px 24px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.09)',
    kpiMetricShadow:
      '0 1px 0 rgba(255, 255, 255, 0.95) inset, 0 20px 56px rgba(15, 23, 42, 0.28), 0 8px 24px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.09)',
    heroWashCss:
      'linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 12%, transparent 26%)',
  };
}

/** @deprecated use getTechTokens */
export function getTechAccent(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).accent;
}

export function getTechAccentMuted(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).accentMuted;
}

export function getTechGlassBorder(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).panelBorder;
}

export function getDashboardCanvasStyle(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  if (Platform.OS === 'web') {
    return {
      backgroundColor: t.canvasBase,
      // @ts-expect-error web-only
      backgroundImage: `${t.gridCss}, ${t.canvasGradientCss}`,
    };
  }
  return { backgroundColor: t.canvasBase };
}

export type TechPanelVariant = 'accent' | 'surface' | 'inset' | 'chart';

export function mfTechPanelChrome(
  isDarkMode: boolean,
  variant: TechPanelVariant = 'surface',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const isAccent = variant === 'accent';
  const isInset = variant === 'inset' || variant === 'chart';
  const isChart = variant === 'chart';

  const base: ViewStyle = {
    borderRadius: isChart ? mfRadius.sm : mfRadius.md,
    borderWidth: 1,
    borderColor: isInset ? t.insetBorder : isAccent ? t.panelBorder : t.insetBorder,
    backgroundColor: isChart
      ? isDarkMode
        ? 'rgba(4, 8, 14, 0.92)'
        : 'rgba(241, 245, 249, 0.95)'
      : isInset
        ? t.insetFill
        : t.panelFill,
    overflow: isAccent ? 'visible' : 'hidden',
    ...(isAccent
      ? { borderTopWidth: 2, borderTopColor: t.accent }
      : { borderTopWidth: 1 }),
  };

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return {
      ...base,
      // @ts-expect-error web-only
      backdropFilter: isChart ? 'none' : 'blur(24px) saturate(1.25)',
      WebkitBackdropFilter: isChart ? 'none' : 'blur(24px) saturate(1.25)',
      boxShadow: isInset
        ? 'inset 0 2px 12px rgba(0,0,0,0.25)'
        : isAccent
          ? t.panelShadow
          : '0 4px 24px rgba(0,0,0,0.2)',
    };
  }
  return base;
}

/** Fundo sólido para modais full-screen — sem blur (evita grid “vazando” no web). */
export function mfTechOpaqueShell(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const fill = isDarkMode ? '#0a1018' : '#ffffff';
  return {
    flex: 1,
    width: '100%',
    backgroundColor: fill,
    borderWidth: 1,
    borderColor: t.panelBorder,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          // @ts-expect-error web-only — sem backdrop-filter
          boxShadow: t.panelShadow,
        }
      : {}),
  };
}

/** Véu sobre o grid do canvas (modais / overlays). */
export function mfTechCanvasScrim(isDarkMode: boolean): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDarkMode ? 'rgba(3, 5, 8, 0.78)' : 'rgba(15, 23, 42, 0.42)',
  };
}

export function mfTechNavChrome(isDarkMode: boolean): ViewStyle {
  return mfTechPanelChrome(isDarkMode);
}

export function mfTechInsetSurface(isDarkMode: boolean, featured = false): ViewStyle {
  const t = getTechTokens(isDarkMode);
  return {
    borderRadius: mfRadius.sm,
    borderWidth: 1,
    borderColor: featured ? t.accent : t.insetBorder,
    backgroundColor: t.insetFill,
    ...(featured
      ? {
          borderLeftWidth: 3,
          borderLeftColor: t.accent,
        }
      : {}),
  };
}

export type TechKpiElevation = 'featured' | 'metric';

/** Sombra única para saldo, entradas e saídas (mesmo lift). */
export function getTechKpiShadow(isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).kpiFeaturedShadow;
}

/** Fundo dos KPIs — mesma elevação visual em todos os cards. */
export function mfTechKpiSurfaceFill(isDarkMode: boolean): string {
  return isDarkMode ? '#1a2838' : '#ffffff';
}

/** Estilo do invólucro (fundo + borda). Sombra: `MfTechKpiCard` ou `getTechKpiShadow` no web. */
export function mfTechKpiCardStyle(
  isDarkMode: boolean,
  level: TechKpiElevation = 'metric',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const featured = level === 'featured';
  const borderColor = isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.09)';

  const base: ViewStyle = {
    backgroundColor: mfTechKpiSurfaceFill(isDarkMode),
    borderWidth: 1,
    borderColor,
    borderRadius: mfRadius.sm,
    overflow: 'visible',
    ...(level === 'metric'
      ? {
          flex: 1,
          minWidth: 0,
          alignSelf: 'stretch',
        }
      : {}),
    ...(featured
      ? {
          borderLeftWidth: 3,
          borderLeftColor: t.accent,
          transform: [{ translateY: -1 }],
        }
      : {}),
  };

  if (Platform.OS === 'web') {
    const shadow = getTechKpiShadow(isDarkMode);
    return {
      ...base,
      // @ts-expect-error web-only
      boxShadow: shadow,
      // @ts-expect-error web-only
      WebkitBoxShadow: shadow,
    };
  }

  // Métricas em listas (categorias, contas, orçamentos): borda só — sem glow cyan no Android.
  if (level === 'metric') {
    return {
      ...base,
      overflow: 'hidden',
      elevation: 0,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    };
  }

  return {
    ...base,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.32 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  };
}

/** Conteúdo interno do KPI — padding sem sobrescrever sombra do shell. */
export function mfTechKpiCardInnerStyle(level: TechKpiElevation = 'metric'): ViewStyle {
  if (level === 'featured') {
    return {
      paddingTop: mfSpacing.md,
      paddingBottom: mfSpacing.md,
      paddingRight: mfSpacing.md,
      paddingLeft: mfSpacing.lg,
      gap: mfSpacing.sm,
    };
  }
  return {
    padding: mfSpacing.sm,
    gap: 4,
  };
}

/** Faixa de acento à esquerda do saldo — não cobre o card inteiro. */
export function mfTechHeroWashOverlay(isDarkMode: boolean): ViewStyle {
  const t = getTechTokens(isDarkMode);
  if (Platform.OS === 'web') {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '32%',
      maxWidth: 140,
      borderTopLeftRadius: mfRadius.sm,
      borderBottomLeftRadius: mfRadius.sm,
      // @ts-expect-error web-only
      backgroundImage: t.heroWashCss,
      pointerEvents: 'none',
    };
  }
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '32%',
    maxWidth: 140,
    borderTopLeftRadius: mfRadius.sm,
    borderBottomLeftRadius: mfRadius.sm,
    backgroundColor: t.accentSoft,
    pointerEvents: 'none',
  };
}

/** @deprecated use mfTechKpiCardStyle */
export function mfTechKpiElevation(
  isDarkMode: boolean,
  level: TechKpiElevation = 'metric',
): ViewStyle {
  const t = getTechTokens(isDarkMode);
  const featured = level === 'featured';
  if (Platform.OS === 'web') {
    return {
      // @ts-expect-error web-only
      boxShadow: featured ? t.kpiFeaturedShadow : t.kpiMetricShadow,
    };
  }
  return mfTechKpiCardStyle(isDarkMode, level);
}

/** @deprecated use mfTechHeroWashOverlay dentro do card */
export function mfTechHeroPrimaryWash(isDarkMode: boolean): ViewStyle {
  return mfTechHeroWashOverlay(isDarkMode);
}

export type GlassIntensity = 'subtle' | 'medium' | 'strong';

export function getGlassFill(
  _theme: Theme,
  isDarkMode: boolean,
  intensity: GlassIntensity = 'medium',
): string {
  const t = getTechTokens(isDarkMode);
  if (isDarkMode) {
    switch (intensity) {
      case 'subtle':
        return 'rgba(8, 12, 20, 0.72)';
      case 'strong':
        return t.panelFill;
      default:
        return 'rgba(10, 15, 24, 0.86)';
    }
  }
  switch (intensity) {
    case 'subtle':
      return 'rgba(255, 255, 255, 0.78)';
    case 'strong':
      return t.panelFill;
    default:
      return 'rgba(255, 255, 255, 0.88)';
  }
}

export function getGlassBorder(_theme: Theme, isDarkMode: boolean): string {
  return getTechTokens(isDarkMode).insetBorder;
}

export function getGlassBlurIntensity(isDarkMode: boolean): number {
  if (Platform.OS === 'ios') return isDarkMode ? 52 : 44;
  if (Platform.OS === 'android') return isDarkMode ? 48 : 40;
  return isDarkMode ? 36 : 28;
}

export function mfGlassChrome(
  theme: Theme,
  isDarkMode: boolean,
  intensity: GlassIntensity = 'medium',
  tech: boolean | TechPanelVariant = false,
): ViewStyle {
  if (tech) {
    const variant = tech === true ? 'surface' : tech;
    return mfTechPanelChrome(isDarkMode, variant);
  }
  const t = getTechTokens(isDarkMode);
  const base: ViewStyle = {
    borderRadius: mfRadius.lg,
    borderWidth: 1,
    borderColor: t.insetBorder,
    overflow: 'hidden',
    backgroundColor: getGlassFill(theme, isDarkMode, intensity),
  };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return {
      ...base,
      // @ts-expect-error web-only
      backdropFilter: 'blur(20px) saturate(1.15)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.15)',
      boxShadow: t.panelShadow,
    };
  }
  return base;
}

export function mfTechKpiSurface(isDarkMode: boolean, featured = false): ViewStyle {
  return {
    flex: featured ? 1.35 : 1,
    minWidth: 0,
    padding: featured ? 22 : 16,
    ...mfTechInsetSurface(isDarkMode, featured),
  };
}
