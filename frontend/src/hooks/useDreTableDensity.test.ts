import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DRE_TABLE_DENSITY_STORAGE_KEY,
  useDreTableDensity
} from './useDreTableDensity';

describe('useDreTableDensity', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defeito Simples sem chave', () => {
    const { result } = renderHook(() => useDreTableDensity());
    expect(result.current.density).toBe('simples');
  });

  it('valor inválido no storage → Simples e remove chave inválida', () => {
    localStorage.setItem(DRE_TABLE_DENSITY_STORAGE_KEY, 'lixo');
    const { result } = renderHook(() => useDreTableDensity());
    expect(result.current.density).toBe('simples');
    expect(localStorage.getItem(DRE_TABLE_DENSITY_STORAGE_KEY)).toBeNull();
  });

  it('setDensity grava Completo no localStorage', () => {
    const { result } = renderHook(() => useDreTableDensity());
    act(() => {
      result.current.setDensity('completo');
    });
    expect(result.current.density).toBe('completo');
    expect(localStorage.getItem(DRE_TABLE_DENSITY_STORAGE_KEY)).toBe('completo');
  });

  it('nova montagem lê Completo gravado', () => {
    localStorage.setItem(DRE_TABLE_DENSITY_STORAGE_KEY, 'completo');
    const { result } = renderHook(() => useDreTableDensity());
    expect(result.current.density).toBe('completo');
  });
});
