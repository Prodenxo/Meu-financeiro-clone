import { describe, it, expect } from 'vitest';
import type { NfseEmitenteSnapshot } from '../services/guidesMeiService';
import type { EmitirNfseInput } from '../services/meiNotasService';
import { onlyDigits } from '../lib/formatCpfCnpjPtBr';
import {
  emptyNfsePrestadorEndereco,
  mergeEmitenteSnapshotIntoNfseForm,
  replacePrestadorFromEmitenteSnapshot
} from './nfseEmitenteHydration';

const baseSnap = (): NfseEmitenteSnapshot => ({
  razaoSocial: 'ACME LTDA',
  nomeFantasia: 'ACME',
  email: 'a@acme.com',
  regimeTributario: '1',
  simplesNacional: true,
  cep: '01310100',
  tipoLogradouro: 'Rua',
  logradouro: 'Av Paulista',
  numero: '1000',
  complemento: 'Sala 1',
  bairro: 'Bela Vista',
  codigoCidade: '3550308',
  descricaoCidade: 'São Paulo',
  estado: 'SP',
  inscricaoMunicipal: '',
  rpsLote: 1,
  rpsNumero: 1,
  rpsSerie: '1',
  certDocument: '11222333000181'
});

const emptyForm = (): EmitirNfseInput => ({
  prestadorCpfCnpj: '',
  prestadorRazaoSocial: '',
  prestadorEmail: '',
  prestadorEndereco: emptyNfsePrestadorEndereco(),
  tomadorCpfCnpj: '',
  tomadorRazaoSocial: '',
  tomadorEmail: '',
  servico: {
    codigo: '',
    discriminacao: '',
    cnae: '',
    valorServico: ''
  },
  cidadePrestacao: {
    codigo: '',
    descricao: '',
    estado: ''
  },
  idIntegracao: '',
  enviarEmail: false,
  descricao: '',
  informacoesComplementares: ''
});

describe('mergeEmitenteSnapshotIntoNfseForm', () => {
  it('preenche prestador a partir do snapshot quando o formulário está vazio', () => {
    const next = mergeEmitenteSnapshotIntoNfseForm(emptyForm(), baseSnap());
    expect(next.prestadorRazaoSocial).toBe('ACME LTDA');
    expect(next.prestadorEmail).toBe('a@acme.com');
    expect(onlyDigits(next.prestadorCpfCnpj)).toBe('11222333000181');
    expect(next.prestadorEndereco?.logradouro).toBe('Av Paulista');
    expect(next.prestadorEndereco?.cep).toBe('01310100');
    expect(next.prestadorEndereco?.codigoCidade).toBe('3550308');
    expect(next.prestadorEndereco?.estado).toBe('SP');
    expect(next.prestadorInscricaoMunicipal).toBe('');
  });

  it('preenche inscrição municipal a partir do snapshot quando o formulário está vazio', () => {
    const snap = { ...baseSnap(), inscricaoMunicipal: 'IM-12345' };
    const next = mergeEmitenteSnapshotIntoNfseForm(emptyForm(), snap);
    expect(next.prestadorInscricaoMunicipal).toBe('IM-12345');
  });

  it('não sobrescreve campos já preenchidos manualmente', () => {
    const current = emptyForm();
    current.prestadorRazaoSocial = 'Nome Manual';
    current.prestadorEndereco = {
      ...emptyNfsePrestadorEndereco(),
      logradouro: 'Rua X'
    };
    const next = mergeEmitenteSnapshotIntoNfseForm(current, baseSnap());
    expect(next.prestadorRazaoSocial).toBe('Nome Manual');
    expect(next.prestadorEndereco?.logradouro).toBe('Rua X');
    expect(next.prestadorEmail).toBe('a@acme.com');
  });

  it('mantém CNPJ do prestador quando já há 14 dígitos', () => {
    const current = emptyForm();
    current.prestadorCpfCnpj = '99.887.776/0001-00';
    const next = mergeEmitenteSnapshotIntoNfseForm(current, baseSnap());
    expect(next.prestadorCpfCnpj).toBe('99.887.776/0001-00');
  });

  it('usa certDocument quando o campo prestador ainda não tem CNPJ completo', () => {
    const snap = { ...baseSnap(), certDocument: '11222333000181' };
    const next = mergeEmitenteSnapshotIntoNfseForm(emptyForm(), snap);
    expect(next.prestadorCpfCnpj.replace(/\D/g, '')).toBe('11222333000181');
  });

  it('segundo merge (ex.: novo snapshot do servidor) não sobrescreve edição manual', () => {
    let form = mergeEmitenteSnapshotIntoNfseForm(emptyForm(), baseSnap());
    form = { ...form, prestadorRazaoSocial: 'Editado pelo utilizador' };
    const snap2 = { ...baseSnap(), razaoSocial: 'Razão nova no servidor' };
    const next = mergeEmitenteSnapshotIntoNfseForm(form, snap2);
    expect(next.prestadorRazaoSocial).toBe('Editado pelo utilizador');
  });
});

describe('replacePrestadorFromEmitenteSnapshot', () => {
  it('substitui prestador mesmo quando já havia valores (opt-in pós-PATCH)', () => {
    const current = emptyForm();
    current.prestadorRazaoSocial = 'Antigo no formulário';
    current.prestadorEndereco = {
      ...emptyNfsePrestadorEndereco(),
      logradouro: 'Rua Velha'
    };
    const snap = { ...baseSnap(), inscricaoMunicipal: 'IM-SNAP' };
    const next = replacePrestadorFromEmitenteSnapshot(current, snap);
    expect(next.prestadorRazaoSocial).toBe('ACME LTDA');
    expect(next.prestadorEndereco?.logradouro).toBe('Av Paulista');
    expect(onlyDigits(next.prestadorCpfCnpj)).toBe('11222333000181');
    expect(next.prestadorInscricaoMunicipal).toBe('IM-SNAP');
  });
});
