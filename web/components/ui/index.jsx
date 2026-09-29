import Link from 'next/link';
import { Icon } from './Icon';
import s from './ui.module.css';

function cx(...names) {
  return names.filter(Boolean).join(' ');
}

export { cx, Icon };

export function Card({ as: Tag = 'section', tight = false, className, children, ...rest }) {
  return (
    <Tag className={cx(s.card, tight && s.cardTight, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, icon, iconTone, action, id, className }) {
  return (
    <header className={cx(s.cardHeader, className)}>
      <div className={s.cardTitleRow}>
        {icon ? <IconBubble name={icon} tone={iconTone} /> : null}
        <h2 className={s.cardTitle} id={id}>
          {title}
        </h2>
      </div>
      {action}
    </header>
  );
}

const BTN_VARIANT = {
  primary: s.btnPrimary,
  outline: s.btnOutline,
  ghost: s.btnGhost,
};

export function Button({ variant = 'primary', size, icon, block, className, children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={cx(s.btn, BTN_VARIANT[variant], size === 'sm' && s.btnSm, icon && !children && s.btnIcon, block && s.btnBlock, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} /> : null}
      {children}
    </button>
  );
}

export function ArrowLink({ href, external, children, className, ...rest }) {
  const content = (
    <>
      {children}
      <Icon name="arrow-right" size={14} />
    </>
  );
  if (external) {
    return (
      <a href={href} className={cx(s.arrowLink, className)} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cx(s.arrowLink, className)} {...rest}>
      {content}
    </Link>
  );
}

const PILL_TONE = {
  neutral: s.pillNeutral,
  success: s.pillSuccess,
  warning: s.pillWarning,
  danger: s.pillDanger,
  primary: s.pillPrimary,
};

export function Pill({ tone = 'neutral', icon, className, children }) {
  return (
    <span className={cx(s.pill, PILL_TONE[tone], className)}>
      {icon ? <Icon name={icon} size={12} strokeWidth={2.2} /> : null}
      {children}
    </span>
  );
}

const BUBBLE_TONE = {
  neutral: '',
  success: s.iconBubbleSuccess,
  danger: s.iconBubbleDanger,
  warning: s.iconBubbleWarning,
  primary: s.iconBubblePrimary,
  outline: s.iconBubbleOutline,
};

export function IconBubble({ name, tone = 'neutral', size = 32, iconSize = 16, className, style }) {
  return (
    <span
      className={cx(s.iconBubble, BUBBLE_TONE[tone], className)}
      style={{ width: size, height: size, ...style }}
    >
      <Icon name={name} size={iconSize} />
    </span>
  );
}

export function Skeleton({ width = '100%', height = 14, radius, className, style }) {
  return (
    <span
      className={cx(s.skeleton, className)}
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function EmptyState({ icon = 'receipt', title, text, action, className }) {
  return (
    <div className={cx(s.empty, className)} role="status">
      <span className={s.emptyIcon}>
        <Icon name={icon} size={22} />
      </span>
      {title ? <p className={s.emptyTitle}>{title}</p> : null}
      {text ? <p className={s.emptyText}>{text}</p> : null}
      {action}
    </div>
  );
}

const ALERT_TONE = { error: s.alertError, success: s.alertSuccess, info: s.alertInfo };

export function Alert({ tone = 'info', children, className }) {
  const icon = tone === 'error' ? 'alert-circle' : tone === 'success' ? 'check' : 'alert-circle';
  return (
    <div className={cx(s.alert, ALERT_TONE[tone], className)} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={icon} size={16} />
      <div>{children}</div>
    </div>
  );
}

export function Field({ label, htmlFor, error, children }) {
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className={s.fieldHint} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Input({ invalid, className, ...rest }) {
  return <input className={cx(s.input, invalid && s.inputError, className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cx(s.select, className)} {...rest}>
      {children}
    </select>
  );
}

export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className={s.segmented} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={cx(s.segment, value === opt.value && s.segmentActive)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, color, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={s.progress}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className={s.progressBar} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
