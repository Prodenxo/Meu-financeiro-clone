import { describe, expect, it } from 'vitest';
import {
  buildNfeCatalogProdutoMetadata,
  emptyNfeCatalogProdutoFormFields,
  nfeCatalogProdutoFormFieldsFromMetadata,
  validateNfeCatalogProdutoFormFields,
} from './nfeCatalogProdutoMetadata';

describe('nfeCatalogProdutoMetadata', () => {
  it('exige NCM de 8 dígitos', () => {
    expect(validateNfeCatalogProdutoFormFields(emptyNfeCatalogProdutoFormFields())).toMatch(/NCM/);
  });

  it('aceita campos MEI padrão completos', () => {
    const fields = nfeCatalogProdutoFormFieldsFromMetadata({
      ncm: '12345678',
      cfop: '5102',
      unidade: 'UN',
      icmsCsosn: '102',
      pisCst: '49',
      cofinsCst: '49',
    });
    expect(validateNfeCatalogProdutoFormFields(fields)).toBeNull();
  });

  it('persiste tributos em metadata_json', () => {
    const meta = buildNfeCatalogProdutoMetadata(null, {
      ncm: '22011000',
      cfop: '5102',
      unidade: 'UN',
      icmsCsosn: '102',
      pisCst: '49',
      cofinsCst: '49',
    });
    expect(meta).toMatchObject({
      ncm: '22011000',
      icmsCsosn: '102',
      pisCst: '49',
      cofinsCst: '49',
    });
  });
});
