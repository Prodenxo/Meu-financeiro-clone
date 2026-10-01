/**
 * Telefone internacional — porta de `frontend/lib/phoneCountries.ts`,
 * `frontend/lib/internationalPhone.ts` e da validação do backend (`assertValidWhatsappPhone`).
 * Convenção: o valor guardado é só dígitos com DDI na frente (ex.: 5521999999999).
 */
import { PHONE_COUNTRIES_COMPACT } from './phoneCountries.generated.js';

/** @type {{ iso: string, name: string, dialCode: string }[]} */
export const PHONE_COUNTRIES = PHONE_COUNTRIES_COMPACT.map(([iso, name, dialCode]) => ({ iso, name, dialCode }));

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));
const BY_DIAL_LENGTH_DESC = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

export function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function phonesMatch(left, right) {
  return normalizePhoneDigits(left) === normalizePhoneDigits(right);
}

export function getPhoneCountryByIso(iso) {
  return BY_ISO.get(String(iso || '').toLowerCase()) || PHONE_COUNTRIES[0];
}

/** Primeiro país (DDI mais longo primeiro) cujo código é prefixo dos dígitos; Brasil quando nada casa. */
export function detectPhoneCountryFromDigits(digits) {
  const d = normalizePhoneDigits(digits);
  if (!d) return PHONE_COUNTRIES[0];
  for (const country of BY_DIAL_LENGTH_DESC) {
    if (d.startsWith(country.dialCode)) return country;
  }
  return PHONE_COUNTRIES[0];
}

export function splitInternationalPhone(value, fallbackIso = 'br') {
  const digits = normalizePhoneDigits(value);
  if (!digits) return { country: getPhoneCountryByIso(fallbackIso), nationalDigits: '' };
  const country = detectPhoneCountryFromDigits(digits);
  const nationalDigits = digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits;
  return { country, nationalDigits };
}

export function buildInternationalPhone(country, nationalDigits) {
  const national = normalizePhoneDigits(nationalDigits);
  if (!national) return '';
  return `${country.dialCode}${national}`;
}

/** Máscara brasileira "(11) 99999-9999" (mesma de `formatPhoneBrCell`, sem o 55). */
export function formatNationalPhoneInput(countryIso, nationalDigits) {
  const digits = normalizePhoneDigits(nationalDigits);
  if (!digits) return '';
  if (countryIso !== 'br') return digits.slice(0, 15);
  const local = digits.slice(0, 11);
  if (local.length <= 2) return `(${local}`;
  if (local.length <= 7) return `(${local.slice(0, 2)}) ${local.slice(2)}`;
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}

/** Telefone completo para exibição (ex.: "+55 (21) 99999-9999"). */
export function formatInternationalPhone(value) {
  const { country, nationalDigits } = splitInternationalPhone(value);
  if (!nationalDigits) return '';
  return `+${country.dialCode} ${formatNationalPhoneInput(country.iso, nationalDigits)}`;
}

/**
 * Mesmas regras do backend (`assertValidWhatsappPhone`): Brasil = DDD + 8/9 dígitos;
 * outros países = 10 a 15 dígitos no total. Devolve a mensagem de erro ou `null`.
 */
export function getPhoneValidationError(value) {
  const digits = normalizePhoneDigits(value);
  if (!digits) return 'Informe um número de telefone.';
  if (digits.startsWith('55')) {
    const national = digits.slice(2);
    if (national.length < 10 || national.length > 11) {
      return 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).';
    }
    return null;
  }
  if (digits.length < 10 || digits.length > 15) return 'Telefone internacional inválido.';
  return null;
}

/** Bandeira do país (mesmas CDNs das moedas): SVG circular → PNG. */
export function getCountryFlagUrls(iso) {
  const code = String(iso || '').toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return [];
  return [`https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@gh-pages/flags/${code}.svg`, `https://flagcdn.com/w80/${code}.png`];
}

export function filterPhoneCountries(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return PHONE_COUNTRIES;
  const qDigits = q.replace(/\D/g, '');
  return PHONE_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.iso === q || (qDigits && c.dialCode.startsWith(qDigits)));
}
