import {
  DEFAULT_DOCUMENTOS_ATIVOS,
  type DocumentosAtivosState
} from './plugnotasEmpresaDocumentosAtivos';
import { normalizeIbgeMunicipioCodigo } from './ibgeMunicipioCodigo';

const normalizeDoc = (value: string) => value.replace(/\D/g, '');
const hasRequiredText = (value: unknown) => String(value || '').trim().length > 0;
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Valor enviado ao Plugnotas quando a IE não é preenchida no formulário.
 * Deve coincidir com `PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA` no backend.
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 */
export const PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA = 'ISENTO';

/**
 * Contrato oficial PlugNotas para NFS-e Nacional no cadastro da empresa.
 * Política MVP: `consultaNfseNacional` acompanha `nfseNacional`.
 * @see docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md (US-MEI-NAT-02)
 */
export const PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY = 'nfseNacional' as const;
export const PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY = 'consultaNfseNacional' as const;
export const PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON = true;

const PLUGNOTAS_EMPRESA_DOC_INATIVO = Object.freeze({ ativo: false, tipoContrato: 0 });
const PLUGNOTAS_NFE_ATIVO_CONFIG_MIN = Object.freeze({
  producao: true,
  serie: 1,
  numero: 1
});
const PLUGNOTAS_NFCE_ATIVO_CONFIG_MIN = Object.freeze({
  producao: true,
  serie: 1,
  numero: 1,
  versaoQrCode: 2
});

/** Abreviações de tipo de via sem nome — Plugnotas rejeita no POST /empresa. */
const LOGRADOURO_SO_TIPO_ABREVIADO = /^(av|tv|pc|lt|rod|est|rua|al|v|p|l|st|qd|cj|cs)\.?$/i;

export const PLUGNOTAS_REGIME_ESPECIAL_MEI = 5;

export type NfEmissionRegimeTributario = '1' | '2' | '3';

export type NfEmissionCompanyForm = {
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  /** Opcional — enviado ao Plugnotas apenas se preenchido (modo nacional não exige na UI). */
  inscricaoMunicipal: string;
  regimeTributario: NfEmissionRegimeTributario;
  simplesNacional: boolean;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  codigoCidade: string;
  descricaoCidade: string;
  estado: string;
  /** Lote inicial RPS (PlugNotas) — editável na configuração do emitente. */
  rpsLote: number;
  /** Número inicial RPS. */
  rpsNumero: number;
  /** Série RPS (texto). */
  rpsSerie: string;
};

const clampRpsInt = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return fallback;
};

function normalizeRpsErrorText(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Detecta rejeição do emissor por ausência de série RPS no cadastro da empresa. */
export function isPlugnotasRpsSerieNotRegisteredMessage(message: string): boolean {
  const m = normalizeRpsErrorText(message);
  if (!m.trim()) return false;
  if (m.includes('nenhuma serie cadastrada')) return true;
  if (m.includes('serie') && m.includes('cadastrad') && (m.includes('rps') || m.includes('nfse'))) return true;
  if (m.includes('series') && m.includes('nao') && m.includes('cadastrad')) return true;
  return false;
}

export const buildRpsPayloadFromForm = (form: NfEmissionCompanyForm) => ({
  lote: clampRpsInt(form.rpsLote, 1),
  numeracao: [
    {
      numero: clampRpsInt(form.rpsNumero, 1),
      serie: String(form.rpsSerie ?? '1').trim() || '1'
    }
  ]
});

export const getDefaultNfEmissionCompanyForm = (): NfEmissionCompanyForm => ({
  razaoSocial: '',
  nomeFantasia: '',
  email: '',
  inscricaoMunicipal: '',
  regimeTributario: '1',
  simplesNacional: true,
  cep: '',
  tipoLogradouro: 'Rua',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  codigoCidade: '',
  descricaoCidade: '',
  estado: '',
  rpsLote: 1,
  rpsNumero: 1,
  rpsSerie: '1'
});

export const getNfEmissionCompanyValidationMessage = (form: NfEmissionCompanyForm): string | null => {
  if (!hasRequiredText(form.razaoSocial)) return 'Informe a razão social da empresa para configurar a integração fiscal.';
  if (!hasRequiredText(form.logradouro)) return 'Informe o logradouro do endereço da empresa.';
  const logradouroTrim = form.logradouro.trim();
  if (logradouroTrim.length < 4 || LOGRADOURO_SO_TIPO_ABREVIADO.test(logradouroTrim)) {
    return 'Informe o nome completo do logradouro (ex.: Av. Principal, Rua das Flores), com pelo menos 4 caracteres; não use só abreviação de tipo (ex.: "Av").';
  }
  if (!hasRequiredText(form.numero)) return 'Informe o número do endereço da empresa.';
  if (!hasRequiredText(form.bairro)) return 'Informe o bairro do endereço da empresa.';
  if (normalizeDoc(form.cep).length !== 8) return 'Informe um CEP válido com 8 dígitos.';
  if (!hasRequiredText(form.codigoCidade)) return 'Informe o código IBGE da cidade.';
  if (!hasRequiredText(form.descricaoCidade)) return 'Informe a cidade da empresa.';
  if (String(form.estado ?? '').trim().length !== 2) return 'Informe a UF com 2 letras (ex.: PR).';
  if (!hasRequiredText(form.email)) {
    return 'Informe o e-mail da empresa (obrigatório no cadastro fiscal).';
  }
  if (!isValidEmail(form.email)) {
    return 'Informe um e-mail válido (ex.: contato@empresa.com.br).';
  }
  if (!Number.isFinite(form.rpsLote) || form.rpsLote < 1) {
    return 'Lote RPS deve ser um número inteiro maior ou igual a 1.';
  }
  if (!Number.isFinite(form.rpsNumero) || form.rpsNumero < 1) {
    return 'Número inicial do RPS deve ser um inteiro maior ou igual a 1.';
  }
  if (!String(form.rpsSerie ?? '').trim()) {
    return 'Informe a série do RPS (ex.: 1).';
  }
  return null;
};

const resolveDocumentosAtivosSelection = (documentosAtivos?: DocumentosAtivosState): DocumentosAtivosState => {
  if (!documentosAtivos) {
    return { ...DEFAULT_DOCUMENTOS_ATIVOS };
  }
  return {
    nfse: Boolean(documentosAtivos.nfse),
    nfe: Boolean(documentosAtivos.nfe),
    nfce: Boolean(documentosAtivos.nfce)
  };
};

const buildNfseConfigRpsFromForm = (form: NfEmissionCompanyForm) => ({
  serie: String(form.rpsSerie ?? '1').trim() || '1',
  numero: clampRpsInt(form.rpsNumero, 1),
  lote: clampRpsInt(form.rpsLote, 1)
});

const buildNfseBlockFromSelection = (
  selection: DocumentosAtivosState,
  form?: NfEmissionCompanyForm
): Record<string, unknown> => {
  if (!selection.nfse) {
    return { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };
  }
  return {
    ativo: true,
    tipoContrato: 0,
    config: {
      producao: true,
      [PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
      [PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
      rps: form ? buildNfseConfigRpsFromForm(form) : { serie: '1', numero: 1, lote: 1 }
    }
  };
};

const buildNfeBlockFromSelection = (selection: DocumentosAtivosState): Record<string, unknown> => {
  if (!selection.nfe) {
    return { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };
  }
  return {
    ativo: true,
    tipoContrato: 0,
    config: { ...PLUGNOTAS_NFE_ATIVO_CONFIG_MIN }
  };
};

const buildNfceBlockFromSelection = (selection: DocumentosAtivosState): Record<string, unknown> => {
  if (!selection.nfce) {
    return { ...PLUGNOTAS_EMPRESA_DOC_INATIVO };
  }
  return {
    ativo: true,
    tipoContrato: 0,
    config: { ...PLUGNOTAS_NFCE_ATIVO_CONFIG_MIN }
  };
};

export const buildNfEmissionEmpresaPayload = ({
  cnpj,
  certificadoId,
  form,
  documentosAtivos
}: {
  cnpj: string;
  /** Quando omitido, o payload não inclui `certificado` (uso em PATCH só dados cadastrais). */
  certificadoId?: string;
  form: NfEmissionCompanyForm;
  /** Se presente, o backend monta `nfse`/`nfe`/`nfce` a partir desta selecção canónica. */
  documentosAtivos?: DocumentosAtivosState;
}) => {
  const documentosSelection = resolveDocumentosAtivosSelection(documentosAtivos);
  const endereco: Record<string, unknown> = {
    tipoLogradouro: form.tipoLogradouro.trim() || 'Rua',
    logradouro: form.logradouro.trim(),
    numero: form.numero.trim(),
    bairro: form.bairro.trim(),
    codigoPais: '1058',
    descricaoPais: 'Brasil',
    codigoCidade: normalizeIbgeMunicipioCodigo(form.codigoCidade),
    descricaoCidade: form.descricaoCidade.trim(),
    estado: form.estado.trim().toUpperCase(),
    cep: normalizeDoc(form.cep).slice(0, 8)
  };
  if (form.complemento.trim()) {
    endereco.complemento = form.complemento.trim();
  }

  const payload: Record<string, unknown> = {
    cpfCnpj: cnpj,
    razaoSocial: form.razaoSocial.trim(),
    nomeFantasia: form.nomeFantasia.trim() || form.razaoSocial.trim(),
    regimeTributario: Number(form.regimeTributario || '1'),
    simplesNacional: Boolean(form.simplesNacional),
    ...(form.regimeTributario === '1' && form.simplesNacional
      ? { regimeTributarioEspecial: PLUGNOTAS_REGIME_ESPECIAL_MEI }
      : {}),
    endereco,
    /** Sem input na UI (US-MEI-NFS-02); política alinhada ao backend US-MEI-NFS-01. */
    inscricaoEstadual: PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
    nfse: buildNfseBlockFromSelection(documentosSelection, form),
    nfe: buildNfeBlockFromSelection(documentosSelection),
    nfce: buildNfceBlockFromSelection(documentosSelection)
  };
  if (form.email.trim()) {
    payload.email = form.email.trim();
  }
  const im = form.inscricaoMunicipal?.trim();
  if (im) {
    payload.inscricaoMunicipal = im;
  }

  const trimmedCert = certificadoId?.trim();
  if (trimmedCert) {
    payload.certificado = trimmedCert;
  }

  if (documentosAtivos) {
    payload.documentosAtivos = { ...documentosSelection };
  }

  payload.rps = buildRpsPayloadFromForm(form);

  return payload;
};
