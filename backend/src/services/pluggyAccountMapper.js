import { env } from '../config/env.js';

/** Mapeia conta Pluggy → linha de `contas_financeiras` (campos de negócio). */

const DEFAULT_COR = '#6366f1';

const INSTITUICAO_BY_PATTERN = [
  { id: 'pagbank', re: /pagseguro|pagbank/i },
  { id: 'inter', re: /\bbanco inter\b|^inter\b|\binter\b/i },
  { id: 'nubank', re: /nubank|\bnu\b/i },
  { id: 'itau', re: /itau|itaú/i },
  { id: 'bradesco', re: /bradesco/i },
  { id: 'mercadopago', re: /mercado pago|mercadopago/i },
];

/** Normaliza nome para comparar conta manual vs Pluggy. */
export function normalizeContaNomeForMatch(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function contaMatchesPluggyInstitution(localConta, pluggyAccount) {
  const inferred = inferInstituicaoIdFromPluggyAccount(pluggyAccount);
  if (!inferred) return false;
  if (localConta?.instituicao_id && localConta.instituicao_id === inferred) return true;
  const blob = `${localConta?.nome || ''} ${localConta?.instituicao_id || ''}`;
  const entry = INSTITUICAO_BY_PATTERN.find((p) => p.id === inferred);
  return entry ? entry.re.test(blob) : false;
}

/** Escolhe no máximo uma conta manual para virar a conta OF (evita duplicata). */
export function pickManualContaMergeCandidate(candidates, pluggyAccount) {
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0];

  const pluggyNorm = normalizeContaNomeForMatch(
    pluggyAccount?.name || pluggyAccount?.marketingName || pluggyAccount?.number || '',
  );
  if (!pluggyNorm) return null;

  const byNome = candidates.filter((c) => {
    const localNorm = normalizeContaNomeForMatch(c.nome);
    if (!localNorm) return false;
    return localNorm === pluggyNorm || localNorm.includes(pluggyNorm) || pluggyNorm.includes(localNorm);
  });
  if (byNome.length === 1) return byNome[0];
  return null;
}

export function pluggyContaFingerprint(pluggyAccount) {
  const instituicao_id = inferInstituicaoIdFromPluggyAccount(pluggyAccount);
  const tipo = mapPluggyAccountTipo(pluggyAccount);
  const nome = normalizeContaNomeForMatch(
    pluggyAccount?.name || pluggyAccount?.marketingName || pluggyAccount?.number || '',
  );
  return { instituicao_id, tipo, nome };
}

export function localContaMatchesPluggyFingerprint(localConta, pluggyAccount) {
  const fp = pluggyContaFingerprint(pluggyAccount);
  if (!fp.instituicao_id || !fp.nome) return false;
  if (localConta?.tipo !== fp.tipo) return false;
  if (localConta?.instituicao_id !== fp.instituicao_id) return false;
  const localNome = normalizeContaNomeForMatch(localConta?.nome);
  return (
    localNome === fp.nome || localNome.includes(fp.nome) || fp.nome.includes(localNome)
  );
}

export function inferInstituicaoIdFromPluggyAccount(account) {
  const blob = [
    account?.name,
    account?.marketingName,
    account?.connector?.name,
    account?.connectorName,
  ]
    .filter(Boolean)
    .join(' ');
  for (const { id, re } of INSTITUICAO_BY_PATTERN) {
    if (re.test(blob)) return id;
  }
  return null;
}

/** Por padrão ignora só cartão de crédito (PagBank/conta digital costuma vir como `outro`). */
export function shouldImportPluggyAccount(account) {
  const tipo = mapPluggyAccountTipo(account);
  if (tipo === 'cartao_credito' && !env.PLUGGY_IMPORT_CREDIT_CARDS) {
    return false;
  }
  return true;
}

export function mapPluggyAccountTipo(account) {
  const type = String(account?.type || '').toUpperCase();
  const subtype = String(account?.subtype || '').toUpperCase();
  if (type === 'CREDIT' || subtype.includes('CREDIT_CARD') || subtype === 'CREDIT_CARD') {
    return 'cartao_credito';
  }
  if (type === 'SAVINGS' || subtype.includes('SAVINGS')) {
    return 'poupanca';
  }
  if (
    type === 'BANK' ||
    type === 'PAYMENT_ACCOUNT' ||
    subtype.includes('CHECKING') ||
    subtype === 'CHECKING_ACCOUNT' ||
    subtype.includes('PAYMENT') ||
    subtype.includes('DIGITAL')
  ) {
    return 'corrente';
  }
  return 'outro';
}

export function readPluggyAccountBalance(account) {
  const raw =
    account?.balance ??
    account?.availableBalance ??
    account?.bankData?.availableBalance ??
    account?.bankData?.closingBalance ??
    account?.creditData?.availableCreditLimit ??
    account?.creditData?.balance;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function buildContaRowFromPluggyAccount(account, { isNew }) {
  const nome =
    String(account?.name || account?.marketingName || account?.number || '').trim() ||
    'Conta Open Finance';
  const tipo = mapPluggyAccountTipo(account);
  const isCartao = tipo === 'cartao_credito';
  const limiteRaw = account?.creditData?.creditLimit ?? account?.creditData?.availableCreditLimit;
  const limite = limiteRaw != null ? Number(limiteRaw) : null;

  const instituicao_id = inferInstituicaoIdFromPluggyAccount(account);

  const row = {
    nome,
    tipo,
    cor: DEFAULT_COR,
    instituicao_id,
    ativo: true,
    of_provider: 'pluggy',
    of_external_id: String(account.id),
    of_last_synced_at: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    limite_credito: isCartao && Number.isFinite(limite) ? limite : null,
    dia_fechamento: null,
    dia_vencimento: null,
  };

  if (isNew) {
    row.saldo_inicial = readPluggyAccountBalance(account);
  }

  return row;
}
