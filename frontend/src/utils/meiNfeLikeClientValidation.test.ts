import { describe, expect, it } from 'vitest';
import { createEmptyMeiNfeLikeFormState, createEmptyMeiNfeLikeItem } from './meiNfeLikeFormState';
import { validateMeiNfeLikeForm } from './meiNfeLikeClientValidation';

describe('validateMeiNfeLikeForm', () => {
  it('rejeita formulário vazio', () => {
    const r = validateMeiNfeLikeForm(createEmptyMeiNfeLikeFormState(), 'NF-e');
    expect(r.ok).toBe(false);
    expect(r.errors['mei-nfe-emitente-cnpj']).toBeTruthy();
    expect(r.firstSection).toBe('emitente');
  });

  it('rejeita CPF/CNPJ do destinatário com DV inválido', () => {
    const state = {
      ...createEmptyMeiNfeLikeFormState(),
      emitenteCnpj: '11.222.333/0001-81',
      destinatarioDoc: '111.111.111-11',
      destinatarioRazao: 'X',
      itens: [
        {
          ...createEmptyMeiNfeLikeItem(),
          codigo: '1',
          descricao: 'P',
          ncm: '12345678',
          cfop: '5102',
          quantidade: '1',
          valorUnitario: '1'
        }
      ]
    };
    const r = validateMeiNfeLikeForm(state, 'NF-e');
    expect(r.ok).toBe(false);
    expect(r.errors['mei-nfe-dest-doc']).toContain('inválido');
  });

  it('aceita mínimo válido (um item)', () => {
    const state = {
      ...createEmptyMeiNfeLikeFormState(),
      emitenteCnpj: '11.222.333/0001-81',
      destinatarioDoc: '529.982.247-25',
      destinatarioRazao: 'Cliente Teste',
      destinatarioEndereco: {
        cep: '01310100',
        logradouro: 'Av Paulista',
        numero: '100',
        complemento: '',
        bairro: 'Bela Vista',
        codigoCidade: '3550308',
        descricaoCidade: 'São Paulo',
        estado: 'SP',
      },
      itens: [
        {
          ...createEmptyMeiNfeLikeItem(),
          codigo: 'SKU1',
          descricao: 'Produto',
          ncm: '12345678',
          cfop: '5102',
          quantidade: '2',
          valorUnitario: '10,50'
        }
      ]
    };
    const r = validateMeiNfeLikeForm(state, 'NFC-e');
    expect(r.ok).toBe(true);
  });
});
