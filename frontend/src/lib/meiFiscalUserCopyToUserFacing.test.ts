import { describe, it, expect } from 'vitest';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';
import { mapMeiFiscalErrorToCopy } from './fiscalUserError';
import { meiFiscalUserCopyToUserFacing } from './meiFiscalUserCopyToUserFacing';

describe('meiFiscalUserCopyToUserFacing', () => {
  it('define categoria e fonte provedor_fiscal', () => {
    const copy = mapMeiFiscalErrorToCopy({ rawMessage: 'Erro curto.', plugnotasCode: null });
    const props = meiFiscalUserCopyToUserFacing(copy, {
      variant: 'inline',
      rawMessage: 'Erro curto.',
      plugnotasCode: null,
    });
    expect(props.category).toBe('provedor_fiscal');
    expect(props.source).toBe('provedor_fiscal');
    expect(props.description).toContain('Erro curto');
  });

  it('com embedRawAsTechnicalDetail false não preenche technicalDetail', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'x'.repeat(400),
      plugnotasCode: null,
    });
    const props = meiFiscalUserCopyToUserFacing(copy, {
      variant: 'inline',
      rawMessage: 'x'.repeat(400),
      embedRawAsTechnicalDetail: false,
    });
    expect(props.technicalDetail).toBeNull();
  });

  it('expõe secondaryAction quando o mapeamento inclui href', () => {
    const copy = mapMeiFiscalErrorToCopy({
      rawMessage: 'conflict',
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    const props = meiFiscalUserCopyToUserFacing(copy, {
      variant: 'inline',
      rawMessage: 'conflict',
      plugnotasCode: PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
    });
    expect(props.secondaryAction?.href).toMatch(/certificado-emissor-409-sem-id/);
  });
});
