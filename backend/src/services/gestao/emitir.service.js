import { env } from '../../config/env.js';
import {
  MEI_GUIDE_INTEGRATION_SERPRO,
  MEI_GUIDE_SERPRO_UNAVAILABLE
} from '../../constants/mei-guide-error-codes.js';
import { badRequest, serviceUnavailable } from '../../utils/errors.js';
import {
  obterTokenProcurador,
  armazenarTokenNoCache,
  autenticarViaCertificado,
  getSerproTokens,
  serproApiFetch
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      console.info('[emitir] autenticar_procurador_token aplicado');
    }
  }

  return headers;
};

export const emitirServico = async ({
  contratanteNumero,
  autorPedidoNumero,
  contribuinteNumero,
  idSistema,
  idServico,
  dados = {},
  versaoSistema = '1.0'
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

  if (!contratanteLimpo || !autorLimpo || !contribuinteLimpo) {
    throw badRequest('Dados inválidos para emissão');
  }

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
      versaoSistema,
      dados: typeof dados === 'string' ? dados : JSON.stringify(dados)
    }
  };

  const baseUrl = String(env.SERPRO_API_BASE_URL).replace(/\/$/, '');
  const requestEmitir = async (forceRefresh = false) => {
    const headers = await buildSerproHeaders({
      forceRefresh,
      contratanteLimpo,
      autorLimpo,
      contribuinteLimpo
    });
    const response = await serproApiFetch(`${baseUrl}/Emitir`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      return { response, message: null };
    }
    const message = await parseErrorMessage(response);
    return { response, message };
  };

  let result = await requestEmitir(false);
  if (!result.response.ok && isAuthTokenError(result.response.status, result.message)) {
    result = await requestEmitir(true);
  }

  if (!result.response.ok) {
    const upstreamStatus = result.response.status;
    if (upstreamStatus >= 500) {
      if (env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[emitir] Serpro upstream erro', {
          integration: MEI_GUIDE_INTEGRATION_SERPRO,
          upstreamStatus
        });
      }
      throw serviceUnavailable(
        'O serviço da Receita Federal está temporariamente indisponível. Tente novamente em alguns minutos.',
        {
          code: MEI_GUIDE_SERPRO_UNAVAILABLE,
          integration: MEI_GUIDE_INTEGRATION_SERPRO,
          upstreamStatus
        }
      );
    }
    throw badRequest(result.message || 'Falha ao emitir serviço');
  }

  const payload = await result.response.json();
  return {
    status: result.response.status,
    headers: Object.fromEntries(result.response.headers.entries()),
    dados: parseDados(payload),
    raw: payload
  };
};

export const emitirRelatorio = async (
  protocoloRelatorio,
  contratanteNumero,
  autorPedidoNumero,
  contribuinteNumero
) => {
  if (!env.SERPRO_API_BASE_URL) {
    throw badRequest('API Serpro não configurada');
  }
  if (!protocoloRelatorio) {
    throw badRequest('Protocolo do relatório é obrigatório');
  }

  const contratanteLimpo = normalizeDoc(contratanteNumero);
  const autorLimpo = normalizeDoc(autorPedidoNumero);
  const contribuinteLimpo = normalizeDoc(contribuinteNumero);

  if (!contratanteLimpo || !autorLimpo || !contribuinteLimpo) {
    throw badRequest('Dados inválidos para emissão');
  }

  const requestBody = {
    contratante: { numero: contratanteLimpo, tipo: getDocTypeNumber(contratanteLimpo) || 2 },
    autorPedidoDados: { numero: autorLimpo, tipo: getDocTypeNumber(autorLimpo) || 2 },
    contribuinte: {
      numero: contribuinteLimpo,
      tipo: getDocTypeNumber(contribuinteLimpo) || 2
    },
    pedidoDados: {
      idSistema: 'SITFIS',
      idServico: 'RELATORIOSITFIS92',
      versaoSistema: '2.0',
      dados: `{ "protocoloRelatorio": "${protocoloRelatorio}" }`
    }
  };

  const baseUrl = String(env.SERPRO_API_BASE_URL).replace(/\/$/, '');
  const maxTentativas = 5;
  let tentativas = 0;
  let tempoEspera = 4000;

  while (tentativas < maxTentativas) {
    const requestRelatorio = async (forceRefresh = false) => {
      const headers = await buildSerproHeaders({
        forceRefresh,
        contratanteLimpo,
        autorLimpo,
        contribuinteLimpo
      });
      const response = await serproApiFetch(`${baseUrl}/Emitir`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        return { response, message: null };
      }
      const message = await parseErrorMessage(response);
      return { response, message };
    };

    let result = await requestRelatorio(false);
    if (!result.response.ok && isAuthTokenError(result.response.status, result.message)) {
      result = await requestRelatorio(true);
    }

    if (!result.response.ok) {
      const upstreamStatus = result.response.status;
      if (upstreamStatus >= 500) {
        if (env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.info('[emitir relatorio] Serpro upstream erro', {
            integration: MEI_GUIDE_INTEGRATION_SERPRO,
            upstreamStatus
          });
        }
        throw serviceUnavailable(
          'O serviço da Receita Federal está temporariamente indisponível. Tente novamente em alguns minutos.',
          {
            code: MEI_GUIDE_SERPRO_UNAVAILABLE,
            integration: MEI_GUIDE_INTEGRATION_SERPRO,
            upstreamStatus
          }
        );
      }
      throw badRequest(result.message || 'Falha ao emitir relatório');
    }

    const payload = await result.response.json();
    if (payload?.dados) {
      let parsed = payload.dados;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = null;
        }
      }

      if (parsed?.pdf) {
        return {
          message: 'Relatório emitido com sucesso',
          protocolo: protocoloRelatorio,
          base64: parsed.pdf
        };
      }

      if (parsed?.tempoEspera) {
        await delay(parsed.tempoEspera);
        tentativas += 1;
        continue;
      }
    }

    await delay(tempoEspera);
    tentativas += 1;
    tempoEspera += 2000;
  }

  throw badRequest('Relatório não foi gerado dentro do tempo esperado');
};
