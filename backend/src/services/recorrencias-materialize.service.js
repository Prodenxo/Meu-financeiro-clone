import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';

const RECORRENCIAS_TABLE = 'recorrencias';
const LANCAMENTOS_TABLE = 'lancamentos_id';
const JOB_RUNS_TABLE = 'recorrencias_job_runs';
const RUN_TYPE = 'diario';
const TIMEZONE = 'America/Sao_Paulo';
const SCHEDULER_INTERVAL_MS = 10 * 60 * 1000; // 10 min

let schedulerHandle = null;
let lastRunKey = null;

const getSaoPauloDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };
};

const buildRunKey = (date = new Date()) => {
  const { year, month, day } = getSaoPauloDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const buildAnoMes = (date) => {
  const { year, month } = getSaoPauloDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}`;
};

const normalizeTipo = (tipo) => (tipo === 'saída' ? 'saida' : tipo);

const acquireLock = async (runKey) => {
  const db = createSupabaseClient({ useServiceRole: true });
  const { error } = await db
    .from(JOB_RUNS_TABLE)
    .insert({
      run_key: runKey,
      run_type: RUN_TYPE,
      timezone: TIMEZONE
    });

  if (!error) return true;
  const code = String(error.code || '').trim();
  const msg = String(error.message || '').toLowerCase();
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return false;
  }
  throw error;
};

/**
 * Materializa lançamentos para o dia atual (timezone America/Sao_Paulo).
 * Só insere se ainda não existir lançamento para (user_id, recorrencia_id, ano_mes).
 */
export const runDailyRecorrenciasMaterialization = async (now = new Date()) => {
  const { year, month, day } = getSaoPauloDateParts(now);
  const runKey = buildRunKey(now);
  const anoMes = buildAnoMes(now);

  const acquired = await acquireLock(runKey);
  if (!acquired) {
    if (env.NODE_ENV !== 'production') {
      console.info('[recorrencias] Job diário já executado para', runKey);
    }
    return { runKey, materialized: 0, skipped: 0 };
  }

  const db = createSupabaseClient({ useServiceRole: true });

  const { data: recs, error: errRec } = await db
    .from(RECORRENCIAS_TABLE)
    .select('*')
    .eq('ativo', true)
    .eq('dia_do_mes', day);

  if (errRec) throw errRec;
  if (!recs?.length) return { runKey, materialized: 0, skipped: 0 };

  const dataStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  let materialized = 0;
  let skipped = 0;

  for (const rec of recs) {
    const { data: existing } = await db
      .from(LANCAMENTOS_TABLE)
      .select('id')
      .eq('user_id', rec.user_id)
      .eq('recorrencia_id', rec.id)
      .eq('recorrencia_ano_mes', anoMes)
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error: insertErr } = await db
      .from(LANCAMENTOS_TABLE)
      .insert([{
        user_id: rec.user_id,
        tipo: normalizeTipo(rec.tipo),
        valor: rec.valor,
        classificacao: rec.classificacao,
        status: rec.status,
        data: dataStr,
        obs: rec.obs ?? null,
        categoria: rec.categoria ?? null,
        recorrencia_id: rec.id,
        recorrencia_ano_mes: anoMes
      }]);

    if (!insertErr) materialized += 1;
    else if (env.NODE_ENV !== 'production') {
      console.warn('[recorrencias] Falha ao inserir lançamento', rec.id, insertErr.message);
    }
  }

  if (env.NODE_ENV !== 'production' && (materialized > 0 || skipped > 0)) {
    console.info('[recorrencias] Materialização', runKey, { materialized, skipped });
  }

  return { runKey, materialized, skipped };
};

const runSchedulerTick = async () => {
  const now = new Date();
  const runKey = buildRunKey(now);
  if (lastRunKey === runKey) return;
  try {
    await runDailyRecorrenciasMaterialization(now);
    lastRunKey = runKey;
  } catch (err) {
    console.warn('[recorrencias] Erro no job diário', err instanceof Error ? err.message : err);
  }
};

export const startRecorrenciasScheduler = () => {
  if (schedulerHandle) return;
  if (String(process.env.RECORRENCIAS_SCHEDULER_ENABLED ?? 'true').toLowerCase() === 'false') {
    if (env.NODE_ENV !== 'production') {
      console.info('[recorrencias] Scheduler desabilitado por configuração');
    }
    return;
  }
  schedulerHandle = setInterval(() => void runSchedulerTick(), SCHEDULER_INTERVAL_MS);
  void runSchedulerTick();
};
