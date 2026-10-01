'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { buildInternationalPhone, filterPhoneCountries, formatNationalPhoneInput, normalizePhoneDigits, splitInternationalPhone } from '@/lib/phone/phone';
import m from '@/components/dashboard/modal.module.css';
import s from './configuracoes.module.css';
import { CountryFlag } from './CountryFlag';

/** Seletor de país (DDI) em modal com busca — mesma lista do app atual. */
function CountryPicker({ current, onPick, onClose }) {
  const dialogRef = useRef(null);
  const [query, setQuery] = useState('');
  const options = useMemo(() => filterPhoneCountries(query), [query]);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="country-picker-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="country-picker-title">
            Código do país
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className={s.pickerSearch}>
          <span className={s.pickerSearchIcon}>
            <Icon name="search" size={15} />
          </span>
          <Input placeholder="Buscar país ou DDI" aria-label="Buscar país" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus autoComplete="off" />
        </div>
        <div className={s.countryList} role="listbox" aria-label="Países">
          {options.length === 0 ? (
            <p className={s.pickerEmpty}>Nenhum país encontrado</p>
          ) : (
            options.map((c) => (
              <button key={c.iso} type="button" role="option" aria-selected={c.iso === current.iso} className={cx(s.countryItem, c.iso === current.iso && s.countryItemActive)} onClick={() => onPick(c)}>
                <CountryFlag iso={c.iso} label={c.name} size={22} />
                <span className={s.countryName}>{c.name}</span>
                <span className={s.countryDial}>+{c.dialCode}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </dialog>
  );
}

/**
 * Telefone internacional: botão de país (bandeira + DDI) e número com máscara brasileira.
 * `value` / `onChange` trabalham com dígitos completos (DDI + número), como no Expo.
 */
export function PhoneInput({ id, value, onChange, invalid, disabled }) {
  // País escolhido fica em estado próprio (vários países partilham o DDI "1"), como no Expo.
  const [picked, setPicked] = useState(() => splitInternationalPhone(value).country);
  const [pickerOpen, setPickerOpen] = useState(false);
  const digits = normalizePhoneDigits(value);
  const country = !digits || digits.startsWith(picked.dialCode) ? picked : splitInternationalPhone(digits).country;
  const nationalDigits = digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits;
  const national = formatNationalPhoneInput(country.iso, nationalDigits);

  const pick = (next) => {
    setPicked(next);
    setPickerOpen(false);
    onChange(buildInternationalPhone(next, nationalDigits) || `${next.dialCode}`);
  };

  return (
    <>
      <div className={cx(s.phoneWrap, invalid && s.phoneWrapInvalid)}>
        <button type="button" className={s.countryBtn} onClick={() => setPickerOpen(true)} disabled={disabled} aria-label={`Código do país: ${country.name}, mais ${country.dialCode}`} aria-haspopup="dialog">
          <CountryFlag iso={country.iso} label={country.name} size={20} />
          +{country.dialCode}
          <Icon name="chevron-down" size={14} />
        </button>
        <input
          id={id}
          className={s.phoneInput}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={country.iso === 'br' ? '(11) 99999-9999' : 'Número com DDD'}
          value={national}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange(digits ? buildInternationalPhone(country, digits) : `${country.dialCode}`);
          }}
        />
      </div>
      {pickerOpen ? <CountryPicker current={country} onPick={pick} onClose={() => setPickerOpen(false)} /> : null}
    </>
  );
}
