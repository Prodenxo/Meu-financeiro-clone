'use client';

import Link from 'next/link';
import { Card, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import s from './configuracoes.module.css';

/** Card de secção: ícone redondo + título + descrição, com divisor. */
export function SettingsCard({ id, icon, iconTone, title, description, children, className }) {
  const titleId = `${id}-title`;
  return (
    <Card id={id} aria-labelledby={titleId} className={className}>
      <header className={s.cardHead}>
        <span className={cx(s.cardIcon, iconTone === 'danger' && s.cardIconDanger)} aria-hidden="true">
          <Icon name={icon} size={17} />
        </span>
        <div className={s.cardHeadText}>
          <h2 className={s.cardTitle} id={titleId}>
            {title}
          </h2>
          {description ? <p className={s.cardDesc}>{description}</p> : null}
        </div>
      </header>
      {children}
    </Card>
  );
}

/**
 * Linha de navegação (ícone, título, descrição, seta). `href` interno → Link; `external` → <a>;
 * `onClick` → botão; sem destino → desabilitada com motivo.
 */
export function SettingsLinkRow({ icon, title, description, href, external, onClick, disabled, disabledReason, ariaLabel }) {
  const inner = (
    <>
      <span className={s.linkIcon} aria-hidden="true">
        <Icon name={icon} size={17} />
      </span>
      <span className={s.linkText}>
        <span className={s.linkTitle}>{title}</span>
        <span className={s.linkDesc}>{description}</span>
      </span>
      <Icon name={external ? 'arrow-up-right' : 'chevron-right'} size={18} className={s.linkChevron} />
    </>
  );

  if (disabled || (!href && !onClick)) {
    return (
      <span className={s.linkRow} aria-disabled="true" title={disabledReason || 'Indisponível no momento'}>
        {inner}
      </span>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={s.linkRow} onClick={onClick} aria-label={ariaLabel}>
        {inner}
      </button>
    );
  }
  if (external) {
    return (
      <a className={s.linkRow} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <Link className={s.linkRow} href={href} aria-label={ariaLabel}>
      {inner}
    </Link>
  );
}
