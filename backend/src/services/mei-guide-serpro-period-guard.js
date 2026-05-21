import { badRequest } from '../utils/errors.js';

export const MEI_DAS_PERIODO_INDISPONIVEL_CODE = 'MEI_DAS_PERIODO_INDISPONIVEL';

const INDISPONIVEL_TEXT_PATTERNS = [
  /n[aã]o\s+optante\s+pelo\s+simei/i,
  /MSG_23008/i,
  /empresa\s+baixada\s+para\s+o\s+ano/i,
  /MSG_23013/i,
  /per[ií]odo\s+de\s+apura[cç][aã]o\s+inv[aá]lido/i,
  /per[ií]odo\s+.*\s+futuro/i,
  /per[ií]odo\s+.*\s+decadente/i,
  /MSG_23030/i,
  /n[aã]o\s+h[aá]\s+das\s+a\s+ser\s+emitido/i,
  /n[aã]o\s+ser[aá]\s+gerado\s+das/i,
  /n[aã]o\s+foi\s+emitido\s+das/i,
  /MSG_23017/i,
  /MSG_23018/i,
  /MSG_23019/i
];

const collectSerproMessagesText = (response) => {
  const parts = [];
  const raw = response?.raw ?? response;
  if (!raw || typeof raw !== 'object') return '';
  const mensagens = raw.mensagens;
  if (Array.isArray(mensagens)) {
    for (const item of mensagens) {
      if (typeof item === 'string') parts.push(item);
      else {
        parts.push(
          item?.texto
          ?? item?.mensagem
          ?? item?.descricao
          ?? item?.codigo
          ?? ''
        );
      }
    }
  } else if (typeof mensagens === 'string') {
    parts.push(mensagens);
  }
  if (raw.message) parts.push(String(raw.message));
  if (raw.error) parts.push(String(raw.error));
  return parts.filter(Boolean).join(' ').trim();
};

export const isPeriodoIndisponivelSerproMessage = (message) => {
  const text = String(message || '').trim();
  if (!text) return false;
  return INDISPONIVEL_TEXT_PATTERNS.some((pattern) => pattern.test(text));
};

export const isPeriodoIndisponivelSerproError = (error) => {
  if (!error) return false;
  if (error?.errors?.code === MEI_DAS_PERIODO_INDISPONIVEL_CODE) return true;
  return isPeriodoIndisponivelSerproMessage(error?.message);
};

const buildIndisponivelUserMessage = (serproText, competenciaLabel) => {
  const label = competenciaLabel ? ` (${competenciaLabel})` : '';
  if (/n[aã]o\s+optante/i.test(serproText)) {
    return `DAS MEI indisponível${label}: neste período a empresa ainda não era optante pelo Simples (MEI). Use apenas competências após a abertura do CNPJ.`;
  }
  if (serproText) {
    return `DAS MEI indisponível${label}: ${serproText}`;
  }
  return `DAS MEI indisponível${label} para este período de apuração.`;
};

export const periodoIndisponivelError = (serproText, competenciaLabel) => {
  const message = buildIndisponivelUserMessage(serproText, competenciaLabel);
  return badRequest(message, {
    code: MEI_DAS_PERIODO_INDISPONIVEL_CODE,
    serproMessage: serproText || null
  });
};

/** Valida resposta SERPRO (HTTP 200 com avisos) antes de aceitar/gravar PDF. */
export const assertSerproDasPeriodoDisponivel = (response, competenciaLabel) => {
  const serproText = collectSerproMessagesText(response);
  if (isPeriodoIndisponivelSerproMessage(serproText)) {
    throw periodoIndisponivelError(serproText, competenciaLabel);
  }
  return serproText;
};

export const competenciaLabelFromPeriod = (period) => {
  const digits = String(period || '').replace(/\D/g, '');
  if (digits.length !== 6) return null;
  return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
};
