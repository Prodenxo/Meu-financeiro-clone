import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInternationalPhone,
  detectPhoneCountryFromDigits,
  filterPhoneCountries,
  formatInternationalPhone,
  formatNationalPhoneInput,
  getPhoneValidationError,
  phonesMatch,
  splitInternationalPhone,
} from './phone.js';

test('detecta país pelo DDI (mais longo primeiro) e cai para o Brasil', () => {
  assert.equal(detectPhoneCountryFromDigits('5521999999999').iso, 'br');
  assert.equal(detectPhoneCountryFromDigits('12125551234').iso, 'us');
  assert.equal(detectPhoneCountryFromDigits('351912345678').iso, 'pt');
  assert.equal(detectPhoneCountryFromDigits('').iso, 'br');
});

test('separa e remonta telefone internacional', () => {
  const { country, nationalDigits } = splitInternationalPhone('+55 (21) 99999-9999');
  assert.equal(country.iso, 'br');
  assert.equal(nationalDigits, '21999999999');
  assert.equal(buildInternationalPhone(country, '(21) 99999-9999'), '5521999999999');
  assert.equal(buildInternationalPhone(country, ''), '');
  assert.equal(splitInternationalPhone('', 'pt').country.iso, 'pt');
});

test('máscara nacional brasileira e exibição completa', () => {
  assert.equal(formatNationalPhoneInput('br', '21'), '(21');
  assert.equal(formatNationalPhoneInput('br', '219999'), '(21) 9999');
  assert.equal(formatNationalPhoneInput('br', '21999999999'), '(21) 99999-9999');
  assert.equal(formatNationalPhoneInput('us', '2125551234'), '2125551234');
  assert.equal(formatInternationalPhone('5521999999999'), '+55 (21) 99999-9999');
  assert.equal(formatInternationalPhone(''), '');
});

test('validação segue o backend: Brasil 10-11 dígitos nacionais, outros 10-15 no total', () => {
  assert.equal(getPhoneValidationError(''), 'Informe um número de telefone.');
  assert.equal(getPhoneValidationError('552199999'), 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).');
  assert.equal(getPhoneValidationError('5521999999999'), null);
  assert.equal(getPhoneValidationError('552133334444'), null);
  assert.equal(getPhoneValidationError('1212555'), 'Telefone internacional inválido.');
  assert.equal(getPhoneValidationError('12125551234'), null);
});

test('comparação ignora formatação e busca por nome/DDI', () => {
  assert.equal(phonesMatch('+55 21 99999-9999', '5521999999999'), true);
  assert.equal(phonesMatch('5521999999999', '5521999999998'), false);
  assert.ok(filterPhoneCountries('bras').some((c) => c.iso === 'br'));
  assert.ok(filterPhoneCountries('+351').every((c) => c.dialCode.startsWith('351')));
  assert.ok(filterPhoneCountries('').length > 150);
});
