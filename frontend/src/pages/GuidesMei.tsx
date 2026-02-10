import { useEffect, useMemo, useState } from 'react';
import Layout from '../Layout/Layout';
import {
  downloadMeiGuide,
  fetchMeiCertificateStatus
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
  const [hasCertificate, setHasCertificate] = useState(false);
  const [hasServerCertificate, setHasServerCertificate] = useState(false);

  const normalizedContribuinte = useMemo(() => normalizeDoc(contribuinteDoc), [contribuinteDoc]);
  const contribuinteTipo = useMemo(() => getDocType(normalizedContribuinte), [normalizedContribuinte]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await fetchMeiCertificateStatus();
        setHasServerCertificate(Boolean(status.hasEnvCertificate));
        if (status.hasUserCertificate || status.hasEnvCertificate) {
          setHasCertificate(true);
        }
      } catch {
        setHasServerCertificate(false);
      }
    };
    void loadStatus();
  }, []);

  const handleDownload = async (periodoApuracao: string, competencia?: string | null) => {
    const { blob, filename } = await downloadMeiGuide(
      normalizedContribuinte,
      periodoApuracao,
      { numero: normalizedContribuinte, tipo: contribuinteTipo }
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


  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => currentYear - index);
  }, []);

  const availableMonths = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  ), []);

  const handleDownloadClick = async () => {
    if (normalizedContribuinte.length !== 14) {
      setPeriodError('Informe um CNPJ válido do contribuinte.');
      return;
    }
    if (!hasCertificate) {
      setPeriodError('Envie o certificado para gerar a guia.');
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
        Informe o CNPJ e escolha o período para baixar a guia.
      </p>

      <div className="planner-card p-4 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-semibold dark:text-gray-200">CNPJ do contribuinte</label>
            {!hasCertificate && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Certificado deve estar configurado no servidor.
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <input
              className="planner-input-compact"
              value={contribuinteDoc}
              onChange={(event) => setContribuinteDoc(formatDocument(event.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>
          <div>
            <button
              className="planner-button-compact md:w-40"
              onClick={handleDownloadClick}
              disabled={normalizedContribuinte.length !== 14 || !hasCertificate}
            >
              Baixar guia
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 planner-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold dark:text-gray-200">
              Certificado digital (obrigatório)
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400">
              Configurado e gerenciado no servidor.
            </div>
          </div>
          {hasCertificate && (
            <span className="planner-chip dark:bg-blue-900/30 dark:text-blue-200">
              Certificado enviado
            </span>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Certificado configurado no servidor. Upload não é necessário.
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
        {periodError && (
          <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">{periodError}</div>
        )}
      </div>
    </Layout>
  );
}
