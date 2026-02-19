import { useEffect, useMemo, useState } from 'react';
import Layout from '../Layout/Layout';
import {
  downloadMeiGuide,
  fetchMeiCertificateStatus,
  removeMeiCertificate,
  uploadMeiCertificate,
  validateMeiGuide
} from '../services/guidesMeiService';

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

const getDefaultPeriod = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    year: previous.getFullYear(),
    month: String(previous.getMonth() + 1).padStart(2, '0')
  };
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
  const hasCertificate = hasUserCertificate;

  const normalizedContribuinte = useMemo(() => normalizeDoc(contribuinteDoc), [contribuinteDoc]);
  const contribuinteTipo = useMemo(() => getDocType(normalizedContribuinte), [normalizedContribuinte]);

  const applyDocumento = (documento?: string | null, force = false) => {
    if (!documento) return;
    const formatted = formatDocument(documento);
    setContribuinteDoc((current) => (force || !current ? formatted : current));
  };

  const loadCertificateStatus = async () => {
    try {
      const status = await fetchMeiCertificateStatus();
      setHasUserCertificate(Boolean(status.hasUserCertificate));
      setHasServerCertificate(Boolean(status.hasEnvCertificate));
      applyDocumento(status.documento);
    } catch {
      setHasUserCertificate(false);
      setHasServerCertificate(false);
    }
  };

  useEffect(() => {
    void loadCertificateStatus();
  }, []);

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
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename || buildFilenameFromCompetencia(competencia || null);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
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


  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => currentYear - index);
  }, []);

  const availableMonths = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  ), []);

  const handleDownloadClick = async () => {
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
    await handleDownload(periodoApuracao, competencia);
  };

  return (
    <Layout>
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
            disabled={isUploadingCert}
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
            disabled={!normalizedContribuinte || normalizedContribuinte.length !== 14}
          >
            Baixar guia
          </button>
        </div>
        {periodError && (
          <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">{periodError}</div>
        )}
      </div>
    </Layout>
  );
}
