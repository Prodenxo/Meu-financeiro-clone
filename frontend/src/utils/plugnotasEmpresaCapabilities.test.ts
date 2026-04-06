import { describe, expect, it } from 'vitest';
import {
  extractPlugnotasEmpresaBody,
  isNfeLikeEmissionBlockedByCapabilities,
  parsePlugnotasEmpresaCapabilities
} from './plugnotasEmpresaCapabilities';

describe('plugnotasEmpresaCapabilities', () => {
  it('extrai corpo com aninhamento message/data (formato Plugnotas típico)', () => {
    const raw = {
      message: 'OK',
      data: {
        cpfCnpj: '17422651000172',
        razaoSocial: 'Empresa Exemplo',
        nfe: { ativo: false, tipoContrato: 0 },
        nfce: { ativo: false, tipoContrato: 0 },
        nfse: { ativo: true, tipoContrato: 0 }
      }
    };
    const body = extractPlugnotasEmpresaBody(raw);
    expect(body?.razaoSocial).toBe('Empresa Exemplo');
    expect(parsePlugnotasEmpresaCapabilities(raw)).toEqual({
      nfe: 'inactive',
      nfce: 'inactive'
    });
    expect(isNfeLikeEmissionBlockedByCapabilities('NFE', parsePlugnotasEmpresaCapabilities(raw))).toBe(true);
    expect(isNfeLikeEmissionBlockedByCapabilities('NFCE', parsePlugnotasEmpresaCapabilities(raw))).toBe(true);
  });

  it('empresa com NF-e e NFC-e activos não bloqueia', () => {
    const raw = {
      message: 'OK',
      data: {
        nfe: { ativo: true, tipoContrato: 0 },
        nfce: { ativo: true, tipoContrato: 0 }
      }
    };
    const caps = parsePlugnotasEmpresaCapabilities(raw);
    expect(caps.nfe).toBe('active');
    expect(caps.nfce).toBe('active');
    expect(isNfeLikeEmissionBlockedByCapabilities('NFE', caps)).toBe(false);
    expect(isNfeLikeEmissionBlockedByCapabilities('NFCE', caps)).toBe(false);
  });

  it('ausência de bloco nfe/nfce → unknown (sem bloqueio)', () => {
    const raw = { message: 'OK', data: { razaoSocial: 'X' } };
    const caps = parsePlugnotasEmpresaCapabilities(raw);
    expect(caps).toEqual({ nfe: 'unknown', nfce: 'unknown' });
    expect(isNfeLikeEmissionBlockedByCapabilities('NFE', caps)).toBe(false);
  });

  it('payload plano sem wrapper data usa raiz', () => {
    const raw = {
      cpfCnpj: '11222333000181',
      nfe: { ativo: false },
      nfce: { ativo: true }
    };
    const caps = parsePlugnotasEmpresaCapabilities(raw);
    expect(caps.nfe).toBe('inactive');
    expect(caps.nfce).toBe('active');
    expect(isNfeLikeEmissionBlockedByCapabilities('NFE', caps)).toBe(true);
    expect(isNfeLikeEmissionBlockedByCapabilities('NFCE', caps)).toBe(false);
  });
});
