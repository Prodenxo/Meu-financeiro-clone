/**
 * Carmo/RJ (IBGE 3301207) — GET /nfse/cidades/{ibge} HTTP 400
 * com `error.data.padraoNacional.producao === true`.
 *
 * Fix: preflight recupera padraoNacional do error.data e permite POST /empresa
 * no modo NFS-e Nacional. Outros 400 (certificado/senha/etc.) continuam bloqueando.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';
process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL = process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL || 'off';

const CARMO_IBGE = '3301207';

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 400 ? 'Bad Request' : 'Error',
  headers: { get: () => 'application/json' },
  json: async () => payload
});

/** Corpo real observado no Postman para Carmo/RJ. */
const carmoCidade400Body = {
  error: {
    message: 'A cidade vinculada ao código IBGE utilizado ainda não foi homologada',
    data: {
      id: 3301207,
      nome: 'Carmo',
      uf: 'RJ',
      fuso: '-03:00',
      padraoNacional: {
        producao: true,
        homologacao: true,
        certificado: true,
        sequencial: false,
        cancelamento: true,
        lote: { max: 1, numeracaoAutomatica: true }
      }
    }
  }
};

const meiEmpresaPayloadCarmo = {
  cpfCnpj: '17422651000172',
  certificado: 'cert-already-uploaded',
  razaoSocial: 'MEI Carmo Teste',
  regimeTributario: 1,
  simplesNacional: true,
  regimeTributarioEspecial: 5,
  endereco: {
    codigoCidade: CARMO_IBGE,
    estado: 'RJ',
    uf: 'RJ',
    logradouro: 'Rua Teste',
    numero: '1',
    bairro: 'Centro',
    cep: '28640000',
    descricaoCidade: 'Carmo'
  },
  nfse: {
    ativo: true,
    tipoContrato: 0,
    config: {
      producao: true,
      nfseNacional: true,
      consultaNfseNacional: true
    }
  }
};

test('consultarCidadePlugNotas recupera 400 Carmo quando padraoNacional.producao=true', async () => {
  const { consultarCidadePlugNotas } = await import(
    '../src/services/plugnotas/plugnotas-cidades.service.js'
  );
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    assert.match(String(url), new RegExp(`/nfse/cidades/${CARMO_IBGE}$`));
    return createJsonResponse(400, carmoCidade400Body);
  };

  try {
    const preflight = await consultarCidadePlugNotas({
      codigoIbge: CARMO_IBGE,
      environment: 'producao'
    });
    assert.equal(preflight.consulted, true);
    assert.equal(preflight.codigoIbge, CARMO_IBGE);
    assert.equal(preflight.padraoNacionalEnabled, true);
    assert.equal(preflight.requiresLogin, false);
    assert.equal(preflight.requiresSenha, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('consultarCidadePlugNotas ainda rejeita 400 sem padraoNacional nacional', async () => {
  const { consultarCidadePlugNotas } = await import(
    '../src/services/plugnotas/plugnotas-cidades.service.js'
  );
  const originalFetch = global.fetch;

  global.fetch = async () =>
    createJsonResponse(400, {
      error: {
        message: 'A cidade vinculada ao código IBGE utilizado ainda não foi homologada',
        data: {
          id: 3301207,
          padraoNacional: { producao: false, homologacao: false }
        }
      }
    });

  try {
    await assert.rejects(
      () => consultarCidadePlugNotas({ codigoIbge: CARMO_IBGE, environment: 'producao' }),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(String(err.message), /ainda não foi homologada/i);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('cadastrarEmpresaPlugNotas MEI Carmo segue para POST /empresa após 400 com padraoNacional', async () => {
  const { cadastrarEmpresaPlugNotas } = await import(
    '../src/services/plugnotas/empresa.service.js'
  );
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    const method = String(options.method || 'GET').toUpperCase();
    calls.push({ url: String(url), method, body: options.body });
    if (String(url).includes('/nfse/cidades/')) {
      return createJsonResponse(400, carmoCidade400Body);
    }
    if (method === 'POST' && String(url).includes('/empresa')) {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      assert.equal(body?.endereco?.codigoCidade, CARMO_IBGE);
      assert.equal(body?.nfse?.config?.nfseNacional, true);
      assert.equal(body?.certificado, 'cert-already-uploaded');
      return createJsonResponse(200, {
        message: 'Empresa cadastrada',
        data: { cnpj: '17422651000172' }
      });
    }
    return createJsonResponse(500, { message: 'unexpected' });
  };

  try {
    const result = await cadastrarEmpresaPlugNotas(meiEmpresaPayloadCarmo);
    assert.equal(result.operation, 'created');
    assert.equal(
      calls.some((c) => c.method === 'POST' && c.url.includes('/empresa')),
      true
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('400 de certificado/auth continua bloqueando (não misturar com regra nacional)', async () => {
  const { cadastrarEmpresaPlugNotas } = await import(
    '../src/services/plugnotas/empresa.service.js'
  );
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    if (String(url).includes('/nfse/cidades/')) {
      return createJsonResponse(200, {
        padraoNacional: { producao: true, homologacao: true },
        login: { producao: false, homologacao: false },
        senha: { producao: false, homologacao: false }
      });
    }
    if (String(url).includes('/empresa')) {
      return createJsonResponse(400, {
        error: { message: 'Certificado inválido ou senha incorreta' }
      });
    }
    return createJsonResponse(500, { message: 'unexpected' });
  };

  try {
    await assert.rejects(
      () => cadastrarEmpresaPlugNotas(meiEmpresaPayloadCarmo),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(String(err.message), /Certificado inválido|senha/i);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
