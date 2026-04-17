import { useEffect, useState } from 'react';
import type { MeiFiscalEmissionDocumentType } from '../components/mei/MeiFiscalEmissionTypeSegmented';
import { consultarEmpresaEmissaoNf } from '../services/meiNotasService';
import { getPlugnotasCodeFromUnknownError } from '../utils/apiClientError';
import { formatPlugnotasIntegrationError } from '../utils/plugnotasIntegrationErrorMessage';
import {
  type ParsedPlugnotasEmpresaCapabilities,
  parsePlugnotasEmpresaCapabilities
} from '../utils/plugnotasEmpresaCapabilities';

function formatCapabilityFetchError(error: unknown, fallback: string): string {
  return formatPlugnotasIntegrationError(
    error instanceof Error ? error.message : fallback,
    getPlugnotasCodeFromUnknownError(error)
  );
}

export type UseMeiPlugnotasFiscalCapabilityResult = {
  loading: boolean;
  error: string | null;
  capabilities: ParsedPlugnotasEmpresaCapabilities | null;
};

/**
 * Consulta cadastro no emissor fiscal e interpreta `nfe.ativo` / `nfce.ativo` para o Guia MEI (FR-GUIA-FISC-07).
 */
export function useMeiPlugnotasFiscalCapability(options: {
  cnpjDigits: string;
  emissionDocumentType: MeiFiscalEmissionDocumentType;
  fetchEnabled: boolean;
  /** Incrementado pelo pai após mutações (ex.: save empresa) para forçar nova consulta sem F5 (FR-GUIA-FISC-11). */
  capabilityRefetchKey?: number;
}): UseMeiPlugnotasFiscalCapabilityResult {
  const { cnpjDigits, emissionDocumentType, fetchEnabled, capabilityRefetchKey = 0 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ParsedPlugnotasEmpresaCapabilities | null>(null);

  useEffect(() => {
    if (!fetchEnabled || emissionDocumentType === 'NFSE') {
      setLoading(false);
      setError(null);
      setCapabilities(null);
      return;
    }

    if (cnpjDigits.length !== 14) {
      setLoading(false);
      setError(null);
      setCapabilities(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCapabilities(null);

    void consultarEmpresaEmissaoNf(cnpjDigits)
      .then((raw) => {
        if (cancelled) return;
        setCapabilities(parsePlugnotasEmpresaCapabilities(raw));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          formatCapabilityFetchError(
            err,
            'Não foi possível verificar a configuração da empresa no emissor fiscal integrado.'
          )
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cnpjDigits, emissionDocumentType, fetchEnabled, capabilityRefetchKey]);

  return { loading, error, capabilities };
}
