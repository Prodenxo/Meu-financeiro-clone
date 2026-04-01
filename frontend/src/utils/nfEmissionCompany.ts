const normalizeDoc = (value: string) => value.replace(/\D/g, '');

/**
 * Valor enviado ao Plugnotas quando a IE não é preenchida no formulário.
 * Deve coincidir com `PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA` no backend.
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 */
export const PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA = 'ISENTO';

/**
 * Default “NFS-e Nacional ON” no bloco `nfse` — espelha `PLUGNOTAS_NFSE_NACIONAL_*` no backend.
 * @see docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md (US-MEI-NAT-02)
 */
export const PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY = 'nacional' as const;
export const PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON = true;

const hasRequiredText = (value: unknown) => String(value || '').trim().length > 0;

/** Abreviações de tipo de via sem nome — Plugnotas rejeita no POST /empresa. */
const LOGRADOURO_SO_TIPO_ABREVIADO = /^(av|tv|pc|lt|rod|est|rua|al|v|p|l|st|qd|cj|cs)\.?$/i;

export type NfEmissionRegimeTributario = '1' | '2' | '3';

export type NfEmissionCompanyForm = {
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  regimeTributario: NfEmissionRegimeTributario;
  simplesNacional: boolean;
  inscricaoMunicipal: string;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  codigoCidade: string;
  descricaoCidade: string;
  estado: string;
};

export const getDefaultNfEmissionCompanyForm = (): NfEmissionCompanyForm => ({
  razaoSocial: '',
  nomeFantasia: '',
  email: '',
  regimeTributario: '1',
  simplesNacional: true,
  inscricaoMunicipal: '',
  cep: '',
  tipoLogradouro: 'Rua',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  codigoCidade: '',
  descricaoCidade: '',
  estado: ''
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
  if (form.estado.trim().length !== 2) return 'Informe a UF com 2 letras (ex.: PR).';
  return null;
};

export const buildNfEmissionEmpresaPayload = ({
  cnpj,
  certificadoId,
  form
}: {
  cnpj: string;
  /** Quando omitido, o payload não inclui `certificado` (uso em PATCH só dados cadastrais). */
  certificadoId?: string;
  form: NfEmissionCompanyForm;
}) => {
  const endereco: Record<string, unknown> = {
    tipoLogradouro: form.tipoLogradouro.trim() || 'Rua',
    logradouro: form.logradouro.trim(),
    numero: form.numero.trim(),
    bairro: form.bairro.trim(),
    codigoPais: '1058',
    descricaoPais: 'Brasil',
    codigoCidade: form.codigoCidade.trim(),
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
    endereco,
    /** Sem input na UI (US-MEI-NFS-02); política alinhada ao backend US-MEI-NFS-01. */
    inscricaoEstadual: PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA,
    nfse: {
      ativo: true,
      tipoContrato: 0,
      config: { producao: true },
      [PLUGNOTAS_NFSE_NACIONAL_PAYLOAD_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON
    },
    /** Alinhado a US-MEI-NFS-01 / ADR apenas NFS-e — backend reforça o mesmo contrato. */
    nfe: { ativo: false, tipoContrato: 0 },
    nfce: { ativo: false, tipoContrato: 0 }
  };
  if (form.email.trim()) {
    payload.email = form.email.trim();
  }
  if (form.inscricaoMunicipal.trim()) {
    payload.inscricaoMunicipal = form.inscricaoMunicipal.trim();
  }

  const trimmedCert = certificadoId?.trim();
  if (trimmedCert) {
    payload.certificado = trimmedCert;
  }

  return payload;
};
