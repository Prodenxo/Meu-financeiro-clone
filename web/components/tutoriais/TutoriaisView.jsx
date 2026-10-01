'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Alert, Card, EmptyState } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { filterTutorials, pickFeatured, TUTORIAL_MODULES } from '@/lib/tutoriais/tutoriais';
import t from '@/components/transactions/transactions.module.css';
import { BannerArt } from './ModuleArt';
import { TutorialCard } from './TutorialCard';
import s from './tutoriais.module.css';

const FILTERS = [{ id: 'todos', label: 'Todos' }, ...TUTORIAL_MODULES.map((item) => ({ id: item.id, label: item.label }))];

export function TutoriaisView({ tutorials, canManage, unavailable = false }) {
  const [query, setQuery] = useState('');
  const [modulo, setModulo] = useState('todos');
  const featured = useMemo(() => pickFeatured(tutorials), [tutorials]);
  const visible = useMemo(() => filterTutorials(tutorials, { query, modulo }), [tutorials, query, modulo]);
  const selected = FILTERS.find((item) => item.id === modulo);

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Meu espaço / Tutoriais</p>
          <h1 className={t.title}>Central de tutoriais</h1>
          <p className={t.subtitle}>Aprenda a usar o Meu Financeiro no seu ritmo.</p>
        </div>
        {canManage ? (
          <div className={s.headerActions}>
            <Link className={s.linkBtn} href="/tutoriais/gerenciar/novo">+ Novo tutorial</Link>
            <Link className={s.linkBtnGhost} href="/tutoriais/gerenciar">Gerenciar tutoriais</Link>
          </div>
        ) : null}
      </header>

      <section className={s.banner} aria-labelledby="comece-aqui">
        <div>
          <p className={s.kicker}>Comece por aqui</p>
          <h2 className={s.bannerTitle} id="comece-aqui">Seus primeiros passos</h2>
          <p className={s.bannerText}>Configure suas contas e registre sua primeira movimentação.</p>
          {featured ? (
            <Link className={s.bannerBtn} href={`/tutoriais/${featured.id}`}>
              Ver passo a passo
              <Icon name="chevron-right" size={16} />
            </Link>
          ) : null}
        </div>
        <BannerArt />
      </section>

      <div className={s.searchWrap}>
        <Icon className={s.searchIcon} name="search" size={16} />
        <label className={s.srOnly} htmlFor="busca-tutoriais">O que você quer aprender?</label>
        <input
          id="busca-tutoriais"
          className={s.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="O que você quer aprender?"
          type="search"
        />
      </div>

      <div className={s.filters} role="radiogroup" aria-label="Filtrar por módulo">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            className={item.id === modulo ? s.chipActive : s.chip}
            aria-checked={item.id === modulo}
            onClick={() => setModulo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}>Explore os tutoriais</h2>
        <p className={s.sectionText}>
          {selected && selected.id !== 'todos'
            ? `Guias de ${selected.label}.`
            : 'Guias práticos para organizar suas finanças.'}
        </p>
      </div>

      {unavailable ? (
        <Alert tone="info">A central de tutoriais ainda não está disponível neste ambiente.</Alert>
      ) : tutorials.length === 0 ? (
        <Card>
          <EmptyState
            icon="book-open"
            title="Nenhum tutorial publicado"
            text="Quando houver um guia publicado, ele aparece aqui."
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="search"
            title="Nenhum tutorial encontrado"
            text="Tente outro termo ou outro módulo."
          />
        </Card>
      ) : (
        <div className={s.grid}>
          {visible.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      )}

      <section className={s.support}>
        <div className={s.supportCopy}>
          <span className={s.art}>
            <Icon name="headset" size={18} />
          </span>
          <div>
            <h2 className={s.supportTitle}>Ainda precisa de ajuda?</h2>
            <p className={s.supportText}>Fale com nossa equipe de suporte.</p>
          </div>
        </div>
        <Link className={s.supportBtn} href="/configuracoes#suporte">
          Falar com suporte
          <Icon name="chevron-right" size={16} />
        </Link>
      </section>
    </div>
  );
}
