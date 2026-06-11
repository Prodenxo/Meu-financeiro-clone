/**
 * Normaliza itens NF-e/NFC-e para o JSON da Plugnotas.
 * Aceita números simples (formulário) ou objetos { comercial, tributavel }.
 */

const toObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

export const toPlugnotasNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const nested = value.comercial ?? value.tributavel ?? value.valor;
    if (nested !== undefined && nested !== null && nested !== '') {
      return toPlugnotasNumber(nested);
    }
    return null;
  }
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
};

export const extractNfeItemQuantidade = (item) => {
  if (!item || typeof item !== 'object') return null;
  const raw = item.quantidade;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return toPlugnotasNumber(raw.comercial ?? raw.tributavel);
  }
  return toPlugnotasNumber(raw ?? item.quantidadeComercial);
};

export const extractNfeItemValorUnitario = (item) => {
  if (!item || typeof item !== 'object') return null;
  const raw = item.valorUnitario;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return toPlugnotasNumber(raw.comercial ?? raw.tributavel);
  }
  return toPlugnotasNumber(raw ?? item.valorUnitarioComercial ?? item.valor);
};

const prune = (value) => {
  if (Array.isArray(value)) {
    const list = value.map(prune).filter((item) => item !== undefined);
    return list.length ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const next = {};
    Object.entries(value).forEach(([key, item]) => {
      const cleaned = prune(item);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return Object.keys(next).length ? next : undefined;
  }
  if (value === null || value === undefined || value === '') return undefined;
  return value;
};

const normalizeNfeIcmsForPlugnotas = (icms) => {
  const block = toObject(icms);
  const origem = String(block.origem ?? '0').trim() || '0';
  const csosn = String(block.csosn || '').trim();
  const cst = String(block.cst || '').trim();
  if (csosn) {
    return prune({ ...block, origem, cst: csosn, csosn: undefined });
  }
  if (cst) {
    return prune({ ...block, origem, cst });
  }
  return prune({ ...block, origem });
};

export const normalizeNfeItemForPlugnotasEmit = (item) => {
  if (!item || typeof item !== 'object') return item;

  const quantidade = extractNfeItemQuantidade(item);
  const valorUnitario = extractNfeItemValorUnitario(item);
  const valorTotal = toPlugnotasNumber(item.valor) ?? (
    quantidade !== null && valorUnitario !== null ? quantidade * valorUnitario : null
  );

  const tributos = toObject(item.tributos);
  const unidade = String(item.unidadeComercial || item.unidade || 'UN').trim() || 'UN';

  return prune({
    ...item,
    unidadeComercial: unidade,
    quantidade: quantidade !== null
      ? { comercial: quantidade, tributavel: quantidade }
      : undefined,
    valorUnitario: valorUnitario !== null
      ? { comercial: valorUnitario, tributavel: valorUnitario }
      : undefined,
    valor: valorTotal !== null && valorTotal > 0 ? valorTotal : undefined,
    tributos: prune({
      ...tributos,
      icms: normalizeNfeIcmsForPlugnotas(tributos.icms),
    }),
    unidade: undefined,
    quantidadeComercial: undefined,
    valorUnitarioComercial: undefined,
  }) || item;
};

export const normalizePlugnotasNfePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const itens = Array.isArray(payload.itens)
    ? payload.itens.map(normalizeNfeItemForPlugnotasEmit)
    : payload.itens;
  return { ...payload, itens };
};
