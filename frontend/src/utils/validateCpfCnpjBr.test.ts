import { describe, expect, it } from 'vitest';
import { isValidCnpjDigits, isValidCpfDigits, isValidCpfOrCnpjDigits } from './validateCpfCnpjBr';

describe('validateCpfCnpjBr', () => {
  it('rejeita CPF com comprimento errado ou sequência trivial', () => {
    expect(isValidCpfDigits('12345678901')).toBe(false);
    expect(isValidCpfDigits('11111111111')).toBe(false);
    expect(isValidCpfDigits('123456789')).toBe(false);
  });

  it('aceita CPF com dígitos verificadores válidos', () => {
    expect(isValidCpfDigits('52998224725')).toBe(true);
    expect(isValidCpfDigits('39053344705')).toBe(true);
  });

  it('rejeita CNPJ com DV inválido ou sequência trivial', () => {
    expect(isValidCnpjDigits('11222333000180')).toBe(false);
    expect(isValidCnpjDigits('11111111111111')).toBe(false);
  });

  it('aceita CNPJ com dígitos verificadores válidos', () => {
    expect(isValidCnpjDigits('11222333000181')).toBe(true);
    expect(isValidCnpjDigits('07526557000100')).toBe(true);
  });

  it('isValidCpfOrCnpjDigits encaminha por comprimento', () => {
    expect(isValidCpfOrCnpjDigits('52998224725')).toBe(true);
    expect(isValidCpfOrCnpjDigits('11222333000181')).toBe(true);
    expect(isValidCpfOrCnpjDigits('123')).toBe(false);
  });
});
