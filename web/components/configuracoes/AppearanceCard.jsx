'use client';

import { cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useThemePref } from '@/lib/themeClient';
import s from './configuracoes.module.css';
import { SettingsCard } from './SettingsCard';

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: 'sun', preview: '' },
  { value: 'system', label: 'Automático', icon: 'sun-moon', preview: s.previewAuto },
  { value: 'dark', label: 'Escuro', icon: 'moon', preview: s.previewDark },
];

function Preview({ className }) {
  return (
    <span className={cx(s.preview, className)} aria-hidden="true">
      <span className={s.previewSide}>
        <i />
        <i />
        <i />
      </span>
      <span className={s.previewMain}>
        <i />
        <b />
      </span>
    </span>
  );
}

/**
 * Aparência — radios Claro / Automático / Escuro. A preferência vai para o cookie `mf-theme`
 * (mesmo mecanismo do botão da sidebar) e «Automático» acompanha o dispositivo.
 */
export function AppearanceCard({ initialPref }) {
  const { pref, setPref } = useThemePref(initialPref);

  return (
    <SettingsCard id="aparencia" icon="settings" title="Aparência" description="Escolha como visualizar o aplicativo.">
      <div className={s.themeGrid} role="radiogroup" aria-label="Tema do aplicativo">
        {OPTIONS.map((opt) => {
          const active = pref === opt.value;
          return (
            <label key={opt.value} className={cx(s.themeOption, active && s.themeOptionActive)}>
              <input type="radio" name="tema" value={opt.value} checked={active} onChange={() => setPref(opt.value)} />
              <span className={s.themeIcon}>
                <Icon name={opt.icon} size={18} />
              </span>
              {opt.label}
              <Preview className={opt.preview} />
            </label>
          );
        })}
      </div>
      <p className={s.themeHint}>
        <Icon name="alert-circle" size={14} />
        Automático acompanha o tema do dispositivo.
      </p>
    </SettingsCard>
  );
}
