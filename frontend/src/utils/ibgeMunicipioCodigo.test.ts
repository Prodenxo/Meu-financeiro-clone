import { describe, expect, it } from 'vitest';
import { normalizeIbgeMunicipioCodigo } from './ibgeMunicipioCodigo';

describe('normalizeIbgeMunicipioCodigo', () => {
  it('retorna string vazia para null e undefined', () => {
    expect(normalizeIbgeMunicipioCodigo(null)).toBe('');
    expect(normalizeIbgeMunicipioCodigo(undefined)).toBe('');
  });

  it('extrai apenas dígitos de string com máscara ou espaços', () => {
    expect(normalizeIbgeMunicipioCodigo('3550 308')).toBe('3550308');
    expect(normalizeIbgeMunicipioCodigo('35.503-08')).toBe('3550308');
  });

  it('coerge número (JSON Brasil API) para string de dígitos', () => {
    expect(normalizeIbgeMunicipioCodigo(3550308)).toBe('3550308');
  });

  it('é idempotente em string já só com dígitos', () => {
    expect(normalizeIbgeMunicipioCodigo('3550308')).toBe('3550308');
    expect(normalizeIbgeMunicipioCodigo(normalizeIbgeMunicipioCodigo('3550308'))).toBe('3550308');
  });

  it('retorna vazio quando não há dígitos', () => {
    expect(normalizeIbgeMunicipioCodigo('')).toBe('');
    expect(normalizeIbgeMunicipioCodigo('abc')).toBe('');
  });
});
