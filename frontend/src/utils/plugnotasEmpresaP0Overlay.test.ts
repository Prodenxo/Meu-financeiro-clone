import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePlugnotasEmpresaP0Overlay } from './plugnotasEmpresaP0Overlay';

describe('resolvePlugnotasEmpresaP0Overlay', () => {
  it('P0-L2: POST ok + GET coerente → phaseSuccess (prioridade sobre L1)', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: true,
        lastPostEmpresaPhase2Ok: true,
        lastGetEmpresaHasData: true,
        postErrorPanelVisible: true
      })
    ).toEqual({ kind: 'phaseSuccess' });
  });

  it('P0-L1: bloqueado externamente + painel retry visível + sem sucesso → impossibility', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: true,
        lastPostEmpresaPhase2Ok: false,
        lastGetEmpresaHasData: false,
        postErrorPanelVisible: true
      })
    ).toEqual({ kind: 'impossibility' });
  });

  it('flag off + painel visível → none', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: false,
        lastPostEmpresaPhase2Ok: false,
        lastGetEmpresaHasData: false,
        postErrorPanelVisible: true
      })
    ).toEqual({ kind: 'none' });
  });

  it('flag on mas sem painel retry → none', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: true,
        lastPostEmpresaPhase2Ok: false,
        lastGetEmpresaHasData: false,
        postErrorPanelVisible: false
      })
    ).toEqual({ kind: 'none' });
  });

  it('POST ok mas GET ainda incoerente → none (não P0-L1 sobre sucesso parcial)', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: true,
        lastPostEmpresaPhase2Ok: true,
        lastGetEmpresaHasData: false,
        postErrorPanelVisible: true
      })
    ).toEqual({ kind: 'none' });
  });

  it('POST ok + GET coerente sem flag → phaseSuccess', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: false,
        lastPostEmpresaPhase2Ok: true,
        lastGetEmpresaHasData: true,
        postErrorPanelVisible: false
      })
    ).toEqual({ kind: 'phaseSuccess' });
  });

  it('lastPostEmpresaPhase2Ok null → nunca phaseSuccess', () => {
    expect(
      resolvePlugnotasEmpresaP0Overlay({
        configuracaoCadastroBloqueadoExternamente: false,
        lastPostEmpresaPhase2Ok: null,
        lastGetEmpresaHasData: true,
        postErrorPanelVisible: false
      })
    ).toEqual({ kind: 'none' });
  });
});

describe('readMeiPlugnotasEmpresaCadastroBlockedExternally', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocked_externally (várias capitalizações) → true', async () => {
    for (const val of ['blocked_externally', 'BLOCKED_EXTERNALLY', ' Blocked_Externally ']) {
      vi.stubEnv('VITE_MEI_PLUGNOTAS_EMPRESA_CADASTRO_MODE', val);
      vi.resetModules();
      const mod = await import('./plugnotasEmpresaP0Overlay');
      expect(mod.readMeiPlugnotasEmpresaCadastroBlockedExternally()).toBe(true);
    }
  });

  it('auto ou vazio → false', async () => {
    vi.stubEnv('VITE_MEI_PLUGNOTAS_EMPRESA_CADASTRO_MODE', 'auto');
    vi.resetModules();
    const mod = await import('./plugnotasEmpresaP0Overlay');
    expect(mod.readMeiPlugnotasEmpresaCadastroBlockedExternally()).toBe(false);
  });
});
