import { describe, it, expect } from 'vitest';
import {
  redactInviteValidateTokenInUrlForLogs,
  redactPrefeituraCredentialsForLogs
} from './apiClient';

describe('redactInviteValidateTokenInUrlForLogs', () => {
  it('deixa URL intacta quando não é validate de convite', () => {
    expect(redactInviteValidateTokenInUrlForLogs('http://localhost:3333/api/foo?token=sec'))
      .toBe('http://localhost:3333/api/foo?token=sec');
  });

  it('mascara token na rota /invites/validate', () => {
    expect(
      redactInviteValidateTokenInUrlForLogs(
        'http://localhost:3333/api/invites/validate?token=secret-value'
      )
    ).toBe('http://localhost:3333/api/invites/validate?token=[redacted]');
  });

  it('mascara token com URL relativa (proxy dev)', () => {
    expect(redactInviteValidateTokenInUrlForLogs('/api/invites/validate?token=abc&other=1')).toBe(
      '/api/invites/validate?token=[redacted]&other=1'
    );
  });
});

describe('redactPrefeituraCredentialsForLogs', () => {
  it('substitui login e senha em objetos aninhados com chave prefeitura', () => {
    const input = {
      nfse: {
        config: {
          prefeitura: { codigoIbge: '3550308', login: 'u1', senha: 's1' }
        }
      }
    };
    const out = redactPrefeituraCredentialsForLogs(input) as typeof input;
    expect(out.nfse.config.prefeitura.login).toBe('[redacted]');
    expect(out.nfse.config.prefeitura.senha).toBe('[redacted]');
    expect(out.nfse.config.prefeitura.codigoIbge).toBe('3550308');
  });

  it('redige JSON em string (corpo serializado)', () => {
    const raw = JSON.stringify({
      prefeitura: { login: 'x', senha: 'y' }
    });
    const out = redactPrefeituraCredentialsForLogs(raw);
    expect(typeof out).toBe('string');
    expect(out).toContain('[redacted]');
    expect(out).not.toContain('"x"');
    expect(out).not.toContain('"y"');
  });
});
