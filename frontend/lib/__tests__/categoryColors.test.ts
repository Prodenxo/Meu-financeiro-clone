import {
  getCategorySliceColor,
  getCategorySliceColorForId,
  getDonutRemainderColor,
} from '../categoryColors';
import { darkTheme, lightTheme } from '../theme';

describe('categoryColors', () => {
  it('retorna cores distintas por índice', () => {
    expect(getCategorySliceColor(0, false)).not.toBe(getCategorySliceColor(1, false));
  });

  it('estabiliza cor por id de categoria', () => {
    const a = getCategorySliceColorForId(42, false);
    const b = getCategorySliceColorForId(42, false);
    expect(a).toBe(b);
  });

  it('remainder usa token de tema', () => {
    expect(getDonutRemainderColor(lightTheme, false)).toBe(lightTheme.backgroundMuted);
    expect(getDonutRemainderColor(darkTheme, true)).toBe(darkTheme.border);
  });
});
