import { describe, expect, it } from 'vitest';
import {
  getTransactionStatusLabel,
  isRealizedTransactionStatus,
  normalizeTransactionStatus,
} from './transactionStatus';

describe('transactionStatus', () => {
  it('normaliza entrada realizada para recebido', () => {
    expect(normalizeTransactionStatus('entrada', 'pago')).toBe('recebido');
    expect(normalizeTransactionStatus('entrada', 'recebido')).toBe('recebido');
    expect(normalizeTransactionStatus('entrada', '')).toBe('recebido');
  });

  it('normaliza saída realizada para pago', () => {
    expect(normalizeTransactionStatus('saida', 'recebido')).toBe('pago');
    expect(normalizeTransactionStatus('saída', 'pago')).toBe('pago');
  });

  it('exibe recebido no badge mesmo se DB tiver pago em entrada', () => {
    expect(getTransactionStatusLabel('entrada', 'pago')).toBe('recebido');
    expect(getTransactionStatusLabel('saida', 'pago')).toBe('pago');
  });

  it('trata pago em entrada como realizado', () => {
    expect(isRealizedTransactionStatus('entrada', 'pago')).toBe(true);
  });
});
