import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  downloadMeiGuide,
  fetchMeiCertificateStatus,
  fetchMeiPeriods,
  fetchMeiPeriodsByCnpj,
  removeMeiCertificate,
  uploadMeiCertificate,
  validateMeiGuide,
  type MeiPeriod
} from '../services/guidesMeiService';
import {
  arquivarNfse,
  atualizarNfse,
  baixarNfsePdf,
  baixarNfseXml,
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
  return status === 'pago' ? 'Pago' : 'Pendente';
};

const getDasStatusClasses = (status?: MeiPeriod['status'] | null) => {
  if (status === 'pago') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
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

const getNfseValidationMessage = (input: EmitirNfseInput) => {
  const prestadorCpfCnpj = normalizeDoc(input.prestadorCpfCnpj || '');
  if (prestadorCpfCnpj.length !== 14) {
    return 'Informe um CNPJ válido do prestador.';
  }

  const tomadorCpfCnpj = normalizeDoc(input.tomadorCpfCnpj || '');
  if (tomadorCpfCnpj && tomadorCpfCnpj.length !== 11 && tomadorCpfCnpj.length !== 14) {
    return 'CPF/CNPJ do tomador inválido.';
  }

  const servico = input.servico;
  if (!servico) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  if (
    !hasRequiredText(servico.codigo)
    || !hasRequiredText(servico.cnae)
    || !hasRequiredText(servico.discriminacao)
    || !hasRequiredText(servico.aliquota)
    || !hasRequiredText(servico.valorServico)
  ) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  return null;
};

export default function GuidesMei() {
  const [contribuinteDoc, setContribuinteDoc] = useState('');
  const defaultPeriod = useMemo(() => getDefaultPeriod(), []);
  const [selectedYear, setSelectedYear] = useState<number>(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultPeriod.month);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isRemovingCert, setIsRemovingCert] = useState(false);
  const [hasUserCertificate, setHasUserCertificate] = useState(false);
  const [hasServerCertificate, setHasServerCertificate] = useState(false);
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
    prestadorInscricaoMunicipal: '',
    prestadorRazaoSocial: '',
    prestadorEmail: '',
    tomadorCpfCnpj: '',
    tomadorRazaoSocial: '',
    tomadorEmail: '',
    servico: {
      codigo: '',
      discriminacao: '',
      cnae: '',
      aliquota: '',
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
  const [nfseSuccess, setNfseSuccess] = useState<string | null>(null);
  const [nfseCatalogLoading, setNfseCatalogLoading] = useState(false);
  const [nfseCatalogError, setNfseCatalogError] = useState<string | null>(null);
  const [nfseCatalogClientes, setNfseCatalogClientes] = useState<NfseCatalogCliente[]>([]);
  const [nfseCatalogProdutos, setNfseCatalogProdutos] = useState<NfseCatalogProduto[]>([]);
  const [selectedCatalogClienteId, setSelectedCatalogClienteId] = useState('');
  const [selectedCatalogProdutoId, setSelectedCatalogProdutoId] = useState('');
  const [nfseStatusFilter, setNfseStatusFilter] = useState('all');
  const [nfsePeriodFilter, setNfsePeriodFilter] = useState('all');
  const [nfseShowArchived, setNfseShowArchived] = useState(false);
  const nfseValidationMessage = useMemo(() => getNfseValidationMessage(nfseForm), [nfseForm]);

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
      applyDocumento(status.documento);
    } catch {
      setHasUserCertificate(false);
      setHasServerCertificate(false);
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
    setNfseLoading(true);
    setNfseError(null);
    try {
      const list = await listarNfse({ includeArchived: nfseShowArchived });
      setNfseList(list);
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao listar NFSe.');
    } finally {
      setNfseLoading(false);
    }
  }, [nfseShowArchived]);

  const loadNfseCatalog = useCallback(async () => {
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
      setNfseCatalogError(error instanceof Error ? error.message : 'Erro ao carregar catálogo de NFSe.');
    } finally {
      setNfseCatalogLoading(false);
    }
  }, []);

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
    updateNfseServico({
      codigo: selected.codigo || '',
      cnae: selected.cnae || '',
      discriminacao: selected.discriminacao || '',
      aliquota: selected.aliquota ?? '',
      valorServico: selected.valor_sugerido ?? ''
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
    if (!normalizedContribuinte) return;
    setNfseForm((current) => (
      current.prestadorCpfCnpj
        ? current
        : { ...current, prestadorCpfCnpj: formatDocument(normalizedContribuinte) }
    ));
  }, [normalizedContribuinte]);

  useEffect(() => {
    setValidationError(null);
    setValidationSuccess(null);
  }, [normalizedContribuinte, selectedMonth, selectedYear, hasUserCertificate]);

  const handleDownload = async (periodoApuracao: string, competencia?: string | null) => {
    const { blob, filename } = await downloadMeiGuide(
      normalizedContribuinte,
      periodoApuracao,
      normalizedContribuinte ? { numero: normalizedContribuinte, tipo: contribuinteTipo } : undefined
    );
    triggerFileDownload(blob, filename || buildFilenameFromCompetencia(competencia || null));
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setCertificateError('Selecione o arquivo do certificado.');
      return;
    }
    if (!certificatePassword) {
      setCertificateError('Informe a senha do certificado.');
      return;
    }
    setCertificateError(null);
    setIsUploadingCert(true);
    try {
      const status = await uploadMeiCertificate(certificateFile, certificatePassword);
      applyDocumento(status.documento, true);
      setCertificateFile(null);
      setCertificatePassword('');
      await loadCertificateStatus();
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : 'Erro ao enviar certificado.');
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleCertificateRemove = async () => {
    setCertificateError(null);
    setIsRemovingCert(true);
    try {
      await removeMeiCertificate();
      await loadCertificateStatus();
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : 'Erro ao remover certificado.');
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

  const handleEmitNfse = async () => {
    if (nfseSubmitting) return;
    setNfseError(null);
    setNfseSuccess(null);

    if (nfseValidationMessage) {
      setNfseError(nfseValidationMessage);
      return;
    }

    const prestadorCpfCnpj = normalizeDoc(nfseForm.prestadorCpfCnpj);
    const tomadorCpfCnpj = normalizeDoc(nfseForm.tomadorCpfCnpj || '');
    const servico = nfseForm.servico;

    const payload: EmitirNfseInput = {
      prestadorCpfCnpj,
      servico: {
        codigo: servico.codigo.trim(),
        cnae: servico.cnae.trim(),
        discriminacao: servico.discriminacao.trim(),
        aliquota: servico.aliquota,
        valorServico: servico.valorServico
      },
      enviarEmail: Boolean(nfseForm.enviarEmail)
    };

    if (nfseForm.prestadorInscricaoMunicipal?.trim()) {
      payload.prestadorInscricaoMunicipal = nfseForm.prestadorInscricaoMunicipal.trim();
    }
    if (nfseForm.prestadorRazaoSocial?.trim()) {
      payload.prestadorRazaoSocial = nfseForm.prestadorRazaoSocial.trim();
    }
    if (nfseForm.prestadorEmail?.trim()) {
      payload.prestadorEmail = nfseForm.prestadorEmail.trim();
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

    setNfseSubmitting(true);
    try {
      const created = await emitirNfse(payload);
      setNfseSuccess(
        created?.protocol
          ? `NFSe enviada. Protocolo ${created.protocol}.`
          : 'NFSe enviada. Acompanhe o status na lista.'
      );
      await Promise.all([loadNfseList(), loadNfseCatalog()]);
      setSelectedCatalogClienteId('');
      setSelectedCatalogProdutoId('');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao emitir NFSe.');
    } finally {
      setNfseSubmitting(false);
    }
  };

  const handleSyncNfse = async (id: string) => {
    const actionKey = `${id}:sync`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await obterNfse(id, true);
      setNfseList((current) => current.map((item) => (item.id === id ? updated : item)));
      setNfseSuccess('Status da NFSe atualizado com sucesso.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfsePdf = async (record: NfseRecord) => {
    const actionKey = `${record.id}:pdf`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfsePdf(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.pdf`);
      setNfseSuccess('Download do PDF iniciado.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao baixar PDF da NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfseXml = async (record: NfseRecord) => {
    const actionKey = `${record.id}:xml`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfseXml(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.xml`);
      setNfseSuccess('Download do XML iniciado.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao baixar XML da NFSe.');
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
    setNfseError(null);
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
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleCancelNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:cancel`;
    if (isNfseActionLoading(actionKey)) return;
    if (!window.confirm('Deseja solicitar o cancelamento desta NFSe?')) return;

    const reason = window.prompt('Motivo do cancelamento (opcional):', '') || '';
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await cancelarNfse(record.id, {
        ...(reason.trim() ? { reason: reason.trim() } : {})
      });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess('Solicitação de cancelamento processada.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao cancelar NFSe.');
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
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await arquivarNfse(record.id, { archived: !isArchived });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess(!isArchived ? 'NFSe arquivada com sucesso.' : 'NFSe desarquivada com sucesso.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar arquivamento da NFSe.');
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
      if (nfseStatusFilter !== 'all' && getNfseStatusKey(item.status) !== nfseStatusFilter) {
        return false;
      }
      if (nfsePeriodFilter !== 'all' && toNfsePeriodKey(item.created_at) !== nfsePeriodFilter) {
        return false;
      }
      return true;
    });
  }, [nfseList, nfsePeriodFilter, nfseStatusFilter]);

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
      <h1 className="text-xl md:text-2xl font-bold mb-1 mt-2 dark:text-white">Meu MEI</h1>
      <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 mb-4">
        Envie o certificado do cliente ou informe o CNPJ do MEI e o período para baixar a guia.
      </p>

      <div className="mt-4 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold dark:text-gray-200">
              Certificado digital (opcional)
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400">
              Envie o certificado PFX do cliente para gerar a guia em nome dele, ou use apenas o CNPJ e o período na seção abaixo para baixar sem certificado.
            </div>
          </div>
          {hasUserCertificate && (
            <span className="planner-chip dark:bg-blue-900/30 dark:text-blue-200">
              Certificado do cliente ativo
            </span>
          )}
          {!hasUserCertificate && hasServerCertificate && (
            <span className="planner-chip dark:bg-blue-900/30 dark:text-blue-200">
              Certificado do servidor disponível
            </span>
          )}
        </div>
        {hasUserCertificate && (
          <div className="mt-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            Certificado do cliente em uso. Ele expira após algumas horas ou ao reiniciar o servidor.
          </div>
        )}
        {!hasCertificate && (
          <div className="mt-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Opcional: envie o certificado do cliente (PFX) para autenticar via certificado. Para baixar sem certificado, preencha o CNPJ do MEI e escolha o período abaixo.
          </div>
        )}
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
            CNPJ do MEI
          </label>
          <input
            className="planner-input-compact w-full md:max-w-xs"
            type="text"
            inputMode="numeric"
            value={contribuinteDoc}
            onChange={(event) => setContribuinteDoc(formatDocument(event.target.value))}
            onBlur={handleValidateBlur}
            placeholder="00.000.000/0001-00"
          />
          {validationSuccess && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{validationSuccess}</div>
          )}
          {validationError && (
            <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">{validationError}</div>
          )}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px]">
          <input
            className="planner-input-compact"
            type="file"
            accept=".pfx,.p12"
            onChange={(event) => setCertificateFile(event.target.files?.[0] || null)}
          />
          <input
            className="planner-input-compact"
            type="password"
            value={certificatePassword}
            onChange={(event) => setCertificatePassword(event.target.value)}
            placeholder="Senha do certificado"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="planner-button-compact"
            onClick={handleCertificateUpload}
            disabled={isUploadingCert || !certificateFile || !certificatePassword}
          >
            {isUploadingCert ? 'Enviando...' : 'Enviar certificado'}
          </button>
          {hasUserCertificate && (
            <button
              className="planner-button-compact md:w-auto"
              onClick={handleCertificateRemove}
              disabled={isRemovingCert}
            >
              {isRemovingCert ? 'Removendo...' : 'Remover certificado'}
            </button>
          )}
        </div>
        {certificateError && (
          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">{certificateError}</div>
        )}
      </div>

      <div className="mt-5 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-base md:text-lg font-semibold dark:text-white">Período da guia</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
          Selecione o mês e o ano para gerar o DAS.
        </p>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Mês</label>
            <select
              className="planner-input-compact"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Ano</label>
            <select
              className="planner-input-compact"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button
            className="planner-button-compact md:w-40"
            onClick={handleDownloadClick}
            disabled={isDownloadingGuide || !normalizedContribuinte || normalizedContribuinte.length !== 14}
          >
            {isDownloadingGuide ? 'Baixando...' : 'Baixar guia'}
          </button>
        </div>
        {periodError && (
          <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">{periodError}</div>
        )}
      </div>

      <div className="mt-5 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <div>
            <h2 className="text-base md:text-lg font-semibold dark:text-white">Histórico do DAS</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Últimos períodos consultados e situação do pagamento.
            </p>
          </div>
          <button
            className="planner-button-compact"
            onClick={() => void loadMeiPeriods()}
            disabled={!canLoadPeriods || meiPeriodsLoading}
          >
            {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar histórico'}
          </button>
        </div>

        {!canLoadPeriods ? (
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Informe o CNPJ do MEI para consultar meses pagos.
          </div>
        ) : meiPeriodsLoading ? (
          <div className="text-sm text-slate-500 dark:text-gray-400">Carregando histórico...</div>
        ) : meiPeriodsError ? (
          <div className="text-sm text-rose-600 dark:text-rose-400">{meiPeriodsError}</div>
        ) : meiPeriods.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-gray-400">Nenhum período encontrado.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {meiPeriods.map((period) => (
              <div
                key={`${period.competencia || 'period'}-${period.guideId || period.status}`}
                className="flex items-center justify-between rounded-lg border border-slate-200/70 dark:border-slate-700 px-3 py-2"
              >
                <div className="text-sm text-slate-700 dark:text-gray-200">
                  {formatDasCompetenciaLabel(period.competencia)}
                </div>
                <span className={`planner-chip ${getDasStatusClasses(period.status)}`}>
                  {getDasStatusLabel(period.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        {!hasUserCertificate && canLoadPeriods && (
          <div className="mt-2 text-xs text-slate-500 dark:text-gray-400">
            Consulta via CNPJ sem certificado. Se houver falha, envie o certificado do cliente.
          </div>
        )}
      </div>

      <div className="mt-5 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-base md:text-lg font-semibold dark:text-white">Emitir NFSe</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
          Preencha os dados essenciais para emissão da NFSe via PlugNotas.
        </p>
        <div className="grid gap-3 md:grid-cols-2 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
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
        {nfseCatalogLoading && (
          <div className="mb-3 text-xs text-slate-500 dark:text-gray-400">Atualizando catálogo de clientes e serviços...</div>
        )}
        {nfseCatalogError && (
          <div className="mb-3 text-xs text-rose-600 dark:text-rose-400">{nfseCatalogError}</div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              CNPJ do prestador
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              inputMode="numeric"
              value={nfseForm.prestadorCpfCnpj}
              onChange={(event) => updateNfseForm({
                prestadorCpfCnpj: formatDocument(event.target.value)
              })}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Inscrição municipal (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              value={nfseForm.prestadorInscricaoMunicipal}
              onChange={(event) => updateNfseForm({ prestadorInscricaoMunicipal: event.target.value })}
              placeholder="Inscrição municipal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Razão social do prestador (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              value={nfseForm.prestadorRazaoSocial}
              onChange={(event) => updateNfseForm({ prestadorRazaoSocial: event.target.value })}
              placeholder="Razão social"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Email do prestador (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="email"
              value={nfseForm.prestadorEmail}
              onChange={(event) => updateNfseForm({ prestadorEmail: event.target.value })}
              placeholder="email@prestador.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              CPF/CNPJ do tomador (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              inputMode="numeric"
              value={nfseForm.tomadorCpfCnpj}
              onChange={(event) => updateNfseForm({
                tomadorCpfCnpj: formatDocument(event.target.value)
              })}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Razão social do tomador (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              value={nfseForm.tomadorRazaoSocial}
              onChange={(event) => updateNfseForm({ tomadorRazaoSocial: event.target.value })}
              placeholder="Razão social"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Email do tomador (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="email"
              value={nfseForm.tomadorEmail}
              onChange={(event) => updateNfseForm({ tomadorEmail: event.target.value })}
              placeholder="email@tomador.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              ID de integração (opcional)
            </label>
            <input
              className="planner-input-compact w-full"
              type="text"
              value={nfseForm.idIntegracao}
              onChange={(event) => updateNfseForm({ idIntegracao: event.target.value })}
              placeholder="NFSE-123"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold dark:text-gray-200 mb-2">Serviço</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
                Código do serviço
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.servico.codigo}
                onChange={(event) => updateNfseServico({ codigo: event.target.value })}
                placeholder="1.02"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
                CNAE
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.servico.cnae}
                onChange={(event) => updateNfseServico({ cnae: event.target.value })}
                placeholder="6201500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
                Alíquota ISS (%)
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="decimal"
                value={nfseForm.servico.aliquota}
                onChange={(event) => updateNfseServico({ aliquota: event.target.value })}
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
                Valor do serviço
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="decimal"
                value={nfseForm.servico.valorServico}
                onChange={(event) => updateNfseServico({ valorServico: event.target.value })}
                placeholder="1500,00"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
              Discriminação do serviço
            </label>
            <textarea
              className="planner-input-compact w-full min-h-[90px]"
              value={nfseForm.servico.discriminacao}
              onChange={(event) => updateNfseServico({ discriminacao: event.target.value })}
              placeholder="Descreva o serviço prestado"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold dark:text-gray-200 mb-2">Cidade de prestação (opcional)</div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="planner-input-compact"
              type="text"
              value={nfseForm.cidadePrestacao?.codigo || ''}
              onChange={(event) => updateNfseCidade({ codigo: event.target.value })}
              placeholder="Código IBGE"
            />
            <input
              className="planner-input-compact"
              type="text"
              value={nfseForm.cidadePrestacao?.descricao || ''}
              onChange={(event) => updateNfseCidade({ descricao: event.target.value })}
              placeholder="Cidade"
            />
            <input
              className="planner-input-compact"
              type="text"
              value={nfseForm.cidadePrestacao?.estado || ''}
              onChange={(event) => updateNfseCidade({ estado: event.target.value })}
              placeholder="UF"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            id="nfse-enviar-email"
            type="checkbox"
            className="h-4 w-4"
            checked={Boolean(nfseForm.enviarEmail)}
            onChange={(event) => updateNfseForm({ enviarEmail: event.target.checked })}
          />
          <label htmlFor="nfse-enviar-email" className="text-xs text-slate-600 dark:text-gray-400">
            Enviar email ao tomador (se configurado)
          </label>
        </div>

        <div className="mt-4">
          <button
            className="planner-button-compact md:w-40"
            onClick={handleEmitNfse}
            disabled={nfseSubmitting || Boolean(nfseValidationMessage)}
          >
            {nfseSubmitting ? 'Enviando...' : 'Emitir NFSe'}
          </button>
        </div>
        {nfseValidationMessage && (
          <div className="mt-2 text-xs text-slate-500 dark:text-gray-400">
            {nfseValidationMessage}
          </div>
        )}

        {nfseError && (
          <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">{nfseError}</div>
        )}
        {nfseSuccess && (
          <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{nfseSuccess}</div>
        )}
      </div>

      <div className="mt-5 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-base md:text-lg font-semibold dark:text-white">Notas emitidas</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-slate-600 dark:text-gray-400 inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={nfseShowArchived}
                onChange={(event) => setNfseShowArchived(event.target.checked)}
              />
              Mostrar arquivadas
            </label>
            <button
              className="planner-button-compact"
              onClick={() => void loadNfseList()}
              disabled={nfseLoading}
            >
              {nfseLoading ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 mb-3">
          <select
            className="planner-input-compact"
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
          <select
            className="planner-input-compact"
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
        {nfseLoading && (
          <div className="text-sm text-slate-500 dark:text-gray-400">Carregando notas...</div>
        )}
        {filteredNfseList.length === 0 && !nfseLoading && (
          <div className="text-sm text-slate-500 dark:text-gray-400">
            Nenhuma NFSe emitida ainda.
          </div>
        )}
        {filteredNfseList.map((item) => {
          const statusKey = getNfseStatusKey(item.status);
          const rowBusy = isNfseRowBusy(item.id);
          const metadata = toNfseMetadata(item.metadata_json);
          const reviewRequested = Boolean(metadata.reviewRequested);
          const isArchived = Boolean(item.archived_at);
          return (
          <div
            key={item.id}
            className="mt-3 rounded-xl border border-slate-200/70 dark:border-slate-700 p-3"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                {item.id_integracao || item.plugnotas_id || item.id}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="planner-chip dark:bg-blue-900/30 dark:text-blue-200">
                  {formatNfseStatus(item.status)}
                </span>
                {isArchived && (
                  <span className="planner-chip dark:bg-slate-800 dark:text-slate-200">
                    Arquivada
                  </span>
                )}
                {reviewRequested && (
                  <span className="planner-chip dark:bg-amber-900/40 dark:text-amber-200">
                    Revisão
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Emitida em {formatDateTime(item.created_at)}
              {item.protocol ? ` • Protocolo ${item.protocol}` : ''}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="planner-button-compact"
                onClick={() => handleSyncNfse(item.id)}
                disabled={rowBusy}
              >
                {isNfseActionLoading(`${item.id}:sync`) ? 'Atualizando...' : 'Atualizar status'}
              </button>
              <button
                className="planner-button-compact"
                onClick={() => handleDownloadNfsePdf(item)}
                disabled={rowBusy || statusKey === 'processando'}
              >
                {isNfseActionLoading(`${item.id}:pdf`) ? 'Baixando PDF...' : 'Baixar PDF'}
              </button>
              <button
                className="planner-button-compact"
                onClick={() => handleDownloadNfseXml(item)}
                disabled={rowBusy || statusKey === 'processando'}
              >
                {isNfseActionLoading(`${item.id}:xml`) ? 'Baixando XML...' : 'Baixar XML'}
              </button>
              <button
                className="planner-button-compact"
                onClick={() => handleToggleReviewNfse(item)}
                disabled={rowBusy || isArchived}
              >
                {isNfseActionLoading(`${item.id}:update`)
                  ? 'Salvando...'
                  : reviewRequested
                    ? 'Remover revisão'
                    : 'Marcar revisão'}
              </button>
              <button
                className="planner-button-compact"
                onClick={() => handleCancelNfse(item)}
                disabled={rowBusy || statusKey === 'cancelado' || statusKey === 'cancelamento_pendente'}
              >
                {isNfseActionLoading(`${item.id}:cancel`) ? 'Cancelando...' : 'Cancelar NFSe'}
              </button>
              <button
                className="planner-button-compact"
                onClick={() => handleArchiveNfse(item)}
                disabled={rowBusy}
              >
                {isNfseActionLoading(`${item.id}:archive`)
                  ? 'Salvando...'
                  : isArchived
                    ? 'Desarquivar'
                    : 'Arquivar'}
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
