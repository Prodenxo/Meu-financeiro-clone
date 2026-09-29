/**
 * Ícone por categoria — mesma tabela de palavras-chave de `frontend/lib/categoryIcons.ts`,
 * traduzida para nomes do `lucide-react` (biblioteca única de ícones da web).
 */
const CATEGORY_ICON_MAP = {
  alimentacao: 'utensils',
  mercado: 'shopping-cart',
  mercadorias: 'package',
  compra: 'shopping-cart',
  transporte: 'car',
  combustivel: 'fuel',
  pedagio: 'car',
  casa: 'home',
  aluguel: 'home',
  agua: 'droplets',
  luz: 'zap',
  energia: 'zap',
  gas: 'flame',
  internet: 'wifi',
  telefone: 'phone',
  celular: 'smartphone',
  saude: 'heart-pulse',
  farmacia: 'pill',
  'plano de saude': 'heart-pulse',
  educacao: 'graduation-cap',
  salario: 'wallet',
  'pro-labore': 'briefcase',
  assinaturas: 'repeat',
  receitas: 'trending-up',
  'receitas diversas': 'banknote',
  imposto: 'file-text',
  trabalho: 'briefcase',
  pix: 'arrow-left-right',
  transferencia: 'arrow-left-right',
  lazer: 'party-popper',
  viagem: 'plane',
  pet: 'paw-print',
  investimento: 'line-chart',
};

function normalizeKey(nome) {
  return String(nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getCategoryIconName(nome) {
  const key = normalizeKey(nome);
  if (CATEGORY_ICON_MAP[key]) return CATEGORY_ICON_MAP[key];
  for (const [pattern, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (key.includes(pattern) || pattern.includes(key)) return icon;
  }
  return 'tag';
}
