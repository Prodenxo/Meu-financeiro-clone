/**
 * Política MEI / Guia MEI — cadastro empresa Plugnotas (apenas NFS-e).
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 * @see docs/stories/epic-guia-mei-apenas-nfse-prd.md (US-MEI-NFS-01)
 */
export const PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA = 'ISENTO';

/**
 * Contrato oficial NFS-e Nacional no `POST/PATCH` empresa.
 * Política MVP: `consultaNfseNacional` acompanha `nfseNacional`.
 * @see docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md
 */
export const PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY = 'nfseNacional';
export const PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY = 'consultaNfseNacional';
export const PLUGNOTAS_NFSE_NACIONAL_LEGACY_INPUT_KEY = 'nacional';
export const PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON = true;

const hasOwn = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toObject = (value) => (isPlainObject(value) ? value : {});

export const inspectNfseContractInput = (nfseRaw) => {
  const nfse = toObject(nfseRaw);
  const config = toObject(nfse.config);
  const hasOfficialContractInput =
    hasOwn(config, PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY)
    || hasOwn(config, PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY);
  const hasLegacyNationalInput = hasOwn(nfse, PLUGNOTAS_NFSE_NACIONAL_LEGACY_INPUT_KEY);

  return {
    hasOfficialContractInput,
    hasLegacyNationalInput,
    usesLegacyOnlyNationalInput: hasLegacyNationalInput && !hasOfficialContractInput
  };
};

export const applyNfseNationalContractPolicy = (payload) => {
  if (!isPlainObject(payload)) return inspectNfseContractInput(null);

  const nfse = toObject(payload.nfse);
  const contractInput = inspectNfseContractInput(nfse);
  if (!Object.keys(nfse).length) return contractInput;

  const next = { ...nfse };
  const nextConfig = toObject(next.config);
  delete next[PLUGNOTAS_NFSE_NACIONAL_LEGACY_INPUT_KEY];

  if (next.ativo === false) {
    delete nextConfig[PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY];
    delete nextConfig[PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY];
    if (Object.keys(nextConfig).length) next.config = nextConfig;
    else delete next.config;
    payload.nfse = next;
    return contractInput;
  }

  const configWithDefaults = {
    producao: true,
    ...nextConfig,
    [PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON,
    [PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]: PLUGNOTAS_NFSE_NACIONAL_DEFAULT_ON
  };

  next.config = configWithDefaults;
  payload.nfse = next;
  return contractInput;
};
