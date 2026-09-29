import {
  GOOGLE_CALENDAR_COLORS,
  getGoogleEventColorHex,
} from '../googleCalendarColors';

describe('googleCalendarColors', () => {
  it('mapeia colorId 11 para Tomate', () => {
    expect(getGoogleEventColorHex('11')).toBe('#D50000');
  });

  it('mapeia colorId 1 para Lavanda (não Tomate)', () => {
    expect(getGoogleEventColorHex('1')).toBe('#7986CB');
    expect(getGoogleEventColorHex('1')).not.toBe('#D50000');
  });

  it('usa fallback quando colorId ausente', () => {
    expect(getGoogleEventColorHex(undefined, '#2563EB')).toBe('#2563EB');
  });

  it('expõe 11 cores do Google', () => {
    expect(GOOGLE_CALENDAR_COLORS).toHaveLength(11);
  });
});
