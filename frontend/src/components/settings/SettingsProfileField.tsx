import type { ReactNode } from 'react';

type SettingsProfileFieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  isLast?: boolean;
};

export function SettingsProfileField({
  label,
  children,
  hint,
  onSave,
  saveLabel = 'Salvar',
  saving = false,
  disabled = false,
  isLast = false,
}: SettingsProfileFieldProps) {
  const saveDisabled = disabled || saving;
  const fieldId = `settings-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={['settings-field', isLast ? '!border-b-0 pb-0' : ''].join(' ')}>
      <label htmlFor={fieldId} className="settings-field-label">
        {label}
      </label>

      <div className="settings-field-row">
        <div id={fieldId} className="settings-field-input [&_.form-control]:planner-input-compact [&_.form-control]:!pl-12">
          {children}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="settings-save-btn"
        >
          {saving ? 'Salvando…' : saveLabel}
        </button>
      </div>

      {hint ? <p className="settings-hint">{hint}</p> : null}
    </div>
  );
}
