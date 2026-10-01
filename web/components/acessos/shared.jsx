'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { PAGE_SIZES, avatarHue, buildAcessosHref, describeRange, initialsOf } from '@/lib/acessos/acessos';
import m from '@/components/dashboard/modal.module.css';
import t from '@/components/transactions/transactions.module.css';
import s from './acessos.module.css';

/**
 * Filtros, ordenação e página vivem na URL: o servidor filtra o conjunto autorizado inteiro
 * e devolve só a página. Mudar qualquer filtro volta para a página 1.
 */
export function useAcessosNav(params) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch) => {
      const next = { ...params, ...patch };
      if (!('pagina' in patch)) next.pagina = 1;
      startTransition(() => {
        router.replace(buildAcessosHref(next), { scroll: false });
      });
    },
    [params, router],
  );

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  return { navigate, refresh, pending };
}

/** Campo de busca com atraso de 350 ms (igual ao painel atual) antes de ir para a URL. */
export function SearchField({ value, onChange, placeholder, ariaLabel }) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // Valor novo vindo da URL (ex.: "Limpar filtros") substitui o rascunho — ajuste durante o render.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft.trim() === value) return undefined;
    const tm = setTimeout(() => onChange(draft.trim()), 350);
    return () => clearTimeout(tm);
  }, [draft, value, onChange]);

  return (
    <div className={s.search}>
      <span className={s.searchIcon}>
        <Icon name="search" size={16} />
      </span>
      <Input
        type="search"
        className={s.searchInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export function UserAvatar({ user, size = 36 }) {
  return (
    <span
      className={s.avatar}
      style={{ '--hue': avatarHue(user?.id || user?.email), width: size, height: size }}
      aria-hidden="true"
    >
      {initialsOf(user?.displayName, user?.email)}
    </span>
  );
}

function pageList(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const set = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pageCount - 2) [pageCount - 1, pageCount - 2, pageCount - 3].forEach((n) => set.add(n));
  const list = Array.from(set).filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

/** Rodapé "Mostrando 1–25 de 1.125 usuários" + tamanho da página + páginas. */
export function TableFooter({ page, singular, plural, params, onNavigate }) {
  const items = pageList(page.page, page.pageCount);
  return (
    <footer className={s.tableFoot}>
      <span aria-live="polite">{describeRange(page, singular, plural)}</span>
      <div className={s.footRight}>
        <label className={s.small}>
          <span className="sr-only">Itens por página</span>
          <Select className={s.pageSize} value={params.porPagina} onChange={(e) => onNavigate({ porPagina: Number(e.target.value) })} aria-label="Itens por página">
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </Select>
        </label>
        {page.pageCount > 1 ? (
          <nav className={s.pager} aria-label="Paginação">
            <button type="button" className={s.pageBtn} disabled={page.page <= 1} onClick={() => onNavigate({ pagina: page.page - 1 })} aria-label="Página anterior">
              <Icon name="chevron-left" size={16} />
            </button>
            {items.map((n, i) =>
              n === '…' ? (
                <span key={`gap-${i}`} className={s.pageEllipsis} aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className={cx(s.pageBtn, n === page.page && s.pageBtnActive)}
                  aria-current={n === page.page ? 'page' : undefined}
                  aria-label={`Página ${n}`}
                  onClick={() => onNavigate({ pagina: n })}
                >
                  {n}
                </button>
              ),
            )}
            <button type="button" className={s.pageBtn} disabled={page.page >= page.pageCount} onClick={() => onNavigate({ pagina: page.page + 1 })} aria-label="Próxima página">
              <Icon name="chevron-right" size={16} />
            </button>
          </nav>
        ) : null}
      </div>
    </footer>
  );
}

/**
 * Menu de três pontos. Posicionado com `position: fixed` a partir do botão, por isso não é
 * cortado pelo card nem pela rolagem horizontal da tabela; sobe quando falta espaço embaixo.
 */
export function RowMenu({ label, items, note = 'As opções disponíveis dependem das suas permissões.', disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight || 220;
    const menuW = menuRef.current?.offsetWidth || 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > menuH + 12 ? rect.bottom + 4 : Math.max(8, rect.top - menuH - 4);
    const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  const TONE = { danger: s.menuDanger, warning: s.menuWarning, success: s.menuSuccess };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={s.menuBtn}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="ellipsis" size={18} />
      </button>
      {open ? (
        <div ref={menuRef} className={s.menu} role="menu" aria-label={label} style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}>
          {visible.map((item, i) =>
            item === 'sep' ? (
              <div key={`sep-${i}`} className={s.menuSep} role="separator" />
            ) : (
              <button
                key={item.key || item.label}
                type="button"
                role="menuitem"
                className={cx(s.menuItem, TONE[item.tone])}
                autoFocus={i === 0}
                title={item.title}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            ),
          )}
          {note ? <p className={s.menuNote}>{note}</p> : null}
        </div>
      ) : null}
    </>
  );
}

const CONFIRM_BTN = { danger: t.dangerBtn, warning: s.warnBtn, success: s.successBtn, primary: '' };

/** Confirmação padrão do app (dialog nativo): bloquear, liberar, excluir, revogar, acessar como. */
export function ConfirmDialog({ title, children, confirmLabel, pendingLabel, tone = 'primary', pending, error, onConfirm, onClose, titleId = 'confirm-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <dialog
      ref={ref}
      className={m.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id={titleId}>{title}</h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className={t.dialogText}>{children}</div>
        {error ? <div style={{ marginTop: 16 }}><Alert tone="error">{error}</Alert></div> : null}
        <footer className={m.foot} style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={close} disabled={pending}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={pending} aria-busy={pending} className={CONFIRM_BTN[tone]}>
            {pending ? pendingLabel || 'Aguarde…' : confirmLabel}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}

/** Caixa com senha gerada + copiar (substitui o chip "Senha gerada" do painel atual). */
export function PasswordBox({ password }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={s.passwordBox}>
      <code>{password}</code>
      <button type="button" className={s.copyBtn} onClick={copy} aria-label="Copiar senha">
        <Icon name={copied ? 'check' : 'copy'} size={14} />
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

export function CopyLinkBox({ url, label = 'Copiar link' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={s.linkBox}>
      <Icon name="link" size={14} />
      <code title={url}>{url}</code>
      <button type="button" className={s.copyBtn} onClick={copy} aria-label={label}>
        <Icon name={copied ? 'check' : 'copy'} size={14} />
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
