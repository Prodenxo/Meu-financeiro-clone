import Link from 'next/link';
import { cookies } from 'next/headers';
import { Icon } from '@/components/ui/Icon';
import { BrandMark } from '@/components/shell/BrandMark';
import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { THEME_COOKIE, normalizeTheme } from '@/lib/theme';
import s from './auth.module.css';

const FEATURES = [
  { icon: 'arrow-left-right', text: 'Entradas e saídas organizadas por categoria' },
  { icon: 'credit-card', text: 'Saldo de cada conta bancária em um só lugar' },
  { icon: 'target', text: 'Orçamentos do mês com alerta de limite' },
  { icon: 'calendar-days', text: 'Agenda de contas, recebimentos e lembretes' },
];

/** Layout das telas de acesso: painel da marca à esquerda, formulário à direita. */
export async function AuthShell({ eyebrow, title, subtitle, wide = false, topRight, children, footer }) {
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className={s.page}>
      <aside className={s.brandPanel} aria-hidden="true">
        <span className={s.brand}>
          <span className={s.brandMark}>
            <BrandMark size={20} />
          </span>
          Meu Financeiro
        </span>
        <div className={s.pitch}>
          <h2 className={s.pitchTitle}>Seu dinheiro organizado, mês a mês.</h2>
          <p className={s.pitchText}>Controle pessoal e da sua empresa, com acompanhamento da CF Contabilidade.</p>
          <ul className={s.features}>
            {FEATURES.map((f) => (
              <li key={f.icon} className={s.feature}>
                <span className={s.featureIcon}>
                  <Icon name={f.icon} size={16} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <span className={s.brandFoot}>© {new Date().getFullYear()} Meu Financeiro · CF Contabilidade</span>
      </aside>

      <main className={s.formSide}>
        <div className={s.topBar}>
          <Link href="/login" className={s.mobileBrand}>
            <span className={s.brandMark}>
              <BrandMark size={16} />
            </span>
            Meu Financeiro
          </Link>
          <div className={s.topRight}>
            {topRight}
            <ThemeToggle initialTheme={theme} />
          </div>
        </div>

        <div className={`${s.formWrap} ${wide ? s.formWrapWide : ''}`}>
          {eyebrow ? <p className={s.eyebrow}>{eyebrow}</p> : null}
          <h1 className={s.title}>{title}</h1>
          {subtitle ? <p className={s.subtitle}>{subtitle}</p> : <div style={{ height: 24 }} />}
          {children}
        </div>
        {footer}
      </main>
    </div>
  );
}

export function LegalFooter({ action = 'Entrar' }) {
  return (
    <p className={s.legal}>
      Ao clicar em {action}, você concorda com nossa{' '}
      <a href="/privacidade" target="_blank" rel="noopener noreferrer">
        Política de Privacidade
      </a>{' '}
      e os{' '}
      <a href="/termos" target="_blank" rel="noopener noreferrer">
        Termos de Uso
      </a>
      .
    </p>
  );
}
