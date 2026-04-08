import {
  cadastrarCertificadoEmissaoNf,
  cadastrarEmpresaEmissaoNf,
  type CadastrarEmissaoNfCertificadoInput,
  type CadastrarEmissaoNfCertificadoResponse,
  type CadastrarEmissaoNfEmpresaResponse
} from '../services/meiNotasService';

export type PlugnotasEmitentePhase = 'certificado' | 'empresa';

export class PlugnotasEmitenteSetupError extends Error {
  readonly phase: PlugnotasEmitentePhase;
  readonly certificadoId?: string;
  readonly cnpj?: string;

  constructor(
    phase: PlugnotasEmitentePhase,
    cause: unknown,
    meta?: { certificadoId?: string; cnpj?: string }
  ) {
    const msg =
      cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : 'Falha na configuração fiscal no emissor.';
    super(msg, { cause: cause instanceof Error || typeof cause === 'string' ? cause : undefined });
    this.name = 'PlugnotasEmitenteSetupError';
    this.phase = phase;
    this.certificadoId = meta?.certificadoId;
    this.cnpj = meta?.cnpj;
  }
}

export type PlugnotasEmitenteSetupDeps = {
  cadastrarCertificado: typeof cadastrarCertificadoEmissaoNf;
  cadastrarEmpresa: typeof cadastrarEmpresaEmissaoNf;
};

const defaultDeps: PlugnotasEmitenteSetupDeps = {
  cadastrarCertificado: cadastrarCertificadoEmissaoNf,
  cadastrarEmpresa: cadastrarEmpresaEmissaoNf
};

export type SubmitPlugnotasEmitenteInput = {
  certificateInput: CadastrarEmissaoNfCertificadoInput;
  /** Monta o corpo de `POST …/empresa` após o ID do certificado ser conhecido. */
  buildCompanyPayload: (certificadoId: string) => Record<string, unknown>;
};

export type SubmitPlugnotasEmitenteResult = {
  certificateResponse: CadastrarEmissaoNfCertificadoResponse;
  companyResponse: CadastrarEmissaoNfEmpresaResponse;
  certificateRecoveredFrom409: boolean;
};

/**
 * Sequência canónica: POST certificado → POST empresa (FR-ORQ-CERT-02).
 * Falhas são encapsuladas em {@link PlugnotasEmitenteSetupError} com `phase`.
 */
export async function submitPlugnotasEmitenteSetup(
  input: SubmitPlugnotasEmitenteInput,
  options?: {
    deps?: Partial<PlugnotasEmitenteSetupDeps>;
    onPhaseChange?: (phase: PlugnotasEmitentePhase) => void;
  }
): Promise<SubmitPlugnotasEmitenteResult> {
  const deps = { ...defaultDeps, ...options?.deps };
  const onPhaseChange = options?.onPhaseChange;

  onPhaseChange?.('certificado');
  let certificateResponse: CadastrarEmissaoNfCertificadoResponse;
  try {
    certificateResponse = await deps.cadastrarCertificado(input.certificateInput);
  } catch (cause) {
    throw new PlugnotasEmitenteSetupError('certificado', cause);
  }

  const certificateId = String(certificateResponse.id || '').trim();

  if (!certificateId) {
    throw new PlugnotasEmitenteSetupError('certificado', new Error(
      'O sistema de emissão fiscal não retornou o ID do certificado.'
    ));
  }

  const companyPayload = input.buildCompanyPayload(certificateId);
  const cnpjDigits = String(companyPayload.cpfCnpj ?? companyPayload.cnpj ?? '').replace(/\D/g, '');

  onPhaseChange?.('empresa');
  try {
    const companyResponse = await deps.cadastrarEmpresa(companyPayload);
    const raw = certificateResponse.raw && typeof certificateResponse.raw === 'object'
      ? (certificateResponse.raw as Record<string, unknown>)
      : {};
    const certificateRecoveredFrom409 = Boolean(raw.recoveredFrom409);
    return {
      certificateResponse,
      companyResponse,
      certificateRecoveredFrom409
    };
  } catch (cause) {
    throw new PlugnotasEmitenteSetupError('empresa', cause, {
      certificadoId: certificateId,
      cnpj: cnpjDigits.length === 14 ? cnpjDigits : undefined
    });
  }
}

export async function retryPlugnotasEmpresaRegistro(
  companyPayload: Record<string, unknown>,
  deps?: Partial<PlugnotasEmitenteSetupDeps>
): Promise<CadastrarEmissaoNfEmpresaResponse> {
  const d = { ...defaultDeps, ...deps };
  return d.cadastrarEmpresa(companyPayload);
}

export function isPlugnotasEmitenteSetupError(
  err: unknown
): err is PlugnotasEmitenteSetupError {
  return err instanceof PlugnotasEmitenteSetupError;
}
