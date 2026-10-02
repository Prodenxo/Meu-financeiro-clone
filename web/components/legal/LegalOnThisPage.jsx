'use client';

import { useEffect, useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import s from './legal.module.css';

const HEADER_OFFSET = 96;

export function LegalOnThisPage({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const onNavClick = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: true });
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const navList = (
    <ul className={s.navList}>
      {sections.map((section) => (
        <li key={section.id} className={section.level === 3 ? s.navItemNested : undefined}>
          <a
            href={`#${section.id}`}
            className={activeId === section.id ? s.navLinkActive : s.navLink}
            aria-current={activeId === section.id ? 'location' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavClick(section.id);
            }}
          >
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className={s.navAside} aria-label="Nesta página">
      <div className={s.navDesktop}>
        <p className={s.navTitle}>Nesta página</p>
        {navList}
      </div>

      <div className={s.navMobile}>
        <button
          type="button"
          className={s.navMobileTrigger}
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span>Nesta página</span>
          <Icon name={mobileOpen ? 'chevron-up' : 'chevron-down'} size={18} />
        </button>
        {mobileOpen ? (
          <div id={panelId} className={s.navMobilePanel}>
            {navList}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
