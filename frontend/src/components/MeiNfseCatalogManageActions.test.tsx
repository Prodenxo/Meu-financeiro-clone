// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MeiNfseCatalogManageActions } from './MeiNfseCatalogManageActions';

describe('MeiNfseCatalogManageActions', () => {
  afterEach(() => cleanup());

  it('com inRouter: mostra hint e links para rotas do catálogo', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MeiNfseCatalogManageActions inRouter />
      </MemoryRouter>
    );

    expect(screen.getByText(/Cadastre ou edite itens para os atalhos acima/)).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/mei-catalogo/clientes');
    expect(links[1].getAttribute('href')).toBe('/mei-catalogo/servicos-produtos');
    expect(links[0].getAttribute('aria-describedby')).toBe('mei-nfse-catalog-actions-hint');
    expect(links[1].getAttribute('aria-describedby')).toBe('mei-nfse-catalog-actions-hint');
  });

  it('sem inRouter: usa âncoras com os mesmos destinos', () => {
    render(<MeiNfseCatalogManageActions inRouter={false} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/mei-catalogo/clientes');
    expect(links[1].getAttribute('href')).toBe('/mei-catalogo/servicos-produtos');
    expect(links[0].getAttribute('aria-describedby')).toBe('mei-nfse-catalog-actions-hint');
    expect(links[1].getAttribute('aria-describedby')).toBe('mei-nfse-catalog-actions-hint');
  });

  it('showHint false: não renderiza a linha didática', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MeiNfseCatalogManageActions inRouter showHint={false} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Cadastre ou edite itens para os atalhos acima/)).toBeNull();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('aria-describedby')).toBeNull();
    expect(links[1].getAttribute('aria-describedby')).toBeNull();
  });

  it('catalogEmpty: mostra linha curta extra (FR-NFSE-GCAT-03)', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MeiNfseCatalogManageActions inRouter catalogEmpty />
      </MemoryRouter>
    );

    expect(screen.getByText(/Ainda sem itens guardados/)).toBeTruthy();
    expect(document.getElementById('mei-nfse-catalog-empty-hint')).toBeTruthy();
    const links = screen.getAllByRole('link');
    const bothHints = 'mei-nfse-catalog-actions-hint mei-nfse-catalog-empty-hint';
    expect(links[0].getAttribute('aria-describedby')).toBe(bothHints);
    expect(links[1].getAttribute('aria-describedby')).toBe(bothHints);
  });

  it('catalogEmpty false: não mostra linha de catálogo vazio', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MeiNfseCatalogManageActions inRouter catalogEmpty={false} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Ainda sem itens guardados/)).toBeNull();
  });

  it('catalogEmpty com showHint false: não mostra linha vazia (hero)', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MeiNfseCatalogManageActions inRouter showHint={false} catalogEmpty />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Ainda sem itens guardados/)).toBeNull();
  });
});
