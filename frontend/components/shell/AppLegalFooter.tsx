import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from '@/lib/legalUrls';

/**
 * Rodapé legal no app autenticado (web). Links no HTML estático do index ficam ocultos após o boot.
 */
export function AppLegalFooter() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  const html = useMemo(() => {
    const linkColor = isDarkMode ? '#60A5FA' : '#2563EB';
    const textColor = isDarkMode ? '#94A3B8' : '#64748B';
    const border = isDarkMode ? '#1E293B' : '#E2E8F0';
    const link = (href: string, label: string) =>
      `<a href="${href}" style="color:${linkColor};font-weight:600;text-decoration:underline">${label}</a>`;
    return `<span style="color:${textColor}">${link(LEGAL_PRIVACY_PATH, 'Política de Privacidade')} · ${link(LEGAL_TERMS_PATH, 'Termos de Uso')}</span>`;
  }, [isDarkMode]);

  if (Platform.OS !== 'web') return null;

  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';

  return (
    <div
      className="app-legal-footer"
      role="contentinfo"
      style={{
        width: '100%',
        marginTop: 24,
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: '18px',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderTop: `1px solid ${borderColor}`,
        background: isDarkMode ? '#0F172A' : '#F8FAFC',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
