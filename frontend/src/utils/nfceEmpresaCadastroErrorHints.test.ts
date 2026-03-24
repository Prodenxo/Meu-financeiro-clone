import { describe, expect, it } from 'vitest';
import {
  isLikelyLocalOnlyGuiaMeiEmpresaCertError,
  shouldOfferNfceCadastroDocHint
} from './nfceEmpresaCadastroErrorHints';

describe('shouldOfferNfceCadastroDocHint', () => {
  it('ativa para versaoQrCode', () => {
    expect(
      shouldOfferNfceCadastroDocHint('Falha: nfce.config.versaoQrCode inválido')
    ).toBe(true);
  });

  it('ativa para nfce.config.sefaz', () => {
    expect(shouldOfferNfceCadastroDocHint('Esperado nfce.config.sefaz')).toBe(true);
  });

  it('ativa quando nfce e sefaz aparecem no texto', () => {
    expect(
      shouldOfferNfceCadastroDocHint('Validação NFC-e: preencha sefaz conforme doc')
    ).toBe(true);
  });

  it('não ativa para erro genérico sem termos NFC-e/QR', () => {
    expect(shouldOfferNfceCadastroDocHint('Timeout ao contatar o servidor.')).toBe(false);
  });
});

describe('isLikelyLocalOnlyGuiaMeiEmpresaCertError', () => {
  it('identifica validação local (“Informe…”)', () => {
    expect(isLikelyLocalOnlyGuiaMeiEmpresaCertError('Informe a razão social da empresa.')).toBe(true);
  });

  it('identifica mensagens de fluxo antes da API', () => {
    expect(
      isLikelyLocalOnlyGuiaMeiEmpresaCertError(
        'Não foi possível identificar um CNPJ válido para configurar a empresa no sistema de emissão fiscal.'
      )
    ).toBe(true);
  });

  it('não marca erro vindo do catch com texto do provedor', () => {
    expect(
      isLikelyLocalOnlyGuiaMeiEmpresaCertError(
        'Certificado enviado no MEI, mas falhou a configuração automática da integração fiscal: HTTP 400 plugnotas'
      )
    ).toBe(false);
  });
});
