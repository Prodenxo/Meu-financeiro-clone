import { describe, it, expect } from 'vitest';
import { formatPlugnotasIntegrationError } from './plugnotasIntegrationErrorMessage';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from './plugnotasApiErrorCode';

describe('formatPlugnotasIntegrationError', () => {
  it('preserva mensagem explícita de cadastro ausente dentro do texto mapeado', () => {
    const msg = 'Não há cadastro desta empresa no plugnotas';
    const out = formatPlugnotasIntegrationError(msg);
    expect(out).toContain(msg);
    expect(out).toContain('Cadastro no emissor');
  });

  it('enriquece quando API diz não localizar empresa (copy humana, sem colar JSON)', () => {
    const msg = 'Não localizamos qualquer Empresa com os parâmetros informados';
    const out = formatPlugnotasIntegrationError(msg);
    expect(out).toContain('Empresa não encontrada no emissor');
    expect(out).toContain('emissor fiscal');
    expect(out).not.toContain('Referência do emissor');
    expect(out).toContain('certificado');
    expect(out).toContain('token');
    expect(out).not.toContain(msg);
  });

  it('enriquece rota inexistente no serviço (sem anexar mensagem bruta)', () => {
    const msg = 'Esta rota não existe no serviço';
    const out = formatPlugnotasIntegrationError(msg);
    expect(out).toContain('Configuração do emissor fiscal');
    expect(out).toContain('URL base da API');
    expect(out).not.toContain(msg);
  });

  it('usa código estável certificado_409_sem_id', () => {
    const out = formatPlugnotasIntegrationError('raw', PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID);
    expect(out).toContain('Certificado');
    expect(out).toContain('Documentação:');
  });

  it('remove referência a POST /empresa da mensagem final quando plugnotasRequest está presente', () => {
    const out = formatPlugnotasIntegrationError(
      'Falha ao cadastrar empresa (POST /empresa no emissor fiscal)',
      null,
      400,
      { method: 'POST', path: '/empresa' }
    );
    expect(out).not.toContain('POST /empresa');
    expect(out).not.toContain('endpoint errado');
  });
});
