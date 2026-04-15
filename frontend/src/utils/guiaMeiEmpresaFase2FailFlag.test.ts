import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearGuiaMeiEmpresaFase2FailFlag,
  isGuiaMeiEmpresaFase2FailFlagActive,
  meiEmpresaFase2FailStorageKey,
  MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS,
  setGuiaMeiEmpresaFase2FailFlag
} from './guiaMeiEmpresaFase2FailFlag';

describe('guiaMeiEmpresaFase2FailFlag', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('escrita + leitura: flag activa dentro do TTL', () => {
    setGuiaMeiEmpresaFase2FailFlag('u1', '12.345.678/0001-90');
    expect(isGuiaMeiEmpresaFase2FailFlagActive('u1', '12345678000190')).toBe(true);
  });

  it('TTL expirado → false e remove chave', () => {
    const key = meiEmpresaFase2FailStorageKey('u1', '12345678000190');
    sessionStorage.setItem(
      key,
      JSON.stringify({ t: Date.now() - MEI_EMPRESA_FASE2_FAIL_FLAG_TTL_MS - 1000 })
    );
    expect(isGuiaMeiEmpresaFase2FailFlagActive('u1', '12345678000190')).toBe(false);
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it('clear remove flag', () => {
    setGuiaMeiEmpresaFase2FailFlag('u1', '12345678000190');
    clearGuiaMeiEmpresaFase2FailFlag('u1', '12345678000190');
    expect(isGuiaMeiEmpresaFase2FailFlagActive('u1', '12345678000190')).toBe(false);
  });

  it('CNPJ inválido não grava', () => {
    setGuiaMeiEmpresaFase2FailFlag('u1', '123');
    expect(sessionStorage.length).toBe(0);
  });

  it('sessionStorage indisponível → leitura false sem throw', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(isGuiaMeiEmpresaFase2FailFlagActive('u1', '12345678000190')).toBe(false);
    spy.mockRestore();
  });

  it('anon quando userId null', () => {
    setGuiaMeiEmpresaFase2FailFlag(null, '12345678000190');
    expect(meiEmpresaFase2FailStorageKey(null, '12345678000190')).toContain('anon');
    expect(isGuiaMeiEmpresaFase2FailFlagActive(null, '12345678000190')).toBe(true);
  });
});
