import { describe, it, expect } from 'vitest';
import { buildApiErrorMessage } from './buildApiErrorMessage';

describe('buildApiErrorMessage', () => {
  it('usa message padrão quando payload vazio', () => {
    expect(buildApiErrorMessage(null)).toBe('Erro na requisição');
    expect(buildApiErrorMessage({})).toBe('Erro na requisição');
  });

  it('anexa details quando não duplica message', () => {
    expect(
      buildApiErrorMessage({
        message: 'Falha na validação',
        details: 'Campo X obrigatório'
      })
    ).toBe('Falha na validação\nCampo X obrigatório');
  });

  it('não duplica quando details já está contido em message', () => {
    expect(
      buildApiErrorMessage({
        message: 'Erro: Campo X obrigatório',
        details: 'Campo X obrigatório'
      })
    ).toBe('Erro: Campo X obrigatório');
  });

  it('compõe message+details antes do sufixo plugnotasRequest', () => {
    expect(
      buildApiErrorMessage({
        message: 'Falha',
        details: 'det',
        errors: { plugnotasRequest: { method: 'POST', path: '/nfse' } }
      })
    ).toBe('Falha\ndet (POST /nfse no emissor fiscal)');
  });

  it('inclui resumo de plugnotasUpdateAttempts', () => {
    expect(
      buildApiErrorMessage({
        message: 'Update falhou',
        errors: {
          plugnotasUpdateAttempts: [
            { method: 'PATCH', path: '/empresa/1', status: 404 }
          ]
        }
      })
    ).toBe('Update falhou [Tentativas do emissor: PATCH /empresa/1 → HTTP 404]');
  });
});
