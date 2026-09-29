import {
  getPasswordStrength,
  validateSignupEmail,
  validateSignupPassword,
  validateRecoveryPassword,
  validatePasswordMatch,
  validateOptionalDisplayName,
} from '../authValidation';

describe('authValidation', () => {
  it('validateSignupEmail', () => {
    expect(validateSignupEmail('')).toBeTruthy();
    expect(validateSignupEmail('bad')).toBeTruthy();
    expect(validateSignupEmail('a@b.co')).toBeNull();
  });

  it('validateSignupPassword', () => {
    expect(validateSignupPassword('')).toBeTruthy();
    expect(validateSignupPassword('12345')).toBeTruthy();
    expect(validateSignupPassword('123456')).toBeNull();
  });

  it('validateRecoveryPassword exige 8 chars com letra e número', () => {
    expect(validateRecoveryPassword('')).toBeTruthy();
    expect(validateRecoveryPassword('abcdefg')).toBeTruthy();
    expect(validateRecoveryPassword('abcdefg1')).toBeNull();
    expect(validateRecoveryPassword('Abcdefg1!')).toBeNull();
  });

  it('getPasswordStrength classifica fraca/média/forte', () => {
    expect(getPasswordStrength('').level).toBe('empty');
    expect(getPasswordStrength('abc').level).toBe('weak');
    expect(getPasswordStrength('abcdefg1').level).toBe('medium');
    expect(getPasswordStrength('Abcdefg1!').level).toBe('strong');
    expect(getPasswordStrength('Abcdefg1!').isValid).toBe(true);
  });

  it('validatePasswordMatch', () => {
    expect(validatePasswordMatch('a', '')).toBeTruthy();
    expect(validatePasswordMatch('a', 'b')).toBeTruthy();
    expect(validatePasswordMatch('x', 'x')).toBeNull();
  });

  it('validateOptionalDisplayName', () => {
    expect(validateOptionalDisplayName('')).toBeNull();
    expect(validateOptionalDisplayName('x'.repeat(121))).toBeTruthy();
  });
});
