import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsappPhoneDigits } from '../src/utils/whatsapp-phone.js';
import {
  buildPhoneLookupCandidates,
} from '../src/services/openclaw-bot.service.js';

test('normalizeWhatsappPhoneDigits remove não dígitos e sufixo @', () => {
  assert.equal(
    normalizeWhatsappPhoneDigits('5548912345678@s.whatsapp.net'),
    '5548912345678',
  );
  assert.equal(
    normalizeWhatsappPhoneDigits('+55 (48) 91234-5678'),
    '5548912345678',
  );
});

test('buildPhoneLookupCandidates inclui variante com 55', () => {
  assert.ok(buildPhoneLookupCandidates('48991234567').includes('5548991234567'));
  assert.ok(buildPhoneLookupCandidates('5548991234567').includes('48991234567'));
});
