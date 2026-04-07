import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FetchErrorBanner from './FetchErrorBanner';
import { USER_ERROR_COPY } from '../lib/userErrorCopy';

/** Cobertura automática alinhada ao DoD da story (rede + mensagem genérica), em substituição parcial de smoke manual. */
describe('FetchErrorBanner', () => {
  it('mapeia TypeError Failed to fetch para copy de rede', () => {
    render(<FetchErrorBanner error={new TypeError('Failed to fetch')} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(USER_ERROR_COPY.rede.title)).toBeTruthy();
    expect(screen.getByText(new RegExp(USER_ERROR_COPY.rede.description.slice(0, 25), 'i'))).toBeTruthy();
  });

  it('mensagem legada Erro na requisição não fica só numa linha genérica', () => {
    render(<FetchErrorBanner message="Erro na requisição" />);
    expect(screen.getByText(USER_ERROR_COPY.validacao_servidor.title)).toBeTruthy();
    expect(screen.getByText(USER_ERROR_COPY.validacao_servidor.description)).toBeTruthy();
  });
});
