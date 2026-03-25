import { describe, it, expect } from 'vitest';
import { redactInviteValidateTokenInUrlForLogs } from './apiClient';

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
