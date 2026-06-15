import type { NfseCatalogProduto } from '../services/meiNotasService';
import type { MeiNfeLikeItemFormState } from './meiNfeLikeFormState';
import { createEmptyMeiNfeLikeItem } from './meiNfeLikeFormState';
import {
  nfeCatalogProdutoFormFieldsFromMetadata,
  readNfeCatalogProdutoMetadata,
} from './nfeCatalogProdutoMetadata';

export type { NfeCatalogProdutoItemMetadata } from './nfeCatalogProdutoMetadata';

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
 * Tributos vêm de `metadata_json` cadastrados no modal de produto.
 */
export function mapCatalogProdutoToNfeItemRow(produto: NfseCatalogProduto): MeiNfeLikeItemFormState {
  const base = createEmptyMeiNfeLikeItem();
  const meta = readNfeCatalogProdutoMetadata(produto.metadata_json);
  const fields = nfeCatalogProdutoFormFieldsFromMetadata(produto.metadata_json);
  const codigo = String(produto.codigo ?? '').trim();
  const descricao = String(produto.discriminacao ?? '').trim();
  const vu = formatValorUnitarioFromCatalogValorSugerido(produto.valor_sugerido ?? null);

  return {
    ...base,
    codigo: codigo || 'CAT',
    descricao: descricao || codigo || 'Produto do catálogo',
    ncm: fields.ncm,
    cfop: fields.cfop,
    unidade: (meta.unidade ?? fields.unidade).trim() || 'UN',
    quantidade: '1',
    valorUnitario: vu || '',
    icmsCsosn: fields.icmsCsosn,
    pisCst: fields.pisCst,
    cofinsCst: fields.cofinsCst
  };
}
