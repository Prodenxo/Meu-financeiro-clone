/**
 * Projeções virtuais de recorrências — porta fiel de `frontend/lib/recorrenciaProjection.ts`.
 * Não alterar a deduplicação sem alterar também no app Expo.
 */
import { pad2 } from './normalize.js';

export function normalizeRecorrenciaRow(r) {
  return {
    id: String(r.id ?? ''),
    user_id: String(r.user_id ?? ''),
    dia_do_mes: Number(r.dia_do_mes ?? 0),
    valor: typeof r.valor === 'string' ? parseFloat(r.valor) : Number(r.valor),
    classificacao: String(r.classificacao ?? ''),
    tipo: String(r.tipo ?? ''),
    status: String(r.status ?? 'pago'),
    obs: r.obs != null ? String(r.obs) : null,
    categoria: r.categoria != null ? String(r.categoria) : null,
    ativo: Boolean(r.ativo),
    max_ocorrencias: r.max_ocorrencias != null ? Number(r.max_ocorrencias) : null,
    criado_em: String(r.criado_em ?? ''),
  };
}

function buildSafeDate(year, month, dia) {
  const lastDay = new Date(year, month, 0).getDate();
  const dayClamped = Math.min(Math.max(dia, 1), lastDay);
  return `${year}-${pad2(month)}-${pad2(dayClamped)}`;
}

const normalizeTipoLocal = (tipo) => {
  const t = String(tipo || '').toLowerCase().trim();
  return t === 'saída' ? 'saida' : t;
};

/**
 * Gera projeções para o intervalo [start, end] de meses (inclusivo), sem repetir
 * meses já materializados, cancelados ("Apenas este") ou cobertos por lançamento órfão.
 */
export function projectRecurrences(recurrences, realTransactions, range, skips = []) {
  if (!recurrences?.length) return [];

  const materializedKeys = new Set();
  const orphanMatchKeys = new Set();
  const skippedKeys = new Set();
  for (const s of skips) {
    if (s.recorrencia_id && s.ano_mes) skippedKeys.add(`${s.recorrencia_id}|${s.ano_mes}`);
  }

  for (const t of realTransactions) {
    if (t.recorrencia_id && t.recorrencia_ano_mes) {
      materializedKeys.add(`${t.recorrencia_id}|${t.recorrencia_ano_mes}`);
    } else if (!t.recorrencia_id && t.data && t.classificacao) {
      const anoMes = String(t.data).slice(0, 7);
      orphanMatchKeys.add(`${String(t.classificacao).toLowerCase().trim()}|${normalizeTipoLocal(t.tipo)}|${anoMes}`);
    }
  }

  const totalMonths = (range.endYear - range.startYear) * 12 + (range.endMonth - range.startMonth) + 1;
  if (totalMonths <= 0) return [];

  const out = [];
  for (const rec of recurrences) {
    if (!rec.ativo) continue;
    const limit = rec.max_ocorrencias ?? null;
    const criadoMes = rec.criado_em ? String(rec.criado_em).slice(0, 7) : null;
    const criadoYear = criadoMes ? Number(criadoMes.slice(0, 4)) : null;
    const criadoMonth = criadoMes ? Number(criadoMes.slice(5, 7)) : null;

    for (let offset = 0; offset < totalMonths; offset++) {
      const year = range.startYear + Math.floor((range.startMonth - 1 + offset) / 12);
      const monthIdx = ((range.startMonth - 1 + offset) % 12) + 1;
      const anoMes = `${year}-${pad2(monthIdx)}`;

      if (criadoMes && anoMes < criadoMes) continue;

      const occurrenceNumber =
        criadoYear != null && criadoMonth != null
          ? (year - criadoYear) * 12 + (monthIdx - criadoMonth) + 1
          : offset + 1;
      if (limit != null && occurrenceNumber > limit) break;

      if (materializedKeys.has(`${rec.id}|${anoMes}`)) continue;
      if (skippedKeys.has(`${rec.id}|${anoMes}`)) continue;
      const orphanKey = `${String(rec.classificacao || '').toLowerCase().trim()}|${normalizeTipoLocal(rec.tipo)}|${anoMes}`;
      if (orphanMatchKeys.has(orphanKey)) continue;

      out.push({
        id: `proj_${rec.id}_${anoMes}`,
        user_id: rec.user_id,
        data: buildSafeDate(year, monthIdx, rec.dia_do_mes),
        tipo: rec.tipo,
        valor: rec.valor,
        classificacao: rec.classificacao,
        status: rec.status,
        obs: rec.obs ?? null,
        categoria: rec.categoria ?? null,
        conta_id: null,
        recorrencia_id: rec.id,
        recorrencia_ano_mes: anoMes,
        __projecao: true,
      });
    }
  }
  return out;
}

export function isProjecao(t) {
  return Boolean(t?.__projecao) || (typeof t?.id === 'string' && t.id.startsWith('proj_'));
}

/**
 * Rascunho para lançar uma projeção como lançamento real — igual ao
 * `handleProjectionTap` do Expo (status pendente: a receber / a pagar).
 */
export function buildMaterializationDraft(p) {
  return {
    data: p.data,
    tipo: p.tipo,
    valor: p.valor,
    classificacao: p.classificacao,
    status: String(p.tipo).toLowerCase() === 'entrada' ? 'a_receber' : 'a_pagar',
    obs: p.obs,
    categoria: p.categoria,
    conta_id: null,
    recorrencia_id: p.recorrencia_id,
    recorrencia_ano_mes: p.recorrencia_ano_mes,
  };
}

/** Rascunho de "Duplicar" — igual ao `buildDuplicateTransactionDraft` do Expo. */
export function buildDuplicateDraft(tx) {
  if (!tx) return null;
  const copy = { ...tx };
  delete copy.id;
  delete copy.criado_em;
  delete copy.__projecao;
  delete copy.recorrencia_id;
  delete copy.recorrencia_ano_mes;
  return copy;
}
