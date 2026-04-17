import type { NfseCatalogProduto } from '../services/meiNotasService';
import type { MeiNfeLikeItemFormState } from './meiNfeLikeFormState';
import { createEmptyMeiNfeLikeItem } from './meiNfeLikeFormState';

/** Metadados opcionais gravados no catálogo para linhas NF-e / NFC-e (FR-GUIA-FISC-12). */
export type NfeCatalogProdutoItemMetadata = {
  ncm?: string;
  cfop?: string;
  unidade?: string;
};

function readNfeMetadata(produto: NfseCatalogProduto): NfeCatalogProdutoItemMetadata {
  const raw = produto.metadata_json;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  return {
    ncm: typeof o.ncm === 'string' ? o.ncm : undefined,
    cfop: typeof o.cfop === 'string' ? o.cfop : undefined,
    unidade: typeof o.unidade === 'string' ? o.unidade : undefined
  };
}

/** Apenas dígitos, limitado a `max`. */
function onlyDigits(value: string, max: number): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, max);
}

/**
 * Valor unitário para o formulário (pt-BR) a partir do catálogo.
 */
export function formatValorUnitarioFromCatalogValorSugerido(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor) || valor <= 0) return '';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
}

/**
 * FR-GUIA-FISC-12 — catálogo produto (tipo NFE/NFCE) → linha `MeiNfeLikeItemFormState`.
 * Defaults de tributos alinhados a `createEmptyMeiNfeLikeItem`; NCM/CFOP podem vir de `metadata_json`.
 */
export function mapCatalogProdutoToNfeItemRow(produto: NfseCatalogProduto): MeiNfeLikeItemFormState {
  const base = createEmptyMeiNfeLikeItem();
  const meta = readNfeMetadata(produto);
  const codigo = String(produto.codigo ?? '').trim();
  const descricao = String(produto.discriminacao ?? '').trim();
  const ncmDigits = onlyDigits(meta.ncm ?? '', 8);
  const cfopDigits = onlyDigits(meta.cfop ?? '', 4);
  const vu = formatValorUnitarioFromCatalogValorSugerido(produto.valor_sugerido ?? null);

  return {
    ...base,
    codigo: codigo || 'CAT',
    descricao: descricao || codigo || 'Produto do catálogo',
    ncm: ncmDigits.length === 8 ? ncmDigits : '01012100',
    cfop: cfopDigits.length === 4 ? cfopDigits : '5102',
    unidade: (meta.unidade ?? '').trim() || 'UN',
    quantidade: '1',
    valorUnitario: vu || '1,00'
  };
}
