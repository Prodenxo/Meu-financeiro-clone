import { describe, expect, it } from 'vitest';
import { getConviteTokenFromSearch, inviteStatusUserMessage } from './registerInviteQuery';

describe('registerInviteQuery (US-INV-05)', () => {
  it('getConviteTokenFromSearch lê ?convite=', () => {
    expect(getConviteTokenFromSearch('?convite=abc123%2B')).toBe('abc123+');
    expect(getConviteTokenFromSearch('convite=xy&other=1')).toBe('xy');
    expect(getConviteTokenFromSearch('?other=1&convite=z')).toBe('z');
  });

  it('getConviteTokenFromSearch normaliza espaços', () => {
    expect(getConviteTokenFromSearch('?convite=%20tok%20')).toBe('tok');
  });

  it('inviteStatusUserMessage cobre estados da API pública', () => {
    expect(inviteStatusUserMessage('valid')).toContain('válido');
    expect(inviteStatusUserMessage('expired')).toContain('expirou');
    expect(inviteStatusUserMessage('revoked')).toContain('cancelado');
    expect(inviteStatusUserMessage('used')).toContain('utilizado');
    expect(inviteStatusUserMessage('invalid')).toContain('inválido');
    expect(inviteStatusUserMessage('network_error')).toContain('verificar');
  });
});
