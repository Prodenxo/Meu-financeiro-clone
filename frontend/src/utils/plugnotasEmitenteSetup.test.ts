import { describe, it, expect, vi } from 'vitest';
import {
  isPlugnotasEmitenteSetupError,
  PlugnotasEmitenteSetupError,
  retryPlugnotasEmpresaRegistro,
  submitPlugnotasEmitenteSetup
} from './plugnotasEmitenteSetup';

describe('plugnotasEmitenteSetup', () => {
  const file = new File(['x'], 'c.pfx');

  it('chama certificado depois empresa e devolve resultado', async () => {
    const cadastrarCertificado = vi.fn(async () => ({
      id: 'cid-1',
      message: 'ok',
      raw: {}
    }));
    const cadastrarEmpresa = vi.fn(async () => ({
      cnpj: '17422651000172',
      message: 'empresa ok',
      raw: {}
    }));
    const onPhaseChange = vi.fn();

    const r = await submitPlugnotasEmitenteSetup(
      {
        certificateInput: { arquivo: file, senha: 's', cpfCnpj: '17422651000172' },
        buildCompanyPayload: (certId) => ({
          cpfCnpj: '17422651000172',
          certificado: certId
        })
      },
      { deps: { cadastrarCertificado, cadastrarEmpresa }, onPhaseChange }
    );

    expect(cadastrarCertificado).toHaveBeenCalledTimes(1);
    expect(cadastrarEmpresa).toHaveBeenCalledTimes(1);
    expect(onPhaseChange.mock.calls).toEqual([['certificado'], ['empresa']]);
    expect(r.certificateResponse.id).toBe('cid-1');
    expect(r.companyResponse.cnpj).toBe('17422651000172');
    expect(r.certificateRecoveredFrom409).toBe(false);
  });

  it('certificateRecoveredFrom409 quando raw indica 409 resolvido', async () => {
    const cadastrarCertificado = vi.fn(async () => ({
      id: 'cid-1',
      message: 'ok',
      raw: { recoveredFrom409: true }
    }));
    const cadastrarEmpresa = vi.fn(async () => ({
      cnpj: '17422651000172',
      message: 'ok',
      raw: {}
    }));

    const r = await submitPlugnotasEmitenteSetup(
      {
        certificateInput: { arquivo: file, senha: 's' },
        buildCompanyPayload: (certId) => ({
          cpfCnpj: '17422651000172',
          certificado: certId
        })
      },
      { deps: { cadastrarCertificado, cadastrarEmpresa } }
    );

    expect(r.certificateRecoveredFrom409).toBe(true);
  });

  it('lança PlugnotasEmitenteSetupError fase certificado', async () => {
    const cadastrarCertificado = vi.fn(async () => {
      throw new Error('cert falhou');
    });
    const cadastrarEmpresa = vi.fn();

    await expect(
      submitPlugnotasEmitenteSetup(
        {
          certificateInput: { arquivo: file, senha: 's' },
          buildCompanyPayload: () => ({})
        },
        { deps: { cadastrarCertificado, cadastrarEmpresa } }
      )
    ).rejects.toMatchObject({ phase: 'certificado', name: 'PlugnotasEmitenteSetupError' });

    expect(cadastrarEmpresa).not.toHaveBeenCalled();
  });

  it('lança PlugnotasEmitenteSetupError fase empresa com meta', async () => {
    const cadastrarCertificado = vi.fn(async () => ({
      id: 'cid-1',
      message: 'ok',
      raw: {}
    }));
    const cadastrarEmpresa = vi.fn(async () => {
      throw new Error('empresa falhou');
    });

    try {
      await submitPlugnotasEmitenteSetup(
        {
          certificateInput: { arquivo: file, senha: 's' },
          buildCompanyPayload: (certId) => ({
            cpfCnpj: '17422651000172',
            certificado: certId
          })
        },
        { deps: { cadastrarCertificado, cadastrarEmpresa } }
      );
      expect.fail('deveria lançar');
    } catch (e) {
      expect(isPlugnotasEmitenteSetupError(e)).toBe(true);
      if (isPlugnotasEmitenteSetupError(e)) {
        expect(e.phase).toBe('empresa');
        expect(e.certificadoId).toBe('cid-1');
        expect(e.cnpj).toBe('17422651000172');
      }
    }
  });

  it('lança fase certificado se id vazio', async () => {
    const cadastrarCertificado = vi.fn(async () => ({
      id: null,
      message: 'ok',
      raw: {}
    }));
    const cadastrarEmpresa = vi.fn();

    await expect(
      submitPlugnotasEmitenteSetup(
        {
          certificateInput: { arquivo: file, senha: 's' },
          buildCompanyPayload: () => ({})
        },
        { deps: { cadastrarCertificado, cadastrarEmpresa } }
      )
    ).rejects.toMatchObject({ phase: 'certificado' });

    expect(cadastrarEmpresa).not.toHaveBeenCalled();
  });

  it('retryPlugnotasEmpresaRegistro delega cadastrarEmpresa', async () => {
    const cadastrarEmpresa = vi.fn(async () => ({ cnpj: '1', message: 'ok', raw: {} }));
    const r = await retryPlugnotasEmpresaRegistro({ x: 1 }, { cadastrarEmpresa });
    expect(cadastrarEmpresa).toHaveBeenCalledWith({ x: 1 });
    expect(r.cnpj).toBe('1');
  });

  it('PlugnotasEmitenteSetupError identidade', () => {
    const e = new PlugnotasEmitenteSetupError('empresa', new Error('x'), {
      certificadoId: 'a',
      cnpj: '17422651000172'
    });
    expect(isPlugnotasEmitenteSetupError(e)).toBe(true);
    expect(e).toBeInstanceOf(Error);
  });
});
