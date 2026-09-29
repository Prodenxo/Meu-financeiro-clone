import React from 'react';
import { Platform, Text, TouchableOpacity, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { openLegalUrl } from '@/lib/legalUrls';

type LegalWebLinkProps = {
  /** Caminho relativo (/privacidade) ou URL absoluta */
  href: string;
  label: string;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
};

const absoluteUrl = (href: string) =>
  href.startsWith('http') ? href : `https://meiinfinito.com.br${href.startsWith('/') ? href : `/${href}`}`;

/**
 * No web usa <a href> para crawlers do Google (OAuth homepage).
 * No mobile abre o browser com a URL de produção.
 */
export function LegalWebLink({ href, label, textStyle, containerStyle }: LegalWebLinkProps) {
  if (Platform.OS === 'web') {
    const path = href.startsWith('http') ? href : href;
    return (
      <a
        href={path}
        style={{
          color: '#475569',
          fontSize: 13,
          textDecoration: 'underline',
          fontWeight: '500',
          ...(containerStyle as object),
          ...(textStyle as object),
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => openLegalUrl(absoluteUrl(href))}
      accessibilityRole="link"
    >
      <Text style={[styles.nativeLink, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nativeLink: { fontSize: 13, color: '#475569', textDecorationLine: 'underline' },
});
