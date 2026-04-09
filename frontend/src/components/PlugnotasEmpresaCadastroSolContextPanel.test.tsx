// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

import { PlugnotasEmpresaCadastroSolContextPanel } from './PlugnotasEmpresaCadastroSolContextPanel';
import {
  PLUGNOTAS_SOL_COMPACT_CHAIN_LINE,
  PLUGNOTAS_SOL_L2_TITLE,
  PLUGNOTAS_SOL_L3_BODY,
  PLUGNOTAS_SOL_L3_TITLE
} from '../utils/plugnotasEmpresaCadastroSolUx';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;

describe('PlugnotasEmpresaCadastroSolContextPanel', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('SOL-L3: mostra título e corpo neutros (404 "frio")', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="L3" showPlaybook={false} />);
    });
    expect(container.textContent).toContain(PLUGNOTAS_SOL_L3_TITLE);
    expect(container.textContent).toContain(PLUGNOTAS_SOL_L3_BODY);
  });

  it('SOL-L1: mostra encadeamento POST → GET', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="L1" showPlaybook={false} />);
    });
    expect(container.textContent).toContain('Cadastro ainda não foi criado no emissor');
  });

  it('SOL-L1: aria-label da região prioriza cadastro antes da consulta (FR-BRIEF-OP-05)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="L1" showPlaybook={false} />);
    });
    const region = container.querySelector('[role="region"][aria-label]');
    expect(region).toBeTruthy();
    const label = (region?.getAttribute('aria-label') ?? '').toLowerCase();
    const iCadastro = label.indexOf('cadastro');
    const iConsulta = label.indexOf('consulta');
    expect(iCadastro).toBeGreaterThanOrEqual(0);
    expect(iConsulta).toBeGreaterThanOrEqual(0);
    expect(iCadastro).toBeLessThan(iConsulta);
  });

  it('SOL-L2: mostra título de registro pendente (story P1 activa flag na página)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="L2" showPlaybook={false} />);
    });
    expect(container.textContent).toContain(PLUGNOTAS_SOL_L2_TITLE);
  });

  it('L0 não renderiza (cadastro POST ok e consulta sem "não encontrado")', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="L0" />);
    });
    expect(container.textContent?.trim()).toBe('');
  });

  it('none não renderiza conteúdo', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PlugnotasEmpresaCadastroSolContextPanel state="none" />);
    });
    expect(container.textContent?.trim()).toBe('');
  });

  it('compact renderiza linha de estado sem playbook', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PlugnotasEmpresaCadastroSolContextPanel state="L3" compact showPlaybook={false} />
      );
    });
    expect(container.textContent).toContain(PLUGNOTAS_SOL_COMPACT_CHAIN_LINE);
    expect(container.textContent).not.toContain('O que fazer agora?');
  });
});
