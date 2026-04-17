import type { NfseRecord } from '../services/meiNotasService';
import type { MeiLimiteThresholds } from './meiLimiteFaturamentoConfig';
import {
  DEFAULT_MEI_LIMITE_THRESHOLDS,
  getLimiteReferenciaReaisParaAno
} from './meiLimiteFaturamentoConfig';

export type MeiLimiteBanda = 'seguro' | 'atencao' | 'critico';

/** Quando não há limite configurado ou percentual não aplicável. */
export type MeiLimiteBandaOuIndeterminado = MeiLimiteBanda | 'indeterminado';

export interface MeiLimiteProgresso {
  anoCivil: number;
  totalUtilizadoReais: number;
  /** Limite do ano; `null` se ano sem valor de referência configurado. */
  limiteReferenciaReais: number | null;
  /**
   * Percentual face ao limite; pode exceder 100 (UX §5.4).
   * `null` se limite ausente ou não positivo.
   */
  percentualUtilizado: number | null;
  /** min(100, percentualUtilizado) para barras; `null` se percentual não aplicável. */
  percentualUtilizadoParaBarra: number | null;
  banda: MeiLimiteBandaOuIndeterminado;
  /** Contagem de linhas NFS-e incluídas no somatório. */
  notasConsideradas: number;
}

/** Fuso para ano civil / período do limite MEI (paridade com backend `meiLimitePayloadSum.js`). */
export const MEI_LIMITE_ANO_CIVIL_TZ = 'America/Sao_Paulo';

export interface ComputeMeiLimiteProgressoOptions {
  anoCivil: number;
  /**
   * Limite em R$; se omitido, usa `getLimiteReferenciaReaisParaAno(anoCivil)`.
   * Passar `0` para representar limite explicitamente zero (caso de teste / edge).
   */
  limiteReferenciaReaisOverride?: number | null;
  thresholds?: MeiLimiteThresholds;
  /**
   * Quando definido (resposta de `GET /api/mei-notas/limite-faturamento`), o somatório
   * vem da BD (`payload_json` / `response_json`) em vez de percorrer `records` no cliente.
   */
  agregadoServidor?: { totalUtilizadoReais: number; notasConsideradas: number };
}

/** Remove acentos para classificar status (ex.: provedor devolve "Concluída"). */
function nfseStatusAsciiLower(status?: string | null): string {
  return String(status || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Classificação alinhada à lista em GuidesMei (getNfseStatusKey).
 * Para o limite MEI (MVP), só **concluída/concluído** conta: payload_json + status definitivo (inclui feminino e acentos).
 */
export function nfseStatusKeyParaLimite(status?: string | null): string {
  const text = String(status || '').toLowerCase();
  const ascii = nfseStatusAsciiLower(status);
  if (!ascii) return 'processando';
  if (ascii.includes('cancelamento_pendente') || (ascii.includes('cancelamento') && ascii.includes('pendente'))) {
    return 'cancelamento_pendente';
  }
  if (
    ascii.includes('concluido')
    || ascii.includes('concluida')
    || ascii.includes('autoriz')
  ) {
    return 'concluido';
  }
  if (ascii.includes('process')) return 'processando';
  if (ascii.includes('rejeit')) return 'rejeitado';
  if (ascii.includes('cancel')) return 'cancelado';
  if (ascii.includes('interromp')) return 'interrompido';
  return text;
}

/** Inclui no somatório do limite só notas com faturamento definitivo (ver ADR §4). */
export function nfseDeveEntrarNoSomatórioLimite(status?: string | null): boolean {
  return nfseStatusKeyParaLimite(status) === 'concluido';
}

/**
 * Interpreta `valor.servico` como número ou texto pt-BR (ex.: "10,50", "1.234,56", "R$ 1,00").
 */
export function parseValorMonetarioBr(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = String(value).trim().replace(/\u00a0/g, '');
  if (!s) return null;
  s = s.replace(/^R\$\s*/i, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && (!hasDot || s.lastIndexOf(',') > s.lastIndexOf('.'))) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && hasDot) {
    s = s.replace(/,/g, '');
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza `payload_json`: objeto; string JSON (até 3 níveis); array de um elemento; `payloadJson` camelCase.
 */
export function normalizarPayloadJsonNfse(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null;
  let current: unknown = input;
  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof current === 'string') {
      const t = current.trim();
      if (!t) return null;
      try {
        current = JSON.parse(t) as unknown;
        continue;
      } catch {
        return null;
      }
    }
    if (Array.isArray(current) && current.length === 1) {
      current = current[0];
      continue;
    }
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return current as Record<string, unknown>;
    }
    return null;
  }
  return null;
}

export function resolverPayloadJsonDaNota(record: NfseRecord): Record<string, unknown> | null {
  const r = record as Record<string, unknown>;
  const raw = r.payload_json ?? r.payloadJson;
  return normalizarPayloadJsonNfse(raw);
}

export function resolverResponseJsonDaNota(record: NfseRecord): Record<string, unknown> | null {
  const r = record as Record<string, unknown>;
  const raw = r.response_json ?? r.responseJson;
  return normalizarPayloadJsonNfse(raw);
}

function hasServicoArrayInObj(obj: Record<string, unknown>): boolean {
  const s = obj.servico ?? obj.servicos;
  return s != null;
}

/**
 * FR-GUIA-FISC-17 — apenas **NFSE** entra no somatório do limite MEI (paridade com `meiLimitePayloadSum.js`).
 */
export function isDocumentTypeMeiLimiteRelevante(documentType: string | null | undefined): boolean {
  const dt = String(documentType ?? '').trim().toUpperCase();
  return dt === 'NFSE';
}

/** Apenas NFS-e; NF-e/NFC-e partilham `NfseRecord` mas não entram no KPI de limite MEI. */
export function isNfseDocumento(record: NfseRecord): boolean {
  const dt = String(record.document_type ?? '').trim().toUpperCase();
  if (dt !== '') {
    return isDocumentTypeMeiLimiteRelevante(record.document_type);
  }
  const p = resolverPayloadJsonDaNota(record);
  if (p && hasServicoArrayInObj(p)) return true;
  const resp = resolverResponseJsonDaNota(record);
  return Boolean(resp && hasServicoArrayInObj(resp));
}

/**
 * Por linha de `servico[]`: `valor.liquido` (resposta Plugnotas), depois `valor.servico`, depois aliases no item.
 * Valores ≥ 0 contam.
 */
function valorLimiteDeItemServico(item: Record<string, unknown>): number | null {
  const valor = item.valor;
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const v = valor as { liquido?: unknown; servico?: unknown };
    const liq = parseValorMonetarioBr(v.liquido);
    if (liq !== null && liq >= 0) return liq;
    const serv = parseValorMonetarioBr(v.servico);
    if (serv !== null && serv >= 0) return serv;
  }
  const flat =
    item.valorServico
    ?? (item as { valorServiço?: unknown }).valorServiço
    ?? (item as { valor_servico?: unknown }).valor_servico;
  const n2 = parseValorMonetarioBr(flat);
  if (n2 !== null && n2 >= 0) return n2;
  return null;
}

/**
 * Soma linhas `servico` / `servicos` num objecto já normalizado (payload ou response).
 */
export function extrairValorTotalServicosDeObjeto(raw: Record<string, unknown> | null): number | null {
  if (!raw) return null;
  let servicos = raw.servico ?? raw.servicos;
  if (servicos && !Array.isArray(servicos)) {
    servicos = [servicos];
  }
  if (!Array.isArray(servicos)) return null;
  let sum = 0;
  let any = false;
  for (const item of servicos) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const n = valorLimiteDeItemServico(item as Record<string, unknown>);
    if (n !== null) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
}

/**
 * Prioriza `response_json` (valores autorizados); se não houver linhas válidas, usa `payload_json`.
 * Não soma as duas fontes na mesma nota.
 */
export function extrairValorLimiteMeiDaNota(record: NfseRecord): number | null {
  const resp = resolverResponseJsonDaNota(record);
  if (resp) {
    const fromResp = extrairValorTotalServicosDeObjeto(resp);
    if (fromResp !== null) return fromResp;
  }
  const payload = resolverPayloadJsonDaNota(record);
  return extrairValorTotalServicosDeObjeto(payload);
}

/**
 * Extrai o total em R$ a partir do payload de emissão (coluna `payload_json` / equivalente normalizado).
 * Forma canónica: `{ "servico": [ { "valor": { "liquido" | "servico": number }, ... } ] }`.
 */
export function extrairValorServicoTotalDoPayload(payloadJson: NfseRecord['payload_json'] | null | undefined): number | null {
  const raw = normalizarPayloadJsonNfse(payloadJson);
  return extrairValorTotalServicosDeObjeto(raw);
}

/**
 * Ano civil a partir de `created_at` (timestamptz ISO), no fuso `MEI_LIMITE_ANO_CIVIL_TZ`
 * (evita divergência browser vs servidor em viradas de ano).
 */
export function anoCivilFromIsoCreatedAt(createdAt: string | undefined | null): number | null {
  if (!createdAt) return null;
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MEI_LIMITE_ANO_CIVIL_TZ,
    year: 'numeric'
  }).formatToParts(parsed);
  const y = parts.find((p) => p.type === 'year')?.value;
  if (!y) return null;
  const n = parseInt(y, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Chave `YYYY-MM` para filtros de período na lista NFS-e, alinhada ao ano civil BR do limite MEI.
 */
export function nfsePeriodoChaveBrFromCreatedAt(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MEI_LIMITE_ANO_CIVIL_TZ,
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(parsed);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  return year && month ? `${year}-${month}` : '';
}

export interface SomatorioNfseAnoOptions {
  anoCivil: number;
}

/**
 * Soma valores de NFS-e autorizadas no ano civil em `MEI_LIMITE_ANO_CIVIL_TZ` (coluna `created_at`).
 */
export function somarNfseAutorizadasNoAnoCivil(
  records: NfseRecord[],
  options: SomatorioNfseAnoOptions
): { total: number; notasConsideradas: number } {
  const { anoCivil } = options;
  let total = 0;
  let notasConsideradas = 0;
  for (const record of records) {
    if (!isNfseDocumento(record)) continue;
    if (!nfseDeveEntrarNoSomatórioLimite(record.status)) continue;
    const y = anoCivilFromIsoCreatedAt(record.created_at);
    if (y !== anoCivil) continue;
    const valor = extrairValorLimiteMeiDaNota(record);
    if (valor === null) continue;
    total += valor;
    notasConsideradas += 1;
  }
  return { total, notasConsideradas };
}

function clampBarPercent(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, raw));
}

function resolveBanda(
  percentual: number | null,
  thresholds: MeiLimiteThresholds
): MeiLimiteBandaOuIndeterminado {
  if (percentual === null || !Number.isFinite(percentual)) return 'indeterminado';
  if (percentual >= thresholds.criticoMinPercent) return 'critico';
  if (percentual >= thresholds.atencaoMinPercent) return 'atencao';
  return 'seguro';
}

/**
 * Agregado canónico para LIM-MEI-02 / LIM-MEI-03.
 */
export function computeMeiLimiteProgresso(
  records: NfseRecord[],
  options: ComputeMeiLimiteProgressoOptions
): MeiLimiteProgresso {
  const thresholds = options.thresholds ?? DEFAULT_MEI_LIMITE_THRESHOLDS;
  let total: number;
  let notasConsideradas: number;
  if (options.agregadoServidor !== undefined) {
    total = options.agregadoServidor.totalUtilizadoReais;
    notasConsideradas = options.agregadoServidor.notasConsideradas;
  } else {
    const s = somarNfseAutorizadasNoAnoCivil(records, { anoCivil: options.anoCivil });
    total = s.total;
    notasConsideradas = s.notasConsideradas;
  }

  let limite: number | null;
  if (options.limiteReferenciaReaisOverride !== undefined) {
    limite = options.limiteReferenciaReaisOverride;
  } else {
    limite = getLimiteReferenciaReaisParaAno(options.anoCivil);
  }

  let percentual: number | null = null;
  let paraBarra: number | null = null;
  if (limite !== null && limite > 0) {
    percentual = (total / limite) * 100;
    paraBarra = clampBarPercent(percentual);
  } else if (limite === 0) {
    percentual = null;
    paraBarra = null;
  }

  const banda =
    limite === null || limite <= 0
      ? 'indeterminado'
      : resolveBanda(percentual, thresholds);

  return {
    anoCivil: options.anoCivil,
    totalUtilizadoReais: total,
    limiteReferenciaReais: limite,
    percentualUtilizado: percentual,
    percentualUtilizadoParaBarra: paraBarra,
    banda,
    notasConsideradas
  };
}
