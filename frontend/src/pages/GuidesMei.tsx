import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
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
  cadastrarCertificadoEmissaoNf,
  cadastrarEmpresaEmissaoNf,
  consultarEmpresaEmissaoNf,
  cancelarNfse,
  emitirNfse,
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
import { isFetchConnectivityFailure } from '../utils/isFetchConnectivityFailure';
import { getPlugnotasCodeFromUnknownError as getFiscalErrorCode } from '../utils/apiClientError';
import { formatPlugnotasIntegrationError as formatFiscalError } from '../utils/plugnotasIntegrationErrorMessage';
import { getNfseServicoCodigoValidationError } from '../utils/nfseServicoCodigo';
import { fetchBrasilApiCnpj, type BrasilApiCnpjResponse } from '../utils/brasilApi';
import { DevApiHealthIndicator } from '../components/DevApiHealthIndicator';
import { MeiNfseListRowActions } from '../components/MeiNfseListRowActions';
import {
  EmissaoFiscalErrorAlert,
  GuiaMeiCertificateConnectivityPanel,
  GuiaMeiEmpresaCadastroErrorPanel,
  LongFiscalErrorMessage,
  PlugnotasIntegrationErrorAlert as FiscalProviderErrorAlert
} from '../components/FiscalIntegrationErrorAlert';
import type { GuidesMeiWorkspace } from './guidesMeiWorkspaceStorage';
import {
  MEI_WORKSPACE_STORAGE_KEY,
  readWorkspaceFromStorage,
  resolveInitialWorkspace
} from './guidesMeiWorkspaceStorage';
import {
  emptyNfsePrestadorEndereco,
  mergeEmitenteSnapshotIntoNfseForm,
  replacePrestadorFromEmitenteSnapshot
} from '../utils/nfseEmitenteHydration';
import {
  isNfsePrestadorPrefillEffectivelyEmpty,
  mergeNfsePrestadorPrefillIntoForm
} from '../utils/nfsePrestadorPrefillMerge';
import { fetchNfsePrestadorPrefill } from '../services/meiPrestadorPrefillService';

function formatMeiFiscalErr(error: unknown, fallback: string): string {
  return formatFiscalError(
    error instanceof Error ? error.message : fallback,
    getFiscalErrorCode(error)
  );
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

const emitenteSnapshotToForm = (snap: NfseEmitenteSnapshot): NfEmissionCompanyForm => {
  const { certDocument: _omitCert, ...companyFields } = snap;
  const r = companyFields.regimeTributario;
  const regime: NfEmissionRegimeTributario =
    r === '1' || r === '2' || r === '3' ? r : '1';
  return {
    ...getDefaultNfEmissionCompanyForm(),
    ...companyFields,
    regimeTributario: regime
  };
};

const nfEmissionFormToPersistBody = (form: NfEmissionCompanyForm) => ({
  razaoSocial: form.razaoSocial,
  nomeFantasia: form.nomeFantasia,
  email: form.email,
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
  simplesNacional: form.simplesNacional
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

const getNfseStatusKey = (status?: string | null) => {
  const text = String(status || '').toLowerCase();
  if (!text) return 'processando';
  if (text.includes('cancelamento_pendente')) return 'cancelamento_pendente';
  if (text.includes('concluido') || text.includes('autoriz')) return 'concluido';
  if (text.includes('process')) return 'processando';
  if (text.includes('rejeit')) return 'rejeitado';
  if (text.includes('cancel')) return 'cancelado';
  if (text.includes('interromp')) return 'interrompido';
  return text;
};

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

const toNfsePeriodKey = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

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

/** Rótulo curto na UI do workspace fiscal (Guia MEI só NFS-e — US-MEI-NFS-03). */
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
    <div className="rounded-lg border border-slate-200/80 p-3 dark:border-slate-700/80">
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
    <div className="mb-3 rounded-lg border border-slate-200/80 p-3 dark:border-slate-700/80">
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
  const { role, mei } = useAuthStore();
  const canViewNfse = role === 'superadmin'
    || role === 'admin'
    || (role === 'usuario' && mei !== false);
  const inRouter = useInRouterContext();
  const catalogoClientesLinkClass =
    'font-medium text-blue-600 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:decoration-blue-400/80 dark:hover:text-blue-300';
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
  const [certificateConnectivityAlert, setCertificateConnectivityAlert] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isRemovingCert, setIsRemovingCert] = useState(false);
  const [hasUserCertificate, setHasUserCertificate] = useState(false);
  const [hasServerCertificate, setHasServerCertificate] = useState(false);
  const [certValidFrom, setCertValidFrom] = useState<string | null>(null);
  const [certValidTo, setCertValidTo] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isDownloadingGuide, setIsDownloadingGuide] = useState(false);

  const [meiPeriods, setMeiPeriods] = useState<MeiPeriod[]>([]);
  const [meiPeriodsLoading, setMeiPeriodsLoading] = useState(false);
  const [meiPeriodsError, setMeiPeriodsError] = useState<string | null>(null);
  const hasCertificate = hasUserCertificate;
  const [nfseForm, setNfseForm] = useState<EmitirNfseInput>({
    prestadorCpfCnpj: '',
    prestadorRazaoSocial: '',
    prestadorEmail: '',
    prestadorEndereco: emptyNfsePrestadorEndereco(),
    tomadorCpfCnpj: '',
    tomadorRazaoSocial: '',
    tomadorEmail: '',
    servico: {
      codigo: '',
      discriminacao: '',
      cnae: '',
      valorServico: ''
    },
    cidadePrestacao: {
      codigo: '',
      descricao: '',
      estado: ''
    },
    idIntegracao: '',
    enviarEmail: false,
    descricao: '',
    informacoesComplementares: ''
  });
  const [nfseList, setNfseList] = useState<NfseRecord[]>([]);
  const [nfseLoading, setNfseLoading] = useState(false);
  const [nfseSubmitting, setNfseSubmitting] = useState(false);
  const [nfseActionMap, setNfseActionMap] = useState<Record<string, boolean>>({});
  const [nfseError, setNfseError] = useState<string | null>(null);
  const [nfseErrorKind, setNfseErrorKind] = useState<'emission' | 'operation' | null>(null);
  const [nfseSuccess, setNfseSuccess] = useState<string | null>(null);

  const clearNfseErrorState = useCallback(() => {
    setNfseError(null);
    setNfseErrorKind(null);
  }, []);

  const setEmissionNfseError = useCallback((msg: string) => {
    setNfseError(msg);
    setNfseErrorKind('emission');
  }, []);

  const setOperationNfseError = useCallback((msg: string) => {
    setNfseError(msg);
    setNfseErrorKind('operation');
  }, []);
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
  const [nfseDocumentTypeFilter, setNfseDocumentTypeFilter] = useState<'all' | 'NFSE'>('all');
  const [certificateSuccess, setCertificateSuccess] = useState<string | null>(null);
  const [nfEmissionCompanyForm, setNfEmissionCompanyForm] = useState<NfEmissionCompanyForm>(() => (
    getDefaultNfEmissionCompanyForm()
  ));
  /** Evita sobrescrever edição local ao reexecutar `loadCertificateStatus`. */
  const nfseEmitenteHydratedRef = useRef(false);
  /** Deteta troca para o separador NFS-e e dispara refetch do catálogo (CAT-MEI-05 / FR-CAT-07). */
  const prevMeiWorkspaceRef = useRef<GuidesMeiWorkspace | null>(null);
  const [nfEmissionCompanySyncLoading, setNfEmissionCompanySyncLoading] = useState<'consult' | 'patch' | null>(null);
  const [nfEmissionCompanySyncError, setNfEmissionCompanySyncError] = useState<string | null>(null);
  const [nfEmissionCompanySyncSuccess, setNfEmissionCompanySyncSuccess] = useState<string | null>(null);
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

  const applyDocumento = useCallback((documento?: string | null, force = false) => {
    if (!documento) return;
    const formatted = formatDocument(documento);
    setContribuinteDoc((current) => (force || !current ? formatted : current));
  }, []);

  const loadCertificateStatus = useCallback(async () => {
    try {
      const status = await fetchMeiCertificateStatus();
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
    } catch {
      setHasUserCertificate(false);
      setHasServerCertificate(false);
      setCertValidFrom(null);
      setCertValidTo(null);
    }
  }, [applyDocumento]);

  const loadMeiPeriods = useCallback(async () => {
    if (!canLoadPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    setMeiPeriodsLoading(true);
    setMeiPeriodsError(null);
    try {
      const contribuinte = contribuinteTipo
        ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
        : undefined;
      const periods = hasUserCertificate
        ? await fetchMeiPeriods(normalizedContribuinte, contribuinte)
        : await fetchMeiPeriodsByCnpj(normalizedContribuinte);
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
        ...(nfseDocumentTypeFilter !== 'all' ? { documentType: nfseDocumentTypeFilter } : {})
      });
      setNfseList(list);
    } catch (error) {
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao listar NFSe.'));
    } finally {
      setNfseLoading(false);
    }
  }, [canViewNfse, clearNfseErrorState, nfseDocumentTypeFilter, nfseShowArchived, setOperationNfseError]);

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
        setNfseForm((f) => mergeNfsePrestadorPrefillIntoForm(f, prefill, { onlyFillEmpty: true }));
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
  }, [canViewNfse, activeWorkspace]);

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
      setCertificateError('Selecione o arquivo do certificado.');
      return;
    }
    const trimmedPassword = certificatePassword.trim();
    if (!trimmedPassword) {
      setCertificateConnectivityAlert(false);
      setCertificateErrorFiscalCode(null);
      setCertificateError('Informe a senha do certificado.');
      return;
    }
    if (canViewNfse) {
      const companyValidationMessage = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
      if (companyValidationMessage) {
        setCertificateConnectivityAlert(false);
        setCertificateErrorFiscalCode(null);
        setCertificateError(companyValidationMessage);
        return;
      }
    }

    setCertificateError(null);
    setCertificateErrorFiscalCode(null);
    setCertificateConnectivityAlert(false);
    setCertificateSuccess(null);
    setIsUploadingCert(true);
    let uploadedToMei = false;
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
      }

      if (!canViewNfse) {
        setCertificateFile(null);
        setCertificatePassword('');
        setCertificateSuccess('Certificado enviado com sucesso.');
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

      const certificateResponse = await cadastrarCertificadoEmissaoNf({
        arquivo: certificateFile,
        senha: trimmedPassword,
        cpfCnpj: cnpj,
        ...(
          nfEmissionCompanyForm.email.trim()
            ? { email: nfEmissionCompanyForm.email.trim() }
            : {}
        )
      });
      const certificateId = String(certificateResponse.id || '').trim();
      if (!certificateId) {
        throw new Error('O sistema de emissão fiscal não retornou o ID do certificado.');
      }

      const companyPayload = buildNfEmissionEmpresaPayload({
        cnpj,
        certificadoId: certificateId,
        form: nfEmissionCompanyForm
      });
      const companyResponse = await cadastrarEmpresaEmissaoNf(companyPayload);
      const returnedCnpj = normalizeDoc(String(companyResponse.cnpj || cnpj));
      const formattedCnpj = formatDocument(returnedCnpj || cnpj);

      setContribuinteDoc(formattedCnpj);
      updateNfseForm({
        prestadorCpfCnpj: formattedCnpj,
        ...(nfEmissionCompanyForm.razaoSocial.trim()
          ? { prestadorRazaoSocial: nfEmissionCompanyForm.razaoSocial.trim() }
          : {}),
        ...(nfEmissionCompanyForm.email.trim()
          ? { prestadorEmail: nfEmissionCompanyForm.email.trim() }
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
      setCertificateSuccess(
        [
          'Certificado enviado no MEI e configurado no sistema de emissão fiscal.',
          certificateResponse.message || null,
          companyResponse.message || 'Empresa configurada no sistema de emissão fiscal com sucesso.'
        ].filter(Boolean).join(' ')
      );
    } catch (error) {
      // Rede até o backend: upload MEI, POST certificado fiscal ou cadastro empresa no mesmo try (US-CONN-MEI-03 / US-MEI-FISC-01).
      if (isFetchConnectivityFailure(error)) {
        setCertificateConnectivityAlert(true);
        setCertificateError(null);
        setCertificateErrorFiscalCode(null);
      } else {
        setCertificateConnectivityAlert(false);
        const rawMessage = error instanceof Error ? error.message : 'Erro ao enviar certificado.';
        const isInscricaoMunicipalError = /inscri[cç][aã]o\s*municipal/i.test(rawMessage);
        const fiscalCode = getFiscalErrorCode(error);
        const fallbackMessage = isInscricaoMunicipalError
          ? 'Seu município exige inscrição municipal para emissão de NFS-e. Preencha o campo "Inscrição municipal" no formulário acima e tente novamente.'
          : formatFiscalError(rawMessage, fiscalCode);
        setCertificateErrorFiscalCode(fiscalCode);
        setCertificateError(
          uploadedToMei
            ? `Certificado enviado no MEI, mas falhou a configuração automática da integração fiscal: ${fallbackMessage}`
            : fallbackMessage
        );
      }
    } finally {
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

  const resolveCnpjParaEmissor = () => {
    const fromContrib = normalizeDoc(contribuinteDoc);
    if (fromContrib.length === 14) return fromContrib;
    const fromPrestador = normalizeDoc(nfseForm.prestadorCpfCnpj || '');
    if (fromPrestador.length === 14) return fromPrestador;
    return '';
  };

  const handleConsultarCadastroEmissor = async () => {
    setNfEmissionCompanySyncError(null);
    setNfEmissionCompanySyncSuccess(null);
    const cnpj = resolveCnpjParaEmissor();
    if (cnpj.length !== 14) {
      setNfEmissionCompanySyncError(
        'Informe um CNPJ válido (14 dígitos) no campo CNPJ do MEI ou no prestador da NFSe.'
      );
      return;
    }
    setNfEmissionCompanySyncLoading('consult');
    try {
      const data = (await consultarEmpresaEmissaoNf(cnpj)) as Record<string, unknown>;
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
    } catch (error) {
      setNfEmissionCompanySyncError(
        formatMeiFiscalErr(error, 'Falha ao consultar cadastro no serviço de emissão fiscal.')
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleAtualizarCadastroSemNovoCertificado = async () => {
    setNfEmissionCompanySyncError(null);
    setNfEmissionCompanySyncSuccess(null);
    const companyValidationMessage = getNfEmissionCompanyValidationMessage(nfEmissionCompanyForm);
    if (companyValidationMessage) {
      setNfEmissionCompanySyncError(companyValidationMessage);
      return;
    }
    const cnpj = resolveCnpjParaEmissor();
    if (cnpj.length !== 14) {
      setNfEmissionCompanySyncError(
        'CNPJ de 14 dígitos é obrigatório (campo CNPJ do MEI ou prestador na NFSe).'
      );
      return;
    }
    setNfEmissionCompanySyncLoading('patch');
    setNfseEmitentePendingApply(null);
    try {
      const companyPayload = buildNfEmissionEmpresaPayload({
        cnpj,
        form: nfEmissionCompanyForm
      });
      const companyResponse = await atualizarEmpresaEmissaoNf(companyPayload);
      let updatedStatus;
      try {
        updatedStatus = await patchMeiCertificateEmitenteNfse(
          nfEmissionFormToPersistBody(nfEmissionCompanyForm)
        );
      } catch (persistErr) {
        const msg = persistErr instanceof Error ? persistErr.message : String(persistErr);
        setNfEmissionCompanySyncError(
          `Empresa atualizada no emissor fiscal, mas os dados não foram gravados nesta aplicação: ${msg}`
        );
        return;
      }
      if (updatedStatus?.nfseEmitente) {
        setNfEmissionCompanyForm(emitenteSnapshotToForm(updatedStatus.nfseEmitente));
        nfseEmitenteHydratedRef.current = true;
        setNfseEmitentePendingApply(updatedStatus.nfseEmitente);
      }
      setNfEmissionCompanySyncSuccess(
        companyResponse.message || 'Empresa atualizada no serviço de emissão fiscal com sucesso.'
      );
    } catch (error) {
      setNfEmissionCompanySyncError(
        formatMeiFiscalErr(error, 'Falha ao atualizar empresa no serviço de emissão fiscal.')
      );
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleSalvarDadosEmitente = async () => {
    setNfEmissionCompanySyncError(null);
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
      setNfEmissionCompanySyncError(formatMeiFiscalErr(error, 'Falha ao salvar dados do emitente.'));
    } finally {
      setNfEmissionCompanySyncLoading(null);
    }
  };

  const handleCertificateRemove = async () => {
    setCertificateError(null);
    setCertificateErrorFiscalCode(null);
    setCertificateConnectivityAlert(false);
    setCertificateSuccess(null);
    setIsRemovingCert(true);
    try {
      await removeMeiCertificate();
      nfseEmitenteHydratedRef.current = false;
      setNfseEmitentePendingApply(null);
      setNfEmissionCompanyForm(getDefaultNfEmissionCompanyForm());
      setNfseForm((current) => ({
        ...current,
        prestadorRazaoSocial: '',
        prestadorEmail: '',
        prestadorEndereco: emptyNfsePrestadorEndereco(),
        prestadorCpfCnpj: ''
      }));
      await loadCertificateStatus();
    } catch (error) {
      if (isFetchConnectivityFailure(error)) {
        setCertificateConnectivityAlert(true);
        setCertificateError(null);
        setCertificateErrorFiscalCode(null);
      } else {
        setCertificateConnectivityAlert(false);
        setCertificateErrorFiscalCode(null);
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
      setValidationError('CNPJ do MEI deve ter 14 dígitos.');
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
      setValidationError(error instanceof Error ? error.message : 'Erro ao validar CNPJ.');
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

  const applyBrasilApiToEmitente = (data: BrasilApiCnpjResponse) => {
    setNfEmissionCompanyForm((prev) => mergeIfEmpty(prev, {
      razaoSocial: data.razao_social ?? '',
      nomeFantasia: data.nome_fantasia ?? '',
      email: data.email ?? '',
      logradouro: data.logradouro ?? '',
      numero: data.numero ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cep: (data.cep ?? '').replace('-', ''),
      descricaoCidade: data.municipio ?? '',
      codigoCidade: data.codigo_municipio ?? '',
      estado: data.uf ?? '',
      simplesNacional: data.simples?.optante_simples_nacional ?? prev.simplesNacional,
    }));
  };

  const handleCnpjMeiBlur = async () => {
    await handleValidateBlur();
    const digits = normalizeDoc(contribuinteDoc);
    if (digits.length !== 14) return;
    setBrasilApiError(null);
    setBrasilApiLoading(true);
    try {
      const data = await fetchBrasilApiCnpj(digits);
      applyBrasilApiToEmitente(data);
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
      const data = await fetchBrasilApiCnpj(digits);
      updateNfseForm(mergeIfEmpty(
        {
          prestadorRazaoSocial: nfseForm.prestadorRazaoSocial,
          prestadorEmail: nfseForm.prestadorEmail,
        } as Record<string, unknown>,
        {
          prestadorRazaoSocial: data.razao_social ?? '',
          prestadorEmail: data.email ?? '',
        }
      ) as { prestadorRazaoSocial: string; prestadorEmail: string });
      const currentEndereco = nfseForm.prestadorEndereco ?? {};
      const merged = mergeIfEmpty(
        currentEndereco as Record<string, unknown>,
        {
          logradouro: data.logradouro ?? '',
          numero: data.numero ?? '',
          complemento: data.complemento ?? '',
          bairro: data.bairro ?? '',
          cep: (data.cep ?? '').replace('-', ''),
          codigoCidade: data.codigo_municipio ?? '',
          descricaoCidade: data.municipio ?? '',
          estado: data.uf ?? '',
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
        if (nfseForm.prestadorInscricaoMunicipal?.trim()) {
          payload.prestadorInscricaoMunicipal = nfseForm.prestadorInscricaoMunicipal.trim();
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
        if (nfseForm.idIntegracao?.trim()) {
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
      const created = await emitirNfse(payload);
      const docLabel = GUIA_MEI_NFSE_DOCUMENT_LABEL;
      setNfseSuccess(
        created?.protocol
          ? `${docLabel} enviada. Protocolo ${created.protocol}.`
          : `${docLabel} enviada. Acompanhe o status na lista.`
      );
      await Promise.all([loadNfseList(), loadNfseCatalog()]);
      setSelectedCatalogClienteId('');
      setSelectedCatalogProdutoId('');
    } catch (error) {
      setEmissionNfseError(formatMeiFiscalErr(error, 'Erro ao emitir nota fiscal.'));
    } finally {
      setNfseSubmitting(false);
    }
  };

  const handleSyncNfse = async (id: string) => {
    const actionKey = `${id}:sync`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    clearNfseErrorState();
    setNfseSuccess(null);
    try {
      const updated = await obterNfse(id, true);
      setNfseList((current) => current.map((item) => (item.id === id ? updated : item)));
      setNfseSuccess('Status da NFSe atualizado com sucesso.');
    } catch (error) {
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao atualizar NFSe.'));
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
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao baixar PDF da NFSe.'));
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
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao baixar XML da NFSe.'));
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
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao atualizar NFSe.'));
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
      const updated = await cancelarNfse(record.id, {
        ...(reason.trim() ? { reason: reason.trim() } : {})
      });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess('Solicitação de cancelamento processada.');
    } catch (error) {
      setOperationNfseError(formatMeiFiscalErr(error, 'Erro ao cancelar nota fiscal.'));
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
      setNfseSuccess(!isArchived ? 'Nota fiscal arquivada com sucesso.' : 'Nota fiscal desarquivada com sucesso.');
    } catch (error) {
      setOperationNfseError(
        formatMeiFiscalErr(error, 'Erro ao atualizar arquivamento da nota fiscal.')
      );
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
      if (
        nfseDocumentTypeFilter !== 'all'
        && String(item.document_type || '').toUpperCase() !== nfseDocumentTypeFilter
      ) {
        return false;
      }
      if (nfseStatusFilter !== 'all' && getNfseStatusKey(item.status) !== nfseStatusFilter) {
        return false;
      }
      if (nfsePeriodFilter !== 'all' && toNfsePeriodKey(item.created_at) !== nfsePeriodFilter) {
        return false;
      }
      return true;
    });
  }, [nfseDocumentTypeFilter, nfseList, nfsePeriodFilter, nfseStatusFilter]);

  const resetNfseListFilters = useCallback(() => {
    setNfseStatusFilter('all');
    setNfsePeriodFilter('all');
    setNfseDocumentTypeFilter('all');
    setNfseShowArchived(false);
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
          Cadastre clientes e serviços para usar atalhos, ou preencha o formulário abaixo manualmente.{' '}
          {inRouter ? (
            <>
              <Link to="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                Gerir clientes
              </Link>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                {' · '}
              </span>
              <Link to="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                Gerir serviços e produtos
              </Link>
            </>
          ) : (
            <>
              <a href="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                Gerir clientes
              </a>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                {' · '}
              </span>
              <a href="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                Gerir serviços e produtos
              </a>
            </>
          )}
        </p>
      );
    }
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Use os atalhos na secção &quot;Antes de emitir&quot; ou preencha tomador e serviço para emitir.
      </p>
    );
  }, [
    catalogoClientesLinkClass,
    inRouter,
    nfEmissionCompanyForm.razaoSocial,
    nfseCatalogClientes.length,
    nfseCatalogLoading,
    nfseCatalogProdutos.length,
    setActiveWorkspace
  ]);

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
        />
      );
    }
    if (nfEmissionCompanySyncError) {
      nodes.push(
        <div key="nfse-fb-sync" className="admin-alert-danger text-xs">
          {nfEmissionCompanySyncError}
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
    hasUserCertificate,
    nfEmissionCompanyForm.razaoSocial,
    nfEmissionCompanySyncError,
    nfseEmitentePendingApply,
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
        label: 'NFS-e',
        description: 'Notas de serviço: emissão e acompanhamento',
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

  return (
    <>
      <div className="admin-page-shell">
        <section className="admin-hero">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="admin-hero-title">Mei Infinito</h1>
              <p className="admin-hero-subtitle">
                {canViewNfse
                  ? 'Gerencie certificado, DAS e emissão de NFS-e (notas de serviço) no mesmo fluxo.'
                  : 'Gerencie certificado e DAS no mesmo fluxo.'}
              </p>
              {canViewNfse ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {inRouter ? (
                    <>
                      <Link to="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                        Catálogo de clientes (NFS-e)
                      </Link>
                      <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                        ·
                      </span>
                      <Link to="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                        Serviços e produtos (NFS-e)
                      </Link>
                    </>
                  ) : (
                    <>
                      <a href="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                        Catálogo de clientes (NFS-e)
                      </a>
                      <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                        ·
                      </span>
                      <a href="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                        Serviços e produtos (NFS-e)
                      </a>
                    </>
                  )}
                </p>
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
                  <button
                    type="button"
                    className="planner-button-secondary w-full self-stretch sm:w-auto sm:self-start"
                    onClick={() => setActiveWorkspace('nfse')}
                  >
                    Abrir NFS-e
                  </button>
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

          {!hasCertificate && (
            <div className="admin-alert-warning">
              Opcional: envie o certificado para autenticar. Sem certificado, informe o CNPJ e
              selecione o período abaixo para gerar o DAS.
            </div>
          )}

          {canViewNfse ? (
            <div className="admin-alert-warning">
              Atenção: para emissão de NFS-e, a empresa emitente precisa estar cadastrada no emissor fiscal com certificado
              digital A1 válido.
            </div>
          ) : null}

          {certificateConnectivityAlert ? <GuiaMeiCertificateConnectivityPanel /> : null}
          {certificateError ? (
            <GuiaMeiEmpresaCadastroErrorPanel
              message={certificateError}
              fiscalErrorCode={certificateErrorFiscalCode}
            />
          ) : null}

          {certificateSuccess && (
            <div className="admin-alert-success">
              {certificateSuccess}
            </div>
          )}

          {nfEmissionCompanySyncError ? (
            <GuiaMeiEmpresaCadastroErrorPanel message={nfEmissionCompanySyncError} />
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

          {validationError && (
            <div className="admin-alert-danger">
              {validationError}
            </div>
          )}

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
                    setCertificatePassword(event.target.value);
                  }}
                  placeholder="Senha do certificado"
                />
              </div>

              {canViewNfse ? (
                <div className="rounded-xl border border-slate-300/80 bg-white/70 p-3 dark:border-slate-700/80 dark:bg-slate-950/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dados mínimos para emissão de NFS-e
                  </p>
                  <p className="admin-field-hint mb-2">
                    Campos com * são obrigatórios para a configuração inicial. A inscrição estadual não é solicitada (política MEI). A inscrição municipal é opcional — preencha apenas se o seu município exigir para emissão de NFS-e.
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
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
                      placeholder="Email fiscal (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={nfEmissionCompanyForm.inscricaoMunicipal}
                      onChange={(event) => updateNfEmissionCompanyForm({ inscricaoMunicipal: event.target.value })}
                      placeholder="Inscrição municipal (se exigida pelo município)"
                    />
                    <select
                      className="planner-input-compact"
                      value={nfEmissionCompanyForm.regimeTributario}
                      onChange={(event) => updateNfEmissionCompanyForm({
                        regimeTributario: event.target.value as NfEmissionRegimeTributario
                      })}
                    >
                      <option value="1">Regime tributário: Simples Nacional (1)</option>
                      <option value="2">Regime tributário: Simples excesso sublimite (2)</option>
                      <option value="3">Regime tributário: Regime normal (3)</option>
                    </select>
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
                  <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
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
              ) : null}

              <div className="admin-actions">
                <button
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleCertificateUpload}
                  disabled={isUploadingCert || !certificateFile || !certificatePassword}
                >
                  {isUploadingCert ? (canViewNfse ? 'Enviando e configurando...' : 'Enviando...') : 'Enviar certificado'}
                </button>
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
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void loadMeiPeriods()}
              disabled={!canLoadPeriods || meiPeriodsLoading}
            >
              {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar histórico'}
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

          <div className="admin-alert-warning">
            Atenção: para emissão de NFS-e, a empresa emitente precisa estar cadastrada no emissor fiscal com certificado
            digital A1 válido.
          </div>

          {canViewNfse && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/50">
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
          {nfEmissionCompanySyncError && (
            <div className="admin-alert-danger text-xs">{nfEmissionCompanySyncError}</div>
          )}
          {nfEmissionCompanySyncSuccess && (
            <div className="admin-alert-success text-xs">{nfEmissionCompanySyncSuccess}</div>
          )}

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
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {inRouter ? (
                <>
                  <Link to="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                    Gerir clientes
                  </Link>
                  <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                    ·
                  </span>
                  <Link to="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                    Gerir serviços e produtos
                  </Link>
                </>
              ) : (
                <>
                  <a href="/mei-catalogo/clientes" className={catalogoClientesLinkClass}>
                    Gerir clientes
                  </a>
                  <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                    ·
                  </span>
                  <a href="/mei-catalogo/servicos-produtos" className={catalogoClientesLinkClass}>
                    Gerir serviços e produtos
                  </a>
                </>
              )}
            </p>

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
              <h2 id="mei-nfse-emit-heading" className="admin-section-title">{`Emitir ${GUIA_MEI_NFSE_DOCUMENT_LABEL}`}</h2>
              <p className="admin-section-subtitle">
                Preencha os dados fiscais para emissão pelo sistema integrado.
                Após o envio, mensagens de rejeição ou validação costumam vir do provedor de emissão fiscal, não deste aplicativo.
              </p>
              <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-700/80" role="status" aria-live="polite">
                {nfseWorkspaceGuidance}
              </div>
            </div>
          </div>

          <MeiNfseAjudaFiscalCollapsible
            open={nfseEmitDisclosure.ajudaFiscal}
            onToggle={() => toggleNfseEmitSection('ajudaFiscal')}
          >
            <p className="admin-field-hint text-xs leading-relaxed">
              Campos obrigatórios: CNPJ e endereço mínimo do prestador, CPF/CNPJ e razão social do tomador, código do serviço, CNAE, valor e discriminação. MEI no Simples Nacional: não se informa alíquota ISS — a prefeitura/provedor aplicam a regra.
            </p>
          </MeiNfseAjudaFiscalCollapsible>

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
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Código IBGE da cidade do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.codigoCidade || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ codigoCidade: event.target.value })}
                placeholder="3304557"
              />
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
              className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-300"
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
                  value={nfseForm.cidadePrestacao?.codigo || ''}
                  onChange={(event) => updateNfseCidade({ codigo: event.target.value })}
                  placeholder="Código IBGE"
                />
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

          <div className="admin-actions">
            <button
              type="button"
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleEmitNfse}
              disabled={nfseSubmitting}
              aria-invalid={Boolean(nfseValidationMessage)}
            >
              {nfseSubmitting ? 'Enviando...' : `Emitir ${GUIA_MEI_NFSE_DOCUMENT_LABEL}`}
            </button>
          </div>

          <div
            id="mei-nfse-emit-feedback"
            className="mt-4 space-y-3"
            role="region"
            aria-label={`Feedback de emissão de ${GUIA_MEI_NFSE_DOCUMENT_LABEL}`}
          >
            {nfseEmitFeedbackTier1}
            {nfseValidationMessage ? (
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
            {nfseError && nfseErrorKind === 'emission' ? (
              <div data-nfse-feedback-tier="emission-error">
                <EmissaoFiscalErrorAlert documentTypeLabel={GUIA_MEI_NFSE_DOCUMENT_LABEL} message={nfseError} />
              </div>
            ) : null}
            {nfseError && nfseErrorKind === 'operation' ? (
              <div data-nfse-feedback-tier="provider-error">
                <FiscalProviderErrorAlert message={nfseError} />
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
                  Tipo na lista
                </label>
                <select
                  id="nfse-filter-lista-tipo"
                  className="planner-input-compact w-full"
                  value={nfseDocumentTypeFilter}
                  onChange={(event) => setNfseDocumentTypeFilter(event.target.value as 'all' | 'NFSE')}
                >
                  <option value="all">Todas (histórico)</option>
                  <option value="NFSE">Somente NFSe</option>
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
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400" htmlFor="nfse-filter-arquivadas">
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
                onClick={() => void loadNfseList()}
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
                    onClick={() => void loadNfseList()}
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
                Nenhuma nota corresponde aos filtros atuais.
              </p>
              <button type="button" className="planner-button-secondary-compact" onClick={resetNfseListFilters}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredNfseList.map((item) => {
                  const statusKey = getNfseStatusKey(item.status);
                  const rowBusy = isNfseRowBusy(item.id);
                  const metadata = toNfseMetadata(item.metadata_json);
                  const reviewRequested = Boolean(metadata.reviewRequested);
                  const isArchived = Boolean(item.archived_at);
                  return (
                    <div key={item.id} className="admin-user-card">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                            {item.id_integracao || item.plugnotas_id || item.id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            Emitida em {formatDateTime(item.created_at)}
                            {item.document_type ? ` • Tipo ${item.document_type}` : ''}
                            {item.protocol ? ` • Protocolo ${item.protocol}` : ''}
                          </p>
                        </div>
                        <div className="admin-actions">
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
              <div className="hidden lg:block" aria-label="Lista de notas em tabela">
                <div className="admin-table-shell">
                  <div className="admin-table-wrap">
                    <table className="admin-table w-full">
                      <thead className="admin-table-head">
                        <tr>
                          <th className="admin-table-cell text-left">ID / Integração</th>
                          <th className="admin-table-cell text-left">Data</th>
                          <th className="admin-table-cell text-left">Status</th>
                          <th className="admin-table-cell text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNfseList.map((item) => {
                          const statusKey = getNfseStatusKey(item.status);
                          const rowBusy = isNfseRowBusy(item.id);
                          const metadata = toNfseMetadata(item.metadata_json);
                          const reviewRequested = Boolean(metadata.reviewRequested);
                          const isArchived = Boolean(item.archived_at);
                          return (
                            <tr key={item.id} className="admin-table-row">
                              <td className="admin-table-cell align-top">
                                <div className="font-semibold text-slate-700 dark:text-gray-200">
                                  {item.id_integracao || item.plugnotas_id || item.id}
                                </div>
                                {item.protocol ? (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Protocolo {item.protocol}
                                  </div>
                                ) : null}
                              </td>
                              <td className="admin-table-cell align-top text-xs text-slate-600 dark:text-slate-300">
                                {formatDateTime(item.created_at)}
                                {item.document_type ? (
                                  <>
                                    <br />
                                    <span className="text-slate-500">{item.document_type}</span>
                                  </>
                                ) : null}
                              </td>
                              <td className="admin-table-cell align-top">
                                <div className="flex flex-wrap gap-1">
                                  <span className={getNfseStatusBadgeClass(item.status)}>
                                    {formatNfseStatus(item.status)}
                                  </span>
                                  {isArchived && <span className="admin-badge-neutral">Arquivada</span>}
                                  {reviewRequested && <span className="admin-badge-warning">Revisão</span>}
                                </div>
                              </td>
                              <td className="admin-table-cell align-top">
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
                                  layout="table"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
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
