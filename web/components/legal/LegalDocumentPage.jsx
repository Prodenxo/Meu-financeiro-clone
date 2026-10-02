import Link from 'next/link';
import { cookies } from 'next/headers';
import { BrandMark } from '@/components/shell/BrandMark';
import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { Icon } from '@/components/ui/Icon';
import { THEME_COOKIE, normalizeThemePref } from '@/lib/theme';
import { LegalBlocks, LegalInlineParts } from '@/components/legal/LegalBlocks';
import { LegalOnThisPage } from '@/components/legal/LegalOnThisPage';
import s from './legal.module.css';

function sectionNumber(index) {
  return String(index + 1).padStart(2, '0');
}

export async function LegalDocumentPage({ document: doc }) {
  const cookieStore = await cookies();
  const theme = normalizeThemePref(cookieStore.get(THEME_COOKIE)?.value);
  const navSections = doc.sections.map(({ id, title, level }) => ({ id, title, level }));

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <header className={s.topBar}>
          <Link href="/login" className={s.brand}>
            <span className={s.brandMark}>
              <BrandMark size={18} />
            </span>
            Meu Financeiro
          </Link>
          <div className={s.topActions}>
            <Link href="/login" className={s.backLink}>
              <Icon name="arrow-left" size={16} />
              Voltar para o login
            </Link>
            <ThemeToggle initialTheme={theme} />
          </div>
        </header>

        <div className={s.hero}>
          <div className={s.heroMain}>
            <p className={s.eyebrow}>Documentos da plataforma</p>
            <h1 className={s.heroTitle}>{doc.hero.title}</h1>
            <p className={s.heroLead}>
              <LegalInlineParts parts={doc.hero.lead} />
            </p>
          </div>
          <p className={s.updatedBadge}>
            <Icon name="calendar-days" size={16} />
            Atualizado em {doc.updatedLabel}
          </p>
        </div>

        <div className={s.layout}>
          <LegalOnThisPage sections={navSections} />
          <article className={s.article}>
            {doc.sections.map((section, index) => {
              const Heading = section.level === 3 ? 'h3' : 'h2';
              return (
                <section key={section.id} className={s.section} aria-labelledby={section.id}>
                  <Heading id={section.id} tabIndex={-1} className={s.sectionHeading}>
                    <span className={s.sectionNum} aria-hidden="true">
                      {sectionNumber(index)}
                    </span>
                    {section.title}
                  </Heading>
                  <LegalBlocks blocks={section.blocks} />
                </section>
              );
            })}
          </article>
        </div>

        <footer className={s.footer}>
          <Link href="/privacidade">Política de Privacidade</Link>
          <span aria-hidden="true">|</span>
          <Link href="/termos">Termos de Uso</Link>
          <span aria-hidden="true">|</span>
          <Link href="/login">Entrar</Link>
        </footer>
      </div>
    </div>
  );
}
