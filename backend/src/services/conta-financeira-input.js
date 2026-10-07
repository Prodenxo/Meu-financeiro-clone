/**
 * Validação do cadastro/edição de conta pelo app — mesmas regras e mensagens do
 * `saveContaAction` do site (`web/app/(app)/contas/actions.js`).
 */

export const CONTA_TIPOS_VALIDOS = ['corrente', 'poupanca', 'cartao_credito', 'dinheiro', 'outro'];

const INSTITUICAO_ID_RE = /^[a-z0-9_-]{1,40}$/;
const COR_RE = /^#[0-9a-fA-F]{6}$/;

export const parseMoneyInput = (raw) => {
  if (raw === null || raw === undefined) return Number.NaN;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : Number.NaN;
  const s = String(raw).trim().replace(/R\$/gi, '').replace(/\s/g, '');
  if (!s) return Number.NaN;
  if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
  const n = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : Number.NaN;
};

const parseDay = (raw) => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return { value: null, ok: true };
  const n = Number(String(raw).trim());
  return Number.isInteger(n) && n >= 1 && n <= 31 ? { value: n, ok: true } : { value: null, ok: false };
};

/**
 * `bank_mode` é obrigatório também na edição: sem ele a instituição seria apagada sem aviso.
 * @param {Record<string, unknown>} body
 * @returns {{ errors: Record<string, string> | null, payload: Record<string, unknown> | null }}
 */
export const validateContaInput = (body = {}) => {
  const mode = String(body?.bank_mode ?? '').trim();
  const bankId = String(body?.instituicao_id ?? '').trim();
  const nome = String(body?.nome ?? '').trim();
  const tipo = String(body?.tipo ?? '').trim();
  const cor = String(body?.cor ?? '').trim();
  const saldoInicial = parseMoneyInput(body?.saldo_inicial);
  const limiteRaw = body?.limite_credito;
  const hasLimite = limiteRaw !== null && limiteRaw !== undefined && String(limiteRaw).trim() !== '';
  const limite = hasLimite ? parseMoneyInput(limiteRaw) : null;
  const fechamento = parseDay(body?.dia_fechamento);
  const vencimento = parseDay(body?.dia_vencimento);
  const isCartao = tipo === 'cartao_credito';

  const errors = {};
  if (mode !== 'catalog' && mode !== 'custom') errors.bank = 'Escolha um banco ou "Outra conta".';
  if (mode === 'catalog' && !INSTITUICAO_ID_RE.test(bankId)) errors.bank = 'Banco não encontrado. Escolha novamente.';
  if (!nome) errors.nome = 'Informe um nome para a conta.';
  else if (nome.length > 60) errors.nome = 'Use no máximo 60 caracteres.';
  if (!CONTA_TIPOS_VALIDOS.includes(tipo)) errors.tipo = 'Escolha o tipo da conta.';
  if (!Number.isFinite(saldoInicial)) errors.saldo_inicial = 'Informe um saldo válido.';
  if (isCartao && hasLimite && (!Number.isFinite(limite) || limite < 0)) errors.limite_credito = 'Informe um limite válido.';
  if (isCartao && !fechamento.ok) errors.dia_fechamento = 'Dia entre 1 e 31.';
  if (isCartao && !vencimento.ok) errors.dia_vencimento = 'Dia entre 1 e 31.';
  if (!COR_RE.test(cor)) errors.cor = 'Escolha uma cor.';
  if (Object.keys(errors).length > 0) return { errors, payload: null };

  return {
    errors: null,
    payload: {
      nome,
      tipo,
      saldo_inicial: saldoInicial,
      limite_credito: isCartao ? limite : null,
      dia_fechamento: isCartao ? fechamento.value : null,
      dia_vencimento: isCartao ? vencimento.value : null,
      cor,
      instituicao_id: mode === 'catalog' ? bankId : null,
      ativo: true,
    },
  };
};
