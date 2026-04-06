import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { DrePeriod } from '../../utils/dreMatrix';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/** 12 meses + Total anual */
const PERIOD_COUNT = 13;

export interface DrePeriodSidebarProps {
  period: DrePeriod;
  onPeriodChange: (p: DrePeriod) => void;
}

function isSamePeriod(a: DrePeriod, b: DrePeriod): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'annual' && b.kind === 'annual') return true;
  if (a.kind === 'month' && b.kind === 'month') return a.month === b.month;
  return false;
}

function periodToIndex(p: DrePeriod): number {
  if (p.kind === 'annual') return 12;
  return p.month - 1;
}

export default function DrePeriodSidebar({ period, onPeriodChange }: DrePeriodSidebarProps) {
  const [rovingIndex, setRovingIndex] = useState(() => periodToIndex(period));
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setRovingIndex(periodToIndex(period));
  }, [period]);

  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => setIsLg(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  const focusIndex = useCallback((i: number) => {
    const next = Math.max(0, Math.min(PERIOD_COUNT - 1, i));
    setRovingIndex(next);
    queueMicrotask(() => btnRefs.current[next]?.focus());
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (isLg) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusIndex(i + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusIndex(i - 1);
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusIndex(i + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusIndex(i - 1);
      }
    }
    if (e.key === 'Home') {
      e.preventDefault();
      focusIndex(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      focusIndex(PERIOD_COUNT - 1);
    }
  };

  const setBtnRef = (idx: number) => (el: HTMLButtonElement | null) => {
    btnRefs.current[idx] = el;
  };

  return (
    <nav
      className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-44 shrink-0 lg:border-r border-slate-200/70 dark:border-slate-800/60 lg:pr-4"
      aria-label="Período da DRE"
    >
      {MONTHS.map((label, idx) => {
        const m = idx + 1;
        const p: DrePeriod = { kind: 'month', month: m };
        const selected = isSamePeriod(period, p);
        return (
          <button
            key={label}
            ref={setBtnRef(idx)}
            type="button"
            tabIndex={rovingIndex === idx ? 0 : -1}
            onFocus={() => setRovingIndex(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onClick={() => {
              setRovingIndex(idx);
              onPeriodChange(p);
            }}
            aria-current={selected ? true : undefined}
            className={`min-h-[44px] lg:min-h-0 text-left px-3 py-2.5 lg:py-2 rounded-lg text-sm whitespace-nowrap transition shrink-0 ${
              selected
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border-l-2 border-transparent'
            }`}
          >
            {label}
          </button>
        );
      })}
      <div className="hidden lg:block border-t border-slate-200/70 dark:border-slate-800/60 my-2" aria-hidden />
      <button
        ref={setBtnRef(12)}
        type="button"
        tabIndex={rovingIndex === 12 ? 0 : -1}
        onFocus={() => setRovingIndex(12)}
        onKeyDown={(e) => handleKeyDown(e, 12)}
        onClick={() => {
          setRovingIndex(12);
          onPeriodChange({ kind: 'annual' });
        }}
        aria-current={period.kind === 'annual' ? true : undefined}
        className={`min-h-[44px] lg:min-h-0 text-left px-3 py-2.5 lg:py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
          period.kind === 'annual'
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border-l-2 border-transparent'
        }`}
      >
        Total anual
      </button>
    </nav>
  );
}
