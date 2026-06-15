import { describe, expect, it } from 'vitest';
import {
  MEI_DEFAULT_NFE_CSOSN,
  MEI_DEFAULT_NFE_PIS_COFINS_CST,
  createEmptyMeiNfeLikeFormState,
  createEmptyMeiNfeLikeItem,
} from './meiNfeLikeFormState';

describe('meiNfeLikeFormState defaults', () => {
  it('createEmptyMeiNfeLikeItem pré-preenche tributos MEI', () => {
    const item = createEmptyMeiNfeLikeItem();
    expect(item.icmsCsosn).toBe(MEI_DEFAULT_NFE_CSOSN);
    expect(item.pisCst).toBe(MEI_DEFAULT_NFE_PIS_COFINS_CST);
    expect(item.cofinsCst).toBe(MEI_DEFAULT_NFE_PIS_COFINS_CST);
    expect(item.cfop).toBe('5102');
  });

  it('createEmptyMeiNfeLikeFormState inclui emitenteInscricaoEstadual vazia', () => {
    const form = createEmptyMeiNfeLikeFormState();
    expect(form.emitenteInscricaoEstadual).toBe('');
  });
});
