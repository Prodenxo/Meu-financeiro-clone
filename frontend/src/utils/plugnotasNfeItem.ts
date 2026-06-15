/** Mapeia item do formulário para o JSON esperado pela Plugnotas (NF-e / NFC-e). */

import type { NfeIcmsInput, NfeItemInput, NfeTributosInput } from '../services/meiNotasService';

export type PlugnotasNfeItemFormLike = {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
};

export type PlugnotasIcmsFormLike = {
  origem?: string;
  cst?: string;
  csosn?: string;
};

export function parseDecimalInput(raw: string): number | null {
  const t = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const normalizeDoc = (value: string) => String(value || '').replace(/\D/g, '');

/** CPF ou destinatário não contribuinte → consumidor final (exigência SEFAZ com indIEDest=9). */
export function resolveNfeConsumidorFinal(
  destDoc: string,
  indIEDest?: string,
  inscricaoEstadual?: string,
): boolean {
  const doc = normalizeDoc(destDoc);
  const ie = normalizeDoc(inscricaoEstadual || '');
  const ind = String(indIEDest ?? '').trim();
  if (ind === '9') return true;
  if (doc.length === 14 && ind !== '1' && !ie) return true;
  if (doc.length === 11) return true;
  return false;
}

/** Plugnotas: CSOSN MEI (102) vai em `tributos.icms.cst`. */
export function mapIcmsForPlugnotas(icms: PlugnotasIcmsFormLike = {}): NfeIcmsInput {
  const origem = String(icms.origem ?? '0').trim() || '0';
  const csosn = normalizeDoc(String(icms.csosn ?? '')).slice(0, 3);
  const cst = normalizeDoc(String(icms.cst ?? '')).slice(0, 3);
  if (csosn) return { origem, cst: csosn };
  if (cst) return { origem, cst };
  return { origem };
}

export function mapNfeItemForPlugnotas(
  item: PlugnotasNfeItemFormLike,
  tributos: NfeTributosInput,
): NfeItemInput {
  const unidade = item.unidade.trim() || 'UN';
  const quantidade = parseDecimalInput(item.quantidade);
  const valorUnitarioNum = parseDecimalInput(item.valorUnitario);
  if (quantidade === null || quantidade <= 0 || valorUnitarioNum === null || valorUnitarioNum <= 0) {
    throw new Error('Item NF-e: quantidade e valor unitário devem ser maiores que zero');
  }
  const valorTotal = quantidade * valorUnitarioNum;

  return {
    codigo: item.codigo.trim(),
    descricao: item.descricao.trim(),
    ncm: normalizeDoc(item.ncm),
    cfop: normalizeDoc(item.cfop),
    unidadeComercial: unidade,
    quantidade: { comercial: quantidade, tributavel: quantidade },
    valorUnitario: { comercial: valorUnitarioNum, tributavel: valorUnitarioNum },
    valor: valorTotal,
    tributos,
  };
}

/** tPag 99 exige `descricaoMeio` na Plugnotas. */
export function buildDefaultNfePagamentos(valor: number) {
  return [{
    meio: '99',
    valor,
    descricaoMeio: 'Outros',
  }];
}
