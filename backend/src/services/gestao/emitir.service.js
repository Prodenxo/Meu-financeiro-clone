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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      console.info('[emitir] autenticar_procurador_token aplicado');
    }
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
  const response = await fetch(`${baseUrl}/Emitir`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw badRequest(message || 'Falha ao emitir serviço');
  }

  const payload = await response.json();
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
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
      console.info('[emitir] autenticar_procurador_token aplicado');
    }
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
    const response = await fetch(`${baseUrl}/Emitir`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw badRequest(message || 'Falha ao emitir relatório');
    }

    const payload = await response.json();
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
