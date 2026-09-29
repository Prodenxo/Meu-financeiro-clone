import React, { useMemo } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { mfTypography } from '@/lib/theme';

/** Ícone app (só o M) — wordmark na navbar, estilo Assessor. */
const MARK_SOURCE = require('../../assets/icon.png');
/** Logo completa com texto — auth / drawer. */
const LOGO_SOURCE = require('../../assets/logo.png');

export type AppBrandLogoVariant = 'wordmark' | 'wordmarkCompact' | 'mark' | 'drawer';

type Props = {
  variant?: AppBrandLogoVariant;
  titleColor?: string;
};

const MARK_SIZES: Record<AppBrandLogoVariant, number> = {
  wordmark: 28,
  wordmarkCompact: 24,
  mark: 40,
  drawer: 32,
};

/**
 * `wordmark`: ícone + "Meu Financeiro" ao lado (navbar web).
 * `mark` / `drawer`: logo quadrada completa.
 */
export function AppBrandLogo({ variant = 'wordmark', titleColor = '#0F172A' }: Props) {
  const size = MARK_SIZES[variant];
  const isWordmark = variant === 'wordmark' || variant === 'wordmarkCompact';
  const styles = useMemo(() => createStyles(size, isWordmark), [size, isWordmark]);

  return (
    <View
      style={styles.row}
      accessibilityRole="image"
      accessibilityLabel="Meu Financeiro"
    >
      <Image
        source={isWordmark ? MARK_SOURCE : LOGO_SOURCE}
        style={styles.mark}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {isWordmark ? (
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          Meu Financeiro
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(size: number, isWordmark: boolean) {
  const radius = Math.round(size * (isWordmark ? 0.24 : 0.22));
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isWordmark ? 10 : 0,
      flexShrink: 0,
    },
    mark: {
      width: size,
      height: size,
      borderRadius: radius,
    },
    title: {
      ...mfTypography.subtitle,
      fontSize: isWordmark ? 16 : 17,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
  });
}
