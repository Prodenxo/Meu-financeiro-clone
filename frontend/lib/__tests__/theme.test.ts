import {
  darkTheme,
  getFinanceSemanticColor,
  getTheme,
  lightTheme,
  mfAgendaPanelChrome,
  mfCardElevation,
} from '../theme';

describe('theme MF Luxury', () => {
  it('light premium usa fundo branco', () => {
    expect(lightTheme.background).toBe('#FFFFFF');
    expect(lightTheme.backgroundMuted).toBe('#F8FAFC');
  });

  it('expõe tokens financeiros em ambos os modos', () => {
    for (const t of [lightTheme, darkTheme]) {
      expect(t.financeOpen).toBeTruthy();
      expect(t.financeReceived).toBeTruthy();
      expect(t.financeOverdue).toBeTruthy();
      expect(t.financeForecast).toBeTruthy();
    }
  });

  it('getFinanceSemanticColor mapeia semântica', () => {
    expect(getFinanceSemanticColor(lightTheme, 'open')).toBe(lightTheme.financeOpen);
    expect(getFinanceSemanticColor(darkTheme, 'received')).toBe(darkTheme.financeReceived);
  });

  it('getTheme alterna light/dark', () => {
    expect(getTheme(false).background).toBe('#FFFFFF');
    expect(getTheme(true).background).toBe('#000000');
  });

  it('mfCardElevation retorna sombra mais forte no dark', () => {
    const light = mfCardElevation(lightTheme, false);
    const dark = mfCardElevation(darkTheme, true);
    const asNumber = (value: unknown) =>
      typeof value === 'number' ? value : 0;
    expect(asNumber(dark.shadowOpacity)).toBeGreaterThan(asNumber(light.shadowOpacity));
  });

  it('mfAgendaPanelChrome não corta sombra', () => {
    const chrome = mfAgendaPanelChrome(true);
    expect(chrome.overflow).toBe('visible');
  });
});
