import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalizeBrazilWhatsappPhone,
  normalizeWhatsappPhoneDigits,
} from '../src/utils/whatsapp-phone.js';

/** Espelha regras de `assertValidWhatsappPhone` em auth.service.js */
const validateBrWhatsappPhone = (phone) => {
  const digits = normalizeWhatsappPhoneDigits(phone);
  if (!digits.startsWith('55')) return { ok: true };

  const cleaned = canonicalizeBrazilWhatsappPhone(digits);
  const national = cleaned.slice(2);
  if (!national || national.length < 10) {
    return { ok: false, reason: 'short' };
  }
  if (national.length === 10) {
    return { ok: false, reason: 'landline' };
  }
  if (national.length === 11 && national[2] !== '9') {
    return { ok: false, reason: 'no_ninth_digit' };
  }
  return { ok: true, cleaned };
};

test('celular BR válido com nono dígito', () => {
  const result = validateBrWhatsappPhone('5521996185328');
  assert.equal(result.ok, true);
  assert.equal(result.cleaned, '5521996185328');
});

test('rejeita número fake 11111-1111 (sem 9 após DDD)', () => {
  const result = validateBrWhatsappPhone('5521111111111');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no_ninth_digit');
});

test('rejeita fixo de 10 dígitos', () => {
  const result = validateBrWhatsappPhone('552133334444');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'landline');
});
