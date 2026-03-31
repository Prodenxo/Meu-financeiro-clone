import { describe, expect, it } from 'vitest';
import {
  mergeNfsePrestadorPrefillIntoForm,
  isNfsePrestadorPrefillEffectivelyEmpty,
} from './nfsePrestadorPrefillMerge';
import type { EmitirNfseInput } from '../services/meiNotasService';
import type { NfsePrestadorPrefillDto } from '../lib/nfsePrestadorPrefillDto';
import { emptyNfsePrestadorEndereco } from './nfseEmitenteHydration';

const emptyForm = (): EmitirNfseInput => ({
  prestadorCpfCnpj: '',
  prestadorRazaoSocial: '',
  prestadorEmail: '',
  prestadorEndereco: emptyNfsePrestadorEndereco(),
  tomadorCpfCnpj: '',
  tomadorRazaoSocial: '',
  tomadorEmail: '',
  servico: { codigo: '', discriminacao: '', cnae: '', valorServico: '' },
  cidadePrestacao: { codigo: '', descricao: '', estado: '' },
  idIntegracao: '',
  enviarEmail: false,
  descricao: '',
  informacoesComplementares: '',
});

const samplePrefill = (): NfsePrestadorPrefillDto => ({
  prestadorCpfCnpj: '12345678000190',
  prestadorRazaoSocial: 'ACME LTDA',
  prestadorEmail: 'a@b.com',
  prestadorInscricaoMunicipal: 'IM123',
  prestadorEndereco: {
    logradouro: 'Rua X',
    numero: '10',
    codigoCidade: '3550308',
    cep: '01310100',
    complemento: 'sala 1',
    bairro: 'Centro',
    estado: 'sp',
    descricaoCidade: 'São Paulo',
  },
  sourceRowId: '550e8400-e29b-41d4-a716-446655440000',
});

describe('isNfsePrestadorPrefillEffectivelyEmpty', () => {
  it('true quando payload todo null', () => {
    expect(
      isNfsePrestadorPrefillEffectivelyEmpty({
        prestadorCpfCnpj: null,
        prestadorRazaoSocial: null,
        prestadorEmail: null,
        prestadorInscricaoMunicipal: null,
        prestadorEndereco: null,
        sourceRowId: null,
      })
    ).toBe(true);
  });

  it('false com CNPJ', () => {
    expect(
      isNfsePrestadorPrefillEffectivelyEmpty({
        prestadorCpfCnpj: '12.345.678/0001-90',
        prestadorRazaoSocial: null,
        prestadorEmail: null,
        prestadorInscricaoMunicipal: null,
        prestadorEndereco: null,
      })
    ).toBe(false);
  });
});

describe('mergeNfsePrestadorPrefillIntoForm', () => {
  it('preenche form vazio e formata CNPJ', () => {
    const merged = mergeNfsePrestadorPrefillIntoForm(emptyForm(), samplePrefill());
    expect(merged.prestadorCpfCnpj.replace(/\D/g, '')).toBe('12345678000190');
    expect(merged.prestadorRazaoSocial).toBe('ACME LTDA');
    expect(merged.prestadorEndereco?.cep).toBe('01310100');
    expect(merged.prestadorEndereco?.estado).toBe('SP');
  });

  it('onlyFillEmpty mantém CNPJ do utilizador', () => {
    const form = emptyForm();
    form.prestadorCpfCnpj = '98.765.432/0001-00';
    const merged = mergeNfsePrestadorPrefillIntoForm(form, samplePrefill(), { onlyFillEmpty: true });
    expect(merged.prestadorCpfCnpj).toBe('98.765.432/0001-00');
  });
});
