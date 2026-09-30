/**
 * Menu lateral — mesmos destinos de `frontend/lib/appNavConfig.ts`, agrupados como na referência.
 * `href` = rota já migrada para o Next; `legacyPath` = rota que ainda vive no app Expo (web).
 * Enquanto não migra, o item abre o app atual se `NEXT_PUBLIC_LEGACY_APP_URL` estiver definido;
 * caso contrário fica desabilitado (nunca um link que "parece funcionar" e não leva a lugar nenhum).
 */
export const NAV_GROUPS = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Visão geral', icon: 'layout-dashboard', href: '/visao-geral' },
      { id: 'transacoes', label: 'Transações', icon: 'arrow-left-right', href: '/transacoes' },
      { id: 'contas', label: 'Minhas contas', icon: 'credit-card', href: '/contas' },
    ],
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    items: [
      { id: 'orcamentos', label: 'Orçamentos', icon: 'target', legacyPath: '/orcamentos' },
      { id: 'categorias', label: 'Categorias', icon: 'tag', legacyPath: '/categorias' },
      { id: 'agenda', label: 'Agenda', icon: 'calendar-days', legacyPath: '/agenda' },
    ],
  },
  {
    id: 'servicos',
    label: 'Serviços',
    items: [
      { id: 'conta-global', label: 'Conta global', icon: 'globe', legacyPath: '/conta-global' },
      { id: 'mei', label: 'Meu MEI', icon: 'briefcase-business', legacyPath: '/mei', requiresMeiAccess: true },
    ],
  },
];

export const NAV_FOOTER_ITEMS = [
  { id: 'ajuda', label: 'Ajuda', icon: 'circle-help', legacyPath: '/configuracoes' },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings', legacyPath: '/configuracoes' },
];

export function getLegacyAppUrl() {
  return (process.env.NEXT_PUBLIC_LEGACY_APP_URL || '').trim().replace(/\/$/, '');
}

/** Resolve o destino de um item: `{ href, external }` ou `null` quando não há destino funcional. */
export function resolveNavTarget(item, legacyAppUrl) {
  if (item.href) return { href: item.href, external: false };
  if (item.legacyPath && legacyAppUrl) {
    return { href: `${legacyAppUrl}${item.legacyPath}`, external: true };
  }
  return null;
}

export function filterNavGroups(groups, { showMei }) {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.requiresMeiAccess || showMei) }))
    .filter((g) => g.items.length > 0);
}
