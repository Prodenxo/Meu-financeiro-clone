import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LegalWebLink } from './LegalWebLink';

/**
 * Faixa visível na homepage para requisitos OAuth do Google (link à Política de Privacidade).
 */
export function LegalHomepageStrip() {
  if (Platform.OS === 'web') {
    return (
      <nav
        aria-label="Informações legais"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          fontSize: 13,
          color: '#64748B',
        }}
      >
        <LegalWebLink href="/privacidade" label="Política de Privacidade" textStyle={{ color: '#2563EB' }} />
        <span aria-hidden="true">·</span>
        <LegalWebLink href="/termos" label="Termos de Uso" textStyle={{ color: '#2563EB' }} />
      </nav>
    );
  }

  return (
    <View style={styles.nativeRow}>
      <LegalWebLink href="/privacidade" label="Política de Privacidade" textStyle={{ color: '#2563EB' }} />
      <LegalWebLink href="/termos" label="Termos de Uso" textStyle={{ color: '#2563EB' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  nativeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
});
