import { describe, expect, it } from 'vitest';
import { matchManagedUserSearch } from './matchManagedUserSearch';

describe('matchManagedUserSearch', () => {
  const user = {
    id: '11111111-1111-1111-1111-111111111111',
    displayName: 'Ricardo de Souza',
    email: 'ricardo@exemplo.com',
    phone: '(21) 99999-1234',
    empresaName: 'ContabHub MEI',
    role: 'usuario',
  };

  it('aceita termo vazio', () => {
    expect(matchManagedUserSearch(user, '')).toBe(true);
  });

  it('filtra por nome', () => {
    expect(matchManagedUserSearch(user, 'ricardo')).toBe(true);
    expect(matchManagedUserSearch(user, 'souza')).toBe(true);
  });

  it('filtra por email', () => {
    expect(matchManagedUserSearch(user, 'exemplo.com')).toBe(true);
  });

  it('filtra por telefone parcial', () => {
    expect(matchManagedUserSearch(user, '99999')).toBe(true);
    expect(matchManagedUserSearch(user, '21999991234')).toBe(true);
  });

  it('filtra por empresa e perfil', () => {
    expect(matchManagedUserSearch(user, 'contabhub')).toBe(true);
    expect(matchManagedUserSearch(user, 'admin')).toBe(false);
    expect(matchManagedUserSearch(user, 'usuario')).toBe(true);
  });
});
