import { describe, expect, it } from 'vitest';
import {
  buildCatalogoClienteMetadataJson,
  catalogoClienteEnderecoFromMetadata,
  formatCepPtBrInput,
  mergeCatalogoEnderecoFromCepLookup,
  validateCatalogoClienteEndereco,
} from './catalogoClienteEndereco';

describe('catalogoClienteEndereco', () => {
  it('formata CEP para exibição', () => {
    expect(formatCepPtBrInput('21220290')).toBe('21220-290');
  });

  it('lê endereço do metadata_json', () => {
    const form = catalogoClienteEnderecoFromMetadata({
      endereco: {
        cep: '21220290',
        logradouro: 'Rua Merces',
        codigoCidade: '3304557',
        descricaoCidade: 'Rio de Janeiro',
        estado: 'RJ',
      },
    });
    expect(form.cep).toBe('21220-290');
    expect(form.codigoCidade).toBe('3304557');
  });

  it('merge do lookup CEP preserva número digitado', () => {
    const merged = mergeCatalogoEnderecoFromCepLookup(
      {
        cep: '21220-290',
        logradouro: '',
        numero: '94',
        complemento: '',
        bairro: '',
        codigoCidade: '',
        descricaoCidade: '',
        estado: '',
      },
      {
        logradouro: 'Rua Merces',
        bairro: 'Vila da Penha',
        codigoCidade: '3304557',
        descricaoCidade: 'Rio de Janeiro',
        estado: 'RJ',
      },
    );
    expect(merged.numero).toBe('94');
    expect(merged.codigoCidade).toBe('3304557');
  });

  it('buildCatalogoClienteMetadataJson monta payload para API', () => {
    const meta = buildCatalogoClienteMetadataJson({
      cep: '21220-290',
      logradouro: 'Rua Merces',
      numero: '94',
      complemento: '',
      bairro: 'Vila da Penha',
      codigoCidade: '3304557',
      descricaoCidade: 'Rio de Janeiro',
      estado: 'RJ',
    });
    expect(meta).toEqual({
      endereco: {
        cep: '21220290',
        logradouro: 'Rua Merces',
        numero: '94',
        bairro: 'Vila da Penha',
        codigoCidade: '3304557',
        descricaoCidade: 'Rio de Janeiro',
        estado: 'RJ',
      },
    });
  });

  it('validate exige CEP e IBGE quando obrigatório', () => {
    expect(validateCatalogoClienteEndereco({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      codigoCidade: '',
      descricaoCidade: '',
      estado: '',
    })).toMatch(/CEP/);
  });

  it('validate não exige endereço para CPF (opcional)', () => {
    expect(validateCatalogoClienteEndereco({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      codigoCidade: '',
      descricaoCidade: '',
      estado: '',
    }, { obrigatorio: false })).toBeNull();
  });
});
