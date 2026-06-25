import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from 'react';
import { useInRouterContext } from 'react-router-dom';
import {
  downloadMeiGuide,
  downloadParcelamentoPdf,
  fetchMeiCertificateStatus,
  fetchMeiPeriods,
  fetchMeiPeriodsByCnpj,
  fetchParcelamentos,
  removeMeiCertificate,
  uploadMeiCertificate,
  patchMeiCertificateEmitenteNfse,
  validateMeiGuide,
  type MeiPeriod,
  type NfseEmitenteSnapshot,
  type ParcelamentoItem
} from '../services/guidesMeiService';
import {
  arquivarNfse,
  atualizarNfse,
  baixarNfsePdf,
  baixarNfseXml,
  atualizarEmpresaEmissaoNf,
  consultarEmpresaEmissaoNf,
  type CadastrarEmissaoNfEmpresaResponse,
  cancelarNfse,
  emitirNfe,
  emitirNfce,
  emitirNfse,
  fetchLimiteFaturamentoMei,
  listarCatalogoNfseClientes,
  listarCatalogoNfseProdutos,
  listarNfse,
  obterNfse,
  type NfseCatalogCliente,
  type NfseCatalogProduto,
  type EmitirNfseInput,
  type NfseRecord
} from '../services/meiNotasService';
import { useAuthStore } from '../store/authStore';
import {
  buildNfEmissionEmpresaPayload,
  getDefaultNfEmissionCompanyForm,
  getNfEmissionCompanyValidationMessage,
  type NfEmissionCompanyForm,
  type NfEmissionRegimeTributario
} from '../utils/nfEmissionCompany';
import { normalizeIbgeMunicipioCodigo } from '../utils/ibgeMunicipioCodigo';
import {
  DEFAULT_DOCUMENTOS_ATIVOS,
  documentosAtivosDivergem,
  extractDocumentosAtivosFromEmpresaResponse,
  getDocumentosAtivosValidationMessage,
  mapPlugnotasEmpresaToDocumentSelection,
  mergeDocumentosAtivosPrecedence,
  type DocumentosAtivosState
} from '../utils/plugnotasEmpresaDocumentosAtivos';
import {
  clearGuiaMeiEmpresaFase2FailFlag,
  isGuiaMeiEmpresaFase2FailFlagActive,
  setGuiaMeiEmpresaFase2FailFlag
} from '../utils/guiaMeiEmpresaFase2FailFlag';
import { fetchEmpresaJsonWithMeiCache, invalidateMeiEmpresaGetCache } from '../utils/guiaMeiEmpresaGetCache';
import { isFetchConnectivityFailure } from '../utils/isFetchConnectivityFailure';
import {
  isPlugnotasEmitenteSetupError,
  retryPlugnotasEmpresaRegistro,
  submitPlugnotasEmitenteSetup
} from '../utils/plugnotasEmitenteSetup';
import {
  getApiErrorCodeFromUnknownError,
  getHttpStatusFromUnknownError as getFiscalHttpStatus,
  getPlugnotasCodeFromUnknownError as getFiscalErrorCode,
  getPlugnotasRequestFromUnknownError as getFiscalRequestMeta,
  getRuntimeDecisionFromUnknownError
} from '../utils/apiClientError';
import { isMeiEmissionErrorRetryable } from '../utils/meiEmissionRetryable';
import {
  mapMeiGuideValidateErrorToUserMessage,
  type MeiGuideValidateMappedError
} from '../utils/mapMeiGuideValidateErrorToUserMessage';
import {
  formatMeiFiscalMappedForAlert,
  mapMeiFiscalErrorToCopy,
  resolveMeiFiscalScenario
} from '../lib/fiscalUserError';
import { isHiddenNfseE0014RejectedRecord } from '../lib/meiNfseE0014';
import { formatPlugnotasIntegrationError as formatFiscalError } from '../utils/plugnotasIntegrationErrorMessage';
import { getNfseServicoCodigoValidationError } from '../utils/nfseServicoCodigo';
import {
  getNfseNacionalOperacaoHelpHref,
  getPlugnotasEmpresaCadastroErrorUxVariant,
  isPlugnotasEmpresaConsultNotFoundMessage,
  isPlugnotasEmpresaMunicipalRequirementMessage,
  MEI_IBGE_CIDADE_PRESTACAO_PRESTADOR_FIELD_HINT,
  withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable
} from '../utils/nfseNacionalPlugnotasErrorHints';
import { resolvePlugnotasEmpresaCadastroSolUxState } from '../utils/plugnotasEmpresaCadastroSolUx';
import {
  PLUGNOTAS_P0_L1_ARIA_LABEL,
  PLUGNOTAS_P0_L1_BODY_PARAS,
  PLUGNOTAS_P0_L1_TITLE,
  PLUGNOTAS_P0_L2_STATUS_MESSAGE,
  readMeiPlugnotasEmpresaCadastroBlockedExternally,
  resolvePlugnotasEmpresaP0Overlay
} from '../utils/plugnotasEmpresaP0Overlay';
import { lookupEmpresaCnpj, type CnpjLookupResult } from '../services/usersService';
import { DevApiHealthIndicator } from '../components/DevApiHealthIndicator';
import {
  PlugnotasMunicipalRequirementOperacaoBody,
  PlugnotasPrefeituraConfigNfseOperacaoBody,
  PlugnotasPrefeituraConfigNfseOperacaoTitle,
  PlugnotasPrefeituraLoginRequiredNfseOperacaoBody,
  PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle
} from '../components/PlugnotasMunicipalRequirementOperacaoCopy';
import { MeiLimiteFaturamentoBlock } from '../components/MeiLimiteFaturamentoBlock';
import { MeiNfseCatalogManageActions } from '../components/MeiNfseCatalogManageActions';
import { MeiNfseListRowActions } from '../components/MeiNfseListRowActions';
import {
  EmissaoFiscalErrorAlert,
  GuiaMeiCertificateConnectivityPanel,
  GuiaMeiEmpresaCadastroErrorPanel,
  LongFiscalErrorMessage,
  PlugnotasIntegrationErrorAlert as FiscalProviderErrorAlert
} from '../components/FiscalIntegrationErrorAlert';
import { PlugnotasEmpresaCadastroSolContextPanel } from '../components/PlugnotasEmpresaCadastroSolContextPanel';
import type { GuidesMeiWorkspace } from './guidesMeiWorkspaceStorage';
import {
  MEI_WORKSPACE_STORAGE_KEY,
  readWorkspaceFromStorage,
  resolveInitialWorkspace
} from './guidesMeiWorkspaceStorage';
import {
  createInitialEmitirNfseInput,
  emptyNfsePrestadorEndereco,
  mergeEmitenteSnapshotIntoNfseForm,
  replacePrestadorFromEmitenteSnapshot
} from '../utils/nfseEmitenteHydration';
import {
  normalizeCodigoNbsInput,
  pickCodigoNbsFromCatalogMetadata
} from '../lib/nfseCodigoNbs';
import {
  isNfsePrestadorPrefillEffectivelyEmpty,
  mergeNfsePrestadorPrefillIntoForm
} from '../utils/nfsePrestadorPrefillMerge';
import { fetchNfsePrestadorPrefill } from '../services/meiPrestadorPrefillService';
import {
  computeMeiLimiteProgresso,
  nfsePeriodoChaveBrFromCreatedAt,
  nfseStatusKeyParaLimite
} from '../utils/meiLimiteFaturamento';
import { getVigenciaLabelParaAno } from '../utils/meiLimiteFaturamentoConfig';
import {
  meiFiscalDocumentTypeBadgeClass,
  meiFiscalDocumentTypeShortLabel,
  meiFiscalListFilterEmptyMessage,
  type MeiFiscalListDocumentFilter
} from '../utils/meiFiscalDocumentTypeUi';
import {
  buildPrefilledNfeLikeFormSnapshot,
  createEmptyMeiNfeLikeFormState,
  serializeMeiNfeLikeFormForDirty,
  type MeiNfeLikeFormState
} from '../utils/meiNfeLikeFormState';
import { buildNfeLikePayloadFromMeiForm } from '../utils/meiNfeLikePayloadBuilder';
import { validateMeiNfeLikeForm } from '../utils/meiNfeLikeClientValidation';
import { GuiaMeiDesativarNfseDialog } from '../components/mei/GuiaMeiDesativarNfseDialog';
import { MeiFiscalChangeEmissionTypeDialog } from '../components/mei/MeiFiscalChangeEmissionTypeDialog';
import {
  MeiFiscalEmissionTypeSegmented,
  meiFiscalEmissionHelpLine,
  type MeiFiscalEmissionDocumentType
} from '../components/mei/MeiFiscalEmissionTypeSegmented';
import { MeiFiscalCapabilityCallout } from '../components/mei/MeiFiscalCapabilityCallout';
import { MeiFiscalModalidadesActivationWizard } from '../components/mei/MeiFiscalModalidadesActivationWizard';
import { MeiCadastroNfeNfceInfoBanner } from '../components/mei/MeiCadastroNfeNfceInfoBanner';
import { MeiCadastroRequisitosNfeNfcePlaceholder } from '../components/mei/MeiCadastroRequisitosNfeNfcePlaceholder';
import { MeiNfeLikeEmitForm } from '../components/mei/MeiNfeLikeEmitForm';
import { MeiRpsNumeracaoPanel } from '../components/mei/MeiRpsNumeracaoPanel';
import { isMeiFiscalD2ModalidadesEnabled, isMeiNfeNfceEmitEnabled } from '../config/meiFiscalFeatureFlags';
import { useMeiPlugnotasFiscalCapability } from '../hooks/useMeiPlugnotasFiscalCapability';
import { isNfeLikeEmissionBlockedByCapabilities } from '../utils/plugnotasEmpresaCapabilities';
import type { EmpresaCadastroRuntimeDecision } from '../types/empresaCadastroRuntimeDecision';
import {
  getPrefeituraPortalCredentialsValidationMessage,
  isPrefeituraPortalCredentialsUiEnabled,
  mergePrefeituraPortalCredentialsIntoEmpresaPayload
} from '../utils/prefeituraPortalCredentialsUi';
import {
  ARIA_LABEL_REGIAO_DIVERGENCIA_DOCUMENTOS_ATIVOS,
  CTA_ATUALIZAR_VISTA_DOCUMENTOS_ATIVOS,
  CTA_SINCRONIZAR_EMISSOR_DOCUMENTOS_ATIVOS,
  getGuiaMeiCadastroFiscalDocHref,
  getHintBlocoDadosMinimosEmitente,
  getTituloBlocoDadosMinimosEmitente,
  MSG_BANNER_DIVERGENCIA_DOCUMENTOS_ATIVOS,
  MSG_DOCUMENTOS_ATIVOS_GET_EMPRESA_HIDRATACAO_FALHOU,
  MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR,
  shouldShowCadastroNfeNfceInfoBanner,
  shouldShowRequisitosNfeNfceSecao,
  SUBTITULO_OPCIONAL_ALTERAR_DEPOIS_DOCUMENTOS_ATIVOS,
  SUBTITULO_SECAO_DOCUMENTOS_ATIVOS_DESCOBERTA,
  TITULO_SECAO_DOCUMENTOS_ATIVOS_EMISSOR
} from '../utils/guiaMeiCadastroDocumentosAtivos';

function formatMeiFiscalErr(error: unknown, fallback: string): string {
  return formatFiscalError(
    error instanceof Error ? error.message : fallback,
    getFiscalErrorCode(error),
    getFiscalHttpStatus(error),
    getFiscalRequestMeta(error)
  );
}

function nfseErrorSummaryLine(
  rawMessage: string,
  plugnotasCode: string | null,
  httpStatus: number | null,
  plugnotasRequest: ReturnType<typeof getFiscalRequestMeta>
): string {
  const copy = mapMeiFiscalErrorToCopy({ rawMessage, plugnotasCode, httpStatus, plugnotasRequest });
  const line = `${copy.title}: ${copy.description}`.replace(/\s+/g, ' ').trim();
  return line.length > 200 ? `${line.slice(0, 197)}…` : line;
}

type MeiFiscalUiErrorState = {
  message: string;
  rawMessage: string;
  apiErrorCode: string | null;
  plugnotasCode: string | null;
  httpStatus: number | null;
  plugnotasRequest: ReturnType<typeof getFiscalRequestMeta>;
  runtimeDecision: EmpresaCadastroRuntimeDecision | null;
};

function createPlainMeiFiscalUiErrorState(message: string): MeiFiscalUiErrorState {
  const normalized = String(message || '').trim();
  return {
    message: normalized,
    rawMessage: normalized,
    apiErrorCode: null,
    plugnotasCode: null,
    httpStatus: null,
    plugnotasRequest: null,
    runtimeDecision: null
  };
}

function createMeiFiscalUiErrorState(
  error: unknown,
  fallback: string,
  overrideMessage?: string
): MeiFiscalUiErrorState {
  const raw = error instanceof Error ? error.message : fallback;
  const rawMessage = (raw || fallback).trim();
  const plugnotasCode = getFiscalErrorCode(error);
  const httpStatus = getFiscalHttpStatus(error);
  const plugnotasRequest = getFiscalRequestMeta(error);
  const runtimeDecision = getRuntimeDecisionFromUnknownError(error);
  const mapped = mapMeiFiscalErrorToCopy({
    rawMessage,
    plugnotasCode,
    httpStatus,
    plugnotasRequest,
    runtimeDecision
  });

  return {
    message: overrideMessage?.trim() || formatMeiFiscalMappedForAlert(mapped),
    rawMessage,
    apiErrorCode: getApiErrorCodeFromUnknownError(error),
    plugnotasCode,
    httpStatus,
    plugnotasRequest,
    runtimeDecision
  };
}

const buildFilenameFromCompetencia = (competencia: string | null) => {
  if (!competencia) return 'guia-mei.pdf';
  return `guia-mei-${competencia}.pdf`;
};

const normalizeDoc = (value: string) => value.replace(/\D/g, '');

const getDocType = (value: string) => {
  const digits = normalizeDoc(value);
  if (digits.length === 11) return 1;
  if (digits.length === 14) return 2;
  return null;
};

const formatDocument = (value: string) => {
  const digits = normalizeDoc(value).slice(0, 14);
  let formatted = '';
  for (let i = 0; i < digits.length; i += 1) {
    formatted += digits[i];
    if (digits.length <= 11) {
      if (i === 2 || i === 5) formatted += '.';
      if (i === 8) formatted += '-';
    } else {
      if (i === 1 || i === 4) formatted += '.';
      if (i === 7) formatted += '/';
      if (i === 11) formatted += '-';
    }
  }
  return formatted;
};

const formatCompetencia = (month: string, year: number) => {
  return `${month}/${year}`;
};

const toPeriodoApuracao = (month: string, year: number) => {
  return `${year}${month}`;
};

const clampRpsIntForm = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return fallback;
};

const emitenteSnapshotToForm = (snap: NfseEmitenteSnapshot): NfEmissionCompanyForm => {
  const { certDocument: _omitCert, ...companyFields } = snap;
  const regime: NfEmissionRegimeTributario = '1';
  const def = getDefaultNfEmissionCompanyForm();
  return {
    ...def,
    ...companyFields,
    regimeTributario: regime,
    inscricaoMunicipal: String(companyFields.inscricaoMunicipal ?? '').trim(),
    codigoCidade: normalizeIbgeMunicipioCodigo(companyFields.codigoCidade),
    rpsLote: clampRpsIntForm(companyFields.rpsLote, def.rpsLote),
    rpsNumero: clampRpsIntForm(companyFields.rpsNumero, def.rpsNumero),
    rpsSerie: String(companyFields.rpsSerie ?? def.rpsSerie).trim() || def.rpsSerie
  };
};

const nfEmissionFormToPersistBody = (form: NfEmissionCompanyForm) => ({
  razaoSocial: form.razaoSocial,
  nomeFantasia: form.nomeFantasia,
  email: form.email,
  inscricaoMunicipal: form.inscricaoMunicipal,
  regimeTributario: form.regimeTributario,
  cep: form.cep,
  tipoLogradouro: form.tipoLogradouro,
  logradouro: form.logradouro,
  numero: form.numero,
  complemento: form.complemento,
  bairro: form.bairro,
  codigoCidade: form.codigoCidade,
  descricaoCidade: form.descricaoCidade,
  estado: form.estado,
  simplesNacional: form.simplesNacional,
  rpsLote: form.rpsLote,
  rpsNumero: form.rpsNumero,
  rpsSerie: form.rpsSerie
});

const triggerFileDownload = (blob: Blob, filename: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};

const getNfseStatusKey = (status?: string | null) => nfseStatusKeyParaLimite(status);

const formatNfseStatus = (status?: string | null) => {
  const key = getNfseStatusKey(status);
  if (key === 'concluido') return 'Concluída';
  if (key === 'processando') return 'Processando';
  if (key === 'rejeitado') return 'Rejeitada';
  if (key === 'cancelado') return 'Cancelada';
  if (key === 'cancelamento_pendente') return 'Cancelamento pendente';
  if (key === 'interrompido') return 'Interrompida';
  return status || 'Processando';
};

const getNfseStatusBadgeClass = (status?: string | null) => {
  const key = getNfseStatusKey(status);
  if (key === 'concluido') return 'admin-badge-success';
  if (key === 'processando') return 'admin-badge-primary';
  if (key === 'cancelamento_pendente') return 'admin-badge-warning';
  if (key === 'rejeitado' || key === 'cancelado' || key === 'interrompido') {
    return 'admin-badge-danger';
  }
  return 'admin-badge-neutral';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '---';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR');
};

const buildClienteCatalogLabel = (item: NfseCatalogCliente) => {
  const chunks = [
    item.nome || null,
    item.documento ? formatDocument(item.documento) : null,
    item.email || null
  ].filter(Boolean);
  return chunks.length ? chunks.join(' • ') : 'Cliente sem identificação';
};

const buildProdutoCatalogLabel = (item: NfseCatalogProduto) => {
  const chunks = [
    item.codigo || null,
    item.cnae ? `CNAE ${item.cnae}` : null,
    item.discriminacao || null
  ].filter(Boolean);
  return chunks.length ? chunks.join(' • ') : 'Serviço sem identificação';
};

const toNfseMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const toNfsePeriodKey = nfsePeriodoChaveBrFromCreatedAt;

const formatDasCompetenciaLabel = (value?: string | null) => {
  if (!value) return '---';
  const match = String(value).match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }
  return String(value);
};

const getDasStatusLabel = (status?: MeiPeriod['status'] | null) => {
  if (status === 'pago') return 'Pago';
  if (status === 'erro') return 'Erro/Indeterminado';
  return 'Em aberto';
};

const getDasStatusClasses = (status?: MeiPeriod['status'] | null) => {
  if (status === 'pago') return 'admin-badge-success';
  if (status === 'erro') return 'admin-badge-danger';
  return 'admin-badge-warning';
};

const getDefaultPeriod = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    year: previous.getFullYear(),
    month: String(previous.getMonth() + 1).padStart(2, '0')
  };
};

const hasRequiredText = (value: unknown) => String(value || '').trim().length > 0;
const parseDecimalInput = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Rótulo curto na pilha de feedback quando o tipo activo é NFS-e (emitir NFSe). */
const GUIA_MEI_NFSE_DOCUMENT_LABEL = 'NFSe';

/** Story 2.3 — paridade mobile (MeiScreen NFSe). */
const NFSE_PRESTADOR_PREFILL_MSG_EMPTY =
  'Não há cadastro MEI activo para preencher automaticamente. Complete o certificado ou preencha o prestador manualmente.';
const NFSE_PRESTADOR_PREFILL_MSG_ERROR =
  'Não foi possível carregar os dados do cadastro. Preencha o prestador manualmente.';

type NfsePrestadorEndereco = {
  logradouro: string;
  numero: string;
  codigoCidade: string;
  cep: string;
  complemento: string;
  bairro: string;
  estado: string;
  descricaoCidade: string;
};

const resolvePrestadorEndereco = (
  endereco: EmitirNfseInput['prestadorEndereco'],
  fallback: Partial<NfsePrestadorEndereco> = {}
): NfsePrestadorEndereco => ({
  logradouro: String(endereco?.logradouro || fallback.logradouro || '').trim(),
  numero: String(endereco?.numero || fallback.numero || '').trim(),
  codigoCidade: String(endereco?.codigoCidade || fallback.codigoCidade || '').trim(),
  cep: normalizeDoc(String(endereco?.cep || fallback.cep || '')).slice(0, 8),
  complemento: String(endereco?.complemento || fallback.complemento || '').trim(),
  bairro: String(endereco?.bairro || fallback.bairro || '').trim(),
  estado: String(endereco?.estado || fallback.estado || '').trim().toUpperCase(),
  descricaoCidade: String(endereco?.descricaoCidade || fallback.descricaoCidade || '').trim()
});

const getNfseValidationMessage = (
  input: EmitirNfseInput,
  fallbackPrestadorEndereco: Partial<NfsePrestadorEndereco> = {}
) => {
  const prestadorCpfCnpj = normalizeDoc(input.prestadorCpfCnpj || '');
  if (prestadorCpfCnpj.length !== 14) {
    return 'Informe um CNPJ válido do prestador.';
  }
  const prestadorEndereco = resolvePrestadorEndereco(input.prestadorEndereco, fallbackPrestadorEndereco);
  if (!prestadorEndereco.logradouro) {
    return 'Informe o logradouro do prestador.';
  }
  if (!prestadorEndereco.numero) {
    return 'Informe o número do endereço do prestador.';
  }
  if (!prestadorEndereco.codigoCidade) {
    return 'Informe o código IBGE da cidade do prestador.';
  }
  if (prestadorEndereco.cep.length !== 8) {
    return 'Informe um CEP válido do prestador com 8 dígitos.';
  }

  const tomadorCpfCnpj = normalizeDoc(input.tomadorCpfCnpj || '');
  if (!tomadorCpfCnpj) {
    return 'Informe o CPF/CNPJ do tomador.';
  }
  if (tomadorCpfCnpj.length !== 11 && tomadorCpfCnpj.length !== 14) {
    return 'CPF/CNPJ do tomador inválido.';
  }
  const tomadorRazaoSocial = String(input.tomadorRazaoSocial || '').trim();
  if (!tomadorRazaoSocial) {
    return 'Informe a razão social do tomador.';
  }

  const servico = input.servico;
  if (!servico) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  if (
    !hasRequiredText(servico.codigo)
    || !hasRequiredText(servico.cnae)
    || !hasRequiredText(servico.discriminacao)
    || !hasRequiredText(servico.valorServico)
  ) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  const codigoServicoErro = getNfseServicoCodigoValidationError(servico.codigo);
  if (codigoServicoErro) {
    return codigoServicoErro;
  }

  const valorServico = parseDecimalInput(servico.valorServico);
  if (valorServico === null || valorServico <= 0) {
    return 'Informe um valor de serviço maior que zero.';
  }

  return null;
};

/** FR-NFSE-UX-P1: primeira secção com erro (Prestador → Tomador → Serviço) para expansão ao tentar emitir. */
type NfseEmitFormSection = 'prestador' | 'tomador' | 'servico' | 'opcionais';

/** Secção `opcionais` existe no UI; a validação local atual não mapeia erros para ela (só prestador/tomador/serviço). */
const getNfseValidationSection = (
  input: EmitirNfseInput,
  fallbackPrestadorEndereco: Partial<NfsePrestadorEndereco> = {}
): NfseEmitFormSection | null => {
  if (!getNfseValidationMessage(input, fallbackPrestadorEndereco)) return null;
  const prestadorCpfCnpj = normalizeDoc(input.prestadorCpfCnpj || '');
  if (prestadorCpfCnpj.length !== 14) return 'prestador';
  const prestadorEndereco = resolvePrestadorEndereco(input.prestadorEndereco, fallbackPrestadorEndereco);
  if (!prestadorEndereco.logradouro) return 'prestador';
  if (!prestadorEndereco.numero) return 'prestador';
  if (!prestadorEndereco.codigoCidade) return 'prestador';
  if (prestadorEndereco.cep.length !== 8) return 'prestador';

  const tomadorCpfCnpj = normalizeDoc(input.tomadorCpfCnpj || '');
  if (!tomadorCpfCnpj) return 'tomador';
  if (tomadorCpfCnpj.length !== 11 && tomadorCpfCnpj.length !== 14) return 'tomador';
  const tomadorRazaoSocial = String(input.tomadorRazaoSocial || '').trim();
  if (!tomadorRazaoSocial) return 'tomador';

  const servico = input.servico;
  if (!servico) return 'servico';
  if (
    !hasRequiredText(servico.codigo)
    || !hasRequiredText(servico.cnae)
    || !hasRequiredText(servico.discriminacao)
    || !hasRequiredText(servico.valorServico)
  ) {
    return 'servico';
  }
  const codigoServicoErro = getNfseServicoCodigoValidationError(servico.codigo);
  if (codigoServicoErro) return 'servico';

  const valorServico = parseDecimalInput(servico.valorServico);
  if (valorServico === null || valorServico <= 0) return 'servico';

  return 'servico';
};

function MeiNfseEmitCollapsible(props: {
  section: NfseEmitFormSection;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = `mei-nfse-emit-panel-${props.section}`;
  const headingId = `mei-nfse-emit-heading-${props.section}`;
  return (
    <div className="rounded-lg border ui-border-section p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-semibold text-slate-700 dark:text-gray-200"
        aria-expanded={props.open}
        aria-controls={panelId}
        id={headingId}
        onClick={props.onToggle}
      >
        <span>{props.title}</span>
        <span className="shrink-0 text-xs font-normal text-slate-500 dark:text-slate-400" aria-hidden>
          {props.open ? '▼' : '▶'}
        </span>
      </button>
      {props.open ? (
        <div
          id={panelId}
          className="mt-3 space-y-3"
          role="region"
          aria-labelledby={headingId}
        >
          {props.children}
        </div>
      ) : null}
    </div>
  );
}

function MeiNfseAjudaFiscalCollapsible(props: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = 'mei-nfse-ajuda-fiscal-panel';
  const headingId = 'mei-nfse-ajuda-fiscal-heading';
  return (
    <div className="mb-3 rounded-lg border ui-border-section p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-semibold text-slate-700 dark:text-gray-200"
        aria-expanded={props.open}
        aria-controls={panelId}
        id={headingId}
        onClick={props.onToggle}
      >
        <span>Ajuda fiscal (MEI / campos obrigatórios)</span>
        <span className="shrink-0 text-xs font-normal text-slate-500 dark:text-slate-400" aria-hidden>
          {props.open ? '▼' : '▶'}
        </span>
      </button>
      {props.open ? (
        <div
          id={panelId}
          className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300"
          role="region"
          aria-labelledby={headingId}
        >
          {props.children}
        </div>
      ) : null}
    </div>
  );
}

export default function GuidesMei() {
  const meiGuideValidateConsCTitleId = useId();
  const prefeituraPortalCredentialsTitleId = useId();
  const { role, mei, userId } = useAuthStore();
  const canViewNfse = role === 'superadmin' || mei === true;
  const inRouter = useInRouterContext();
  const [contribuinteDoc, setContribuinteDoc] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<GuidesMeiWorkspace>(() =>
    resolveInitialWorkspace(readWorkspaceFromStorage(), canViewNfse)
  );
  const defaultPeriod = useMemo(() => getDefaultPeriod(), []);
  const [selectedYear, setSelectedYear] = useState<number>(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultPeriod.month);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [certificateErrorFiscalCode, setCertificateErrorFiscalCode] = useState<string | null>(null);
  const [certificateErrorHttpStatus, setCertificateErrorHttpStatus] = useState<number | null>(null);
  const [certificateConnectivityAlert, setCertificateConnectivityAlert] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [plugnotasSubmitPhase, setPlugnotasSubmitPhase] = useState<
    'idle' | 'certificado' | 'empresa'
  >('idle');
  const [plugnotasPendingRetry, setPlugnotasPendingRetry] = useState<{
    certificadoId: string;
    cnpj: string;
    /** FR-ALNFB — segundo passo municipal (credenciais portal). */
    retryKind?: 'municipal';
  } | null>(null);
  /** Credenciais do portal — apenas memória de sessão (NFR-ALNFB-01). */
  const [prefeituraPortalLogin, setPrefeituraPortalLogin] = useState('');
  const [prefeituraPortalSenha, setPrefeituraPortalSenha] = useState('');
  const [plugnotasEmpresaRetryDetail, setPlugnotasEmpresaRetryDetail] = useState<string | null>(null);
  const [plugnotasEmpresaRetryMeta, setPlugnotasEmpresaRetryMeta] = useState<MeiFiscalUiErrorState | null>(null);
  /** FR-SOL: alimenta `lastPostEmpresaPhase2Ok` no resolver (true = POST empresa concluiu; false = falha com retry; null = desconhecido). */
  const [plugnotasEmpresaFase2PostOk, setPlugnotasEmpresaFase2PostOk] = useState<boolean | null>(null);
  /** FR-SOL-P1 follow-up QA: força re-leitura do sessionStorage (TTL) sem depender só de outras interacções. */
  const [solFase2SessionFlagRevalidateTick, setSolFase2SessionFlagRevalidateTick] = useState(0);
  const [empresaRegistroRetryBusy, setEmpresaRegistroRetryBusy] = useState(false);
  /** P0-L1: utilizador fechou o bloco «impossibilidade» (região abaixo de PREF/SOL no painel âmbar). */
  const [plugnotasP0L1ImposibilidadeDismissed, setPlugnotasP0L1ImposibilidadeDismissed] = useState(false);
  /** P0-L2: `role="status"` sucinto, uma transição para sucesso de fase (sem spam em poll). */
  const [plugnotasP0L2PhaseSuccessVisible, setPlugnotasP0L2PhaseSuccessVisible] = useState(false);
  const plugnotasP0OverlayPrevKindRef = useRef<string>('');
  const plugnotasEmpresaRetryRef = useRef<HTMLDivElement>(null);
  const [isRemovingCert, setIsRemovingCert] = useState(false);
  const [hasUserCertificate, setHasUserCertificate] = useState(false);
  const [hasServerCertificate, setHasServerCertificate] = useState(false);
  const [certValidFrom, setCertValidFrom] = useState<string | null>(null);
  const [certValidTo, setCertValidTo] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<MeiGuideValidateMappedError | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isDownloadingGuide, setIsDownloadingGuide] = useState(false);

  const [meiPeriods, setMeiPeriods] = useState<MeiPeriod[]>([]);
  const [meiPeriodsLoading, setMeiPeriodsLoading] = useState(false);
  const [meiPeriodsError, setMeiPeriodsError] = useState<string | null>(null);
  const hasCertificate = hasUserCertificate;
  const [nfseForm, setNfseForm] = useState<EmitirNfseInput>(() => createInitialEmitirNfseInput());
  const [emissionDocumentType, setEmissionDocumentType] = useState<MeiFiscalEmissionDocumentType>('NFSE');
  const [nfeLikeForm, setNfeLikeForm] = useState<MeiNfeLikeFormState>(() => createEmptyMeiNfeLikeFormState());
  const [nfeLikeSubmitting, setNfeLikeSubmitting] = useState(false);
  const [nfeLikeFieldErrors, setNfeLikeFieldErrors] = useState<Record<string, string>>({});
  const [nfeLikeFlashOpenSection, setNfeLikeFlashOpenSection] = useState<
    'emitente' | 'destinatario' | 'itens' | null
  >(null);
  const [emissionTypeChangeDialogOpen, setEmissionTypeChangeDialogOpen] = useState(false);
  const [pendingEmissionDocumentType, setPendingEmissionDocumentType] =
    useState<MeiFiscalEmissionDocumentType | null>(null);

  const nfseFormBaselineRef = useRef(JSON.stringify(createInitialEmitirNfseInput()));
  const nfeLikeBaselineRef = useRef(serializeMeiNfeLikeFormForDirty(createEmptyMeiNfeLikeFormState()));
  /** FR-GUIA-FISC-11 — incrementado após save empresa com sucesso para refetch sem F5. */
  const [fiscalCapabilityRefetchKey, setFiscalCapabilityRefetchKey] = useState(0);
  /** FR-GUIA-FISC-14 D2 — *wizard* de activação NF-e/NFC-e (flag `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED`). */
  const [d2ModalidadesWizardOpen, setD2ModalidadesWizardOpen] = useState(false);

  const cnpjParaFiscalCapability = useMemo(() => {
    const fromEmit = normalizeDoc(nfeLikeForm.emitenteCnpj || '');
    if (fromEmit.length === 14) return fromEmit;
    const fromContrib = normalizeDoc(contribuinteDoc);
    if (fromContrib.length === 14) return fromContrib;
    const fromPrestador = normalizeDoc(nfseForm.prestadorCpfCnpj || '');
    if (fromPrestador.length === 14) return fromPrestador;
    return '';
  }, [nfeLikeForm.emitenteCnpj, contribuinteDoc, nfseForm.prestadorCpfCnpj]);

  const fiscalCapabilityFetchEnabled = Boolean(canViewNfse && activeWorkspace === 'nfse');
  const bumpFiscalCapabilityRefetchIfApplicable = useCallback(() => {
    if (!fiscalCapabilityFetchEnabled) return;
    if (emissionDocumentType !== 'NFE' && emissionDocumentType !== 'NFCE') return;
    if (cnpjParaFiscalCapability.length !== 14) return;
    setFiscalCapabilityRefetchKey((k) => k + 1);
  }, [fiscalCapabilityFetchEnabled, emissionDocumentType, cnpjParaFiscalCapability]);
  const { loading: fiscalCapabilityLoading, error: fiscalCapabilityError, capabilities: fiscalCapabilities } =
    useMeiPlugnotasFiscalCapability({
      cnpjDigits: cnpjParaFiscalCapability,
      emissionDocumentType,
      fetchEnabled: fiscalCapabilityFetchEnabled,
      capabilityRefetchKey: fiscalCapabilityRefetchKey
    });

  const nfeLikeEmitterBlockedByProvider = useMemo(() => {
    if (emissionDocumentType === 'NFE') {
      return isNfeLikeEmissionBlockedByCapabilities('NFE', fiscalCapabilities);
    }
    if (emissionDocumentType === 'NFCE') {
      return isNfeLikeEmissionBlockedByCapabilities('NFCE', fiscalCapabilities);
    }
    return false;
  }, [emissionDocumentType, fiscalCapabilities]);

  const nfeLikeEmissionLocked = useMemo(() => {
    if (emissionDocumentType === 'NFSE' || !canViewNfse) return false;
    if (cnpjParaFiscalCapability.length !== 14) return false;
    return (
      fiscalCapabilityLoading || Boolean(fiscalCapabilityError) || nfeLikeEmitterBlockedByProvider
    );
  }, [
    emissionDocumentType,
    canViewNfse,
    cnpjParaFiscalCapability,
    fiscalCapabilityLoading,
    fiscalCapabilityError,
    nfeLikeEmitterBlockedByProvider
  ]);

  const [nfseList, setNfseList] = useState<NfseRecord[]>([]);
  const [nfseLoading, setNfseLoading] = useState(false);
  const [nfseSubmitting, setNfseSubmitting] = useState(false);
  const [nfseActionMap, setNfseActionMap] = useState<Record<string, boolean>>({});
  const [nfseError, setNfseError] = useState<{
    rawMessage: string;
    plugnotasCode: string | null;
    httpStatus: number | null;
    plugnotasRequest: ReturnType<typeof getFiscalRequestMeta>;
    /** FR-GUIA-FISC-13 — só em falhas de emissão (`emission`). */
    emissionRetryable?: boolean;
  } | null>(null);
  const [nfseErrorKind, setNfseErrorKind] = useState<'emission' | 'operation' | null>(null);
  const [nfseSuccess, setNfseSuccess] = useState<string | null>(null);
  /** Soma do limite MEI a partir da coluna `payload_json` (GET /mei-notas/limite-faturamento). */
  const [meiLimiteServidor, setMeiLimiteServidor] = useState<{
    totalUtilizadoReais: number;
    notasConsideradas: number;
  } | null>(null);
  const [meiLimiteServidorReady, setMeiLimiteServidorReady] = useState(false);
  const [meiLimiteServidorLoading, setMeiLimiteServidorLoading] = useState(false);

  /** FR-GUIA-FISC-13: barreira síncrona contra duplo clique antes do re-render de `*Submitting`. */
  const meiEmitInFlightRef = useRef(false);
  const e0014ArchiveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  /** Próximo POST NFS-e sem `idIntegracao` manual — servidor gera novo id (retry). */
  const omitClientIdIntegracaoOnNextEmitRef = useRef(false);

  const clearNfseErrorState = useCallback(() => {
    setNfseError(null);
    setNfseErrorKind(null);
  }, []);

  const setEmissionNfseError = useCallback((error: unknown, fallback: string) => {
    const raw = error instanceof Error ? error.message : fallback;
    const retryable = isMeiEmissionErrorRetryable(error);
    const httpSt = getFiscalHttpStatus(error);
    console.warn('[mei-emission]', {
      phase: 'emission_failed',
      retryable,
      httpStatus: httpSt ?? undefined
    });
    setNfseError({
      rawMessage: (raw || fallback).trim(),
      plugnotasCode: getFiscalErrorCode(error),
      httpStatus: httpSt,
      plugnotasRequest: getFiscalRequestMeta(error),
      emissionRetryable: retryable
    });
    setNfseErrorKind('emission');
  }, []);

  const setOperationNfseError = useCallback(
    (error: unknown, fallback: string, opts?: { userFacingMessageOnly?: boolean }) => {
      const raw = opts?.userFacingMessageOnly
        ? fallback
        : error instanceof Error
          ? error.message
          : fallback;
      setNfseError({
        rawMessage: (raw || fallback).trim(),
        plugnotasCode: getFiscalErrorCode(error),
        httpStatus: getFiscalHttpStatus(error),
        plugnotasRequest: getFiscalRequestMeta(error)
      });
      setNfseErrorKind('operation');
    },
    []
  );
  const [nfseCatalogLoading, setNfseCatalogLoading] = useState(false);
  const [nfseCatalogError, setNfseCatalogError] = useState<string | null>(null);
  const [nfseCatalogClientes, setNfseCatalogClientes] = useState<NfseCatalogCliente[]>([]);
  const [nfseCatalogProdutos, setNfseCatalogProdutos] = useState<NfseCatalogProduto[]>([]);
  const [parcelamentosList, setParcelamentosList] = useState<ParcelamentoItem[]>([]);
  const [parcelamentosResumo, setParcelamentosResumo] = useState<{ modalidadesConsultadas?: number; resumoPorModalidade?: Record<string, number> }>({});
  const [parcelamentosLoading, setParcelamentosLoading] = useState(false);
  const [parcelamentosError, setParcelamentosError] = useState<string | null>(null);
  const [parcelamentosSearchDone, setParcelamentosSearchDone] = useState(false);
  const [parcelamentoPdfLoadingNumero, setParcelamentoPdfLoadingNumero] = useState<string | null>(null);
  const [parcelamentoPdfError, setParcelamentoPdfError] = useState<string | null>(null);
  const [selectedCatalogClienteId, setSelectedCatalogClienteId] = useState('');
  const [selectedCatalogProdutoId, setSelectedCatalogProdutoId] = useState('');
  const [nfseStatusFilter, setNfseStatusFilter] = useState('all');
  const [nfsePeriodFilter, setNfsePeriodFilter] = useState('all');
  const [nfseShowArchived, setNfseShowArchived] = useState(false);
  const [nfseDocumentTypeFilter, setNfseDocumentTypeFilter] = useState<MeiFiscalListDocumentFilter>('all');
  const [certificateSuccess, setCertificateSuccess] = useState<{
    primary: string;
    secondary?: string;
  } | null>(null);
  const [nfEmissionCompanyForm, setNfEmissionCompanyForm] = useState<NfEmissionCompanyForm>(() => (
    getDefaultNfEmissionCompanyForm()
  ));
  /** Evita sobrescrever edição local ao reexecutar `loadCertificateStatus`. */
  const nfseEmitenteHydratedRef = useRef(false);
  /** Uma vez hidratado a partir do espelho Supabase ou após consulta GET remota (remoto > espelho > default). */
  const documentosAtivosRemoteOrMirrorHydratedRef = useRef(false);
  /** Deteta troca para o separador NFS-e e dispara refetch do catálogo (CAT-MEI-05 / FR-CAT-07). */
  const prevMeiWorkspaceRef = useRef<GuidesMeiWorkspace | null>(null);
  const [nfEmissionCompanySyncLoading, setNfEmissionCompanySyncLoading] = useState<'consult' | 'patch' | null>(null);
  const [nfEmissionCompanySyncError, setNfEmissionCompanySyncError] = useState<MeiFiscalUiErrorState | null>(null);
  const [nfEmissionCompanySyncSuccess, setNfEmissionCompanySyncSuccess] = useState<string | null>(null);
  const clearNfEmissionCompanySyncErrorState = useCallback(() => {
    setNfEmissionCompanySyncError(null);
  }, []);
  const [documentosAtivos, setDocumentosAtivos] = useState<DocumentosAtivosState>(() => ({
    ...DEFAULT_DOCUMENTOS_ATIVOS
  }));
  const [documentosAtivosSubmitError, setDocumentosAtivosSubmitError] = useState<string | null>(null);
  const [documentosAtivosConsultWarning, setDocumentosAtivosConsultWarning] = useState<string | null>(null);
  /** S0 — até resolver GET espelho/remoto (FR-UPD-DOC); inicia locked para evitar flash de defaults. */
  const [documentosAtivosHydrating, setDocumentosAtivosHydrating] = useState(true);
  /** Falha GET empresa na hidratação inicial (aria-live). */
  const [documentosAtivosHydrationError, setDocumentosAtivosHydrationError] = useState<string | null>(null);
  /** FR-UPD-DOC-08 — últimos espelho/remoto parseados para deteção de deriva (tri-boolean estrito). */
  const [documentosAtivosMirrorSnapshot, setDocumentosAtivosMirrorSnapshot] = useState<DocumentosAtivosState | null>(
    null
  );
  const [documentosAtivosRemoteSnapshot, setDocumentosAtivosRemoteSnapshot] = useState<DocumentosAtivosState | null>(
    null
  );
  /** FR-UPD-DOC-07 — utilizador alterou checkboxes desde o último PATCH emitente bem-sucedido. */
  const documentosAtivosUserEditedRef = useRef(false);
  const [nfseDesativarDialogOpen, setNfseDesativarDialogOpen] = useState(false);
  const documentosAtivosNfseCheckboxRef = useRef<HTMLInputElement>(null);
  const prefeituraPortalLoginInputRef = useRef<HTMLInputElement>(null);
  const prefeituraPortalSenhaInputRef = useRef<HTMLInputElement>(null);
  const [brasilApiLoading, setBrasilApiLoading] = useState(false);
  const [brasilApiError, setBrasilApiError] = useState<string | null>(null);
  const [nfsePrestadorBrasilApiLoading, setNfsePrestadorBrasilApiLoading] = useState(false);
  const [nfsePrestadorBrasilApiError, setNfsePrestadorBrasilApiError] = useState<string | null>(null);
  /** Após PATCH emitente: opt-in para alinhar o formulário NFS-e ao snapshot guardado (mitigação QA FR-AP-02). */
  const [nfseEmitentePendingApply, setNfseEmitentePendingApply] = useState<NfseEmitenteSnapshot | null>(null);
  /** FR-P04 Story 2.3: uma tentativa de BFF prefill no separador NFSe; não sobrescrever após edição do prestador. */
  const nfsePrestadorPrefillAppliedRef = useRef(false);
  /** Evita segundo pedido HTTP se o utilizador sair e voltar ao separador enquanto o 1.º fetch ainda corre (mitigação QA Story 2.3). */
  const nfsePrestadorPrefillInFlightRef = useRef(false);
  const nfsePrestadorUserEditedRef = useRef(false);
  /** FR-P05: ao voltar ao separador, repõe banner se outcome for empty/error. */
  const nfsePrestadorPrefillBannerOutcomeRef = useRef<'unset' | 'empty' | 'error' | 'ok'>('unset');
  const [nfsePrestadorPrefillLoading, setNfsePrestadorPrefillLoading] = useState(false);
  const [nfsePrestadorPrefillBanner, setNfsePrestadorPrefillBanner] = useState<string | null>(null);
  const nfsePrestadorAddressFallback = useMemo(
    () => ({
      logradouro: nfEmissionCompanyForm.logradouro,
      numero: nfEmissionCompanyForm.numero,
      codigoCidade: nfEmissionCompanyForm.codigoCidade,
      cep: nfEmissionCompanyForm.cep,
      complemento: nfEmissionCompanyForm.complemento,
      bairro: nfEmissionCompanyForm.bairro,
      estado: nfEmissionCompanyForm.estado,
      descricaoCidade: nfEmissionCompanyForm.descricaoCidade
    }),
    [nfEmissionCompanyForm]
  );

  const nfseValidationMessage = useMemo(
    () => getNfseValidationMessage(nfseForm, nfsePrestadorAddressFallback),
    [nfseForm, nfsePrestadorAddressFallback]
  );

  const documentosAtivosDivergence = useMemo(
    () => documentosAtivosDivergem(documentosAtivosMirrorSnapshot, documentosAtivosRemoteSnapshot),
    [documentosAtivosMirrorSnapshot, documentosAtivosRemoteSnapshot]
  );

  const showDocumentosAtivosDivergenceBanner = useMemo(
    () => Boolean(canViewNfse && !documentosAtivosHydrating && documentosAtivosDivergence),
    [canViewNfse, documentosAtivosHydrating, documentosAtivosDivergence]
  );

  /** FR-NFSE-UX-P1: colapsáveis do formulário de emissão (todos expandidos por defeito). */
  const [nfseEmitDisclosure, setNfseEmitDisclosure] = useState({
    prestador: true,
    tomador: true,
    servico: true,
    opcionais: true,
    ajudaFiscal: false
  });

  const toggleNfseEmitSection = useCallback((key: keyof typeof nfseEmitDisclosure) => {
    setNfseEmitDisclosure((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /** FR-NFSE-UX-P1 / mitigação QA: setas Home/End no menu (padrão APG). */
  const handleNfseMoreMenuKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const k = event.key;
    if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'Home' && k !== 'End') return;
    const menu = event.currentTarget;
    const items = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')
    ).filter((btn) => !btn.disabled);
    if (items.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const active = document.activeElement;
    let idx = items.findIndex((el) => el === active);
    if (idx < 0) idx = 0;
    if (k === 'ArrowDown') idx = (idx + 1) % items.length;
    else if (k === 'ArrowUp') idx = (idx - 1 + items.length) % items.length;
    else if (k === 'Home') idx = 0;
    else idx = items.length - 1;
    items[idx]?.focus();
  }, []);

  /** FR-NFSE-UX-P1: menu «Mais ações» por linha (evita re-render global da lista). */
  const [nfseMoreMenuOpenId, setNfseMoreMenuOpenId] = useState<string | null>(null);
  const nfseMoreMenuFirstItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!nfseMoreMenuOpenId) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(`[data-nfse-more-menu-root="${nfseMoreMenuOpenId}"]`)) {
        setNfseMoreMenuOpenId(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNfseMoreMenuOpenId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [nfseMoreMenuOpenId]);

  useEffect(() => {
    if (!nfseMoreMenuOpenId) return;
    const id = requestAnimationFrame(() => {
      nfseMoreMenuFirstItemRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [nfseMoreMenuOpenId]);

  const touchNfsePrestadorBffParity = useCallback(() => {
    nfsePrestadorUserEditedRef.current = true;
    if (
      nfsePrestadorPrefillBannerOutcomeRef.current === 'empty'
      || nfsePrestadorPrefillBannerOutcomeRef.current === 'error'
    ) {
      nfsePrestadorPrefillBannerOutcomeRef.current = 'ok';
      setNfsePrestadorPrefillBanner(null);
    }
  }, []);

  const normalizedContribuinte = useMemo(() => normalizeDoc(contribuinteDoc), [contribuinteDoc]);
  const contribuinteTipo = useMemo(() => getDocType(normalizedContribuinte), [normalizedContribuinte]);
  const canLoadPeriods = normalizedContribuinte.length === 14;

  const nfEmissionFormAndDocsOkForPlugnotas = useMemo(() => {
    if (!canViewNfse) return true;
    return (
      !getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm)
      && !getDocumentosAtivosValidationMessage(documentosAtivos)
    );
  }, [canViewNfse, nfEmissionCompanyForm, documentosAtivos]);

  const plugnotasCnpjOkForSubmit = useMemo(
    () => !canViewNfse || normalizedContribuinte.length === 14,
    [canViewNfse, normalizedContribuinte]
  );

  const meiPlugnotasEmpresaBlockedExternally = useMemo(
    () => readMeiPlugnotasEmpresaCadastroBlockedExternally(),
    []
  );

  const plugnotasRetryScenario = useMemo(() => {
    if (!plugnotasEmpresaRetryMeta) return null;
    return resolveMeiFiscalScenario({
      rawMessage: plugnotasEmpresaRetryMeta.rawMessage,
      plugnotasCode: plugnotasEmpresaRetryMeta.plugnotasCode,
      httpStatus: plugnotasEmpresaRetryMeta.httpStatus,
      plugnotasRequest: plugnotasEmpresaRetryMeta.plugnotasRequest,
      runtimeDecision: plugnotasEmpresaRetryMeta.runtimeDecision
    });
  }, [plugnotasEmpresaRetryMeta]);

  const showPrefeituraPortalCredentialsBlock = useMemo(
    () =>
      Boolean(
        canViewNfse
        && documentosAtivos.nfse
        && plugnotasPendingRetry?.retryKind === 'municipal'
        && isPrefeituraPortalCredentialsUiEnabled()
        && !meiPlugnotasEmpresaBlockedExternally
      ),
    [
      canViewNfse,
      documentosAtivos.nfse,
      plugnotasPendingRetry?.retryKind,
      meiPlugnotasEmpresaBlockedExternally
    ]
  );

  const prefeituraPortalCredValidationMessage = useMemo(
    () => getPrefeituraPortalCredentialsValidationMessage(prefeituraPortalLogin, prefeituraPortalSenha),
    [prefeituraPortalLogin, prefeituraPortalSenha]
  );

  const plugnotasRetryBlockedByScenario = useMemo(
    () =>
      plugnotasRetryScenario === 'prefeitura_login_required_blocked'
      || plugnotasRetryScenario === 'prefeitura_ibge_apenas_insuficiente_dp02',
    [plugnotasRetryScenario]
  );

  const plugnotasRetryActionAvailable = useMemo(
    () =>
      Boolean(plugnotasPendingRetry)
      && !meiPlugnotasEmpresaBlockedExternally
      && !plugnotasRetryBlockedByScenario,
    [plugnotasPendingRetry, meiPlugnotasEmpresaBlockedExternally, plugnotasRetryBlockedByScenario]
  );

  const plugnotasPrimaryActionEnabled = useMemo(() => {
    if (isUploadingCert || empresaRegistroRetryBusy) return false;
    if (plugnotasPendingRetry) {
      if (!plugnotasRetryActionAvailable) return false;
      if (!nfEmissionFormAndDocsOkForPlugnotas || !plugnotasCnpjOkForSubmit) return false;
      return true;
    }
    if (!certificateFile || !certificatePassword.trim()) return false;
    if (canViewNfse) {
      return nfEmissionFormAndDocsOkForPlugnotas && plugnotasCnpjOkForSubmit;
    }
    return true;
  }, [
    isUploadingCert,
    empresaRegistroRetryBusy,
    plugnotasPendingRetry,
    certificateFile,
    certificatePassword,
    canViewNfse,
    nfEmissionFormAndDocsOkForPlugnotas,
    plugnotasCnpjOkForSubmit,
    plugnotasRetryActionAvailable,
    showPrefeituraPortalCredentialsBlock
  ]);

  const plugnotasPrimaryDisabledHint = useMemo(() => {
    if (plugnotasPrimaryActionEnabled || isUploadingCert || empresaRegistroRetryBusy) return null;
    if (plugnotasPendingRetry) {
      if (plugnotasRetryBlockedByScenario) {
        return 'Neste cenário o cadastro automático pelo site não está disponível. Revise os dados do emitente e siga o guia de operação fiscal antes de tentar novamente.';
      }
      if (meiPlugnotasEmpresaBlockedExternally) {
        return 'Neste cenário o cadastro automático pelo site não está disponível. Use o guia de operação fiscal ou o suporte do emissor antes de insistir no envio.';
      }
      const c = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
      if (c) return c;
      const d = getDocumentosAtivosValidationMessage(documentosAtivos);
      if (d) return d;
      if (showPrefeituraPortalCredentialsBlock && prefeituraPortalCredValidationMessage) {
        return prefeituraPortalCredValidationMessage;
      }
      if (!plugnotasCnpjOkForSubmit) {
        return 'Informe um CNPJ válido (14 dígitos) no campo CNPJ do MEI.';
      }
      return null;
    }
    if (!certificateFile || !certificatePassword.trim()) {
      return 'Preencha todos os campos obrigatórios e selecione o certificado para continuar.';
    }
    if (canViewNfse) {
      const c = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
      if (c) return c;
      const d = getDocumentosAtivosValidationMessage(documentosAtivos);
      if (d) return d;
      if (!plugnotasCnpjOkForSubmit) {
        return 'Informe um CNPJ válido (14 dígitos) no campo CNPJ do MEI.';
      }
    }
    return null;
  }, [
    plugnotasPrimaryActionEnabled,
    isUploadingCert,
    empresaRegistroRetryBusy,
    meiPlugnotasEmpresaBlockedExternally,
    plugnotasPendingRetry,
    plugnotasRetryBlockedByScenario,
    certificateFile,
    certificatePassword,
    canViewNfse,
    nfEmissionCompanyForm,
    documentosAtivos,
    plugnotasCnpjOkForSubmit,
    showPrefeituraPortalCredentialsBlock,
    prefeituraPortalCredValidationMessage
  ]);

  const applyDocumento = useCallback((documento?: string | null, force = false) => {
    if (!documento) return;
    const formatted = formatDocument(documento);
    setContribuinteDoc((current) => (force || !current ? formatted : current));
  }, []);

  const loadCertificateStatus = useCallback(async () => {
    try {
      const cnpjEarly = normalizeDoc(contribuinteDoc);
      let status: Awaited<ReturnType<typeof fetchMeiCertificateStatus>>;
      let empresaData: unknown | undefined;
      let empresaFetchFailed = false;

      if (canViewNfse && cnpjEarly.length === 14) {
        const results = await Promise.allSettled([
          fetchMeiCertificateStatus(),
          fetchEmpresaJsonWithMeiCache({
            userId,
            cnpjDigits: cnpjEarly,
            fetcher: () => consultarEmpresaEmissaoNf(cnpjEarly)
          })
        ]);
        if (results[0].status === 'rejected') throw results[0].reason;
        status = results[0].value;
        if (results[1].status === 'fulfilled') {
          empresaData = results[1].value;
        } else {
          empresaFetchFailed = true;
        }
      } else {
        status = await fetchMeiCertificateStatus();
      }

      setHasUserCertificate(Boolean(status.hasUserCertificate));
      setHasServerCertificate(Boolean(status.hasEnvCertificate));
      setCertValidFrom(status.certValidFrom ?? null);
      setCertValidTo(status.certValidTo ?? null);
      applyDocumento(status.documento);
      if (status.nfseEmitente && !nfseEmitenteHydratedRef.current) {
        nfseEmitenteHydratedRef.current = true;
        const snap = status.nfseEmitente;
        setNfEmissionCompanyForm(emitenteSnapshotToForm(snap));
        setNfseForm((current) => mergeEmitenteSnapshotIntoNfseForm(current, snap));
      }

      const cnpjResolved = normalizeDoc(status.documento || '') || cnpjEarly;

      if (canViewNfse) {
        const firstHydration = !documentosAtivosRemoteOrMirrorHydratedRef.current;
        if (firstHydration) {
          setDocumentosAtivosHydrating(true);
          setDocumentosAtivosHydrationError(null);
        }
        try {
          let remoteSel: DocumentosAtivosState | null = null;
          let getFailed = false;
          let usedJson: unknown | undefined;

          if (cnpjResolved.length === 14) {
            const sameKeyAsParallel = cnpjEarly.length === 14 && cnpjResolved === cnpjEarly;
            if (sameKeyAsParallel && !empresaFetchFailed) {
              usedJson = empresaData;
            } else if (sameKeyAsParallel && empresaFetchFailed) {
              usedJson = undefined;
              getFailed = true;
            } else {
              try {
                usedJson = await fetchEmpresaJsonWithMeiCache({
                  userId,
                  cnpjDigits: cnpjResolved,
                  fetcher: () => consultarEmpresaEmissaoNf(cnpjResolved)
                });
              } catch {
                getFailed = true;
                usedJson = undefined;
              }
            }

            if (!getFailed && usedJson !== undefined) {
              remoteSel = extractDocumentosAtivosFromEmpresaResponse(usedJson);
              if (remoteSel !== null && cnpjResolved.length === 14) {
                clearGuiaMeiEmpresaFase2FailFlag(userId, cnpjResolved);
              }
            } else if (getFailed && firstHydration) {
              setDocumentosAtivosHydrationError(MSG_DOCUMENTOS_ATIVOS_GET_EMPRESA_HIDRATACAO_FALHOU);
            }
          }

          const mirror: DocumentosAtivosState | null = status.documentosAtivos
            ? {
                nfse: Boolean(status.documentosAtivos.nfse),
                nfe: Boolean(status.documentosAtivos.nfe),
                nfce: Boolean(status.documentosAtivos.nfce)
              }
            : null;

          setDocumentosAtivosMirrorSnapshot(mirror);
          setDocumentosAtivosRemoteSnapshot(remoteSel);

          if (firstHydration) {
            setDocumentosAtivos(
              mergeDocumentosAtivosPrecedence({
                remote: remoteSel,
                mirror,
                fallback: DEFAULT_DOCUMENTOS_ATIVOS
              })
            );
            documentosAtivosRemoteOrMirrorHydratedRef.current = true;
          }
        } finally {
          if (firstHydration) {
            setDocumentosAtivosHydrating(false);
          }
        }
      }
    } catch {
      setHasUserCertificate(false);
      setHasServerCertificate(false);
      setCertValidFrom(null);
      setCertValidTo(null);
      setDocumentosAtivosHydrating(false);
    }
  }, [applyDocumento, canViewNfse, contribuinteDoc, userId]);

  const loadMeiPeriods = useCallback(async (options?: { refresh?: boolean }) => {
    if (!canLoadPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    const refresh = Boolean(options?.refresh);
    setMeiPeriodsLoading(true);
    setMeiPeriodsError(null);
    try {
      const contribuinte = contribuinteTipo
        ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
        : undefined;
      const fetchOpts = refresh ? { refresh: true } : undefined;
      const periods = hasUserCertificate
        ? await fetchMeiPeriods(normalizedContribuinte, contribuinte, fetchOpts)
        : await fetchMeiPeriodsByCnpj(normalizedContribuinte, fetchOpts);
      setMeiPeriods(periods || []);
    } catch (error) {
      setMeiPeriodsError(error instanceof Error ? error.message : 'Erro ao listar períodos do DAS.');
    } finally {
      setMeiPeriodsLoading(false);
    }
  }, [canLoadPeriods, contribuinteTipo, hasUserCertificate, normalizedContribuinte]);

  const loadNfseList = useCallback(async () => {
    if (!canViewNfse) {
      setNfseList([]);
      setNfseLoading(false);
      clearNfseErrorState();
      return;
    }
    setNfseLoading(true);
    clearNfseErrorState();
    try {
      const list = await listarNfse({
        includeArchived: nfseShowArchived,
        limit: 1000,
        ...(nfseDocumentTypeFilter !== 'all' ? { documentType: nfseDocumentTypeFilter } : {})
      });
      setNfseList(list);
      for (const item of list) {
        if (item.archived_at || !isHiddenNfseE0014RejectedRecord(item)) continue;
        if (e0014ArchiveTimersRef.current.has(item.id)) continue;
        const timer = setTimeout(() => {
          e0014ArchiveTimersRef.current.delete(item.id);
          void arquivarNfse(item.id, { archived: true })
            .then(() => loadNfseList())
            .catch(() => {});
        }, 20000);
        e0014ArchiveTimersRef.current.set(item.id, timer);
      }
    } catch (error) {
      setOperationNfseError(error, 'Erro ao listar NFSe.');
    } finally {
      setNfseLoading(false);
    }
  }, [canViewNfse, clearNfseErrorState, nfseDocumentTypeFilter, nfseShowArchived, setOperationNfseError]);

  const loadMeiLimiteServidor = useCallback(async () => {
    if (!canViewNfse) {
      setMeiLimiteServidor(null);
      setMeiLimiteServidorReady(false);
      setMeiLimiteServidorLoading(false);
      return;
    }
    setMeiLimiteServidorLoading(true);
    try {
      const ano = new Date().getFullYear();
      const data = await fetchLimiteFaturamentoMei({ year: ano });
      setMeiLimiteServidor({
        totalUtilizadoReais: data.totalUtilizadoReais,
        notasConsideradas: data.notasConsideradas
      });
    } catch {
      setMeiLimiteServidor(null);
    } finally {
      setMeiLimiteServidorReady(true);
      setMeiLimiteServidorLoading(false);
    }
  }, [canViewNfse]);

  const loadNfseCatalog = useCallback(async () => {
    if (!canViewNfse) {
      setNfseCatalogClientes([]);
      setNfseCatalogProdutos([]);
      setNfseCatalogLoading(false);
      setNfseCatalogError(null);
      return;
    }
    setNfseCatalogLoading(true);
    setNfseCatalogError(null);
    try {
      const [clientes, produtos] = await Promise.all([
        listarCatalogoNfseClientes({ limit: 30, documentType: 'NFSE' }),
        listarCatalogoNfseProdutos({ limit: 30, documentType: 'NFSE' })
      ]);
      setNfseCatalogClientes(clientes || []);
      setNfseCatalogProdutos(produtos || []);
    } catch (error) {
      setNfseCatalogError(formatMeiFiscalErr(error, 'Erro ao carregar catálogo fiscal.'));
    } finally {
      setNfseCatalogLoading(false);
    }
  }, [canViewNfse]);

  const updateNfseForm = (updates: Partial<EmitirNfseInput>) => {
    setNfseForm((current) => ({ ...current, ...updates }));
  };

  const finalizePlugnotasEmpresaCadastroSuccess = useCallback((
    companyResponse: CadastrarEmissaoNfEmpresaResponse,
    cnpj: string,
    opts: { certificateRecoveredFrom409: boolean; isRetryOnly: boolean }
  ) => {
    const returnedCnpj = normalizeDoc(String(companyResponse.cnpj || cnpj));
    const formattedCnpj = formatDocument(returnedCnpj || cnpj);
    invalidateMeiEmpresaGetCache(userId, returnedCnpj || cnpj);
    clearGuiaMeiEmpresaFase2FailFlag(userId, returnedCnpj || cnpj);
    clearNfEmissionCompanySyncErrorState();
    setContribuinteDoc(formattedCnpj);
    updateNfseForm({
      prestadorCpfCnpj: formattedCnpj,
      ...(nfEmissionCompanyForm.razaoSocial.trim()
        ? { prestadorRazaoSocial: nfEmissionCompanyForm.razaoSocial.trim() }
        : {}),
      ...(nfEmissionCompanyForm.email.trim()
        ? { prestadorEmail: nfEmissionCompanyForm.email.trim() }
        : {}),
      ...(nfEmissionCompanyForm.inscricaoMunicipal.trim()
        ? { prestadorInscricaoMunicipal: nfEmissionCompanyForm.inscricaoMunicipal.trim() }
        : {}),
      prestadorEndereco: resolvePrestadorEndereco(undefined, {
        logradouro: nfEmissionCompanyForm.logradouro,
        numero: nfEmissionCompanyForm.numero,
        codigoCidade: nfEmissionCompanyForm.codigoCidade,
        cep: nfEmissionCompanyForm.cep,
        complemento: nfEmissionCompanyForm.complemento,
        bairro: nfEmissionCompanyForm.bairro,
        estado: nfEmissionCompanyForm.estado,
        descricaoCidade: nfEmissionCompanyForm.descricaoCidade
      })
    });
    setCertificateFile(null);
    setCertificatePassword('');
    setPlugnotasPendingRetry(null);
    setPlugnotasEmpresaRetryDetail(null);
    setPlugnotasEmpresaRetryMeta(null);
    setPrefeituraPortalLogin('');
    setPrefeituraPortalSenha('');
    setPlugnotasEmpresaFase2PostOk(true);
    const operation = companyResponse.operation || null;
    const primary = opts.isRetryOnly
      ? operation === 'updated' || operation === 'existing'
        ? 'Dados do emitente foram sincronizados com sucesso no emissor fiscal.'
        : 'Dados do emitente foram registrados no serviço de emissão fiscal com sucesso.'
      : opts.certificateRecoveredFrom409
        ? operation === 'updated' || operation === 'existing'
          ? 'Seu certificado já estava no emissor; os dados do emitente foram sincronizados.'
          : 'Seu certificado já estava no emissor; os dados do emitente foram registrados.'
        : operation === 'updated' || operation === 'existing'
          ? 'Cadastro da empresa localizado no emissor; os dados do emitente foram sincronizados.'
          : 'Certificado e dados do emitente foram enviados ao serviço de emissão.';
    setCertificateSuccess({
      primary,
      secondary: canViewNfse ? MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR : undefined
    });
    bumpFiscalCapabilityRefetchIfApplicable();
  }, [userId, nfEmissionCompanyForm, updateNfseForm, canViewNfse, clearNfEmissionCompanySyncErrorState, bumpFiscalCapabilityRefetchIfApplicable]);

  const handleRetryPlugnotasEmpresaRegistro = useCallback(async () => {
    if (!plugnotasPendingRetry || !plugnotasRetryActionAvailable) return;
    const companyValidationMessage = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
    if (companyValidationMessage) {
      setCertificateErrorFiscalCode(null);
      setCertificateErrorHttpStatus(null);
      setCertificateError(companyValidationMessage);
      return;
    }
    const docMsg = getDocumentosAtivosValidationMessage(documentosAtivos);
    if (docMsg) {
      setDocumentosAtivosSubmitError(docMsg);
      documentosAtivosNfseCheckboxRef.current?.focus();
      return;
    }
    setCertificateError(null);
    setCertificateErrorFiscalCode(null);
    setCertificateErrorHttpStatus(null);
    setPlugnotasEmpresaRetryDetail(null);
    setPlugnotasEmpresaRetryMeta(null);
    setEmpresaRegistroRetryBusy(true);
    setPlugnotasSubmitPhase('empresa');
    try {
      if (
        plugnotasPendingRetry.retryKind === 'municipal'
        && isPrefeituraPortalCredentialsUiEnabled()
      ) {
        const credMsg = getPrefeituraPortalCredentialsValidationMessage(
          prefeituraPortalLogin,
          prefeituraPortalSenha
        );
        if (credMsg) {
          setEmpresaRegistroRetryBusy(false);
          setPlugnotasSubmitPhase('idle');
          queueMicrotask(() => {
            const lt = prefeituraPortalLogin.trim();
            const st = prefeituraPortalSenha.trim();
            if (!lt) {
              prefeituraPortalLoginInputRef.current?.focus();
            } else if (!st) {
              prefeituraPortalSenhaInputRef.current?.focus();
            }
          });
          return;
        }
      }
      let companyPayload: Record<string, unknown> = buildNfEmissionEmpresaPayload({
        cnpj: plugnotasPendingRetry.cnpj,
        certificadoId: plugnotasPendingRetry.certificadoId,
        form: nfEmissionCompanyForm,
        documentosAtivos
      });
      if (
        plugnotasPendingRetry.retryKind === 'municipal'
        && isPrefeituraPortalCredentialsUiEnabled()
      ) {
        companyPayload = mergePrefeituraPortalCredentialsIntoEmpresaPayload(companyPayload, {
          login: prefeituraPortalLogin,
          senha: prefeituraPortalSenha,
          codigoIbgeDigits: nfEmissionCompanyForm.codigoCidade
        });
      }
      const companyResponse = await retryPlugnotasEmpresaRegistro(companyPayload);
      finalizePlugnotasEmpresaCadastroSuccess(companyResponse, plugnotasPendingRetry.cnpj, {
        certificateRecoveredFrom409: false,
        isRetryOnly: true
      });
    } catch (error) {
      if (isFetchConnectivityFailure(error)) {
        setCertificateConnectivityAlert(true);
        setPlugnotasPendingRetry(null);
        setPlugnotasEmpresaRetryMeta(null);
        setPlugnotasEmpresaFase2PostOk(null);
      } else {
        const retryError = createMeiFiscalUiErrorState(error, 'Erro ao registrar empresa.');
        setPlugnotasEmpresaRetryDetail(retryError.message);
        setPlugnotasEmpresaRetryMeta(retryError);
        setGuiaMeiEmpresaFase2FailFlag(userId, plugnotasPendingRetry.cnpj);
      }
    } finally {
      setEmpresaRegistroRetryBusy(false);
      setPlugnotasSubmitPhase('idle');
      try {
        await loadCertificateStatus();
      } catch {
        /* mantém fluxo principal */
      }
    }
  }, [
    plugnotasPendingRetry,
    nfEmissionCompanyForm,
    documentosAtivos,
    prefeituraPortalLogin,
    prefeituraPortalSenha,
    finalizePlugnotasEmpresaCadastroSuccess,
    loadCertificateStatus,
    userId,
    plugnotasRetryActionAvailable
  ]);

  const handlePrefeituraPortalVoltar = useCallback(() => {
    setPlugnotasPendingRetry(null);
    setPlugnotasEmpresaRetryDetail(null);
    setPlugnotasEmpresaRetryMeta(null);
    setPrefeituraPortalLogin('');
    setPrefeituraPortalSenha('');
    setPlugnotasEmpresaFase2PostOk(null);
  }, []);

  const updateNfseServico = (updates: Partial<EmitirNfseInput['servico']>) => {
    setNfseForm((current) => ({
      ...current,
      servico: {
        ...current.servico,
        ...updates
      }
    }));
  };

  const updateNfseCidade = (updates: Partial<NonNullable<EmitirNfseInput['cidadePrestacao']>>) => {
    setNfseForm((current) => ({
      ...current,
      cidadePrestacao: {
        ...(current.cidadePrestacao || {}),
        ...updates
      }
    }));
  };

  const updateNfsePrestadorEndereco = (
    updates: Partial<NonNullable<EmitirNfseInput['prestadorEndereco']>>
  ) => {
    touchNfsePrestadorBffParity();
    setNfseForm((current) => ({
      ...current,
      prestadorEndereco: {
        ...(current.prestadorEndereco || {}),
        ...updates
      }
    }));
  };

  const updateNfEmissionCompanyForm = (updates: Partial<NfEmissionCompanyForm>) => {
    setNfEmissionCompanyForm((current) => ({
      ...current,
      ...updates
    }));
  };

  const openRpsConfig = useCallback(() => {
    setActiveWorkspace('nfse');
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById('mei-rps-config')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }, []);

  const handleDocumentosAtivosChange = (key: keyof DocumentosAtivosState, checked: boolean) => {
    if (key === 'nfse' && !checked && documentosAtivos.nfse) {
      setNfseDesativarDialogOpen(true);
      return;
    }
    documentosAtivosUserEditedRef.current = true;
    setDocumentosAtivos((prev) => ({ ...prev, [key]: checked }));
  };

  const confirmDesativarNfse = () => {
    documentosAtivosUserEditedRef.current = true;
    setDocumentosAtivos((prev) => ({ ...prev, nfse: false }));
    setNfseDesativarDialogOpen(false);
  };

  useEffect(() => {
    setDocumentosAtivosSubmitError(null);
  }, [documentosAtivos]);

  useEffect(() => {
    setPrefeituraPortalLogin('');
    setPrefeituraPortalSenha('');
  }, [nfEmissionCompanyForm.codigoCidade, documentosAtivos.nfse]);

  const handleSelectCatalogCliente = (id: string) => {
    setSelectedCatalogClienteId(id);
    if (!id) return;
    const selected = nfseCatalogClientes.find((item) => item.id === id);
    if (!selected) return;
    updateNfseForm({
      tomadorCpfCnpj: selected.documento ? formatDocument(selected.documento) : '',
      tomadorRazaoSocial: selected.nome || '',
      tomadorEmail: selected.email || ''
    });
  };

  const handleSelectCatalogProduto = (id: string) => {
    setSelectedCatalogProdutoId(id);
    if (!id) return;
    const selected = nfseCatalogProdutos.find((item) => item.id === id);
    if (!selected) return;
    const vs = selected.valor_sugerido;
    updateNfseServico({
      codigo: selected.codigo || '',
      cnae: selected.cnae || '',
      discriminacao: selected.discriminacao || '',
      codigoNbs: pickCodigoNbsFromCatalogMetadata(selected.metadata_json),
      valorServico: vs != null && vs !== '' ? String(vs) : ''
    });
  };

  const isNfseActionLoading = (actionKey: string) => Boolean(nfseActionMap[actionKey]);
  const isNfseRowBusy = (id: string) => Object.entries(nfseActionMap)
    .some(([key, value]) => value && key.startsWith(`${id}:`));

  const startNfseAction = (actionKey: string) => {
    setNfseActionMap((current) => ({ ...current, [actionKey]: true }));
  };

  const finishNfseAction = (actionKey: string) => {
    setNfseActionMap((current) => {
      const next = { ...current };
      delete next[actionKey];
      return next;
    });
  };

  useEffect(() => {
    if (!canViewNfse) {
      setDocumentosAtivosHydrating(false);
    }
  }, [canViewNfse]);

  useEffect(() => {
    void loadCertificateStatus();
  }, [loadCertificateStatus]);

  useEffect(() => {
    if (!canLoadPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    void loadMeiPeriods();
  }, [canLoadPeriods, hasUserCertificate, loadMeiPeriods]);

  useEffect(() => {
    void loadNfseList();
  }, [loadNfseList]);

  useEffect(() => {
    void loadMeiLimiteServidor();
  }, [loadMeiLimiteServidor]);

  useEffect(() => {
    void loadNfseCatalog();
  }, [loadNfseCatalog]);

  useEffect(() => {
    const prev = prevMeiWorkspaceRef.current;
    prevMeiWorkspaceRef.current = activeWorkspace;
    if (prev === null) {
      return;
    }
    if (activeWorkspace === 'nfse' && prev !== 'nfse' && canViewNfse) {
      void loadNfseCatalog();
    }
  }, [activeWorkspace, canViewNfse, loadNfseCatalog]);

  /** FR-CAT-12 / paridade pós-CAT-MEI-07 e CAT-MEI-08: exclusões de clientes ou itens noutra rota reflectem-se nos atalhos ao regressar ao separador NFS-e ou ao foco do separador (visibility). */
  useEffect(() => {
    if (!canViewNfse) return;
    const onVis = () => {
      if (document.visibilityState === 'visible' && activeWorkspace === 'nfse') {
        void loadNfseCatalog();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [canViewNfse, activeWorkspace, loadNfseCatalog]);

  useEffect(() => {
    if (!canViewNfse && activeWorkspace === 'nfse') {
      setActiveWorkspace('overview');
    }
  }, [activeWorkspace, canViewNfse]);

  useEffect(() => {
    try {
      localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, activeWorkspace);
    } catch {
      /* quota / modo privado / indisponível */
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (!canViewNfse || activeWorkspace !== 'nfse') return;
    const o = nfsePrestadorPrefillBannerOutcomeRef.current;
    if (o === 'empty') setNfsePrestadorPrefillBanner(NFSE_PRESTADOR_PREFILL_MSG_EMPTY);
    else if (o === 'error') setNfsePrestadorPrefillBanner(NFSE_PRESTADOR_PREFILL_MSG_ERROR);
  }, [canViewNfse, activeWorkspace]);

  useEffect(() => {
    if (!canViewNfse || activeWorkspace !== 'nfse') return;
    if (nfsePrestadorPrefillAppliedRef.current) return;
    if (nfsePrestadorUserEditedRef.current) return;
    if (nfsePrestadorPrefillInFlightRef.current) return;

    nfsePrestadorPrefillInFlightRef.current = true;
    (async () => {
      setNfsePrestadorPrefillLoading(true);
      setNfsePrestadorPrefillBanner(null);
      nfsePrestadorPrefillBannerOutcomeRef.current = 'unset';
      try {
        const prefill = await fetchNfsePrestadorPrefill();
        if (nfsePrestadorUserEditedRef.current) return;
        if (nfsePrestadorPrefillAppliedRef.current) return;
        nfsePrestadorPrefillAppliedRef.current = true;
        const certDigits = normalizeDoc(contribuinteDoc || '');
        const prefillDigits = normalizeDoc(prefill.prestadorCpfCnpj || '');
        const localStale =
          certDigits.length === 14
          && prefillDigits.length === 14
          && certDigits !== prefillDigits;
        setNfseForm((f) => mergeNfsePrestadorPrefillIntoForm(f, prefill, {
          onlyFillEmpty: !localStale,
        }));
        if (isNfsePrestadorPrefillEffectivelyEmpty(prefill)) {
          nfsePrestadorPrefillBannerOutcomeRef.current = 'empty';
          setNfsePrestadorPrefillBanner(NFSE_PRESTADOR_PREFILL_MSG_EMPTY);
        } else {
          nfsePrestadorPrefillBannerOutcomeRef.current = 'ok';
          setNfsePrestadorPrefillBanner(null);
        }
      } catch {
        if (nfsePrestadorUserEditedRef.current) return;
        if (nfsePrestadorPrefillAppliedRef.current) return;
        nfsePrestadorPrefillAppliedRef.current = true;
        nfsePrestadorPrefillBannerOutcomeRef.current = 'error';
        setNfsePrestadorPrefillBanner(NFSE_PRESTADOR_PREFILL_MSG_ERROR);
      } finally {
        nfsePrestadorPrefillInFlightRef.current = false;
        setNfsePrestadorPrefillLoading(false);
      }
    })();
  }, [canViewNfse, activeWorkspace, contribuinteDoc]);

  useEffect(() => {
    if (!normalizedContribuinte) return;
    const formatted = formatDocument(normalizedContribuinte);
    setNfseForm((current) => (
      current.prestadorCpfCnpj
        ? current
        : { ...current, prestadorCpfCnpj: formatted }
    ));
  }, [normalizedContribuinte]);

  useEffect(() => {
    setParcelamentosSearchDone(false);
    setParcelamentosResumo({});
    setParcelamentoPdfError(null);
  }, [contribuinteDoc]);

  useEffect(() => {
    setNfEmissionCompanyForm((current) => {
      const razao = nfseForm.prestadorRazaoSocial?.trim() || '';
      const email = nfseForm.prestadorEmail?.trim() || '';
      if (!razao && !email) return current;

      let changed = false;
      const next = { ...current };
      if (razao && !current.razaoSocial.trim()) {
        next.razaoSocial = razao;
        changed = true;
      }
      if (razao && !current.nomeFantasia.trim()) {
        next.nomeFantasia = razao;
        changed = true;
      }
      if (email && !current.email.trim()) {
        next.email = email;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [nfseForm.prestadorEmail, nfseForm.prestadorRazaoSocial]);

  useEffect(() => {
    setValidationError(null);
    setValidationSuccess(null);
  }, [normalizedContribuinte, selectedMonth, selectedYear, hasUserCertificate]);

  useEffect(() => {
    if (!plugnotasPendingRetry) return;
    queueMicrotask(() => plugnotasEmpresaRetryRef.current?.focus());
  }, [plugnotasPendingRetry]);

  const handleDownload = async (periodoApuracao: string, competencia?: string | null) => {
    const contribuinte = normalizedContribuinte && contribuinteTipo !== null
      ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
      : undefined;
    const { blob, filename } = await downloadMeiGuide(
      normalizedContribuinte,
      periodoApuracao,
      contribuinte
    );
    triggerFileDownload(blob, filename || buildFilenameFromCompetencia(competencia || null));
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setCertificateConnectivityAlert(false);
      setCertificateErrorFiscalCode(null);
      setCertificateErrorHttpStatus(null);
      setCertificateError('Selecione o arquivo do certificado.');
      return;
    }
    const trimmedPassword = certificatePassword.trim();
    if (!trimmedPassword) {
      setCertificateConnectivityAlert(false);
      setCertificateErrorFiscalCode(null);
      setCertificateErrorHttpStatus(null);
      setCertificateError('Informe a senha do certificado.');
      return;
    }
    if (canViewNfse) {
      const companyValidationMessage = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
      if (companyValidationMessage) {
        setCertificateConnectivityAlert(false);
        setCertificateErrorFiscalCode(null);
        setCertificateErrorHttpStatus(null);
        setCertificateError(companyValidationMessage);
        return;
      }
      const docMsg = getDocumentosAtivosValidationMessage(documentosAtivos);
      if (docMsg) {
        setCertificateConnectivityAlert(false);
        setCertificateErrorFiscalCode(null);
        setCertificateErrorHttpStatus(null);
        setDocumentosAtivosSubmitError(docMsg);
        documentosAtivosNfseCheckboxRef.current?.focus();
        return;
      }
    }

    setCertificateError(null);
    setCertificateErrorFiscalCode(null);
    setCertificateErrorHttpStatus(null);
    setDocumentosAtivosSubmitError(null);
    setCertificateConnectivityAlert(false);
    setCertificateSuccess(null);
    setPlugnotasPendingRetry(null);
    setPlugnotasEmpresaRetryDetail(null);
    setPlugnotasEmpresaRetryMeta(null);
    setPlugnotasEmpresaFase2PostOk(null);
    setPlugnotasSubmitPhase('idle');
    setIsUploadingCert(true);
    let uploadedToMei = false;
    let cnpjForFiscal = '';
    try {
      const status = await uploadMeiCertificate(
        certificateFile,
        trimmedPassword,
        canViewNfse ? nfEmissionCompanyForm : undefined
      );
      uploadedToMei = true;
      applyDocumento(status.documento, true);
      if (canViewNfse && status.nfseEmitente) {
        const snap = status.nfseEmitente;
        setNfEmissionCompanyForm(emitenteSnapshotToForm(snap));
        nfseEmitenteHydratedRef.current = true;
        setNfseForm((current) => mergeEmitenteSnapshotIntoNfseForm(current, snap));
        const emitDigits = normalizeDoc(snap.certDocument || status.documento || '');
        const emitRazao = String(snap.razaoSocial || '').trim();
        if (emitDigits.length === 14 || emitRazao) {
          setNfeLikeForm((current) => ({
            ...current,
            emitenteCnpj: emitDigits.length === 14 ? formatDocument(emitDigits) : current.emitenteCnpj,
            emitenteRazao: emitRazao || current.emitenteRazao
          }));
        }
      }
      nfsePrestadorPrefillAppliedRef.current = false;
      nfsePrestadorUserEditedRef.current = false;

      if (!canViewNfse) {
        setCertificateFile(null);
        setCertificatePassword('');
        setCertificateSuccess({ primary: 'Certificado enviado com sucesso.' });
        return;
      }

      const cnpj = normalizeDoc(
        status.documento
        || normalizedContribuinte
        || nfseForm.prestadorCpfCnpj
        || contribuinteDoc
      );
      if (cnpj.length !== 14) {
        throw new Error('Não foi possível identificar um CNPJ válido para configurar a empresa no sistema de emissão fiscal.');
      }
      cnpjForFiscal = cnpj;

      const setupResult = await submitPlugnotasEmitenteSetup(
        {
          certificateInput: {
            arquivo: certificateFile,
            senha: trimmedPassword,
            cpfCnpj: cnpj,
            ...(
              nfEmissionCompanyForm.email.trim()
                ? { email: nfEmissionCompanyForm.email.trim() }
                : {}
            )
          },
          buildCompanyPayload: (certificadoId) => buildNfEmissionEmpresaPayload({
            cnpj,
            certificadoId,
            form: nfEmissionCompanyForm,
            documentosAtivos
          })
        },
        { onPhaseChange: setPlugnotasSubmitPhase }
      );

      finalizePlugnotasEmpresaCadastroSuccess(setupResult.companyResponse, cnpj, {
        certificateRecoveredFrom409: setupResult.certificateRecoveredFrom409,
        isRetryOnly: false
      });
    } catch (error) {
      if (isPlugnotasEmitenteSetupError(error) && error.phase === 'empresa') {
        const cause = error.cause;
        if (isFetchConnectivityFailure(cause)) {
          setCertificateConnectivityAlert(true);
          setCertificateError(null);
          setCertificateErrorFiscalCode(null);
          setCertificateErrorHttpStatus(null);
          setPlugnotasPendingRetry(null);
          setPlugnotasEmpresaRetryDetail(null);
          setPlugnotasEmpresaRetryMeta(null);
          setPlugnotasEmpresaFase2PostOk(null);
        } else {
          const retryError = createMeiFiscalUiErrorState(cause, 'Erro ao registrar empresa.');
          setCertificateConnectivityAlert(false);
          setCertificateError(null);
          setCertificateErrorFiscalCode(null);
          setCertificateErrorHttpStatus(null);
          setPlugnotasEmpresaRetryDetail(retryError.message);
          setPlugnotasEmpresaRetryMeta(retryError);
          const retryCnpj = normalizeDoc(String(error.cnpj || cnpjForFiscal || ''));
          const retryCert = String(error.certificadoId || '').trim();
          const retryScenario = resolveMeiFiscalScenario({
            rawMessage: retryError.rawMessage,
            plugnotasCode: retryError.plugnotasCode,
            httpStatus: retryError.httpStatus,
            plugnotasRequest: retryError.plugnotasRequest,
            runtimeDecision: retryError.runtimeDecision
          });
          const municipalFallback =
            retryScenario === 'prefeitura_login_required_fallback_available'
            && isPrefeituraPortalCredentialsUiEnabled();
          if (retryCert && retryCnpj.length === 14) {
            setPlugnotasEmpresaFase2PostOk(false);
            setGuiaMeiEmpresaFase2FailFlag(userId, retryCnpj);
            setPrefeituraPortalLogin('');
            setPrefeituraPortalSenha('');
            setPlugnotasPendingRetry({
              certificadoId: retryCert,
              cnpj: retryCnpj,
              ...(municipalFallback ? { retryKind: 'municipal' as const } : {})
            });
          } else {
            setPlugnotasPendingRetry(null);
            setPlugnotasEmpresaFase2PostOk(null);
          }
        }
      } else if (isFetchConnectivityFailure(error)) {
        setCertificateConnectivityAlert(true);
        setCertificateError(null);
        setCertificateErrorFiscalCode(null);
        setCertificateErrorHttpStatus(null);
      } else if (isPlugnotasEmitenteSetupError(error) && error.phase === 'certificado') {
        const src = error.cause ?? error;
        if (isFetchConnectivityFailure(src)) {
          setCertificateConnectivityAlert(true);
          setCertificateError(null);
          setCertificateErrorFiscalCode(null);
          setCertificateErrorHttpStatus(null);
        } else {
          setCertificateConnectivityAlert(false);
          const fiscalCode = getFiscalErrorCode(src);
          const fallbackMessage = formatMeiFiscalErr(src, 'Erro ao enviar certificado.');
          setCertificateErrorFiscalCode(fiscalCode);
          setCertificateErrorHttpStatus(getFiscalHttpStatus(src));
          setCertificateError(
            uploadedToMei
              ? `Certificado enviado no MEI, mas falhou a configuração automática da integração fiscal: ${fallbackMessage}`
              : fallbackMessage
          );
        }
      } else {
        setCertificateConnectivityAlert(false);
        const fiscalCode = getFiscalErrorCode(error);
        const fallbackMessage = formatMeiFiscalErr(error, 'Erro ao enviar certificado.');
        setCertificateErrorFiscalCode(fiscalCode);
        setCertificateErrorHttpStatus(getFiscalHttpStatus(error));
        setCertificateError(
          uploadedToMei
            ? `Certificado enviado no MEI, mas falhou a configuração automática da integração fiscal: ${fallbackMessage}`
            : fallbackMessage
        );
      }
    } finally {
      setPlugnotasSubmitPhase('idle');
      if (uploadedToMei) {
        try {
          await loadCertificateStatus();
        } catch {
          // mantém o resultado principal e evita bloquear o fluxo por refresh de status.
        }
      }
      setIsUploadingCert(false);
    }
  };

  const resolveCnpjParaEmissor = useCallback(() => {
    const fromContrib = normalizeDoc(contribuinteDoc);
    if (fromContrib.length === 14) return fromContrib;
    const fromPrestador = normalizeDoc(nfseForm.prestadorCpfCnpj || '');
    if (fromPrestador.length === 14) return fromPrestador;
    return '';
  }, [contribuinteDoc, nfseForm.prestadorCpfCnpj]);

  const handleConsultarCadastroEmissor = async () => {
    clearNfEmissionCompanySyncErrorState();
    setNfEmissionCompanySyncSuccess(null);
    setDocumentosAtivosConsultWarning(null);
    setDocumentosAtivosHydrationError(null);
    const cnpj = resolveCnpjParaEmissor();
    if (cnpj.length !== 14) {
      setNfEmissionCompanySyncError(
        createPlainMeiFiscalUiErrorState(
          'Informe um CNPJ válido (14 dígitos) no campo CNPJ do MEI ou no prestador da NFSe.'
        )
      );
      return;
    }
    setNfEmissionCompanySyncLoading('consult');
    try {
      const data = (await fetchEmpresaJsonWithMeiCache({
        userId,
        cnpjDigits: cnpj,
        fetcher: () => consultarEmpresaEmissaoNf(cnpj)
      })) as Record<string, unknown>;
      const nested = data?.data && typeof data.data === 'object' && !Array.isArray(data.data)
        ? (data.data as Record<string, unknown>)
        : {};
      const razao = typeof nested.razaoSocial === 'string' ? nested.razaoSocial : null;
      const msg = typeof data.message === 'string' ? data.message : null;
      setNfEmissionCompanySyncSuccess(
        [msg, razao ? `Razão social: ${razao}` : null, 'Consulta concluída com sucesso.']
          .filter(Boolean)
          .join(' ')
      );
      if (canViewNfse) {
        const mapped = mapPlugnotasEmpresaToDocumentSelection(data);
        if (mapped.kind === 'full') {
          clearGuiaMeiEmpresaFase2FailFlag(userId, cnpj);
          documentosAtivosRemoteOrMirrorHydratedRef.current = true;
          setDocumentosAtivosRemoteSnapshot(mapped.selection);
          setDocumentosAtivos(mapped.selection);
          setDocumentosAtivosConsultWarning(null);
          try {
            await loadCertificateStatus();
          } catch {
            // espelho/snapshots na próxima carga
          }
        } else {
          setDocumentosAtivosConsultWarning(mapped.message);
        }
      }
    } catch (error) {
      const mappedError = createMeiFiscalUiErrorState(
        error,
        'Falha ao consultar cadastro no serviço de emissão fiscal.'
      );
      const sessionPostFailedFlag =
        cnpj.length === 14 && isGuiaMeiEmpresaFase2FailFlagActive(userId, cnpj);
      setNfEmissionCompanySyncError(
        createMeiFiscalUiErrorState(
          error,
          'Falha ao consultar cadastro no serviço de emissão fiscal.',
          withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(mappedError.message, {
            pendingRetryPanel: Boolean(plugnotasPendingRetry),
            sessionPostFailedFlag
          })
        )
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleAtualizarCadastroSemNovoCertificado = async () => {
    clearNfEmissionCompanySyncErrorState();
    setNfEmissionCompanySyncSuccess(null);
    setDocumentosAtivosSubmitError(null);
    const companyValidationMessage = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
    if (companyValidationMessage) {
      setNfEmissionCompanySyncError(createPlainMeiFiscalUiErrorState(companyValidationMessage));
      return;
    }
    const docMsg = getDocumentosAtivosValidationMessage(documentosAtivos);
    if (docMsg) {
      setDocumentosAtivosSubmitError(docMsg);
      documentosAtivosNfseCheckboxRef.current?.focus();
      return;
    }
    const cnpj = resolveCnpjParaEmissor();
    if (cnpj.length !== 14) {
      setNfEmissionCompanySyncError(
        createPlainMeiFiscalUiErrorState(
          'CNPJ de 14 dígitos é obrigatório (campo CNPJ do MEI ou prestador na NFSe).'
        )
      );
      return;
    }
    setNfEmissionCompanySyncLoading('patch');
    setNfseEmitentePendingApply(null);
    try {
      const companyPayload = buildNfEmissionEmpresaPayload({
        cnpj,
        form: nfEmissionCompanyForm,
        documentosAtivos
      });
      const companyResponse = await atualizarEmpresaEmissaoNf(companyPayload);
      clearGuiaMeiEmpresaFase2FailFlag(userId, cnpj);
      let updatedStatus;
      try {
        updatedStatus = await patchMeiCertificateEmitenteNfse(
          nfEmissionFormToPersistBody(nfEmissionCompanyForm)
        );
      } catch (persistErr) {
        const msg = persistErr instanceof Error ? persistErr.message : String(persistErr);
        setNfEmissionCompanySyncError(
          createPlainMeiFiscalUiErrorState(
            `Empresa atualizada no emissor fiscal, mas os dados não foram gravados nesta aplicação: ${msg}`
          )
        );
        return;
      }
      if (updatedStatus?.nfseEmitente) {
        setNfEmissionCompanyForm(emitenteSnapshotToForm(updatedStatus.nfseEmitente));
        nfseEmitenteHydratedRef.current = true;
        setNfseEmitentePendingApply(updatedStatus.nfseEmitente);
      }
      if (documentosAtivosUserEditedRef.current) {
        setNfEmissionCompanySyncSuccess(MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR);
      } else {
        setNfEmissionCompanySyncSuccess(
          companyResponse.message || 'Empresa atualizada no serviço de emissão fiscal com sucesso.'
        );
      }
      documentosAtivosUserEditedRef.current = false;
      setDocumentosAtivosSubmitError(null);
      invalidateMeiEmpresaGetCache(userId, cnpj);
      bumpFiscalCapabilityRefetchIfApplicable();
      try {
        await loadCertificateStatus();
      } catch {
        // mantém sucesso principal; snapshots podem actualizar na próxima carga
      }
    } catch (error) {
      setNfEmissionCompanySyncError(
        createMeiFiscalUiErrorState(error, 'Falha ao atualizar empresa no serviço de emissão fiscal.')
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleDocumentosAtivosAtualizarVista = useCallback(() => {
    const remote = documentosAtivosRemoteSnapshot;
    if (!remote) return;
    setDocumentosAtivos({ ...remote });
    documentosAtivosUserEditedRef.current = false;
  }, [documentosAtivosRemoteSnapshot]);

  const handleDocumentosAtivosSincronizarPlugnotas = useCallback(async () => {
    const cnpj = resolveCnpjParaEmissor();
    if (cnpj.length !== 14) {
      setNfEmissionCompanySyncError(
        createPlainMeiFiscalUiErrorState(
          'Informe um CNPJ válido (14 dígitos) no campo CNPJ do MEI ou no prestador da NFSe.'
        )
      );
      return;
    }
    clearNfEmissionCompanySyncErrorState();
    setNfEmissionCompanySyncLoading('consult');
    try {
      invalidateMeiEmpresaGetCache(userId, cnpj);
      await fetchEmpresaJsonWithMeiCache({
        userId,
        cnpjDigits: cnpj,
        fetcher: () => consultarEmpresaEmissaoNf(cnpj)
      });
      await loadCertificateStatus();
    } catch (error) {
      const mappedError = createMeiFiscalUiErrorState(error, 'Falha ao sincronizar com o emissor fiscal.');
      const sessionPostFailedFlag =
        cnpj.length === 14 && isGuiaMeiEmpresaFase2FailFlagActive(userId, cnpj);
      setNfEmissionCompanySyncError(
        createMeiFiscalUiErrorState(
          error,
          'Falha ao sincronizar com o emissor fiscal.',
          withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(mappedError.message, {
            pendingRetryPanel: Boolean(plugnotasPendingRetry),
            sessionPostFailedFlag
          })
        )
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  }, [userId, loadCertificateStatus, resolveCnpjParaEmissor, plugnotasPendingRetry, clearNfEmissionCompanySyncErrorState]);

  const handleSalvarDadosEmitente = async () => {
    clearNfEmissionCompanySyncErrorState();
    setNfEmissionCompanySyncSuccess(null);
    setNfEmissionCompanySyncLoading('patch');
    try {
      const updatedStatus = await patchMeiCertificateEmitenteNfse(
        nfEmissionFormToPersistBody(nfEmissionCompanyForm)
      );
      if (updatedStatus?.nfseEmitente) {
        setNfEmissionCompanyForm(emitenteSnapshotToForm(updatedStatus.nfseEmitente));
        nfseEmitenteHydratedRef.current = true;
      }
      setNfEmissionCompanySyncSuccess('Dados do emitente salvos com sucesso.');
    } catch (error) {
      setNfEmissionCompanySyncError(
        createMeiFiscalUiErrorState(error, 'Falha ao salvar dados do emitente.')
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleCertificateRemove = async () => {
    const cnpjBeforeRemove = normalizeDoc(contribuinteDoc);
    if (cnpjBeforeRemove.length === 14) {
      clearGuiaMeiEmpresaFase2FailFlag(userId, cnpjBeforeRemove);
    }
    setCertificateError(null);
    setCertificateErrorFiscalCode(null);
    setCertificateErrorHttpStatus(null);
    setCertificateConnectivityAlert(false);
    setCertificateSuccess(null);
    setPlugnotasPendingRetry(null);
    setPlugnotasEmpresaRetryDetail(null);
    setPlugnotasEmpresaRetryMeta(null);
    setPlugnotasEmpresaFase2PostOk(null);
    setPlugnotasSubmitPhase('idle');
    setIsRemovingCert(true);
    try {
      await removeMeiCertificate();
      nfseEmitenteHydratedRef.current = false;
      documentosAtivosRemoteOrMirrorHydratedRef.current = false;
      documentosAtivosUserEditedRef.current = false;
      setDocumentosAtivosMirrorSnapshot(null);
      setDocumentosAtivosRemoteSnapshot(null);
      setNfseEmitentePendingApply(null);
      setNfEmissionCompanyForm(getDefaultNfEmissionCompanyForm());
      setDocumentosAtivos({ ...DEFAULT_DOCUMENTOS_ATIVOS });
      setDocumentosAtivosConsultWarning(null);
      setDocumentosAtivosHydrationError(null);
      setNfseForm((current) => ({
        ...current,
        prestadorRazaoSocial: '',
        prestadorEmail: '',
        prestadorInscricaoMunicipal: '',
        prestadorEndereco: emptyNfsePrestadorEndereco(),
        prestadorCpfCnpj: ''
      }));
      nfsePrestadorPrefillAppliedRef.current = false;
      nfsePrestadorUserEditedRef.current = false;
      await loadCertificateStatus();
    } catch (error) {
      if (isFetchConnectivityFailure(error)) {
        setCertificateConnectivityAlert(true);
        setCertificateError(null);
        setCertificateErrorFiscalCode(null);
        setCertificateErrorHttpStatus(null);
      } else {
        setCertificateConnectivityAlert(false);
        setCertificateErrorFiscalCode(null);
        setCertificateErrorHttpStatus(getFiscalHttpStatus(error));
        setCertificateError(formatMeiFiscalErr(error, 'Erro ao remover certificado.'));
      }
    } finally {
      setIsRemovingCert(false);
    }
  };

  const handleValidateBlur = async () => {
    if (isValidating) return;
    setValidationError(null);
    setValidationSuccess(null);

    if (!normalizedContribuinte) {
      return;
    }
    if (normalizedContribuinte.length !== 14) {
      setValidationError({ variant: 'plain', message: 'CNPJ do MEI deve ter 14 dígitos.' });
      return;
    }

    setIsValidating(true);
    try {
      const periodoApuracao = toPeriodoApuracao(selectedMonth, selectedYear);
      const result = await validateMeiGuide(normalizedContribuinte, periodoApuracao);
      const fallbackMessage = hasUserCertificate
        ? 'CNPJ e certificado validados com sucesso.'
        : 'CNPJ validado com sucesso.';
      setValidationSuccess(result?.message || fallbackMessage);
    } catch (error) {
      setValidationError(mapMeiGuideValidateErrorToUserMessage(error));
    } finally {
      setIsValidating(false);
    }
  };

  const mergeIfEmpty = <T extends Record<string, unknown>>(current: T, incoming: Partial<T>): T => {
    const result = { ...current };
    for (const key of Object.keys(incoming) as (keyof T)[]) {
      const val = incoming[key];
      if (val !== undefined && val !== null && String(val).trim() !== '' && !String(current[key] ?? '').trim()) {
        (result as Record<keyof T, unknown>)[key] = val;
      }
    }
    return result;
  };

  const applyCnpjLookupToEmitente = (data: CnpjLookupResult) => {
    setNfEmissionCompanyForm((prev) => mergeIfEmpty(prev, {
      razaoSocial: data.razaoSocial ?? '',
      nomeFantasia: data.nomeFantasia ?? '',
      email: data.email ?? '',
      logradouro: data.endereco.logradouro ?? '',
      numero: data.endereco.numero ?? '',
      complemento: data.endereco.complemento ?? '',
      bairro: data.endereco.bairro ?? '',
      cep: (data.endereco.cep ?? '').replace(/\D/g, ''),
      descricaoCidade: data.endereco.descricaoCidade ?? '',
      codigoCidade: normalizeIbgeMunicipioCodigo(data.endereco.codigoCidade ?? ''),
      estado: data.endereco.estado ?? '',
      simplesNacional: data.opcaoSimples ?? prev.simplesNacional,
    }));
  };

  const handleCnpjMeiBlur = async () => {
    await handleValidateBlur();
    const digits = normalizeDoc(contribuinteDoc);
    if (digits.length !== 14) return;
    setBrasilApiError(null);
    setBrasilApiLoading(true);
    try {
      const data = await lookupEmpresaCnpj(digits);
      applyCnpjLookupToEmitente(data);
    } catch (err) {
      setBrasilApiError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ.');
    } finally {
      setBrasilApiLoading(false);
    }
  };

  const handlePrestadorCnpjBlur = async () => {
    const digits = normalizeDoc(nfseForm.prestadorCpfCnpj);
    if (digits.length !== 14) return;
    setNfsePrestadorBrasilApiError(null);
    setNfsePrestadorBrasilApiLoading(true);
    try {
      const data = await lookupEmpresaCnpj(digits);
      updateNfseForm(mergeIfEmpty(
        {
          prestadorRazaoSocial: nfseForm.prestadorRazaoSocial,
          prestadorEmail: nfseForm.prestadorEmail,
        } as Record<string, unknown>,
        {
          prestadorRazaoSocial: data.razaoSocial ?? '',
          prestadorEmail: data.email ?? '',
        }
      ) as { prestadorRazaoSocial: string; prestadorEmail: string });
      const currentEndereco = nfseForm.prestadorEndereco ?? {};
      const merged = mergeIfEmpty(
        currentEndereco as Record<string, unknown>,
        {
          logradouro: data.endereco.logradouro ?? '',
          numero: data.endereco.numero ?? '',
          complemento: data.endereco.complemento ?? '',
          bairro: data.endereco.bairro ?? '',
          cep: (data.endereco.cep ?? '').replace(/\D/g, ''),
          codigoCidade: normalizeIbgeMunicipioCodigo(data.endereco.codigoCidade ?? ''),
          descricaoCidade: data.endereco.descricaoCidade ?? '',
          estado: data.endereco.estado ?? '',
        }
      );
      updateNfsePrestadorEndereco(merged as Parameters<typeof updateNfsePrestadorEndereco>[0]);
    } catch (err) {
      setNfsePrestadorBrasilApiError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ.');
    } finally {
      setNfsePrestadorBrasilApiLoading(false);
    }
  };

  const handleEmitNfse = async () => {
    if (meiEmitInFlightRef.current) return;
    if (nfseSubmitting) return;
    clearNfseErrorState();
    setNfseSuccess(null);

    if (nfseValidationMessage) {
      const section = getNfseValidationSection(nfseForm, nfsePrestadorAddressFallback);
      if (section) {
        setNfseEmitDisclosure((prev) => ({ ...prev, [section]: true }));
        const panelId = `mei-nfse-emit-panel-${section}`;
        requestAnimationFrame(() => {
          document.getElementById(panelId)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        });
      }
      return;
    }

    meiEmitInFlightRef.current = true;
    setNfseSubmitting(true);
    try {
      const prestadorCpfCnpj = normalizeDoc(nfseForm.prestadorCpfCnpj);
      const tomadorCpfCnpj = normalizeDoc(nfseForm.tomadorCpfCnpj || '');
      const servico = nfseForm.servico;
      const prestadorEndereco = resolvePrestadorEndereco(nfseForm.prestadorEndereco, {
        logradouro: nfEmissionCompanyForm.logradouro,
        numero: nfEmissionCompanyForm.numero,
        codigoCidade: nfEmissionCompanyForm.codigoCidade,
        cep: nfEmissionCompanyForm.cep,
        complemento: nfEmissionCompanyForm.complemento,
        bairro: nfEmissionCompanyForm.bairro,
        estado: nfEmissionCompanyForm.estado,
        descricaoCidade: nfEmissionCompanyForm.descricaoCidade
      });

      const payload: EmitirNfseInput = {
          prestadorCpfCnpj,
          servico: {
            codigo: servico.codigo.trim(),
            cnae: servico.cnae.trim(),
            discriminacao: servico.discriminacao.trim(),
            ...(servico.codigoNbs?.trim()
              ? { codigoNbs: normalizeCodigoNbsInput(servico.codigoNbs) }
              : {}),
            valorServico: servico.valorServico
          },
          prestadorEndereco: {
            logradouro: prestadorEndereco.logradouro,
            numero: prestadorEndereco.numero,
            codigoCidade: prestadorEndereco.codigoCidade,
            cep: prestadorEndereco.cep,
            ...(prestadorEndereco.complemento ? { complemento: prestadorEndereco.complemento } : {}),
            ...(prestadorEndereco.bairro ? { bairro: prestadorEndereco.bairro } : {}),
            ...(prestadorEndereco.estado ? { estado: prestadorEndereco.estado } : {}),
            ...(prestadorEndereco.descricaoCidade ? { descricaoCidade: prestadorEndereco.descricaoCidade } : {})
          },
          enviarEmail: Boolean(nfseForm.enviarEmail)
        };

        if (nfseForm.prestadorRazaoSocial?.trim()) {
          payload.prestadorRazaoSocial = nfseForm.prestadorRazaoSocial.trim();
        }
        if (nfseForm.prestadorEmail?.trim()) {
          payload.prestadorEmail = nfseForm.prestadorEmail.trim();
        }
        const prestadorIm =
          nfseForm.prestadorInscricaoMunicipal?.trim() || nfEmissionCompanyForm.inscricaoMunicipal?.trim() || '';
        if (prestadorIm) {
          payload.prestadorInscricaoMunicipal = prestadorIm;
        }
        if (tomadorCpfCnpj) {
          payload.tomadorCpfCnpj = tomadorCpfCnpj;
        }
        if (nfseForm.tomadorRazaoSocial?.trim()) {
          payload.tomadorRazaoSocial = nfseForm.tomadorRazaoSocial.trim();
        }
        if (nfseForm.tomadorEmail?.trim()) {
          payload.tomadorEmail = nfseForm.tomadorEmail.trim();
        }
        const skipClientIntegracao = omitClientIdIntegracaoOnNextEmitRef.current;
        omitClientIdIntegracaoOnNextEmitRef.current = false;
        if (nfseForm.idIntegracao?.trim() && !skipClientIntegracao) {
          payload.idIntegracao = nfseForm.idIntegracao.trim();
        }
        if (nfseForm.descricao?.trim()) {
          payload.descricao = nfseForm.descricao.trim();
        }
        if (nfseForm.informacoesComplementares?.trim()) {
          payload.informacoesComplementares = nfseForm.informacoesComplementares.trim();
        }

        const cidade = nfseForm.cidadePrestacao || {};
        if (cidade.codigo || cidade.descricao || cidade.estado) {
          payload.cidadePrestacao = {
            ...(cidade.codigo ? { codigo: cidade.codigo.trim() } : {}),
            ...(cidade.descricao ? { descricao: cidade.descricao.trim() } : {}),
            ...(cidade.estado ? { estado: cidade.estado.trim() } : {})
          };
        }

      setNfseSuccess(
        `${GUIA_MEI_NFSE_DOCUMENT_LABEL} em envio — acompanhe na lista abaixo.`,
      );
      setSelectedCatalogClienteId('');
      setSelectedCatalogProdutoId('');
      setNfseSubmitting(false);
      setActiveWorkspace('nfse');
      setNfseShowArchived(false);
      requestAnimationFrame(() => {
        document.getElementById('mei-nfse-list')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      });

      void (async () => {
        try {
          const created = await emitirNfse(payload);
          const docLabel = GUIA_MEI_NFSE_DOCUMENT_LABEL;
          const statusKey = getNfseStatusKey(created?.status);
          if (statusKey === 'rejeitado') {
            setEmissionNfseError(
              { message: 'A nota foi rejeitada. Veja o motivo na lista — em cerca de 20s ela vai para Arquivadas.' },
              'Nota rejeitada pelo emissor fiscal.',
            );
          } else {
            setNfseSuccess(
              statusKey === 'processando'
                ? `${docLabel} enviada. A prefeitura está processando — acompanhe na lista.`
                : created?.protocol
                  ? `${docLabel} enviada. Protocolo ${created.protocol}.`
                  : `${docLabel} enviada. Acompanhe o status na lista.`,
            );
          }
          await Promise.all([loadNfseList(), loadNfseCatalog(), loadMeiLimiteServidor()]);
          nfseFormBaselineRef.current = JSON.stringify(nfseForm);
        } catch (error) {
          setEmissionNfseError(error, 'Erro ao emitir nota fiscal.');
        } finally {
          meiEmitInFlightRef.current = false;
        }
      })();
    } catch (error) {
      setEmissionNfseError(error, 'Erro ao emitir nota fiscal.');
      meiEmitInFlightRef.current = false;
      setNfseSubmitting(false);
    }
  };

  const nfeNfceEmitEnabled = useMemo(() => isMeiNfeNfceEmitEnabled(), []);

  const performEmissionTypeSwitch = useCallback(
    (newType: MeiFiscalEmissionDocumentType) => {
      const prev = emissionDocumentType;

      if (prev === 'NFSE' && newType !== 'NFSE') {
        const prefill = buildPrefilledNfeLikeFormSnapshot(nfseForm, nfEmissionCompanyForm.razaoSocial || '');
        setNfseForm(createInitialEmitirNfseInput());
        nfseFormBaselineRef.current = JSON.stringify(createInitialEmitirNfseInput());
        setEmissionDocumentType(newType);
        setNfeLikeForm(prefill);
        nfeLikeBaselineRef.current = serializeMeiNfeLikeFormForDirty(prefill);
      } else if (prev !== 'NFSE' && newType === 'NFSE') {
        setNfeLikeForm(createEmptyMeiNfeLikeFormState());
        nfeLikeBaselineRef.current = serializeMeiNfeLikeFormForDirty(createEmptyMeiNfeLikeFormState());
        setEmissionDocumentType(newType);
        nfseFormBaselineRef.current = JSON.stringify(nfseForm);
      } else if (prev !== 'NFSE' && newType !== 'NFSE') {
        const prefill: MeiNfeLikeFormState = {
          ...createEmptyMeiNfeLikeFormState(),
          emitenteCnpj: nfeLikeForm.emitenteCnpj,
          emitenteRazao: nfeLikeForm.emitenteRazao,
          emitenteInscricaoEstadual: nfeLikeForm.emitenteInscricaoEstadual,
        };
        setNfeLikeForm(prefill);
        nfeLikeBaselineRef.current = serializeMeiNfeLikeFormForDirty(prefill);
        setEmissionDocumentType(newType);
      }

      setNfeLikeFieldErrors({});
      setNfeLikeFlashOpenSection(null);
      clearNfseErrorState();
      setNfseSuccess(null);
    },
    [emissionDocumentType, nfseForm, nfeLikeForm, nfEmissionCompanyForm.razaoSocial, clearNfseErrorState]
  );

  useEffect(() => {
    if (!nfeNfceEmitEnabled && (emissionDocumentType === 'NFE' || emissionDocumentType === 'NFCE')) {
      performEmissionTypeSwitch('NFSE');
    }
  }, [nfeNfceEmitEnabled, emissionDocumentType, performEmissionTypeSwitch]);

  const requestEmissionDocumentTypeChange = useCallback(
    (newType: MeiFiscalEmissionDocumentType) => {
      if (newType === emissionDocumentType) return;
      const dirty =
        emissionDocumentType === 'NFSE'
          ? JSON.stringify(nfseForm) !== nfseFormBaselineRef.current
          : serializeMeiNfeLikeFormForDirty(nfeLikeForm) !== nfeLikeBaselineRef.current;
      if (dirty) {
        setPendingEmissionDocumentType(newType);
        setEmissionTypeChangeDialogOpen(true);
        return;
      }
      performEmissionTypeSwitch(newType);
    },
    [emissionDocumentType, nfseForm, nfeLikeForm, performEmissionTypeSwitch]
  );

  const handleCancelEmissionTypeDialog = useCallback(() => {
    setEmissionTypeChangeDialogOpen(false);
    setPendingEmissionDocumentType(null);
  }, []);

  const handleConfirmEmissionTypeChange = useCallback(() => {
    if (pendingEmissionDocumentType) {
      performEmissionTypeSwitch(pendingEmissionDocumentType);
    }
    setEmissionTypeChangeDialogOpen(false);
    setPendingEmissionDocumentType(null);
  }, [pendingEmissionDocumentType, performEmissionTypeSwitch]);

  const handleEmitNfeLike = useCallback(async () => {
    if (meiEmitInFlightRef.current) return;
    if (nfeLikeSubmitting) return;
    if (emissionDocumentType !== 'NFE' && emissionDocumentType !== 'NFCE') return;
    if (nfeLikeEmissionLocked) return;
    clearNfseErrorState();
    setNfseSuccess(null);
    const docShort = emissionDocumentType === 'NFE' ? 'NF-e' : 'NFC-e';
    const validation = validateMeiNfeLikeForm(nfeLikeForm, docShort);
    if (!validation.ok) {
      setNfeLikeFieldErrors(validation.errors);
      if (validation.firstSection) {
        setNfeLikeFlashOpenSection(validation.firstSection);
      }
      return;
    }
    setNfeLikeFieldErrors({});
    setNfeLikeFlashOpenSection(null);
    meiEmitInFlightRef.current = true;
    setNfeLikeSubmitting(true);
    try {
      const payload = buildNfeLikePayloadFromMeiForm(nfeLikeForm, emissionDocumentType);
      setNfseSuccess(`${docShort} em envio — acompanhe na lista abaixo.`);
      setNfeLikeSubmitting(false);
      requestAnimationFrame(() => {
        document.getElementById('mei-nfse-list')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      });

      void (async () => {
        try {
          const created =
            emissionDocumentType === 'NFE' ? await emitirNfe(payload) : await emitirNfce(payload);
          setNfseSuccess(
            created?.protocol
              ? `${docShort}: nota enviada. Protocolo ${created.protocol}.`
              : `${docShort}: nota enviada. Acompanhe o status na lista.`
          );
          await Promise.all([loadNfseList(), loadNfseCatalog(), loadMeiLimiteServidor()]);
          const nextForm = buildPrefilledNfeLikeFormSnapshot(nfseForm, nfEmissionCompanyForm.razaoSocial || '');
          setNfeLikeForm(nextForm);
          nfeLikeBaselineRef.current = serializeMeiNfeLikeFormForDirty(nextForm);
        } catch (error) {
          setEmissionNfseError(error, `Erro ao emitir ${docShort}.`);
        } finally {
          meiEmitInFlightRef.current = false;
        }
      })();
    } catch (error) {
      setEmissionNfseError(error, `Erro ao emitir ${docShort}.`);
      meiEmitInFlightRef.current = false;
      setNfeLikeSubmitting(false);
    }
  }, [
    nfeLikeSubmitting,
    emissionDocumentType,
    nfeLikeForm,
    nfseForm,
    nfEmissionCompanyForm.razaoSocial,
    clearNfseErrorState,
    setEmissionNfseError,
    loadNfseList,
    loadNfseCatalog,
    loadMeiLimiteServidor,
    nfeLikeEmissionLocked
  ]);

  const handleSyncNfse = async (id: string) => {
    const actionKey = `${id}:sync`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const updated = await obterNfse(id, true);
      setNfseList((current) => current.map((item) => (item.id === id ? updated : item)));
      setNfseSuccess('Estado da nota actualizado com sucesso.');
    } catch (error) {
      setOperationNfseError(error, 'Erro ao actualizar o estado da nota.', {
        userFacingMessageOnly: true
      });
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfsePdf = async (record: NfseRecord) => {
    const actionKey = `${record.id}:pdf`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfsePdf(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.pdf`);
      setNfseSuccess('Download do PDF iniciado.');
    } catch (error) {
      setOperationNfseError(error, 'Erro ao baixar PDF da NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfseXml = async (record: NfseRecord) => {
    const actionKey = `${record.id}:xml`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfseXml(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.xml`);
      setNfseSuccess('Download do XML iniciado.');
    } catch (error) {
      setOperationNfseError(error, 'Erro ao baixar XML da NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleToggleReviewNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:update`;
    if (isNfseActionLoading(actionKey)) return;
    const metadata = toNfseMetadata(record.metadata_json);
    const reviewRequested = Boolean(metadata.reviewRequested);
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const updated = await atualizarNfse(record.id, {
        metadata: {
          reviewRequested: !reviewRequested,
          reviewRequestedAt: !reviewRequested ? new Date().toISOString() : null
        }
      });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess(!reviewRequested ? 'NFSe marcada para revisão.' : 'Marcação de revisão removida.');
    } catch (error) {
      setOperationNfseError(error, 'Erro ao atualizar NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleCancelNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:cancel`;
    if (isNfseActionLoading(actionKey)) return;
    if (!window.confirm('Deseja solicitar o cancelamento desta nota fiscal?')) return;

    const reason = window.prompt('Motivo do cancelamento (opcional):', '') || '';
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      await cancelarNfse(record.id, {
        ...(reason.trim() ? { reason: reason.trim() } : {})
      });
      setNfseSuccess('Solicitação de cancelamento processada.');
      /** LIM-MEI-03 / FR-LIM-08: mesmo estado que alimenta o limite — refetch da lista (e do indicador). */
      await Promise.all([loadNfseList(), loadMeiLimiteServidor()]);
    } catch (error) {
      setOperationNfseError(error, 'Erro ao cancelar nota fiscal.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleArchiveNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:archive`;
    if (isNfseActionLoading(actionKey)) return;
    const isArchived = Boolean(record.archived_at);
    if (!window.confirm(isArchived ? 'Deseja desarquivar esta NFSe?' : 'Deseja arquivar esta NFSe?')) return;

    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const updated = await arquivarNfse(record.id, { archived: !isArchived });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      await loadMeiLimiteServidor();
      setNfseSuccess(!isArchived ? 'Nota fiscal arquivada com sucesso.' : 'Nota fiscal desarquivada com sucesso.');
    } catch (error) {
      setOperationNfseError(error, 'Erro ao atualizar arquivamento da nota fiscal.');
    } finally {
      finishNfseAction(actionKey);
    }
  };


  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => currentYear - index);
  }, []);

  const availableMonths = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  ), []);

  const nfsePeriodOptions = useMemo(() => {
    const uniquePeriods = Array.from(new Set(
      nfseList
        .map((item) => toNfsePeriodKey(item.created_at))
        .filter(Boolean)
    ));
    return uniquePeriods.sort().reverse();
  }, [nfseList]);

  const filteredNfseList = useMemo(() => {
    return nfseList.filter((item) => {
      if (nfseDocumentTypeFilter !== 'all') {
        const raw = String(item.document_type || '').trim().toUpperCase();
        const effective = raw || 'NFSE';
        if (effective !== nfseDocumentTypeFilter) {
          return false;
        }
      }
      if (nfseStatusFilter !== 'all' && getNfseStatusKey(item.status) !== nfseStatusFilter) {
        return false;
      }
      if (nfsePeriodFilter !== 'all' && toNfsePeriodKey(item.created_at) !== nfsePeriodFilter) {
        return false;
      }
      return true;
    });
  }, [nfseDocumentTypeFilter, nfseList, nfsePeriodFilter, nfseShowArchived, nfseStatusFilter]);

  const meiLimiteBundle = useMemo(() => {
    const anoCivil = new Date().getFullYear();
    const agregadoServidor =
      meiLimiteServidorReady && meiLimiteServidor !== null ? meiLimiteServidor : undefined;
    return {
      anoCivil,
      progresso: computeMeiLimiteProgresso(nfseList, {
        anoCivil,
        ...(agregadoServidor !== undefined ? { agregadoServidor } : {})
      }),
      vigenciaLabel: getVigenciaLabelParaAno(anoCivil)
    };
  }, [nfseList, meiLimiteServidor, meiLimiteServidorReady]);

  const resetNfseListFilters = useCallback(() => {
    setNfseStatusFilter('all');
    setNfsePeriodFilter('all');
    setNfseDocumentTypeFilter('all');
    setNfseShowArchived(false);
  }, []);

  const clearNfseDocumentTypeFilterOnly = useCallback(() => {
    setNfseDocumentTypeFilter('all');
  }, []);

  const scrollToNfseEmitSection = useCallback(() => {
    document.getElementById('mei-nfse-emit')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, []);

  const nfseWorkspaceGuidance = useMemo(() => {
    const razao = nfEmissionCompanyForm.razaoSocial?.trim();
    if (!razao) {
      return (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Configure o emitente na aba{' '}
          <button
            type="button"
            className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => setActiveWorkspace('das')}
          >
            Certificado e DAS
          </button>
          {' '}ou guarde os dados do emitente na secção &quot;Antes de emitir&quot;.
        </p>
      );
    }
    if (nfseCatalogLoading) {
      return (
        <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
          A atualizar catálogo fiscal…
        </p>
      );
    }
    if (nfseCatalogClientes.length === 0 && nfseCatalogProdutos.length === 0) {
      return (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Cadastre clientes e serviços para usar atalhos, ou preencha o formulário abaixo manualmente. Use os botões de
          gestão na secção &quot;Antes de emitir&quot; para abrir o catálogo.
        </p>
      );
    }
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Use os atalhos na secção &quot;Antes de emitir&quot; ou preencha tomador e serviço para emitir.
      </p>
    );
  }, [
    nfEmissionCompanyForm.razaoSocial,
    nfseCatalogClientes.length,
    nfseCatalogLoading,
    nfseCatalogProdutos.length,
    setActiveWorkspace
  ]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setSolFase2SessionFlagRevalidateTick((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const err = nfEmissionCompanySyncError?.message.trim();
    if (!err || !isPlugnotasEmpresaConsultNotFoundMessage(err)) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setSolFase2SessionFlagRevalidateTick((n) => n + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [nfEmissionCompanySyncError]);

  /** CNPJ alvo para marcador sessionStorage FR-SOL-P1 (paridade com `resolveCnpjParaEmissor`). */
  const cnpjParaSolSessionFlag = useMemo(() => {
    const d = normalizeDoc(contribuinteDoc);
    if (d.length === 14) return d;
    return normalizeDoc(nfseForm.prestadorCpfCnpj || '');
  }, [contribuinteDoc, nfseForm.prestadorCpfCnpj]);

  /** FR-SOL-P0/P1: estado UX encadeamento POST → GET "não encontrado"; L2 via sessionStorage após reload. */
  const plugnotasCadastroSolUxState = useMemo(() => {
    const sessionPostFailedFlag =
      cnpjParaSolSessionFlag.length === 14 &&
      isGuiaMeiEmpresaFase2FailFlagActive(userId, cnpjParaSolSessionFlag);
    const err = nfEmissionCompanySyncError?.message.trim();
    if (!err || !isPlugnotasEmpresaConsultNotFoundMessage(err)) {
      return resolvePlugnotasEmpresaCadastroSolUxState({
        lastPostEmpresaPhase2Ok: plugnotasEmpresaFase2PostOk,
        lastGetEmpresaNotFound: false,
        postErrorPanelVisible: false,
        sessionPostFailedFlag: false
      });
    }
    return resolvePlugnotasEmpresaCadastroSolUxState({
      lastPostEmpresaPhase2Ok: plugnotasEmpresaFase2PostOk,
      lastGetEmpresaNotFound: true,
      postErrorPanelVisible: Boolean(plugnotasPendingRetry),
      sessionPostFailedFlag
    });
  }, [
    cnpjParaSolSessionFlag,
    nfEmissionCompanySyncError,
    plugnotasPendingRetry,
    plugnotasEmpresaFase2PostOk,
    solFase2SessionFlagRevalidateTick,
    userId
  ]);

  const plugnotasEmpresaLastGetCoherent = useMemo(() => {
    const err = nfEmissionCompanySyncError?.message.trim();
    if (!err) return true;
    return !isPlugnotasEmpresaConsultNotFoundMessage(err);
  }, [nfEmissionCompanySyncError]);

  const plugnotasEmpresaP0Overlay = useMemo(
    () =>
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: meiPlugnotasEmpresaBlockedExternally,
        lastPostEmpresaPhase2Ok: plugnotasEmpresaFase2PostOk,
        lastGetEmpresaHasData: plugnotasEmpresaLastGetCoherent,
        postErrorPanelVisible: Boolean(plugnotasPendingRetry && !certificateConnectivityAlert)
      }),
    [
      meiPlugnotasEmpresaBlockedExternally,
      plugnotasEmpresaFase2PostOk,
      plugnotasEmpresaLastGetCoherent,
      plugnotasPendingRetry,
      certificateConnectivityAlert
    ]
  );

  useEffect(() => {
    setPlugnotasP0L1ImposibilidadeDismissed(false);
  }, [plugnotasEmpresaRetryDetail]);

  useEffect(() => {
    if (!plugnotasPendingRetry) {
      setPlugnotasP0L1ImposibilidadeDismissed(false);
    }
  }, [plugnotasPendingRetry]);

  useEffect(() => {
    if (plugnotasEmpresaFase2PostOk !== true) {
      plugnotasP0OverlayPrevKindRef.current = '';
      setPlugnotasP0L2PhaseSuccessVisible(false);
      return;
    }
    const k = plugnotasEmpresaP0Overlay.kind;
    if (k === 'phaseSuccess' && plugnotasP0OverlayPrevKindRef.current !== 'phaseSuccess') {
      setPlugnotasP0L2PhaseSuccessVisible(true);
    }
    plugnotasP0OverlayPrevKindRef.current = k;
  }, [plugnotasEmpresaFase2PostOk, plugnotasEmpresaP0Overlay.kind]);

  useEffect(() => {
    if (!plugnotasP0L2PhaseSuccessVisible) return undefined;
    const id = window.setTimeout(() => setPlugnotasP0L2PhaseSuccessVisible(false), 6000);
    return () => window.clearTimeout(id);
  }, [plugnotasP0L2PhaseSuccessVisible]);

  /** FR-NFSE-UX-P2 §7: pilha de feedback abaixo do botão Emitir — (1) bloqueio certificado/emitente. */
  const nfseEmitFeedbackTier1 = useMemo(() => {
    const nodes: ReactNode[] = [];
    if (certificateConnectivityAlert) {
      nodes.push(<GuiaMeiCertificateConnectivityPanel key="nfse-fb-connectivity" />);
    }
    if (certificateError) {
      nodes.push(
        <GuiaMeiEmpresaCadastroErrorPanel
          key="nfse-fb-cert"
          message={certificateError}
          fiscalErrorCode={certificateErrorFiscalCode}
          fiscalHttpStatus={certificateErrorHttpStatus}
        />
      );
    }
    if (nfEmissionCompanySyncError) {
      nodes.push(
        <div key="nfse-fb-sync" className="space-y-2 text-xs">
          <GuiaMeiEmpresaCadastroErrorPanel
            message={nfEmissionCompanySyncError.message}
            fiscalApiErrorCode={nfEmissionCompanySyncError.apiErrorCode}
            fiscalErrorCode={nfEmissionCompanySyncError.plugnotasCode}
            fiscalHttpStatus={nfEmissionCompanySyncError.httpStatus}
            plugnotasRequest={nfEmissionCompanySyncError.plugnotasRequest}
          />
          <PlugnotasEmpresaCadastroSolContextPanel
            state={plugnotasCadastroSolUxState}
            compact
            showPlaybook={false}
          />
        </div>
      );
    }
    if (!hasUserCertificate) {
      nodes.push(
        <div key="nfse-fb-no-cert" className="admin-alert-danger space-y-1 text-sm" role="alert">
          <p className="font-semibold">Certificado necessário para emitir NFSe</p>
          <p className="text-xs leading-relaxed">
            A emissão pelo emissor fiscal exige certificado digital A1. Envie o certificado na aba{' '}
            <button
              type="button"
              className="font-medium text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setActiveWorkspace('das')}
            >
              Certificado e DAS
            </button>
            .
          </p>
        </div>
      );
    }
    if (!nfEmissionCompanyForm.razaoSocial?.trim()) {
      nodes.push(
        <div key="nfse-fb-no-emitente" className="admin-alert-warning text-sm" role="status">
          <p className="font-semibold">Emitente não configurado</p>
          <p className="mt-1 text-xs leading-relaxed">
            Guarde os dados do emitente na secção «Antes de emitir» ou configure na aba Certificado e DAS antes de
            enviar a nota.
          </p>
        </div>
      );
    }
    if (nfseEmitentePendingApply && canViewNfse) {
      nodes.push(
        <div key="nfse-fb-pending-emitente" className="admin-alert-warning space-y-2">
          <p className="text-sm leading-relaxed">
            Os dados guardados nesta aplicação <strong>não</strong> alteram automaticamente o formulário de emissão de
            NFS-e (para não substituir valores que você já tenha editado).
          </p>
          <button
            type="button"
            className="planner-button-secondary-compact"
            onClick={() => {
              const snap = nfseEmitentePendingApply;
              if (!snap) return;
              setNfseForm((current) => replacePrestadorFromEmitenteSnapshot(current, snap));
              setNfseEmitentePendingApply(null);
            }}
          >
            Aplicar dados guardados ao formulário NFS-e
          </button>
        </div>
      );
    }
    if (nodes.length === 0) return null;
    return (
      <div className="space-y-3" data-nfse-feedback-tier="critical">
        {nodes}
      </div>
    );
  }, [
    canViewNfse,
    certificateConnectivityAlert,
    certificateError,
    certificateErrorFiscalCode,
    certificateErrorHttpStatus,
    hasUserCertificate,
    nfEmissionCompanyForm.razaoSocial,
    nfEmissionCompanySyncError,
    nfseEmitentePendingApply,
    plugnotasCadastroSolUxState,
    setActiveWorkspace
  ]);

  const dasPendentesCount = useMemo(
    () => meiPeriods.filter((period) => period.status !== 'pago').length,
    [meiPeriods]
  );

  const certificateScopeLabel = useMemo(() => {
    if (hasUserCertificate) return 'Certificado';
    if (hasServerCertificate) return 'Certificado do servidor';
    return 'Sem certificado ativo';
  }, [hasServerCertificate, hasUserCertificate]);

  const workspaceTabs = useMemo(() => {
    const tabs: Array<{
      id: GuidesMeiWorkspace;
      label: string;
      description: string;
      badge: string;
    }> = [
      {
        id: 'overview',
        label: 'Visão geral',
        description: 'Resumo e atalhos rápidos',
        badge: 'Resumo no topo'
      },
      {
        id: 'das',
        label: 'Certificado e DAS',
        description: 'Configuração e geração de guias',
        badge: dasPendentesCount > 0 ? 'Há pendências' : 'Em dia'
      }
    ];

    if (canViewNfse) {
      tabs.push({
        id: 'nfse',
        label: 'Emissão fiscal',
        description: 'NFS-e, NF-e e NFC-e: emitir e acompanhar',
        badge: 'Emitir e filtrar'
      });
    }

    tabs.push({
      id: 'parcelamentos',
      label: 'Parcelamentos',
      description: 'Consulta de pedidos de parcelamento',
      badge: parcelamentosList.length > 0 ? `${parcelamentosList.length} pedidos` : 'Consulta SERPRO'
    });

    return tabs;
  }, [canViewNfse, dasPendentesCount, parcelamentosList.length]);

  const handleDownloadClick = async () => {
    if (isDownloadingGuide) return;
    if (!normalizedContribuinte) {
      setPeriodError('Informe o CNPJ do MEI para baixar a guia.');
      return;
    }
    if (normalizedContribuinte.length !== 14) {
      setPeriodError('CNPJ do MEI deve ter 14 dígitos.');
      return;
    }
    setPeriodError(null);
    const competencia = formatCompetencia(selectedMonth, selectedYear);
    const periodoApuracao = toPeriodoApuracao(selectedMonth, selectedYear);
    setIsDownloadingGuide(true);
    try {
      await handleDownload(periodoApuracao, competencia);
    } catch (error) {
      setPeriodError(error instanceof Error ? error.message : 'Erro ao baixar guia.');
    } finally {
      setIsDownloadingGuide(false);
    }
  };

  const emissionFeedbackDocumentLabel = useMemo(() => {
    if (emissionDocumentType === 'NFSE') return GUIA_MEI_NFSE_DOCUMENT_LABEL;
    if (emissionDocumentType === 'NFE') return 'NF-e';
    return 'NFC-e';
  }, [emissionDocumentType]);

  const nfeLikeFirstValidationError = useMemo(() => {
    const keys = Object.keys(nfeLikeFieldErrors);
    if (!keys.length) return null;
    return nfeLikeFieldErrors[keys[0]!];
  }, [nfeLikeFieldErrors]);

  const dadosMinimosEmitenteTitle = useMemo(
    () => getTituloBlocoDadosMinimosEmitente(documentosAtivos),
    [documentosAtivos]
  );

  const dadosMinimosEmitenteHint = useMemo(
    () => getHintBlocoDadosMinimosEmitente(documentosAtivos),
    [documentosAtivos]
  );

  const showCadastroNfeNfceInfoBanner = useMemo(
    () => shouldShowCadastroNfeNfceInfoBanner(documentosAtivos),
    [documentosAtivos]
  );

  const cadastroFiscalDocHref = useMemo(() => getGuiaMeiCadastroFiscalDocHref(), []);
  const nfseNacionalOperacaoHelpHref = useMemo(() => getNfseNacionalOperacaoHelpHref(), []);
  const plugnotasRetryMunicipalOperacaoHint = useMemo(
    () =>
      !showPrefeituraPortalCredentialsBlock
      && (
        plugnotasRetryBlockedByScenario
        || Boolean(
          plugnotasEmpresaRetryDetail &&
            isPlugnotasEmpresaMunicipalRequirementMessage(plugnotasEmpresaRetryDetail)
        )
      ),
    [
      showPrefeituraPortalCredentialsBlock,
      plugnotasRetryBlockedByScenario,
      plugnotasEmpresaRetryDetail
    ]
  );
  const plugnotasRetryEmpresaUxVariant = useMemo(
    () =>
      plugnotasRetryScenario === 'prefeitura_login_required_blocked'
        ? 'prefeitura-login-required'
        : plugnotasEmpresaRetryDetail
          ? getPlugnotasEmpresaCadastroErrorUxVariant(plugnotasEmpresaRetryDetail)
          : 'generic',
    [plugnotasRetryScenario, plugnotasEmpresaRetryDetail]
  );

  const showRequisitosNfeNfcePlaceholder = useMemo(
    () => shouldShowRequisitosNfeNfceSecao(documentosAtivos),
    [documentosAtivos]
  );

  return (
    <>
      <GuiaMeiDesativarNfseDialog
        open={nfseDesativarDialogOpen}
        onCancel={() => setNfseDesativarDialogOpen(false)}
        onConfirm={confirmDesativarNfse}
      />
      <MeiFiscalChangeEmissionTypeDialog
        open={emissionTypeChangeDialogOpen}
        onCancel={handleCancelEmissionTypeDialog}
        onConfirm={handleConfirmEmissionTypeChange}
      />
      <MeiFiscalModalidadesActivationWizard
        open={d2ModalidadesWizardOpen}
        onClose={() => setD2ModalidadesWizardOpen(false)}
        cnpjDigits={cnpjParaFiscalCapability}
        target={emissionDocumentType === 'NFCE' ? 'NFCE' : 'NFE'}
        onSuccess={() => {
          invalidateMeiEmpresaGetCache(userId, cnpjParaFiscalCapability);
          bumpFiscalCapabilityRefetchIfApplicable();
        }}
      />
      <div className="admin-page-shell">
        <section className="admin-hero">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="admin-hero-title">Mei Infinito</h1>
              <p className="admin-hero-subtitle">
                {canViewNfse
                  ? 'Gerencie certificado, DAS e emissão de notas fiscais (NFS-e, NF-e e NFC-e) no mesmo fluxo.'
                  : 'Gerencie certificado e DAS no mesmo fluxo.'}
              </p>
              {canViewNfse ? (
                <div className="mt-2 max-w-xl">
                  <MeiNfseCatalogManageActions
                    inRouter={inRouter}
                    showHint={false}
                    clienteLabel="Catálogo de clientes (NFS-e)"
                    produtoLabel="Serviços e produtos (NFS-e)"
                  />
                </div>
              ) : null}
              {hasServerCertificate && !hasUserCertificate ? (
                <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                  Autenticação via certificado do servidor. Para enviar ou substituir pelo seu certificado A1, abra{' '}
                  <button
                    type="button"
                    className="font-medium text-blue-600 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-400/80 dark:hover:text-blue-300"
                    onClick={() => setActiveWorkspace('das')}
                  >
                    Certificado e DAS
                  </button>
                  .
                </p>
              ) : null}
            </div>
            <span
              className={
                hasUserCertificate
                  ? 'admin-badge-success'
                  : hasServerCertificate
                    ? 'admin-badge-primary'
                    : 'admin-badge-warning'
              }
            >
              {certificateScopeLabel}
            </span>
          </div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Períodos DAS</p>
              <p className="admin-stat-value">{meiPeriods.length}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Pendências DAS</p>
              <p className="admin-stat-value">{dasPendentesCount}</p>
            </div>
            {canViewNfse ? (
              <div className="admin-stat-card">
                <p className="admin-stat-label">Notas exibidas</p>
                <p className="admin-stat-value">{filteredNfseList.length}</p>
              </div>
            ) : null}
            <div className="admin-stat-card">
              <p className="admin-stat-label">Status do certificado</p>
              <p className="admin-stat-value text-base md:text-lg">{certificateScopeLabel}</p>
              {hasUserCertificate && (certValidFrom || certValidTo) && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {certValidFrom && certValidTo
                    ? `Válido de ${new Date(certValidFrom).toLocaleDateString('pt-BR')} até ${new Date(certValidTo).toLocaleDateString('pt-BR')}`
                    : certValidTo
                      ? `Válido até ${new Date(certValidTo).toLocaleDateString('pt-BR')}`
                      : null}
                </p>
              )}
            </div>
          </div>
          {dasPendentesCount > 0 ? (
            <p className="mt-3 max-w-2xl text-sm text-amber-800 dark:text-amber-100/95">
              Há períodos DAS em aberto — abra{' '}
              <button
                type="button"
                className="font-medium underline decoration-amber-800/70 underline-offset-2 hover:text-amber-900 dark:decoration-amber-200/70 dark:hover:text-amber-50"
                onClick={() => setActiveWorkspace('das')}
              >
                Certificado e DAS
              </button>{' '}
              para gerar ou regularizar.
            </p>
          ) : null}
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Fluxo do MEI</h2>
              <p className="admin-section-subtitle">
                Os números principais estão no resumo acima. Escolha uma área abaixo para ir direto à etapa.
              </p>
            </div>
          </div>
          <div className="admin-toolbar space-y-3">
            <div
              className={`grid gap-2 ${canViewNfse ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
              role="tablist"
              aria-label="Fluxo do MEI"
            >
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  id={`mei-tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeWorkspace === tab.id}
                  aria-controls={activeWorkspace === tab.id ? `mei-panel-${tab.id}` : undefined}
                  onClick={() => setActiveWorkspace(tab.id)}
                  className={`mei-fluxo-tab planner-tab h-full w-full items-start justify-between rounded-xl px-4 py-3 text-left ${
                    activeWorkspace === tab.id ? 'planner-tab-active mei-fluxo-tab-active' : ''
                  }`}
                >
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-sm font-semibold">{tab.label}</span>
                    <span className="text-xs opacity-90">{tab.description}</span>
                  </span>
                  <span className="text-xs font-medium opacity-90">{tab.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeWorkspace === 'overview' ? (
          <section
            className="admin-section-card"
            role="tabpanel"
            id="mei-panel-overview"
            aria-labelledby="mei-tab-overview"
          >
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Visão geral operacional</h2>
                <p className="admin-section-subtitle">
                  {canViewNfse
                    ? 'Atalhos para cada etapa (certificado, DAS, NFS-e, parcelamentos) com menos rolagem.'
                    : 'Atalhos para cada etapa (certificado, DAS e parcelamentos) com menos rolagem.'}
                </p>
              </div>
            </div>
            {canViewNfse ? (
              <div id="mei-limite-faturamento-anchor" className="scroll-mt-4">
                <MeiLimiteFaturamentoBlock
                  anoCivil={meiLimiteBundle.anoCivil}
                  progresso={meiLimiteBundle.progresso}
                  vigenciaLabel={meiLimiteBundle.vigenciaLabel}
                  loading={nfseLoading || meiLimiteServidorLoading}
                  errorMessage={
                    nfseError && nfseErrorKind === 'operation'
                      ? nfseErrorSummaryLine(
                        nfseError.rawMessage,
                        nfseError.plugnotasCode,
                        nfseError.httpStatus,
                        nfseError.plugnotasRequest
                      )
                      : null
                  }
                  canViewNfse
                  onIrParaNfse={() => setActiveWorkspace('nfse')}
                />
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="admin-toolbar flex flex-col gap-3 text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Certificado e DAS</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Configure certificado, valide CNPJ e gere o DAS do período.
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {hasServerCertificate && !hasUserCertificate
                      ? 'Você está usando o certificado do servidor; envie o seu A1 nesta etapa, se precisar.'
                      : hasUserCertificate
                        ? 'Certificado A1 ativo nesta sessão para operações que exigem o seu arquivo.'
                        : 'Sem certificado A1 na sessão: ainda é possível informar CNPJ e gerar DAS conforme o fluxo.'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={hasUserCertificate ? 'admin-badge-success' : 'admin-badge-warning'}>
                      {hasUserCertificate ? 'Certificado em uso' : 'Certificado pendente'}
                    </span>
                    <span className={dasPendentesCount > 0 ? 'admin-badge-warning' : 'admin-badge-success'}>
                      {dasPendentesCount > 0 ? 'Há DAS em aberto' : 'DAS em dia'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="planner-button-secondary w-full self-stretch sm:w-auto sm:self-start"
                  onClick={() => setActiveWorkspace('das')}
                >
                  Abrir Certificado e DAS
                </button>
              </div>

              {canViewNfse ? (
                <div className="admin-toolbar flex flex-col gap-3 text-left">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">NFS-e</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Emita e acompanhe notas de serviço (NFS-e) com integração fiscal.
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {nfseList.length === 0
                        ? 'Nenhuma NFS-e registrada ainda. Após emitir, as notas aparecem aqui e no resumo acima.'
                        : filteredNfseList.length === 0
                          ? 'Nenhuma nota corresponde aos filtros ativos na guia NFS-e. Ajuste os filtros ou emita uma nova nota.'
                          : 'Use a guia NFS-e para emitir, baixar XML/PDF e filtrar por status ou período.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="admin-badge-neutral">Lista e emissão</span>
                      <span className="admin-badge-neutral">Integração fiscal</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="planner-button-secondary w-full self-stretch sm:w-auto sm:self-start"
                      onClick={() => setActiveWorkspace('nfse')}
                    >
                      Abrir NFS-e
                    </button>
                    <button
                      type="button"
                      className="planner-button w-full self-stretch sm:w-auto sm:self-start"
                      onClick={openRpsConfig}
                    >
                      Configurar série RPS
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="admin-toolbar flex flex-col gap-3 text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Parcelamentos</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Consulte pedidos de parcelamento do MEI via SERPRO.
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {parcelamentosList.length === 0
                      ? 'Nenhum pedido listado ainda. Abra a área para consultar na SERPRO.'
                      : 'Pedidos já carregados. O total aparece no separador Parcelamentos; abra a área para detalhes e SERPRO.'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="admin-badge-neutral">
                      {parcelamentosList.length > 0 ? 'Pedidos disponíveis' : 'Consulta SERPRO'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="planner-button-secondary w-full self-stretch sm:w-auto sm:self-start"
                  onClick={() => setActiveWorkspace('parcelamentos')}
                >
                  Abrir Parcelamentos
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeWorkspace === 'das' ? (
          <div
            className="space-y-4 md:space-y-6"
            role="tabpanel"
            id="mei-panel-das"
            aria-labelledby="mei-tab-das"
          >
            <section className="admin-section-card">
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setActiveWorkspace('overview')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Voltar ao Mei Infinito
            </button>
          </div>
          <div className="admin-section-header">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="admin-section-title">Certificado digital</h2>
              <DevApiHealthIndicator />
            </div>
          </div>

          {hasUserCertificate && (
            <div className="admin-alert-success">
              Certificado em uso. Ele permanece ativo até você removê-lo ou o servidor ser reiniciado.
            </div>
          )}

          {certificateConnectivityAlert ? <GuiaMeiCertificateConnectivityPanel /> : null}
          {certificateError ? (
            <GuiaMeiEmpresaCadastroErrorPanel
              message={certificateError}
              fiscalErrorCode={certificateErrorFiscalCode}
              fiscalHttpStatus={certificateErrorHttpStatus}
            />
          ) : null}

          {plugnotasPendingRetry && !certificateConnectivityAlert ? (
            <div
              ref={plugnotasEmpresaRetryRef}
              role="alert"
              tabIndex={-1}
              className="space-y-2 rounded-lg border border-amber-200/90 bg-amber-50/90 p-3 text-sm leading-relaxed dark:border-amber-900/50 dark:bg-amber-950/30"
            >
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                Não foi possível concluir o registro da empresa
              </p>
              <p className="text-amber-950/95 dark:text-amber-100/90">
                {plugnotasRetryActionAvailable
                  ? 'O certificado pode já ter sido enviado ao emissor fiscal. Os dados do emitente não foram concluídos. Você pode tentar registrar a empresa novamente sem enviar o arquivo outra vez.'
                  : 'O certificado pode já ter sido enviado ao emissor fiscal. Os dados do emitente não foram concluídos. Neste cenário, revise os dados do emitente e siga o guia de operação fiscal antes de insistir no cadastro automático.'}
              </p>
              {plugnotasEmpresaRetryDetail ? (
                <p className="text-amber-900 dark:text-amber-200/95">{plugnotasEmpresaRetryDetail}</p>
              ) : null}
              {plugnotasRetryMunicipalOperacaoHint ? (
                plugnotasRetryEmpresaUxVariant === 'prefeitura-login-required' ? (
                  <div
                    role="region"
                    aria-label="Acesso ao portal da prefeitura no NFS-e"
                    className="text-xs text-amber-950/95 dark:text-amber-100/90"
                  >
                    <p className="mb-1 font-semibold text-amber-950 dark:text-amber-50">
                      <PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle />
                    </p>
                    <p className="leading-snug">
                      <PlugnotasPrefeituraLoginRequiredNfseOperacaoBody />
                    </p>
                  </div>
                ) : plugnotasRetryEmpresaUxVariant === 'prefeitura-config' ? (
                  <div
                    role="region"
                    aria-label="Configuração de prefeitura no NFS-e"
                    className="text-xs text-amber-950/95 dark:text-amber-100/90"
                  >
                    <p className="mb-1 font-semibold text-amber-950 dark:text-amber-50">
                      <PlugnotasPrefeituraConfigNfseOperacaoTitle />
                    </p>
                    <p className="leading-snug">
                      <PlugnotasPrefeituraConfigNfseOperacaoBody />
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-950/95 dark:text-amber-100/90">
                    <PlugnotasMunicipalRequirementOperacaoBody />
                  </p>
                )
              ) : null}
              {plugnotasEmpresaP0Overlay.kind === 'impossibility' &&
              !plugnotasP0L1ImposibilidadeDismissed ? (
                <div
                  role="region"
                  aria-label={PLUGNOTAS_P0_L1_ARIA_LABEL}
                  className="space-y-2 rounded-md border border-amber-300/70 bg-amber-100/40 p-3 dark:border-amber-800/60 dark:bg-amber-950/40"
                >
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                    {PLUGNOTAS_P0_L1_TITLE}
                  </p>
                  {PLUGNOTAS_P0_L1_BODY_PARAS.map((para) => (
                    <p
                      key={para.slice(0, 24)}
                      className="text-xs leading-relaxed text-amber-950/95 dark:text-amber-100/90"
                    >
                      {para}
                    </p>
                  ))}
                  <p className="text-xs">
                    <a
                      href={nfseNacionalOperacaoHelpHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-amber-900 underline decoration-amber-800/60 underline-offset-2 hover:text-amber-950 dark:text-amber-200/95 dark:decoration-amber-300/50 dark:hover:text-amber-100"
                    >
                      Ver guia de operação fiscal
                    </a>
                  </p>
                  <button
                    type="button"
                    className="planner-button-secondary-compact"
                    onClick={() => setPlugnotasP0L1ImposibilidadeDismissed(true)}
                  >
                    Entendi
                  </button>
                </div>
              ) : null}
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Se o problema continuar, verifique se o CNPJ e o ambiente (sandbox ou produção) coincidem com o painel do emissor ou fale com o suporte.
              </p>
              <button
                type="button"
                className="planner-button-secondary-compact"
                onClick={() => {
                  document.getElementById('mei-emitente-dados-minimos')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                  window.setTimeout(() => {
                    document.getElementById('mei-emitente-razao-social')?.focus();
                  }, 300);
                }}
              >
                Editar dados
              </button>
              <p className="text-xs">
                <a
                  href={
                    plugnotasRetryMunicipalOperacaoHint ? nfseNacionalOperacaoHelpHref : cadastroFiscalDocHref
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-amber-900 underline decoration-amber-800/60 underline-offset-2 hover:text-amber-950 dark:text-amber-200/95 dark:decoration-amber-300/50 dark:hover:text-amber-100"
                >
                  Ver guia de operação fiscal
                </a>
              </p>
            </div>
          ) : null}

          {certificateSuccess ? (
            <div className="admin-alert-success space-y-1">
              <p>{certificateSuccess.primary}</p>
              {certificateSuccess.secondary ? (
                <p className="text-sm opacity-90">{certificateSuccess.secondary}</p>
              ) : null}
            </div>
          ) : null}

          {plugnotasP0L2PhaseSuccessVisible ? (
            <p
              className="rounded-md border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100/95"
              role="status"
            >
              {PLUGNOTAS_P0_L2_STATUS_MESSAGE}
            </p>
          ) : null}

          {nfEmissionCompanySyncError ? (
            <>
              <GuiaMeiEmpresaCadastroErrorPanel
                message={nfEmissionCompanySyncError.message}
                fiscalApiErrorCode={nfEmissionCompanySyncError.apiErrorCode}
                fiscalErrorCode={nfEmissionCompanySyncError.plugnotasCode}
                fiscalHttpStatus={nfEmissionCompanySyncError.httpStatus}
                plugnotasRequest={nfEmissionCompanySyncError.plugnotasRequest}
              />
              <PlugnotasEmpresaCadastroSolContextPanel state={plugnotasCadastroSolUxState} showPlaybook />
            </>
          ) : null}

          {nfEmissionCompanySyncSuccess && (
            <div className="admin-alert-success">
              {nfEmissionCompanySyncSuccess}
            </div>
          )}

          {nfseEmitentePendingApply && canViewNfse ? (
            <div className="admin-alert-warning space-y-2">
              <p className="text-sm leading-relaxed">
                Os dados guardados nesta aplicação <strong>não</strong> alteram automaticamente o formulário de emissão de
                NFS-e (para não substituir valores que você já tenha editado no separador NFS-e).
              </p>
              <button
                type="button"
                className="planner-button-secondary-compact"
                onClick={() => {
                  const snap = nfseEmitentePendingApply;
                  if (!snap) return;
                  setNfseForm((current) => replacePrestadorFromEmitenteSnapshot(current, snap));
                  setNfseEmitentePendingApply(null);
                }}
              >
                Aplicar dados guardados ao formulário NFS-e
              </button>
            </div>
          ) : null}

          {validationSuccess && (
            <div className="admin-alert-success">
              {validationSuccess}
            </div>
          )}

          {validationError?.variant === 'cons-c' ? (
            <div
              role="region"
              aria-labelledby={meiGuideValidateConsCTitleId}
              className="admin-alert-warning space-y-2"
              data-cons-trigger="serpro-validate"
            >
              <p id={meiGuideValidateConsCTitleId} className="text-sm font-semibold">
                {validationError.title}
              </p>
              <p className="text-sm leading-relaxed">{validationError.body}</p>
              {validationError.rawDetail ? (
                <details className="text-xs text-slate-600 dark:text-slate-400">
                  <summary className="cursor-pointer select-none">Detalhe técnico</summary>
                  <p className="mt-1 whitespace-pre-wrap">{validationError.rawDetail}</p>
                </details>
              ) : null}
            </div>
          ) : validationError?.variant === 'plain' ? (
            <div className="admin-alert-danger" role="alert">
              {validationError.message}
            </div>
          ) : null}

          <div className="admin-toolbar grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">CNPJ do MEI</label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={contribuinteDoc}
                onChange={(event) => setContribuinteDoc(formatDocument(event.target.value))}
                onBlur={handleCnpjMeiBlur}
                placeholder="00.000.000/0001-00"
              />
              {isValidating ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Validando CNPJ...</p>
              ) : null}
              {brasilApiLoading ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buscando dados da empresa...</p>
              ) : null}
              {brasilApiError ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{brasilApiError}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-[1fr_220px]">
                <input
                  className="planner-input-compact"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(event) => {
                    setCertificateConnectivityAlert(false);
                    setCertificateError(null);
                    setCertificateErrorFiscalCode(null);
                    setCertificateErrorHttpStatus(null);
                    setPlugnotasPendingRetry(null);
                    setPlugnotasEmpresaRetryDetail(null);
                    setPlugnotasEmpresaRetryMeta(null);
                    setPlugnotasEmpresaFase2PostOk(null);
                    setCertificateFile(event.target.files?.[0] || null);
                  }}
                />
                <input
                  className="planner-input-compact"
                  type="password"
                  value={certificatePassword}
                  onChange={(event) => {
                    setCertificateConnectivityAlert(false);
                    setCertificateError(null);
                    setCertificateErrorFiscalCode(null);
                    setCertificateErrorHttpStatus(null);
                    setPlugnotasPendingRetry(null);
                    setPlugnotasEmpresaRetryDetail(null);
                    setPlugnotasEmpresaRetryMeta(null);
                    setPlugnotasEmpresaFase2PostOk(null);
                    setCertificatePassword(event.target.value);
                  }}
                  placeholder="Senha do certificado"
                />
              </div>

              {canViewNfse ? (
                <div className="space-y-3">
                  <fieldset
                    className="rounded-xl border ui-border-section bg-white/70 p-3 dark:bg-slate-950/30"
                    aria-busy={documentosAtivosHydrating}
                    aria-describedby={
                      [
                        documentosAtivosSubmitError ? 'mei-doc-ativos-erro' : '',
                        documentosAtivosHydrationError ? 'mei-doc-ativos-hidratacao' : ''
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  >
                    <legend className="mb-2 w-full text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {TITULO_SECAO_DOCUMENTOS_ATIVOS_EMISSOR}
                    </legend>
                    <p className="admin-field-hint mb-2">
                      {SUBTITULO_OPCIONAL_ALTERAR_DEPOIS_DOCUMENTOS_ATIVOS}
                    </p>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{SUBTITULO_SECAO_DOCUMENTOS_ATIVOS_DESCOBERTA}</p>
                    {showDocumentosAtivosDivergenceBanner ? (
                      <div
                        role="region"
                        aria-label={ARIA_LABEL_REGIAO_DIVERGENCIA_DOCUMENTOS_ATIVOS}
                        className="mb-3 flex flex-col gap-3 rounded-lg border border-amber-200/90 bg-amber-50/90 p-3 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100/95">
                          {MSG_BANNER_DIVERGENCIA_DOCUMENTOS_ATIVOS}
                        </p>
                        <div className="flex flex-shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            className="planner-button-secondary-compact"
                            onClick={handleDocumentosAtivosAtualizarVista}
                            disabled={documentosAtivosHydrating}
                          >
                            {CTA_ATUALIZAR_VISTA_DOCUMENTOS_ATIVOS}
                          </button>
                          <button
                            type="button"
                            className="planner-button-secondary-compact"
                            onClick={() => {
                              void handleDocumentosAtivosSincronizarPlugnotas();
                            }}
                            disabled={
                              documentosAtivosHydrating || nfEmissionCompanySyncLoading === 'consult'
                            }
                          >
                            {nfEmissionCompanySyncLoading === 'consult'
                              ? 'Sincronizando...'
                              : CTA_SINCRONIZAR_EMISSOR_DOCUMENTOS_ATIVOS}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {documentosAtivosHydrationError ? (
                      <p
                        id="mei-doc-ativos-hidratacao"
                        className="mb-3 text-sm text-amber-700 dark:text-amber-300/90"
                        aria-live="polite"
                      >
                        {documentosAtivosHydrationError}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-x-6">
                      <label className="flex max-w-md cursor-pointer items-start gap-2">
                        <input
                          ref={documentosAtivosNfseCheckboxRef}
                          type="checkbox"
                          className="mt-0.5"
                          disabled={documentosAtivosHydrating}
                          checked={documentosAtivos.nfse}
                          onChange={(e) => handleDocumentosAtivosChange('nfse', e.target.checked)}
                        />
                        <span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">NFS-e</span>
                          <span className="text-slate-600 dark:text-slate-300"> (nota de serviço)</span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Serviços prestados; padrão para MEI na área de emissão da app.
                          </span>
                        </span>
                      </label>
                      <label className="flex max-w-md cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          disabled={documentosAtivosHydrating}
                          checked={documentosAtivos.nfe}
                          onChange={(e) => handleDocumentosAtivosChange('nfe', e.target.checked)}
                        />
                        <span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">NF-e</span>
                          <span className="text-slate-600 dark:text-slate-300"> (modelo 55, produto)</span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Produtos e operações que exigem NF-e (modelo 55).
                          </span>
                        </span>
                      </label>
                      <label className="flex max-w-md cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          disabled={documentosAtivosHydrating}
                          checked={documentosAtivos.nfce}
                          onChange={(e) => handleDocumentosAtivosChange('nfce', e.target.checked)}
                        />
                        <span>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">NFC-e</span>
                          <span className="text-slate-600 dark:text-slate-300"> (venda ao consumidor)</span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Venda presencial ou ao consumidor final com NFC-e.
                          </span>
                        </span>
                      </label>
                    </div>
                    {documentosAtivosSubmitError ? (
                      <p
                        id="mei-doc-ativos-erro"
                        role="alert"
                        className="mt-3 text-sm text-red-600 dark:text-red-400"
                      >
                        {documentosAtivosSubmitError}
                      </p>
                    ) : null}
                  </fieldset>

                  {showCadastroNfeNfceInfoBanner ? (
                    <MeiCadastroNfeNfceInfoBanner docHref={cadastroFiscalDocHref} />
                  ) : null}

                  {documentosAtivosConsultWarning ? (
                    <div className="admin-alert-warning text-sm leading-relaxed">{documentosAtivosConsultWarning}</div>
                  ) : null}

                  <div
                    id="mei-emitente-dados-minimos"
                    className="rounded-xl border ui-border-section bg-white/70 p-3 dark:bg-slate-950/30"
                  >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {dadosMinimosEmitenteTitle}
                  </p>
                  <p className="admin-field-hint mb-2">
                    {dadosMinimosEmitenteHint}
                  </p>
                  <MeiRpsNumeracaoPanel
                    id="mei-rps-config-emitente"
                    variant="nfse-workspace"
                    rpsLote={nfEmissionCompanyForm.rpsLote}
                    rpsNumero={nfEmissionCompanyForm.rpsNumero}
                    rpsSerie={nfEmissionCompanyForm.rpsSerie}
                    onChange={updateNfEmissionCompanyForm}
                    showSaveAction
                    onSave={handleSalvarDadosEmitente}
                    saveLoading={nfEmissionCompanySyncLoading === 'patch'}
                    saveLabel="Salvar série RPS no emissor"
                  />
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    Também disponível no topo da aba{' '}
                    <button
                      type="button"
                      className="font-medium text-violet-700 underline decoration-violet-700/70 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:decoration-violet-300/70"
                      onClick={openRpsConfig}
                    >
                      Emissão fiscal
                    </button>
                    .
                  </p>
                  {!showPrefeituraPortalCredentialsBlock ? (
                    <div
                      role="note"
                      aria-label="NFS-e Nacional como padrão"
                      className="mb-3 rounded-lg border border-sky-200/80 bg-sky-50/80 p-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-100"
                    >
                      <p className="font-semibold">NFS-e Nacional é o padrão desta jornada.</p>
                      <p className="mt-1">
                        Preencha os dados do emitente e tente o cadastro nacional primeiro. Se o emissor indicar portal da
                        prefeitura e o caso estiver elegível para continuar nesta jornada, abrimos o segundo passo com login e
                        senha; se não estiver elegível, mostramos orientação sem pedir credenciais aqui.
                      </p>
                    </div>
                  ) : (
                    <div
                      role="status"
                      className="mb-3 rounded-lg border border-violet-200/85 bg-violet-50/85 p-3 text-sm leading-relaxed text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/25 dark:text-violet-100"
                    >
                      <p className="font-semibold">Segundo passo: cadastro municipal no emissor</p>
                      <p className="mt-1">
                        O primeiro passo (NFS-e Nacional) não concluiu neste município. O emissor classificou o caso como
                        elegível para continuar com credenciais do portal da prefeitura — preencha o bloco abaixo.
                      </p>
                    </div>
                  )}
                  {showPrefeituraPortalCredentialsBlock ? (
                    <div
                      role="region"
                      aria-labelledby={prefeituraPortalCredentialsTitleId}
                      className="mb-3 rounded-lg border ui-border-section bg-white/90 p-3 dark:bg-slate-950/40"
                    >
                      <p
                        id={prefeituraPortalCredentialsTitleId}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Credenciais do portal da prefeitura
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Usadas só para enviar ao emissor fiscal nesta sessão — não ficam guardadas no navegador nem em links.
                      </p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div>
                          <label htmlFor="mei-prefeitura-login" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            Login do portal
                          </label>
                          <input
                            id="mei-prefeitura-login"
                            ref={prefeituraPortalLoginInputRef}
                            className="planner-input-compact w-full"
                            type="text"
                            name="prefeitura-portal-login"
                            autoComplete="off"
                            value={prefeituraPortalLogin}
                            onChange={(e) => setPrefeituraPortalLogin(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="mei-prefeitura-senha" className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            Senha do portal
                          </label>
                          <input
                            id="mei-prefeitura-senha"
                            ref={prefeituraPortalSenhaInputRef}
                            className="planner-input-compact w-full"
                            type="password"
                            name="prefeitura-portal-senha"
                            autoComplete="new-password"
                            value={prefeituraPortalSenha}
                            onChange={(e) => setPrefeituraPortalSenha(e.target.value)}
                          />
                        </div>
                      </div>
                      {prefeituraPortalCredValidationMessage ? (
                        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {prefeituraPortalCredValidationMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {showRequisitosNfeNfcePlaceholder ? <MeiCadastroRequisitosNfeNfcePlaceholder /> : null}
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      id="mei-emitente-razao-social"
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.razaoSocial}
                      onChange={(event) => updateNfEmissionCompanyForm({ razaoSocial: event.target.value })}
                      placeholder="Razão social *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.nomeFantasia}
                      onChange={(event) => updateNfEmissionCompanyForm({ nomeFantasia: event.target.value })}
                      placeholder="Nome fantasia (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="email"
                      value={nfEmissionCompanyForm.email}
                      onChange={(event) => updateNfEmissionCompanyForm({ email: event.target.value })}
                      placeholder="E-mail fiscal *"
                    />
                    <div
                      className="planner-input-compact flex items-center bg-slate-100/80 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                      aria-label="Regime tributário MEI"
                    >
                      Simples Nacional + MEI
                    </div>
                    <input
                      id="mei-emitente-inscricao-municipal"
                      className="planner-input-compact md:col-span-2"
                      type="text"
                      value={nfEmissionCompanyForm.inscricaoMunicipal}
                      onChange={(event) => updateNfEmissionCompanyForm({
                        inscricaoMunicipal: event.target.value
                      })}
                      placeholder="Inscrição municipal (opcional)"
                      autoComplete="off"
                      aria-describedby="mei-emitente-inscricao-municipal-hint"
                    />
                    <p
                      id="mei-emitente-inscricao-municipal-hint"
                      className="md:col-span-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      Opcional. É o número da inscrição na prefeitura; não substitui configurações extras que o emissor
                      possa pedir no cadastro NFS-e.
                    </p>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-4">
                    <input
                      className="planner-input-compact"
                      type="text"
                      inputMode="numeric"
                      value={nfEmissionCompanyForm.cep}
                      onChange={(event) => updateNfEmissionCompanyForm({ cep: event.target.value })}
                      placeholder="CEP *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.tipoLogradouro}
                      onChange={(event) => updateNfEmissionCompanyForm({ tipoLogradouro: event.target.value })}
                      placeholder="Tipo logradouro"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.logradouro}
                      onChange={(event) => updateNfEmissionCompanyForm({ logradouro: event.target.value })}
                      placeholder="Logradouro *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.numero}
                      onChange={(event) => updateNfEmissionCompanyForm({ numero: event.target.value })}
                      placeholder="Número *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.complemento}
                      onChange={(event) => updateNfEmissionCompanyForm({ complemento: event.target.value })}
                      placeholder="Complemento (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.bairro}
                      onChange={(event) => updateNfEmissionCompanyForm({ bairro: event.target.value })}
                      placeholder="Bairro *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      inputMode="numeric"
                      value={nfEmissionCompanyForm.codigoCidade}
                      onChange={(event) => updateNfEmissionCompanyForm({ codigoCidade: event.target.value })}
                      placeholder="Código IBGE cidade *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.descricaoCidade}
                      onChange={(event) => updateNfEmissionCompanyForm({ descricaoCidade: event.target.value })}
                      placeholder="Cidade *"
                    />
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-[120px_auto]">
                    <input
                      className="planner-input-compact"
                      type="text"
                      maxLength={2}
                      value={nfEmissionCompanyForm.estado}
                      onChange={(event) => updateNfEmissionCompanyForm({ estado: event.target.value.toUpperCase() })}
                      placeholder="UF *"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={nfEmissionCompanyForm.simplesNacional}
                        onChange={(event) => updateNfEmissionCompanyForm({ simplesNacional: event.target.checked })}
                      />
                      Empresa optante pelo Simples Nacional
                    </label>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t ui-border-section pt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Se o certificado já está cadastrado no emissor fiscal, você pode consultar o cadastro ou atualizar só os dados
                      fiscais (endereço, regime, etc.) sem reenviar o arquivo .pfx.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="planner-button-secondary-compact"
                        onClick={handleConsultarCadastroEmissor}
                        disabled={Boolean(nfEmissionCompanySyncLoading) || isUploadingCert}
                      >
                        {nfEmissionCompanySyncLoading === 'consult' ? 'Consultando...' : 'Consultar cadastro no emissor'}
                      </button>
                      <button
                        type="button"
                        className="planner-button-secondary-compact"
                        onClick={handleAtualizarCadastroSemNovoCertificado}
                        disabled={Boolean(nfEmissionCompanySyncLoading) || isUploadingCert}
                      >
                        {nfEmissionCompanySyncLoading === 'patch' ? 'Atualizando...' : 'Atualizar cadastro (sem novo certificado)'}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              ) : null}

              {canViewNfse && ((isUploadingCert && plugnotasSubmitPhase !== 'idle') || empresaRegistroRetryBusy) ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-2 flex min-h-[28px] items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <span
                    className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent dark:border-slate-500"
                    aria-hidden
                  />
                  {plugnotasSubmitPhase === 'certificado' && isUploadingCert && !empresaRegistroRetryBusy
                    ? 'Enviando certificado digital…'
                    : empresaRegistroRetryBusy && plugnotasPendingRetry?.retryKind === 'municipal'
                      ? 'A concluir cadastro municipal no emissor fiscal…'
                      : 'Registrando empresa no emissor fiscal…'}
                </div>
              ) : null}

              <div className="admin-actions flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  aria-busy={isUploadingCert || empresaRegistroRetryBusy}
                  disabled={!plugnotasPrimaryActionEnabled}
                  title={
                    canViewNfse && !plugnotasPendingRetry
                      ? 'Envia o certificado e registra o emitente no serviço de emissão.'
                      : undefined
                  }
                  onClick={() => {
                    if (plugnotasRetryActionAvailable) {
                      void handleRetryPlugnotasEmpresaRegistro();
                    } else {
                      void handleCertificateUpload();
                    }
                  }}
                >
                  {empresaRegistroRetryBusy
                    || (isUploadingCert && canViewNfse && plugnotasSubmitPhase === 'empresa')
                    ? plugnotasPendingRetry?.retryKind === 'municipal'
                      ? 'A concluir cadastro municipal no emissor fiscal…'
                      : 'Registrando empresa no emissor fiscal…'
                    : isUploadingCert && canViewNfse && plugnotasSubmitPhase === 'certificado'
                      ? 'Enviando certificado digital…'
                      : isUploadingCert && !canViewNfse
                        ? 'Enviando...'
                        : isUploadingCert
                          ? 'Enviando e configurando...'
                          : plugnotasRetryActionAvailable
                            ? showPrefeituraPortalCredentialsBlock
                              ? 'Concluir cadastro com dados da prefeitura'
                              : 'Tentar registrar empresa novamente'
                            : canViewNfse
                              ? 'Concluir configuração fiscal'
                              : 'Enviar certificado'}
                </button>
                {showPrefeituraPortalCredentialsBlock ? (
                  <button
                    type="button"
                    className="planner-button-secondary-compact w-full sm:w-auto"
                    onClick={handlePrefeituraPortalVoltar}
                    disabled={empresaRegistroRetryBusy || isUploadingCert}
                  >
                    Voltar e revisar dados
                  </button>
                ) : null}
                {plugnotasPrimaryDisabledHint ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-md sm:flex-1">
                    {plugnotasPrimaryDisabledHint}
                  </p>
                ) : null}
                {hasUserCertificate && (
                  <button
                    className="planner-button-secondary-compact w-full sm:w-auto"
                    onClick={handleCertificateRemove}
                    disabled={isRemovingCert}
                  >
                    {isRemovingCert ? 'Removendo...' : 'Remover certificado'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Período da guia</h2>
              <p className="admin-section-subtitle">Selecione mês e ano para gerar o DAS.</p>
            </div>
          </div>

          {periodError && (
            <div className="admin-alert-danger">
              {periodError}
            </div>
          )}

          <div className="admin-toolbar">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[170px_170px_auto] md:items-end">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Mês</label>
                <select
                  className="planner-input-compact"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Ano</label>
                <select
                  className="planner-input-compact"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="planner-button w-full sm:w-auto md:justify-self-start disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDownloadClick}
                disabled={isDownloadingGuide || !normalizedContribuinte || normalizedContribuinte.length !== 14}
              >
                {isDownloadingGuide ? 'Baixando...' : 'Baixar guia'}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Histórico do DAS</h2>
              <p className="admin-section-subtitle">Últimos períodos consultados e situação do pagamento.</p>
            </div>
            <button
              type="button"
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void loadMeiPeriods({ refresh: true })}
              disabled={!canLoadPeriods || meiPeriodsLoading}
              title="Consultar novamente a Receita/Serpro e atualizar o status de cada competência"
            >
              {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {!hasUserCertificate && canLoadPeriods ? (
            <div className="admin-alert-warning">
              Consulta via CNPJ sem certificado. Se houver falha, envie o certificado.
            </div>
          ) : null}

          {!canLoadPeriods ? (
            <div className="admin-empty-state">Informe o CNPJ do MEI para consultar meses pagos.</div>
          ) : meiPeriodsLoading ? (
            <div className="admin-empty-state">Carregando histórico...</div>
          ) : meiPeriodsError ? (
            <div className="admin-alert-danger">
              {meiPeriodsError}
            </div>
          ) : meiPeriods.length === 0 ? (
            <div className="admin-empty-state">Nenhum período encontrado.</div>
          ) : (
            <div className="space-y-2">
              {meiPeriods.map((period) => (
                <div
                  key={`${period.competencia || 'period'}-${period.guideId || period.status}`}
                  className="admin-toolbar flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700 dark:text-gray-200">
                      {formatDasCompetenciaLabel(period.competencia)}
                    </div>
                    {period.status === 'erro' ? (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                        {period.errorMessage || 'Falha ao consultar o período no Serpro.'}
                      </p>
                    ) : null}
                  </div>
                  <span className={getDasStatusClasses(period.status)}>
                    {getDasStatusLabel(period.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
          </div>
        ) : null}

        {canViewNfse && activeWorkspace === 'nfse' ? (
          <div
            className="space-y-4 md:space-y-6"
            role="tabpanel"
            id="mei-panel-nfse"
            aria-labelledby="mei-tab-nfse"
          >
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setActiveWorkspace('overview')}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Voltar ao Mei Infinito
              </button>
            </div>

            <section
              id="mei-rps-config-section"
              className="admin-section-card scroll-mt-4"
              aria-labelledby="mei-rps-config-section-heading"
            >
              <div className="admin-section-header">
                <div>
                  <h2 id="mei-rps-config-section-heading" className="admin-section-title">
                    Série RPS (NFS-e)
                  </h2>
                  <p className="admin-section-subtitle">
                    Cadastre lote, número e série no emissor fiscal antes de emitir. Sem isso, a NFS-e pode retornar
                    «Nenhuma série cadastrada».
                  </p>
                </div>
              </div>
              <MeiRpsNumeracaoPanel
                id="mei-rps-config"
                variant="nfse-workspace"
                rpsLote={nfEmissionCompanyForm.rpsLote}
                rpsNumero={nfEmissionCompanyForm.rpsNumero}
                rpsSerie={nfEmissionCompanyForm.rpsSerie}
                onChange={updateNfEmissionCompanyForm}
                showSaveAction
                onSave={handleSalvarDadosEmitente}
                saveLoading={nfEmissionCompanySyncLoading === 'patch'}
              />
              {nfEmissionCompanySyncSuccess ? (
                <div className="admin-alert-success mt-3 text-xs">{nfEmissionCompanySyncSuccess}</div>
              ) : null}
              {nfEmissionCompanySyncError ? (
                <div className="mt-3">
                  <GuiaMeiEmpresaCadastroErrorPanel
                    message={nfEmissionCompanySyncError.message}
                    fiscalApiErrorCode={nfEmissionCompanySyncError.apiErrorCode}
                    fiscalErrorCode={nfEmissionCompanySyncError.plugnotasCode}
                    fiscalHttpStatus={nfEmissionCompanySyncError.httpStatus}
                    plugnotasRequest={nfEmissionCompanySyncError.plugnotasRequest}
                  />
                </div>
              ) : null}
            </section>

            <section
              id="mei-nfse-pre"
              className="admin-section-card"
              aria-labelledby="mei-nfse-pre-heading"
            >
              <h2 id="mei-nfse-pre-heading" className="admin-section-title">
                Antes de emitir
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Certificado, emitente no emissor fiscal e atalhos do catálogo.
              </p>

          {canViewNfse && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border ui-border-section bg-slate-50/70 px-3 py-2 dark:bg-slate-900/50">
              <p className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                {nfEmissionCompanyForm.razaoSocial
                  ? <>Emitente configurado: <span className="font-medium text-slate-700 dark:text-slate-200">{nfEmissionCompanyForm.razaoSocial}</span></>
                  : 'Dados do emitente não configurados. Configure na aba de certificado ou salve abaixo.'}
              </p>
              <button
                type="button"
                className="planner-button-secondary-compact shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSalvarDadosEmitente}
                disabled={nfEmissionCompanySyncLoading === 'patch'}
              >
                {nfEmissionCompanySyncLoading === 'patch' ? 'Salvando...' : 'Salvar dados do emitente'}
              </button>
            </div>
          )}
          {nfEmissionCompanySyncError ? (
            <GuiaMeiEmpresaCadastroErrorPanel
              message={nfEmissionCompanySyncError.message}
              fiscalApiErrorCode={nfEmissionCompanySyncError.apiErrorCode}
              fiscalErrorCode={nfEmissionCompanySyncError.plugnotasCode}
              fiscalHttpStatus={nfEmissionCompanySyncError.httpStatus}
              plugnotasRequest={nfEmissionCompanySyncError.plugnotasRequest}
            />
          ) : null}
          {nfEmissionCompanySyncSuccess && (
            <div className="admin-alert-success text-xs">{nfEmissionCompanySyncSuccess}</div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Série RPS? Use a seção{' '}
            <button
              type="button"
              className="font-medium text-violet-700 underline decoration-violet-700/70 underline-offset-2 hover:text-violet-900 dark:text-violet-300"
              onClick={openRpsConfig}
            >
              Série RPS (NFS-e)
            </button>{' '}
            no topo desta aba.
          </p>

          <div className="admin-toolbar space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Cliente salvo (atalho)
                </label>
                <select
                  className="planner-input-compact w-full"
                  value={selectedCatalogClienteId}
                  onChange={(event) => handleSelectCatalogCliente(event.target.value)}
                >
                  <option value="">Selecionar cliente...</option>
                  {nfseCatalogClientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {buildClienteCatalogLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Serviço salvo (atalho)
                </label>
                <select
                  className="planner-input-compact w-full"
                  value={selectedCatalogProdutoId}
                  onChange={(event) => handleSelectCatalogProduto(event.target.value)}
                >
                  <option value="">Selecionar serviço...</option>
                  {nfseCatalogProdutos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {buildProdutoCatalogLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <MeiNfseCatalogManageActions
              inRouter={inRouter}
              catalogEmpty={
                !nfseCatalogLoading
                && nfseCatalogClientes.length === 0
                && nfseCatalogProdutos.length === 0
              }
            />

            {nfseCatalogLoading && !nfEmissionCompanyForm.razaoSocial?.trim() ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualizando catálogo fiscal...
              </p>
            ) : null}
          </div>

          {nfseCatalogError && (
            <div className="admin-alert-danger">
              {nfseCatalogError}
            </div>
          )}

          {nfsePrestadorPrefillLoading ? (
            <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span
                className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300"
                aria-hidden
              />
              A carregar dados do cadastro…
            </p>
          ) : null}
          {nfsePrestadorPrefillBanner ? (
            <div className="admin-alert-warning" role="status">
              {nfsePrestadorPrefillBanner}
            </div>
          ) : null}
            </section>

            <section id="mei-nfse-emit" className="admin-section-card" aria-labelledby="mei-nfse-emit-heading">
          <div className="admin-section-header">
            <div>
              <h2 id="mei-nfse-emit-heading" className="admin-section-title">
                Emitir nota
              </h2>
              <p className="admin-section-subtitle">
                Preencha os dados fiscais para emissão pelo sistema integrado.
                Após o envio, mensagens de rejeição ou validação costumam vir do provedor de emissão fiscal, não deste aplicativo.
              </p>
              <div className="mt-4 max-w-2xl">
                <MeiFiscalEmissionTypeSegmented
                  value={emissionDocumentType}
                  onChange={requestEmissionDocumentTypeChange}
                  disabled={nfseSubmitting || nfeLikeSubmitting}
                  nfeNfceEmitEnabled={nfeNfceEmitEnabled}
                />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {meiFiscalEmissionHelpLine(emissionDocumentType)}
                </p>
              </div>
              <div className="mt-3 border-t ui-border-section pt-3" role="status" aria-live="polite">
                {emissionDocumentType === 'NFSE' ? (
                  nfseWorkspaceGuidance
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Preencha emitente, destinatário e itens. A validação do servidor é a referência final antes da
                    emissão.
                  </p>
                )}
              </div>
              {canViewNfse && emissionDocumentType !== 'NFSE' ? (
                <div className="mt-4 max-w-2xl">
                  {fiscalCapabilityLoading && cnpjParaFiscalCapability.length === 14 ? (
                    <MeiFiscalCapabilityCallout
                      documentLabel={emissionDocumentType === 'NFE' ? 'NF-e' : 'NFC-e'}
                      mode="loading"
                    />
                  ) : null}
                  {!fiscalCapabilityLoading && fiscalCapabilityError ? (
                    <MeiFiscalCapabilityCallout
                      documentLabel={emissionDocumentType === 'NFE' ? 'NF-e' : 'NFC-e'}
                      mode="fetch_error"
                      errorMessage={fiscalCapabilityError}
                      onTentarNovamente={bumpFiscalCapabilityRefetchIfApplicable}
                      onRevisarConfiguracao={() => setActiveWorkspace('das')}
                    />
                  ) : null}
                  {!fiscalCapabilityLoading
                  && !fiscalCapabilityError
                  && cnpjParaFiscalCapability.length === 14
                  && nfeLikeEmitterBlockedByProvider ? (
                    <MeiFiscalCapabilityCallout
                      documentLabel={emissionDocumentType === 'NFE' ? 'NF-e' : 'NFC-e'}
                      mode="blocked"
                      onRevisarConfiguracao={() => setActiveWorkspace('das')}
                      onConfigurarEmissao={
                        isMeiFiscalD2ModalidadesEnabled()
                          ? () => setD2ModalidadesWizardOpen(true)
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {emissionDocumentType === 'NFSE' ? (
            <MeiNfseAjudaFiscalCollapsible
              open={nfseEmitDisclosure.ajudaFiscal}
              onToggle={() => toggleNfseEmitSection('ajudaFiscal')}
            >
              <p className="admin-field-hint text-xs leading-relaxed">
                Campos obrigatórios: CNPJ e endereço mínimo do prestador, CPF/CNPJ e razão social do tomador, código do
                serviço, CNAE, valor e discriminação. MEI no Simples Nacional: não se informa alíquota ISS — a
                prefeitura/provedor aplicam a regra.
              </p>
            </MeiNfseAjudaFiscalCollapsible>
          ) : null}

          {emissionDocumentType === 'NFSE' ? (
          <div className="space-y-3">
            <MeiNfseEmitCollapsible
              section="prestador"
              title="Prestador"
              open={nfseEmitDisclosure.prestador}
              onToggle={() => toggleNfseEmitSection('prestador')}
            >
          <div className="admin-toolbar grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-prestador-cnpj">
                CNPJ do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                id="nfse-prestador-cnpj"
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.prestadorCpfCnpj}
                onChange={(event) => {
                  touchNfsePrestadorBffParity();
                  updateNfseForm({
                    prestadorCpfCnpj: formatDocument(event.target.value)
                  });
                }}
                onBlur={handlePrestadorCnpjBlur}
                placeholder="00.000.000/0001-00"
              />
              {nfsePrestadorBrasilApiLoading ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buscando dados da empresa...</p>
              ) : null}
              {nfsePrestadorBrasilApiError ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{nfsePrestadorBrasilApiError}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Razão social do prestador (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorRazaoSocial}
                onChange={(event) => {
                  touchNfsePrestadorBffParity();
                  updateNfseForm({ prestadorRazaoSocial: event.target.value });
                }}
                placeholder="Razão social"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Email do prestador (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="email"
                value={nfseForm.prestadorEmail}
                onChange={(event) => {
                  touchNfsePrestadorBffParity();
                  updateNfseForm({ prestadorEmail: event.target.value });
                }}
                placeholder="email@prestador.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Logradouro do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.logradouro || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ logradouro: event.target.value })}
                placeholder="Rua / Avenida"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Número do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.numero || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ numero: event.target.value })}
                placeholder="123"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-prestador-codigo-ibge">
                Código IBGE da cidade do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                id="nfse-prestador-codigo-ibge"
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.prestadorEndereco?.codigoCidade || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ codigoCidade: event.target.value })}
                placeholder="3304557"
                aria-describedby="nfse-prestador-codigo-ibge-hint"
              />
              <p id="nfse-prestador-codigo-ibge-hint" className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {MEI_IBGE_CIDADE_PRESTACAO_PRESTADOR_FIELD_HINT}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                CEP do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.prestadorEndereco?.cep || ''}
                onChange={(event) => updateNfsePrestadorEndereco({
                  cep: normalizeDoc(event.target.value).slice(0, 8)
                })}
                placeholder="20040002"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dica: se você já configurou a empresa no sistema fiscal, os dados salvos serão usados como fallback no envio.
              </p>
            </div>
          </div>
            </MeiNfseEmitCollapsible>

            <MeiNfseEmitCollapsible
              section="tomador"
              title="Tomador"
              open={nfseEmitDisclosure.tomador}
              onToggle={() => toggleNfseEmitSection('tomador')}
            >
          <div className="admin-toolbar grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-tomador-doc">
                CPF/CNPJ do tomador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                id="nfse-tomador-doc"
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.tomadorCpfCnpj}
                onChange={(event) =>
                  updateNfseForm({
                    tomadorCpfCnpj: formatDocument(event.target.value)
                  })
                }
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-tomador-razao">
                Razão social do tomador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                id="nfse-tomador-razao"
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.tomadorRazaoSocial}
                onChange={(event) => updateNfseForm({ tomadorRazaoSocial: event.target.value })}
                placeholder="Razão social"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-tomador-email">
                Email do tomador (opcional)
              </label>
              <input
                id="nfse-tomador-email"
                className="planner-input-compact w-full"
                type="email"
                value={nfseForm.tomadorEmail}
                onChange={(event) => updateNfseForm({ tomadorEmail: event.target.value })}
                placeholder="email@tomador.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-id-integracao">
                ID de integração (opcional)
              </label>
              <input
                id="nfse-id-integracao"
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.idIntegracao}
                onChange={(event) => updateNfseForm({ idIntegracao: event.target.value })}
                placeholder="NFSE-123"
              />
            </div>
          </div>
            </MeiNfseEmitCollapsible>

            <MeiNfseEmitCollapsible
              section="servico"
              title="Serviço"
              open={nfseEmitDisclosure.servico}
              onToggle={() => toggleNfseEmitSection('servico')}
            >
          <div className="admin-toolbar space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-servico-codigo">
                  Código do serviço
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  id="nfse-servico-codigo"
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.servico.codigo}
                  onChange={(event) => updateNfseServico({ codigo: event.target.value })}
                  placeholder="Ex.: 01.02.03 (min. 6 caracteres alfanum. sem mascara)"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-servico-cnae">
                  CNAE
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  id="nfse-servico-cnae"
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.servico.cnae}
                  onChange={(event) => updateNfseServico({ cnae: event.target.value })}
                  placeholder="6201500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-servico-valor">
                  Valor do serviço
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  id="nfse-servico-valor"
                  className="planner-input-compact w-full"
                  type="text"
                  inputMode="decimal"
                  value={String(nfseForm.servico.valorServico ?? '')}
                  onChange={(event) => updateNfseServico({ valorServico: event.target.value })}
                  placeholder="1500,00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-servico-nbs">
                  Código NBS
                </label>
                <input
                  id="nfse-servico-nbs"
                  className="planner-input-compact w-full tabular-nums"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={nfseForm.servico.codigoNbs ?? ''}
                  onChange={(event) => updateNfseServico({
                    codigoNbs: normalizeCodigoNbsInput(event.target.value)
                  })}
                  placeholder="114061100 (sugerido no catálogo)"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  NFS-e Nacional — se vazio, o backend tenta sugerir pelo código LC 116.
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-servico-discriminacao">
                Discriminação do serviço
                <span className="admin-required-mark">*</span>
              </label>
              <textarea
                id="nfse-servico-discriminacao"
                className="planner-input-compact w-full min-h-[90px]"
                value={nfseForm.servico.discriminacao}
                onChange={(event) => updateNfseServico({ discriminacao: event.target.value })}
                placeholder="Descreva o serviço prestado"
              />
            </div>
            <div
              className="rounded-md border ui-border-section bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
              aria-live="polite"
            >
              <p className="font-semibold text-slate-700 dark:text-slate-200">Resumo</p>
              <p>
                Tomador: {nfseForm.tomadorRazaoSocial?.trim() || '—'}
                {' · '}
                Valor: {String(nfseForm.servico.valorServico ?? '').trim() || '—'}
                {' · '}
                {nfseValidationMessage ? 'Ajuste os campos obrigatórios' : 'Validação local ok'}
              </p>
            </div>
          </div>
            </MeiNfseEmitCollapsible>

            <MeiNfseEmitCollapsible
              section="opcionais"
              title="Opcionais (cidade de prestação e envio por email)"
              open={nfseEmitDisclosure.opcionais}
              onToggle={() => toggleNfseEmitSection('opcionais')}
            >
          <div className="admin-toolbar space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-cidade-prestacao-codigo">
                  Código IBGE (prestação)
                </label>
                <input
                  id="nfse-cidade-prestacao-codigo"
                  className="planner-input-compact w-full"
                  type="text"
                  inputMode="numeric"
                  value={nfseForm.cidadePrestacao?.codigo || ''}
                  onChange={(event) => updateNfseCidade({ codigo: event.target.value })}
                  placeholder="Código IBGE"
                  aria-describedby="nfse-cidade-prestacao-codigo-hint"
                />
                <p
                  id="nfse-cidade-prestacao-codigo-hint"
                  className="mt-1 text-xs text-slate-600 dark:text-slate-400"
                >
                  {MEI_IBGE_CIDADE_PRESTACAO_PRESTADOR_FIELD_HINT}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-cidade-prestacao-desc">
                  Cidade (prestação)
                </label>
                <input
                  id="nfse-cidade-prestacao-desc"
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.cidadePrestacao?.descricao || ''}
                  onChange={(event) => updateNfseCidade({ descricao: event.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-cidade-prestacao-uf">
                  UF (prestação)
                </label>
                <input
                  id="nfse-cidade-prestacao-uf"
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.cidadePrestacao?.estado || ''}
                  onChange={(event) => updateNfseCidade({ estado: event.target.value })}
                  placeholder="UF"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400" htmlFor="nfse-enviar-email">
              <input
                id="nfse-enviar-email"
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(nfseForm.enviarEmail)}
                onChange={(event) => updateNfseForm({ enviarEmail: event.target.checked })}
              />
              Enviar email ao tomador (se configurado)
            </label>
          </div>
            </MeiNfseEmitCollapsible>
          </div>
          ) : (
            <MeiNfeLikeEmitForm
              documentLabel={emissionDocumentType === 'NFE' ? 'NF-e' : 'NFC-e'}
              value={nfeLikeForm}
              onChange={setNfeLikeForm}
              errors={nfeLikeFieldErrors}
              flashOpenSection={nfeLikeFlashOpenSection}
              onFlashOpenConsumed={() => setNfeLikeFlashOpenSection(null)}
              fieldsDisabled={nfeLikeEmissionLocked}
              nfLikeCatalogDocumentType={
                emissionDocumentType === 'NFE' || emissionDocumentType === 'NFCE'
                  ? emissionDocumentType
                  : undefined
              }
              onEditEmitenteCadastro={() => {
                document.getElementById('mei-emitente-dados-minimos')?.scrollIntoView?.({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            />
          )}

          <div className="admin-actions">
            <button
              type="button"
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (emissionDocumentType === 'NFSE') {
                  void handleEmitNfse();
                } else {
                  void handleEmitNfeLike();
                }
              }}
              disabled={
                nfseSubmitting
                || nfeLikeSubmitting
                || (emissionDocumentType !== 'NFSE' && nfeLikeEmissionLocked)
              }
              aria-invalid={
                emissionDocumentType === 'NFSE' ? Boolean(nfseValidationMessage) : Boolean(nfeLikeFirstValidationError)
              }
            >
              {emissionDocumentType === 'NFSE'
                ? nfseSubmitting
                  ? 'Enviando...'
                  : `Emitir ${GUIA_MEI_NFSE_DOCUMENT_LABEL}`
                : nfeLikeSubmitting
                  ? 'Enviando...'
                  : fiscalCapabilityLoading && cnpjParaFiscalCapability.length === 14
                    ? 'A verificar…'
                    : emissionDocumentType === 'NFE'
                      ? 'Emitir NF-e'
                      : 'Emitir NFC-e'}
            </button>
          </div>

          <div
            id="mei-nfse-emit-feedback"
            className="mt-4 space-y-3"
            role="region"
            aria-label={`Feedback de emissão de ${emissionFeedbackDocumentLabel}`}
          >
            {nfseEmitFeedbackTier1}
            {emissionDocumentType === 'NFSE' && nfseValidationMessage ? (
              <div
                className="admin-alert-warning space-y-1"
                role="status"
                data-nfse-feedback-tier="validation"
              >
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                  Ajuste os dados antes de enviar ({GUIA_MEI_NFSE_DOCUMENT_LABEL})
                </p>
                <LongFiscalErrorMessage message={nfseValidationMessage} tone="warning" />
              </div>
            ) : null}
            {emissionDocumentType !== 'NFSE' && nfeLikeFirstValidationError ? (
              <div className="admin-alert-warning space-y-1" role="status" data-nfse-feedback-tier="validation-nfe">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                  Ajuste os dados antes de enviar ({emissionFeedbackDocumentLabel})
                </p>
                <LongFiscalErrorMessage message={nfeLikeFirstValidationError} tone="warning" />
              </div>
            ) : null}
            {nfseError && nfseErrorKind === 'emission' ? (
              <div data-nfse-feedback-tier="emission-error">
                <EmissaoFiscalErrorAlert
                  documentTypeLabel={emissionFeedbackDocumentLabel}
                  message={nfseError.rawMessage}
                  plugnotasCode={nfseError.plugnotasCode}
                  httpStatus={nfseError.httpStatus}
                  plugnotasRequest={nfseError.plugnotasRequest}
                  onConfigureRps={emissionDocumentType === 'NFSE' ? openRpsConfig : undefined}
                  onRetry={
                    nfseError.emissionRetryable
                      ? () => {
                          console.warn('[mei-emission]', {
                            phase: 'user_retry',
                            documentType: emissionDocumentType
                          });
                          omitClientIdIntegracaoOnNextEmitRef.current = true;
                          if (emissionDocumentType === 'NFSE') {
                            void handleEmitNfse();
                          } else {
                            void handleEmitNfeLike();
                          }
                        }
                      : undefined
                  }
                />
              </div>
            ) : null}
            {nfseError && nfseErrorKind === 'operation' ? (
              <div data-nfse-feedback-tier="provider-error">
                <FiscalProviderErrorAlert
                  message={nfseError.rawMessage}
                  plugnotasCode={nfseError.plugnotasCode}
                  httpStatus={nfseError.httpStatus}
                  plugnotasRequest={nfseError.plugnotasRequest}
                />
              </div>
            ) : null}
            {nfseSuccess ? (
              <div className="admin-alert-success" data-nfse-feedback-tier="success">
                {nfseSuccess}
              </div>
            ) : null}
          </div>
        </section>

        <section id="mei-nfse-list" className="admin-section-card" aria-labelledby="mei-nfse-list-heading">
          <div className="admin-section-header">
            <div>
              <h2 id="mei-nfse-list-heading" className="admin-section-title">Notas emitidas</h2>
              <p className="admin-section-subtitle">
                Acompanhe status, descarregue XML/PDF e faça a gestão de cada nota. O resumo numérico do separador está no topo da página quando visível.
              </p>
            </div>
          </div>

          <div className="admin-toolbar flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-filter-lista-tipo">
                  Tipo de nota
                </label>
                <select
                  id="nfse-filter-lista-tipo"
                  className="planner-input-compact w-full"
                  value={nfseDocumentTypeFilter}
                  onChange={(event) =>
                    setNfseDocumentTypeFilter(event.target.value as MeiFiscalListDocumentFilter)
                  }
                >
                  <option value="all">Todas</option>
                  <option value="NFSE">NFS-e</option>
                  <option value="NFE">NF-e</option>
                  <option value="NFCE">NFC-e</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-filter-status">
                  Status
                </label>
                <select
                  id="nfse-filter-status"
                  className="planner-input-compact w-full"
                  value={nfseStatusFilter}
                  onChange={(event) => setNfseStatusFilter(event.target.value)}
                >
                  <option value="all">Todos os status</option>
                  <option value="processando">Processando</option>
                  <option value="concluido">Concluída</option>
                  <option value="rejeitado">Rejeitada</option>
                  <option value="interrompido">Interrompida</option>
                  <option value="cancelamento_pendente">Cancelamento pendente</option>
                  <option value="cancelado">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="nfse-filter-periodo">
                  Período de competência
                </label>
                <select
                  id="nfse-filter-periodo"
                  className="planner-input-compact w-full"
                  value={nfsePeriodFilter}
                  onChange={(event) => setNfsePeriodFilter(event.target.value)}
                >
                  <option value="all">Todos os períodos</option>
                  {nfsePeriodOptions.map((period) => (
                    <option key={period} value={period}>
                      {period.split('-').reverse().join('/')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="inline-flex items-center gap-2 rounded-lg border ui-border-section bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-400" htmlFor="nfse-filter-arquivadas">
                <input
                  id="nfse-filter-arquivadas"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={nfseShowArchived}
                  onChange={(event) => setNfseShowArchived(event.target.checked)}
                />
                Mostrar arquivadas
              </label>
              <button
                id="nfse-list-atualizar"
                type="button"
                className="planner-button-secondary-compact w-full sm:w-auto"
                onClick={() => void Promise.all([loadNfseList(), loadMeiLimiteServidor()])}
                disabled={nfseLoading}
              >
                {nfseLoading ? 'Atualizando...' : 'Atualizar lista'}
              </button>
            </div>
          </div>

          {nfseLoading ? (
            <div className="admin-empty-state">Carregando notas...</div>
          ) : nfseList.length === 0 ? (
            <div className="admin-empty-state space-y-3">
              {nfseError && nfseErrorKind === 'operation' ? (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Não foi possível carregar a lista. O detalhe do erro está na secção de emissão acima (pilha de
                    feedback).
                  </p>
                  <button
                    type="button"
                    className="planner-button-secondary-compact"
                    onClick={() => void Promise.all([loadNfseList(), loadMeiLimiteServidor()])}
                  >
                    Tentar novamente
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Ainda não há notas emitidas.</p>
                  <button type="button" className="planner-button-secondary-compact" onClick={scrollToNfseEmitSection}>
                    Preencher e emitir
                  </button>
                </>
              )}
            </div>
          ) : filteredNfseList.length === 0 ? (
            <div className="admin-empty-state space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {nfseDocumentTypeFilter !== 'all' &&
                nfseStatusFilter === 'all' &&
                nfsePeriodFilter === 'all'
                  ? meiFiscalListFilterEmptyMessage(nfseDocumentTypeFilter)
                  : 'Nenhuma nota corresponde aos filtros atuais.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {nfseDocumentTypeFilter !== 'all' ? (
                  <button
                    type="button"
                    className="planner-button-secondary-compact"
                    onClick={clearNfseDocumentTypeFilterOnly}
                  >
                    Mostrar todas
                  </button>
                ) : null}
                <button type="button" className="planner-button-secondary-compact" onClick={resetNfseListFilters}>
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {filteredNfseList.map((item) => {
                  const statusKey = getNfseStatusKey(item.status);
                  const rowBusy = isNfseRowBusy(item.id);
                  const metadata = toNfseMetadata(item.metadata_json);
                  const reviewRequested = Boolean(metadata.reviewRequested);
                  const isArchived = Boolean(item.archived_at);
                  return (
                    <div key={item.id} className="admin-user-card" aria-busy={rowBusy || undefined}>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                            {item.id_integracao || item.plugnotas_id || item.id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            Emitida em {formatDateTime(item.created_at)}
                            {item.protocol ? ` • Protocolo ${item.protocol}` : ''}
                          </p>
                        </div>
                        <div className="admin-actions">
                          <span className={meiFiscalDocumentTypeBadgeClass(item.document_type)}>
                            {meiFiscalDocumentTypeShortLabel(item.document_type)}
                          </span>
                          <span className={getNfseStatusBadgeClass(item.status)}>
                            {formatNfseStatus(item.status)}
                          </span>
                          {isArchived && <span className="admin-badge-neutral">Arquivada</span>}
                          {reviewRequested && <span className="admin-badge-warning">Revisão</span>}
                        </div>
                      </div>
                      <MeiNfseListRowActions
                        item={item}
                        statusKey={statusKey}
                        rowBusy={rowBusy}
                        reviewRequested={reviewRequested}
                        isArchived={isArchived}
                        moreMenuOpenId={nfseMoreMenuOpenId}
                        setMoreMenuOpenId={setNfseMoreMenuOpenId}
                        isNfseActionLoading={isNfseActionLoading}
                        onSync={() => void handleSyncNfse(item.id)}
                        onDownloadPdf={() => void handleDownloadNfsePdf(item)}
                        onDownloadXml={() => void handleDownloadNfseXml(item)}
                        onToggleReview={() => void handleToggleReviewNfse(item)}
                        onCancel={() => void handleCancelNfse(item)}
                        onArchive={() => void handleArchiveNfse(item)}
                        onMenuKeyDown={handleNfseMoreMenuKeyDown}
                        menuFirstItemRef={nfseMoreMenuFirstItemRef}
                        layout="card"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
          </div>
        ) : null}

        {activeWorkspace === 'parcelamentos' ? (
          <section
            className="admin-section-card"
            role="tabpanel"
            id="mei-panel-parcelamentos"
            aria-labelledby="mei-tab-parcelamentos"
          >
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setActiveWorkspace('overview')}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Voltar ao Mei Infinito
              </button>
            </div>
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Parcelamentos</h2>
                <p className="admin-section-subtitle">
                  Consulte os pedidos de parcelamento (MEI e Simples Nacional) via SERPRO — todas as modalidades disponíveis.
                </p>
              </div>
            </div>
            <div className="admin-toolbar grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">CNPJ do MEI</label>
                <input
                  className="planner-input-compact w-full"
                  type="text"
                  inputMode="numeric"
                  value={contribuinteDoc}
                  onChange={(e) => setContribuinteDoc(formatDocument(e.target.value))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={async () => {
                    setParcelamentosError(null);
                    setParcelamentoPdfError(null);
                    setParcelamentosLoading(true);
                    try {
                      const cnpj = normalizedContribuinte || undefined;
                      const contribuinte = cnpj && contribuinteTipo != null
                        ? { numero: cnpj, tipo: contribuinteTipo }
                        : undefined;
                      const res = await fetchParcelamentos(cnpj, contribuinte);
                      setParcelamentosList(res.parcelamentos ?? []);
                      setParcelamentosResumo({
                        modalidadesConsultadas: res.modalidadesConsultadas,
                        resumoPorModalidade: res.resumoPorModalidade
                      });
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : null);
                      setParcelamentosError(msg || 'Erro ao buscar parcelamentos.');
                      setParcelamentosList([]);
                      setParcelamentosResumo({});
                    } finally {
                      setParcelamentosLoading(false);
                      setParcelamentosSearchDone(true);
                    }
                  }}
                  disabled={parcelamentosLoading || (normalizedContribuinte.length !== 14 && !hasUserCertificate)}
                  className="planner-button-primary-compact"
                >
                  {parcelamentosLoading ? 'Buscando...' : 'Buscar parcelamentos'}
                </button>
              </div>
            </div>
            {parcelamentoPdfError && (
              <div className="admin-alert-danger mt-3">
                {parcelamentoPdfError}
              </div>
            )}
            {parcelamentosError && (
              <div className="admin-alert-danger mt-3">
                {parcelamentosError}
              </div>
            )}
            {parcelamentosList.length > 0 ? (
              <div className="mt-4">
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                  Foram consultadas {parcelamentosResumo.modalidadesConsultadas ?? 6} modalidades (Simples Nacional e MEI). Encontrados {parcelamentosList.length} parcelamento{parcelamentosList.length !== 1 ? 's' : ''}.
                  {parcelamentosResumo.resumoPorModalidade && Object.keys(parcelamentosResumo.resumoPorModalidade).length > 0 && (
                    <span className="ml-1">
                      {' '}
                      Por modalidade: {Object.entries(parcelamentosResumo.resumoPorModalidade)
                        .map(([mod, count]) => `${mod}: ${count}`)
                        .join(', ')}.
                    </span>
                  )}
                </p>
                <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead className="admin-table-head">
                    <tr>
                      <th className="admin-table-cell">Modalidade</th>
                      <th className="admin-table-cell">Número</th>
                      <th className="admin-table-cell">Data do pedido</th>
                      <th className="admin-table-cell">Situação</th>
                      <th className="admin-table-cell">Data da situação</th>
                      <th className="admin-table-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelamentosList.map((p, idx) => {
                      const contribuinteParcel = normalizedContribuinte && contribuinteTipo != null
                        ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
                        : undefined;
                      const isLoadingPdf = parcelamentoPdfLoadingNumero === (p.numero ?? '');
                      return (
                        <tr key={`${p.modalidade ?? ''}-${p.numero ?? idx}`} className="admin-table-row">
                          <td className="admin-table-cell">{p.modalidade ?? '—'}</td>
                          <td className="admin-table-cell">{p.numero ?? '—'}</td>
                          <td className="admin-table-cell">
                            {p.dataPedido
                              ? `${p.dataPedido.slice(6, 8)}/${p.dataPedido.slice(4, 6)}/${p.dataPedido.slice(0, 4)}`
                              : '—'}
                          </td>
                          <td className="admin-table-cell">{p.situacao ?? '—'}</td>
                          <td className="admin-table-cell">
                            {p.dataSituacao
                              ? `${p.dataSituacao.slice(6, 8)}/${p.dataSituacao.slice(4, 6)}/${p.dataSituacao.slice(0, 4)}`
                              : '—'}
                          </td>
                          <td className="admin-table-cell">
                            <button
                              type="button"
                              disabled={isLoadingPdf || !p.numero}
                              className="planner-button-primary-compact text-sm"
                              onClick={async () => {
                                if (!p.numero) return;
                                setParcelamentoPdfError(null);
                                setParcelamentoPdfLoadingNumero(p.numero);
                                try {
                                  const { blob, filename } = await downloadParcelamentoPdf(
                                    p.numero,
                                    normalizedContribuinte || undefined,
                                    p.modalidade,
                                    contribuinteParcel
                                  );
                                  triggerFileDownload(blob, filename || `parcelamento-${p.numero}.pdf`);
                                } catch (e) {
                                  const msg = e instanceof Error ? e.message : (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : null);
                                  setParcelamentoPdfError(msg || 'PDF não disponível para este parcelamento.');
                                } finally {
                                  setParcelamentoPdfLoadingNumero(null);
                                }
                              }}
                            >
                              {isLoadingPdf ? 'Baixando...' : 'Baixar PDF'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            ) : !parcelamentosLoading && !parcelamentosError ? (
              parcelamentosSearchDone ? (
                <div className="admin-empty-state mt-4">
                  Nenhum parcelamento encontrado para este CNPJ.
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Informe o CNPJ do MEI e clique em Buscar parcelamentos para consultar.
                </p>
              )
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
