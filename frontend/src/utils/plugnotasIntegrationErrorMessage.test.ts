import { describe, it, expect } from 'vitest';
import { formatPlugnotasIntegrationError } from './plugnotasIntegrationErrorMessage';

describe('formatPlugnotasIntegrationError', () => {
  it('preserva mensagem quando indica cadastro ausente explícito', () => {
    const msg = 'Não há cadastro desta empresa no plugnotas';
    expect(formatPlugnotasIntegrationError(msg)).toBe(msg);
  });

  it('enriquece quando API diz não localizar empresa', () => {
    const msg = 'Não localizamos qualquer Empresa com os parâmetros informados';
    const out = formatPlugnotasIntegrationError(msg);
    expect(out).toContain('Plugnotas');
    expect(out).toContain(msg);
  });

  it('enriquece rota inexistente no serviço', () => {
    const msg = 'Esta rota não existe no serviço';
    const out = formatPlugnotasIntegrationError(msg);
    expect(out).toContain('PLUGNOTAS_API_BASE_URL');
    expect(out).toContain(msg);
  });
});
