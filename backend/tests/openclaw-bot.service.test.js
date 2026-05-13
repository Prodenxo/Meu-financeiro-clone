import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsappPhoneDigits } from '../src/utils/whatsapp-phone.js';
import {
  buildPhoneLookupCandidates,
  parseMesCompetenciaMmYyyy,
  mesCompetenciaAtualUtc,
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

test('parseMesCompetenciaMmYyyy normaliza MM/YYYY', () => {
  assert.deepEqual(parseMesCompetenciaMmYyyy('5/2026'), {
    display: '05/2026',
    periodoDigits: '202605',
  });
  assert.deepEqual(parseMesCompetenciaMmYyyy('05/2026'), {
    display: '05/2026',
    periodoDigits: '202605',
  });
  assert.equal(parseMesCompetenciaMmYyyy('13/2026'), null);
  assert.equal(parseMesCompetenciaMmYyyy('05-2026'), null);
  assert.equal(parseMesCompetenciaMmYyyy(''), null);
});

test('mesCompetenciaAtualUtc devolve display e periodoDigits coerentes', () => {
  const r = mesCompetenciaAtualUtc();
  assert.match(r.display, /^\d{2}\/\d{4}$/);
  assert.match(r.periodoDigits, /^\d{6}$/);
  const parsed = parseMesCompetenciaMmYyyy(r.display);
  assert.deepEqual(parsed?.periodoDigits, r.periodoDigits);
});
