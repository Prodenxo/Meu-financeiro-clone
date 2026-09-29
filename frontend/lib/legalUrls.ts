import { Linking, Platform } from 'react-native';

/** Páginas legais em produção (domínio público). */
export const LEGAL_PRIVACY_URL = 'https://meiinfinito.com.br/privacidade';
export const LEGAL_TERMS_URL = 'https://meiinfinito.com.br/termos';

/** HTML estático em public/ — funciona no Expo dev e no nginx. */
export const LEGAL_PRIVACY_PATH = '/privacidade.html';
export const LEGAL_TERMS_PATH = '/termos.html';

export async function openLegalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Não foi possível abrir o link.');
  }
  await Linking.openURL(url);
}
