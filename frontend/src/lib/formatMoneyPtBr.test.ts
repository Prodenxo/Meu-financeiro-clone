import { describe, it, expect } from 'vitest';
import {
  moneyDigitsFromNumber,
  formatMoneyDigitsPtBr,
  parseMoneyInputToNumber,
  formatBrlDisplay
} from './formatMoneyPtBr';

describe('formatMoneyPtBr', () => {
  it('moneyDigitsFromNumber e formato de exibição', () => {
    expect(moneyDigitsFromNumber(12.34)).toBe('1234');
    expect(formatMoneyDigitsPtBr('1234')).toBe('12,34');
  });

  it('parseMoneyInputToNumber aceita string formatada', () => {
    expect(parseMoneyInputToNumber('1.234,56')).toBe(1234.56);
    expect(parseMoneyInputToNumber('')).toBeNull();
  });

  it('formatBrlDisplay', () => {
    expect(formatBrlDisplay(10)).toMatch(/10/);
    expect(formatBrlDisplay(null)).toBe('—');
  });
});
