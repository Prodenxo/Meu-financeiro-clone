import { env } from '../../config/env.js';
import { badRequest } from '../../utils/errors.js';
import {
  obterTokenProcurador,
  armazenarTokenNoCache,
  autenticarViaCertificado,
  getSerproTokens
} from './authProcurador.service.js';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const getDocTypeNumber = (numero) => {
  const digits = normalizeDoc(numero);
  if (digits.length === 11) return 1;
  if (digits.length === 14) return 2;
  return null;
};

const isAuthTokenError = (status, message) => {
  if (status === 401 || status === 403) return true;
  const normalized = String(message || '').toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('authorization')) {
    return normalized.includes('inválid')
      || normalized.includes('invalido')
      || normalized.includes('não')
      || normalized.includes('nao');
  }
  if (normalized.includes('token')) {
    return normalized.includes('inválid')
      || normalized.includes('invalido')
      || normalized.includes('expir');
  }
  return false;
};

const parseDados = (payload) => {
  if (!payload?.dados) return null;
  if (typeof payload.dados === 'object') return payload.dados;
  try {
    return JSON.parse(String(payload.dados));
  } catch {
    return payload.dados;
  }
};

const SERVICOS_SEM_DADOS = new Set(['PEDIDOSPARC163', 'PEDIDOSPARC203']);

const buildSerproHeaders = async ({
  forceRefresh = false,
  contratanteLimpo,
  autorLimpo,
  contribuinteLimpo
}) => {
  const { accessToken, jwtToken } = await getSerproTokens({ forceRefresh });
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...(jwtToken ? { jwt_token: jwtToken } : {}),
    'Content-Type': 'application/json'
  };

  if (contribuinteLimpo !== autorLimpo) {
    let procuradorToken = obterTokenProcurador(autorLimpo);
    if (!procuradorToken) {
      const nomeAssinante = env.SERPRO_ASSINADO_POR_NOME || '';
      procuradorToken = await autenticarViaCertificado(
        contribuinteLimpo,
        autorLimpo,
        nomeAssinante,
        contratanteLimpo
      );
      armazenarTokenNoCache(`procurador_token_${autorLimpo}`, procuradorToken);
    }
    headers.autenticar_procurador_token = procuradorToken;
    if (env.NODE_ENV !== 'production') {
      console.info('[consultar] autenticar_procurador_token aplicado');
    }
  }

  return headers;
};

export const consultarServico = async ({
  contratanteNumero,
  autorPedidoNumero,
  contribuinteNumero,
  idSistema,
  idServico,
  dados = {}
}) => {
  if (!env.SERPRO_API_BASE_URL) {
    throw badRequest('API Serpro não configurada');
  }
  if (!idSistema || !idServico) {
    throw badRequest('Serviço Serpro não informado');
  }

  const contratanteLimpo = normalizeDoc(contratanteNumero);
  const autorLimpo = normalizeDoc(autorPedidoNumero);
  const contribuinteLimpo = normalizeDoc(contribuinteNumero);

  if (!contratanteLimpo) {
    throw badRequest('Contratante inválido');
  }
  if (!autorLimpo) {
    throw badRequest('Autor do pedido inválido');
  }
  if (!contribuinteLimpo) {
    throw badRequest('Contribuinte inválido');
  }

  const dadosRequisicao = SERVICOS_SEM_DADOS.has(idServico)
    ? ''
    : JSON.stringify(dados);

  const requestBody = {
    contratante: { numero: contratanteLimpo, tipo: getDocTypeNumber(contratanteLimpo) || 2 },
    autorPedidoDados: { numero: autorLimpo, tipo: getDocTypeNumber(autorLimpo) || 2 },
    contribuinte: {
      numero: contribuinteLimpo,
      tipo: getDocTypeNumber(contribuinteLimpo) || 2
    },
    pedidoDados: {
      idSistema,
      idServico,
      versaoSistema: '1.0',
      dados: dadosRequisicao
    }
  };

  const baseUrl = String(env.SERPRO_API_BASE_URL).replace(/\/$/, '');
  const requestConsultar = async (forceRefresh = false) => {
    const headers = await buildSerproHeaders({
      forceRefresh,
      contratanteLimpo,
      autorLimpo,
      contribuinteLimpo
    });
    const response = await fetch(`${baseUrl}/Consultar`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      return { response, message: null, rawBody: null };
    }
    const contentType = response.headers.get('content-type') || '';
    const rawBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    const message = typeof rawBody === 'string'
      ? rawBody
      : (rawBody?.message || rawBody?.error || response.statusText);
    return { response, message, rawBody };
  };

  let result = await requestConsultar(false);
  if (!result.response.ok && isAuthTokenError(result.response.status, result.message)) {
    result = await requestConsultar(true);
  }

  if (!result.response.ok) {
    if (env.NODE_ENV !== 'production') {
      const rawBody = result.rawBody;
      const responseId = typeof rawBody === 'object' ? rawBody?.responseId : null;
      const mensagens = typeof rawBody === 'object' ? rawBody?.mensagens : null;
      console.warn('[consultar] erro Serpro', {
        status: result.response.status,
        url: `${baseUrl}/Consultar`,
        request: {
          contratante: contratanteLimpo,
          autor: autorLimpo,
          contribuinte: contribuinteLimpo,
          idSistema,
          idServico
        },
        headers: Object.fromEntries(result.response.headers.entries()),
        responseId,
        mensagens,
        bodyRaw: rawBody,
        bodyJson: typeof rawBody === 'object' ? JSON.stringify(rawBody) : null
      });
    }
    throw badRequest(result.message || 'Falha ao consultar serviço');
  }

  const payload = await result.response.json();
  return {
    status: result.response.status,
    headers: Object.fromEntries(result.response.headers.entries()),
    dados: parseDados(payload),
    raw: payload
  };
};
