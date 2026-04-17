import { useCallback, useState } from 'react';

export type DreTableDensity = 'simples' | 'completo';

export const DRE_TABLE_DENSITY_STORAGE_KEY = 'meu-financeiro:dre-table-density';

function readStoredDensity(): DreTableDensity {
  if (typeof window === 'undefined') return 'simples';
  try {
    const raw = localStorage.getItem(DRE_TABLE_DENSITY_STORAGE_KEY);
    if (raw === 'simples' || raw === 'completo') return raw;
    if (raw != null) {
      localStorage.removeItem(DRE_TABLE_DENSITY_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
  return 'simples';
}

export function useDreTableDensity(): {
  density: DreTableDensity;
  setDensity: (d: DreTableDensity) => void;
} {
  const [density, setDensityState] = useState<DreTableDensity>(readStoredDensity);

  const setDensity = useCallback((d: DreTableDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(DRE_TABLE_DENSITY_STORAGE_KEY, d);
    } catch {
      /* ignore */
    }
  }, []);

  return { density, setDensity };
}
