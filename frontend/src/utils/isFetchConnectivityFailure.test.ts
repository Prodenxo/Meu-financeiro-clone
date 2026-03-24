import { describe, it, expect } from 'vitest';
import { isFetchConnectivityFailure } from './isFetchConnectivityFailure';
import { buildApiErrorMessage } from './buildApiErrorMessage';

describe('isFetchConnectivityFailure', () => {
  it('retorna true para TypeError com mensagem típica de fetch (Chrome)', () => {
    expect(isFetchConnectivityFailure(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('retorna true para TypeError com mensagem típica de fetch (Firefox)', () => {
    expect(
      isFetchConnectivityFailure(
        new TypeError('NetworkError when attempting to fetch resource.')
      )
    ).toBe(true);
  });

  it('retorna true para TypeError com mensagem típica (Safari / load failed)', () => {
    expect(isFetchConnectivityFailure(new TypeError('Load failed'))).toBe(true);
  });

  it('retorna true para DOMException NetworkError', () => {
    const err = new DOMException('A network error occurred.', 'NetworkError');
    expect(isFetchConnectivityFailure(err)).toBe(true);
  });

  it('retorna false para TypeError sem padrão de transporte', () => {
    expect(isFetchConnectivityFailure(new TypeError('Cannot read properties of undefined'))).toBe(
      false
    );
  });

  it('retorna false para AbortError', () => {
    expect(isFetchConnectivityFailure(new DOMException('Aborted', 'AbortError'))).toBe(false);
  });

  it('retorna false quando há response com status na cadeia (erro enriquecido)', () => {
    const err = Object.assign(new Error('wrapped'), { response: { status: 502 } });
    expect(isFetchConnectivityFailure(err)).toBe(false);
  });

  it('retorna false quando response.status é string HTTP (mitigação QA)', () => {
    const err = Object.assign(new Error('wrapped'), { response: { status: '502' } });
    expect(isFetchConnectivityFailure(err)).toBe(false);
  });

  it('retorna false quando cause contém response com status', () => {
    const root = new Error('outer');
    (root as Error & { cause?: unknown }).cause = { response: { status: 400 } };
    expect(isFetchConnectivityFailure(root)).toBe(false);
  });

  it('retorna false quando cause contém response.status string (mitigação QA)', () => {
    const root = new Error('outer');
    (root as Error & { cause?: unknown }).cause = { response: { status: '400' } };
    expect(isFetchConnectivityFailure(root)).toBe(false);
  });

  it('retorna false para Error genérico com texto "Failed to fetch" (não equivale a TypeError do fetch)', () => {
    expect(isFetchConnectivityFailure(new Error('Failed to fetch'))).toBe(false);
  });

  it('não substitui fluxo negocial: Error com mensagem de API JSON', () => {
    const apiMsg = buildApiErrorMessage({
      message: 'Certificado inválido',
      errors: { plugnotasRequest: { method: 'POST', path: '/certificado' } }
    });
    expect(isFetchConnectivityFailure(new Error(apiMsg))).toBe(false);
  });

  it('retorna false para null e valores não-objeto', () => {
    expect(isFetchConnectivityFailure(null)).toBe(false);
    expect(isFetchConnectivityFailure(undefined)).toBe(false);
    expect(isFetchConnectivityFailure('Failed to fetch')).toBe(false);
  });
});
