import { describe, expect, it } from 'vitest';

import {
  resolvePlugnotasEmpresaCadastroSolUxState,
  type PlugnotasEmpresaCadastroSolUxInput
} from './plugnotasEmpresaCadastroSolUx';

const base = (over: Partial<PlugnotasEmpresaCadastroSolUxInput>): PlugnotasEmpresaCadastroSolUxInput => ({
  lastPostEmpresaPhase2Ok: null,
  lastGetEmpresaNotFound: false,
  postErrorPanelVisible: false,
  sessionPostFailedFlag: false,
  ...over
});

describe('resolvePlugnotasEmpresaCadastroSolUxState', () => {
  it('L0 quando POST ok e consulta não é "não encontrado"', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({ lastPostEmpresaPhase2Ok: true, lastGetEmpresaNotFound: false })
      )
    ).toBe('L0');
  });

  it('none quando POST ok mas ainda "não encontrado" (ambíguo)', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({ lastPostEmpresaPhase2Ok: true, lastGetEmpresaNotFound: true })
      )
    ).toBe('none');
  });

  it('none quando não é mensagem de "não encontrado"', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({ lastGetEmpresaNotFound: false, postErrorPanelVisible: true })
      )
    ).toBe('none');
  });

  it('L1 quando painel POST visível e consulta "não encontrado"', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({ lastGetEmpresaNotFound: true, postErrorPanelVisible: true, sessionPostFailedFlag: false })
      )
    ).toBe('L1');
  });

  it('L3 quando só "não encontrado" sem painel nem sessão (FR-SOL-P0)', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({ lastGetEmpresaNotFound: true, postErrorPanelVisible: false, sessionPostFailedFlag: false })
      )
    ).toBe('L3');
  });

  it('L2 quando flag de sessão e "não encontrado" sem painel (FR-SOL-P1)', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({
          lastGetEmpresaNotFound: true,
          postErrorPanelVisible: false,
          sessionPostFailedFlag: true
        })
      )
    ).toBe('L2');
  });

  it('L1 prevalece sobre L2 quando painel POST ainda visível', () => {
    expect(
      resolvePlugnotasEmpresaCadastroSolUxState(
        base({
          lastGetEmpresaNotFound: true,
          postErrorPanelVisible: true,
          sessionPostFailedFlag: true
        })
      )
    ).toBe('L1');
  });
});
