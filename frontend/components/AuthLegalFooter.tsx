import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL, openLegalUrl } from '@/lib/legalUrls';
import { useThemeStore } from '@/store/themeStore';
import { getAuthPalette } from '@/components/auth/authTokens';

/** Rodapé legal no login (iOS/Android). No web use AuthLegalFooter.web.tsx. */
export function AuthLegalFooter() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const palette = getAuthPalette(isDarkMode);
  const linkColor = palette.linkText ?? '#2563EB';
  const textColor = palette.subtitleText;

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: textColor }]}>
        Ao clicar em Entrar, você concorda com nossa{' '}
      </Text>
      <TouchableOpacity onPress={() => openLegalUrl(LEGAL_PRIVACY_URL)}>
        <Text style={[styles.link, { color: linkColor }]}>Política de Privacidade</Text>
      </TouchableOpacity>
      <Text style={[styles.text, { color: textColor }]}> e os </Text>
      <TouchableOpacity onPress={() => openLegalUrl(LEGAL_TERMS_URL)}>
        <Text style={[styles.link, { color: linkColor }]}>Termos de Uso</Text>
      </TouchableOpacity>
      <Text style={[styles.text, { color: textColor }]}>.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  text: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  link: { fontSize: 12, lineHeight: 18, textDecorationLine: 'underline', fontWeight: '600' },
});
