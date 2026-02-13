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

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload?.message || payload?.error || response.statusText;
  }
  const text = await response.text();
  return text || response.statusText;
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

  const { accessToken, jwtToken } = await getSerproTokens();
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
  const response = await fetch(`${baseUrl}/Consultar`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    if (env.NODE_ENV !== 'production') {
      const responseId = typeof rawBody === 'object' ? rawBody?.responseId : null;
      const mensagens = typeof rawBody === 'object' ? rawBody?.mensagens : null;
      console.warn('[consultar] erro Serpro', {
        status: response.status,
        url: `${baseUrl}/Consultar`,
        request: {
          contratante: contratanteLimpo,
          autor: autorLimpo,
          contribuinte: contribuinteLimpo,
          idSistema,
          idServico
        },
        headers: Object.fromEntries(response.headers.entries()),
        responseId,
        mensagens,
        bodyRaw: rawBody,
        bodyJson: typeof rawBody === 'object' ? JSON.stringify(rawBody) : null
      });
    }
    const message = typeof rawBody === 'string'
      ? rawBody
      : (rawBody?.message || rawBody?.error || response.statusText);
    throw badRequest(message || 'Falha ao consultar serviço');
  }

  const payload = await response.json();
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    dados: parseDados(payload),
    raw: payload
  };
};
