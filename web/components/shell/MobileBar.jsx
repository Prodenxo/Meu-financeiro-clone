'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useShellNav } from './ShellNavContext';
import { BrandMark } from './BrandMark';
import s from './shell.module.css';

export function MobileBar() {
  const { openNav, open } = useShellNav();
  return (
    <div className={s.mobileBar}>
      <button
        type="button"
        className={s.iconBtn}
        onClick={openNav}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        <Icon name="menu" size={20} />
      </button>
      <Link href="/visao-geral" className={s.mobileBrand}>
        <span className={s.brandMark} style={{ width: 28, height: 28 }}>
          <BrandMark size={16} />
        </span>
        Meu Financeiro
      </Link>
    </div>
  );
}
