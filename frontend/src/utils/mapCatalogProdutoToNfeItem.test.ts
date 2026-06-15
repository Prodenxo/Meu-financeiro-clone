import { describe, expect, it } from 'vitest';
import type { NfseCatalogProduto } from '../services/meiNotasService';
import {
  formatValorUnitarioFromCatalogValorSugerido,
  mapCatalogProdutoToNfeItemRow
} from './mapCatalogProdutoToNfeItem';
import { createEmptyMeiNfeLikeItem } from './meiNfeLikeFormState';

describe('formatValorUnitarioFromCatalogValorSugerido', () => {
  it('formata número positivo em pt-BR', () => {
    expect(formatValorUnitarioFromCatalogValorSugerido(10.5)).toBe('10,50');
  });

  it('devolve string vazia para valor inválido ou não positivo', () => {
    expect(formatValorUnitarioFromCatalogValorSugerido(null)).toBe('');
    expect(formatValorUnitarioFromCatalogValorSugerido(0)).toBe('');
  });
});

describe('mapCatalogProdutoToNfeItemRow', () => {
  it('happy path: metadados NCM/CFOP e campos alinhados ao formulário', () => {
    const produto: NfseCatalogProduto = {
      id: 'a1',
      codigo: 'SKU-X',
      discriminacao: 'Widget fiscal',
      valor_sugerido: 99.99,
      document_type: 'NFE',
      metadata_json: {
        ncm: '12345678',
        cfop: '5102',
        unidade: 'CX',
        icmsCsosn: '102',
        pisCst: '49',
        cofinsCst: '49',
      },
    };
    const row = mapCatalogProdutoToNfeItemRow(produto);
    expect(row).toMatchObject({
      codigo: 'SKU-X',
      descricao: 'Widget fiscal',
      ncm: '12345678',
      cfop: '5102',
      unidade: 'CX',
      quantidade: '1',
      icmsCsosn: '102',
      pisCst: '49',
      cofinsCst: '49'
    });
    expect(row.valorUnitario).toMatch(/99/);
  });

  it('sem metadados NF-e: usa defaults do formulário vazio', () => {
    const produto: NfseCatalogProduto = {
      id: 'b2',
      codigo: '',
      discriminacao: 'Só descrição',
      valor_sugerido: 1,
      document_type: 'NFE',
    };
    const row = mapCatalogProdutoToNfeItemRow(produto);
    const defaults = createEmptyMeiNfeLikeItem();
    expect(row.icmsCsosn).toBe(defaults.icmsCsosn);
    expect(row.ncm).toBe('');
  });
});
