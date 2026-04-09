import test from 'node:test';
import assert from 'node:assert/strict';

import { HttpError } from '../src/utils/errors.js';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.PLUGNOTAS_API_BASE_URL = process.env.PLUGNOTAS_API_BASE_URL || 'https://api.sandbox.plugnotas.com.br';
process.env.PLUGNOTAS_API_KEY = process.env.PLUGNOTAS_API_KEY || 'plugnotas-key';
process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL = process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL || 'off';

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 409 ? 'Conflict' : 'Error',
  headers: { get: () => 'application/json' },
  json: async () => payload
});

/** Resposta erro com corpo HTML (proxy/gateway) — `parseResponsePayload` usa `text()`. */
const createHtmlErrorResponse = (status, htmlBody) => ({
  ok: false,
  status,
  statusText: status === 502 ? 'Bad Gateway' : 'Error',
  headers: {
    get: (name) => (String(name).toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null)
  },
  json: async () => {
    throw new SyntaxError('not json');
  },
  text: async () => htmlBody
});

test('empresa service valida payload obrigatório', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');

  await assert.rejects(
    () => cadastrarEmpresaPlugNotas(null),
    /Payload da empresa é obrigatório/
  );
  await assert.rejects(
    () => cadastrarEmpresaPlugNotas({ cpfCnpj: '123', certificado: 'cert-1' }),
    /CNPJ da empresa deve ter 14 dígitos/
  );
  await assert.rejects(
    () => cadastrarEmpresaPlugNotas({ cpfCnpj: '17422651000172' }),
    /Certificado é obrigatório/
  );
});

test('empresa service cria empresa com POST /empresa', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'Cadastro efetuado com sucesso',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/empresa$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(response.operation, 'created');
    assert.equal(response.cnpj, '17422651000172');
    const sent = JSON.parse(calls[0].options.body);
    assert.ok(sent.nfce && typeof sent.nfce === 'object');
    assert.equal(sent.nfce.ativo, false);
    assert.equal(sent.nfe.ativo, false);
    assert.equal('config' in sent.nfce, false);
    assert.equal(sent.inscricaoEstadual, 'ISENTO');
    assert.equal(sent.nfse?.nacional, true);
    assert.equal(
      Object.prototype.hasOwnProperty.call(sent.nfse?.config || {}, 'prefeitura'),
      false,
      'sem PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE não enviar prefeitura derivada (NFR-P0-REG-01)'
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST normaliza endereco.codigoCidade numérico para string só dígitos (FR-CID-BE-01)', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste',
      endereco: {
        codigoCidade: 3550308,
        uf: 'SP',
        logradouro: 'Rua A',
        numero: '1',
        bairro: 'Centro',
        cep: '01000000'
      }
    });
    assert.equal(calls.length, 1);
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.endereco.codigoCidade, '3550308');
    assert.equal(typeof sent.endereco.codigoCidade, 'string');
  } finally {
    global.fetch = originalFetch;
  }
});

test('PATCH normaliza endereco.codigoCidade numérico para string só dígitos (FR-CID-BE-01)', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      endereco: {
        codigoCidade: 3550308,
        uf: 'SP'
      }
    });
    assert.ok(calls.length >= 1);
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.endereco.codigoCidade, '3550308');
    assert.equal(typeof sent.endereco.codigoCidade, 'string');
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST com documentosAtivos só NFSe equivale ao default e não envia campo interno ao Plugnotas (CR-CAD-DOC-01)', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste',
      documentosAtivos: { nfse: true, nfe: false, nfce: false }
    });
    const sent = JSON.parse(calls[0].options.body);
    assert.equal('documentosAtivos' in sent, false);
    assert.equal(sent.nfce.ativo, false);
    assert.equal('config' in sent.nfce, false);
    assert.equal(sent.nfe.ativo, false);
    assert.equal(sent.nfse?.nacional, true);
    assert.equal(sent.inscricaoEstadual, 'ISENTO');
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST com documentosAtivos inválido (todos false) → 400', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  await assert.rejects(
    () => cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      documentosAtivos: { nfse: false, nfe: false, nfce: false }
    }),
    /pelo menos um tipo de documento/
  );
});

test('POST com documentosAtivos só nfce true (nfse false) monta nfce ativo e nfse inativo sem config', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      documentosAtivos: { nfse: false, nfe: false, nfce: true }
    });
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.nfse.ativo, false);
    assert.equal('nacional' in sent.nfse, false);
    assert.equal(sent.nfce.ativo, true);
    assert.ok(sent.nfce.config);
    assert.equal(sent.nfe.ativo, false);
    assert.equal('config' in sent.nfe, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST com documentosAtivos nfe true envia bloco nfe ativo com config mínimo', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      documentosAtivos: { nfse: true, nfe: true, nfce: false }
    });
    const sent = JSON.parse(calls[0].options.body);
    assert.equal('documentosAtivos' in sent, false);
    assert.equal(sent.nfe.ativo, true);
    assert.ok(sent.nfe.config);
    assert.equal(sent.nfe.config.producao, true);
    assert.equal(sent.nfce.ativo, false);
    assert.equal('config' in sent.nfce, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('PATCH com documentosAtivos não força nfe/nfce inativos por engano (FR-CAD-DOC-05)', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      documentosAtivos: { nfse: true, nfe: false, nfce: true }
    });
    const sent = JSON.parse(calls[0].body);
    assert.equal('documentosAtivos' in sent, false);
    assert.equal(sent.nfce.ativo, true);
    assert.ok(sent.nfce.config);
    assert.equal(sent.nfe.ativo, false);
    assert.equal('config' in sent.nfe, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service POST modo apenas NFSe: inativa nfce/nfe sem config mesmo se cliente envia NFC-e ativa', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste',
      nfce: {
        ativo: true,
        tipoContrato: 0,
        config: { producao: true, serie: 1, numero: 1, versaoQrCode: 2 }
      }
    });
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.nfce.ativo, false);
    assert.equal('config' in sent.nfce, false);
    assert.equal(sent.nfe.ativo, false);
    assert.equal(sent.nfse?.nacional, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service tenta atualização quando empresa já existe', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Empresa já cadastrada' });
    }
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.method, 'POST');
    assert.match(calls[0].url, /\/empresa$/);
    assert.equal(calls[1].options.method, 'PATCH');
    assert.match(calls[1].url, /\/empresa\/17422651000172$/);
    assert.equal(response.operation, 'updated');
    assert.equal(response.cnpj, '17422651000172');
    const patchBody = JSON.parse(calls[1].options.body);
    assert.equal(patchBody.nfce.ativo, false);
    assert.equal('config' in patchBody.nfce, false);
    assert.equal(patchBody.nfse?.nacional, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service PATCH com nfse no corpo sem nacional: adiciona nacional true', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      nfse: { ativo: true, tipoContrato: 0, config: { producao: true } }
    });
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.nfse.nacional, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service PATCH com nfse.nacional false: não sobrescreve', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      nfse: { ativo: true, tipoContrato: 0, nacional: false }
    });
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.nfse.nacional, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service recupera id quando POST 409 e GET empresa traz certificado', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    return createJsonResponse(200, {
      message: 'OK',
      data: { certificado: 'cert-id-plugnotas-xyz', cpfCnpj: '17422651000172' }
    });
  };

  try {
    const buf = new Uint8Array([1, 2, 3]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'teste.pfx',
      password: 'secret',
      cpfCnpj: '17.422.651/0001-72'
    });
    assert.equal(res.id, 'cert-id-plugnotas-xyz');
    assert.equal(res.raw.recoveredFrom409, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /\/certificado$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.match(calls[1].url, /\/empresa\/17422651000172$/);
    assert.equal(calls[1].options.method, 'GET');
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service usa GET /certificado quando 409 e sem id na empresa', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    if (calls.length === 3) {
      return createJsonResponse(400, { message: 'Filtro não suportado neste ambiente' });
    }
    return createJsonResponse(200, {
      data: [{ id: 'cert-from-list', cpfCnpj: '17422651000172' }]
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'x.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, 'cert-from-list');
    assert.equal(calls.length, 4);
    assert.match(calls[2].url, /\/certificado\?cpfCnpj=17422651000172$/);
    assert.equal(calls[2].options.method, 'GET');
    assert.match(calls[3].url, /\/certificado$/);
    assert.equal(calls[3].options.method, 'GET');
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service resolve id via GET /certificado?cpfCnpj quando a API filtra', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    return createJsonResponse(200, {
      data: [{ id: 'cert-from-filtered', cpfCnpj: '17422651000172' }]
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'f.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, 'cert-from-filtered');
    assert.equal(calls.length, 3);
    assert.match(calls[2].url, /\/certificado\?cpfCnpj=17422651000172$/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service recupera id numérico em GET empresa (certificado objeto)', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    return createJsonResponse(200, {
      message: 'OK',
      data: { certificado: { id: 912345 }, cpfCnpj: '17422651000172' }
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'a.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, '912345');
    assert.equal(res.raw.recoveredFrom409, true);
    assert.equal(calls.length, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service encontra id na listagem quando CNPJ só aparece no nome (DN)', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    if (calls.length === 3) {
      return createJsonResponse(400, { message: 'bad query' });
    }
    return createJsonResponse(200, {
      data: [{
        id: 'cert-dn-match',
        nome: 'CN=ACME LTDA, OU=Certificado A1, OU=17422651000172'
      }]
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'b.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, 'cert-dn-match');
    assert.equal(calls.length, 4);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service usa heurística de lista única quando não há match por CNPJ', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    if (calls.length === 3) {
      return createJsonResponse(400, { message: 'bad query' });
    }
    return createJsonResponse(200, {
      data: [{ id: 777, nome: 'Certificado sem documento no payload' }]
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'c.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, '777');
    assert.equal(calls.length, 4);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service resolve id com listagem em data.items (US-MEI-FISC-05)', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    if (calls.length === 3) {
      return createJsonResponse(400, { message: 'Filtro não suportado neste ambiente' });
    }
    return createJsonResponse(200, {
      data: {
        items: [{ idCertificado: 'cert-from-data-items', cpfCnpj: '17422651000172' }]
      }
    });
  };

  try {
    const buf = new Uint8Array([1]);
    const res = await cadastrarCertificadoPlugNotas({
      fileBuffer: buf,
      fileName: 'nested.pfx',
      password: 'p',
      cpfCnpj: '17422651000172'
    });
    assert.equal(res.id, 'cert-from-data-items');
    assert.equal(calls.length, 4);
  } finally {
    global.fetch = originalFetch;
  }
});

test('certificado service retorna erro claro quando 409 e não pode resolver id', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  global.fetch = async () => createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });

  try {
    const buf = new Uint8Array([1]);
    await assert.rejects(
      () => cadastrarCertificadoPlugNotas({
        fileBuffer: buf,
        fileName: 'x.pfx',
        password: 'p'
      }),
      (err) => {
        assert.equal(err.status, 400);
        assert.equal(err.errors?.plugnotasCode, 'certificado_409_sem_id');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('resolver pós-409 emite log estruturado por etapa quando PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL=warn (US-MEI-FISC-04)', async () => {
  const prevLevel = process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL;
  process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL = 'warn';
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (msg, payload) => {
    warnings.push({ msg, payload });
  };

  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Já existe um Certificado com os parâmetros informados' });
    }
    if (calls.length === 2) {
      return createJsonResponse(404, { message: 'Não localizamos qualquer Empresa' });
    }
    if (calls.length === 3) {
      return createJsonResponse(400, { message: 'Filtro não suportado neste ambiente' });
    }
    return createJsonResponse(404, { message: 'Não localizado' });
  };

  try {
    const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
    const buf = new Uint8Array([1]);
    await assert.rejects(
      () => cadastrarCertificadoPlugNotas({
        fileBuffer: buf,
        fileName: 'x.pfx',
        password: 'p',
        cpfCnpj: '17422651000172'
      }),
      (err) => {
        assert.equal(err.status, 400);
        assert.equal(err.errors?.plugnotasCode, 'certificado_409_sem_id');
        return true;
      }
    );
    assert.ok(warnings.length >= 3, 'esperado log por etapa da cadeia GET');
    const steps = warnings.map((w) => w.payload?.step).filter(Boolean);
    assert.ok(steps.includes('empresa_get'));
    assert.ok(steps.includes('certificado_filtro'));
    assert.ok(steps.includes('certificado_lista'));
    const filtro = warnings.find((w) => w.payload?.step === 'certificado_filtro');
    assert.equal(filtro?.payload?.outcome, 'http_error');
    assert.equal(filtro?.payload?.httpStatus, 400);
    assert.match(String(filtro?.payload?.cpfCnpj || ''), /\d{2}\*\*\*\d{2}/);
  } finally {
    console.warn = origWarn;
    global.fetch = originalFetch;
    process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL = prevLevel;
  }
});

test('empresa service consulta empresa com GET /empresa/:cnpj', async () => {
  const { consultarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cpfCnpj: '17422651000172', razaoSocial: 'ACME' }
    });
  };

  try {
    const response = await consultarEmpresaPlugNotas('17.422.651/0001-72');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'GET');
    assert.match(calls[0].url, /\/empresa\/17422651000172$/);
    assert.equal(response.data.razaoSocial, 'ACME');
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service POST preserva inscricaoEstadual quando cliente informa', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste',
      inscricaoEstadual: '123456789'
    });
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.inscricaoEstadual, '123456789');
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service PATCH com inscricaoEstadual vazia normaliza para ISENTO', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      inscricaoEstadual: '   '
    });
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.inscricaoEstadual, 'ISENTO');
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service atualiza empresa sem certificado no payload', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    const response = await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      endereco: { logradouro: 'Rua A', numero: '1' }
    });

    assert.equal(response.operation, 'updated');
    assert.equal(response.cnpj, '17422651000172');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'PATCH');
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.certificado, undefined);
    assert.equal(sent.nfce, undefined);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service PATCH com nfce no corpo: substitui por bloco inativo sem config', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      nfce: {
        ativo: true,
        tipoContrato: 0,
        config: { producao: true, serie: 1, numero: 1, versaoQrCode: 2 }
      }
    });
    const sent = JSON.parse(calls[0].body);
    assert.equal(sent.nfce.ativo, false);
    assert.equal('config' in sent.nfce, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service atualizar mapeia 404 "não localizamos" para mensagem orientativa', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(404, {
      message: 'Não localizamos qualquer Empresa com os parâmetros informados'
    });
  };

  try {
    await assert.rejects(
      () => atualizarEmpresaPlugNotas({
        cpfCnpj: '17422651000172',
        razaoSocial: 'Empresa Teste'
      }),
      (err) => {
        assert.equal(err.status, 400);
        assert.equal(err.errors?.plugnotasCode, 'empresa_nao_cadastrada');
        assert.ok(Array.isArray(err.errors?.plugnotasUpdateAttempts));
        assert.equal(calls.length, 1);
        assert.match(String(err.message), /Não há cadastro desta empresa no emissor fiscal/);
        assert.match(String(err.message), /certificado/);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service atualizar inclui plugnotasUpdateAttempts quando todas as rotas falham', async () => {
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(400, { message: 'Esta rota não existe no serviço' });
  };

  try {
    await assert.rejects(
      () => atualizarEmpresaPlugNotas({
        cpfCnpj: '17422651000172',
        razaoSocial: 'Empresa Teste'
      }),
      (err) => {
        assert.equal(err.status, 400);
        assert.ok(Array.isArray(err.errors?.plugnotasUpdateAttempts));
        assert.equal(err.errors.plugnotasUpdateAttempts.length, 1);
        assert.equal(calls.length, 1);
        return /Esta rota não existe no serviço/.test(String(err.message));
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service POST /empresa inclui detalhes de validação no 400', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  global.fetch = async () => createJsonResponse(400, {
    message: 'Falha na validação do JSON de Empresa',
    errors: [{ field: 'endereco.logradouro', error: 'inválido' }]
  });

  try {
    await assert.rejects(
      () => cadastrarEmpresaPlugNotas({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        razaoSocial: 'Empresa Teste'
      }),
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 400);
        assert.match(String(err.message), /endereco\.logradouro/);
        assert.match(String(err.message), /inválido/);
        assert.ok(
          !String(err.errors?.plugnotasCode || '').startsWith('plugnotas_gateway_'),
          'CR-GW-02: 400 validação não deve usar código plugnotas_gateway_*'
        );
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service POST /empresa: 502 HTML normaliza mensagem + plugnotas_gateway_502 (integração requestJson)', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const html = '<html><body>502 Bad Gateway</body></html>';
  global.fetch = async () => createHtmlErrorResponse(502, html);

  try {
    await assert.rejects(
      () => cadastrarEmpresaPlugNotas({
        cpfCnpj: '17422651000172',
        certificado: 'cert-1',
        razaoSocial: 'Empresa Teste'
      }),
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 502);
        assert.match(String(err.message), /emissor fiscal não está a responder/i);
        assert.equal(err.errors?.plugnotasCode, 'plugnotas_gateway_502');
        assert.equal(err.errors?.plugnotasRequest?.method, 'POST');
        assert.ok(String(err.errors?.plugnotasRequest?.path || '').includes('/empresa'));
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('cadastrarCertificadoPlugNotas: 502 HTML normaliza mensagem + plugnotas_gateway_502 (integração requestFormData)', async () => {
  const { cadastrarCertificadoPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const html = '<html><title>502 Bad Gateway</title></html>';
  global.fetch = async () => createHtmlErrorResponse(502, html);

  try {
    await assert.rejects(
      () => cadastrarCertificadoPlugNotas({
        fileBuffer: Buffer.from('fake-pfx'),
        fileName: 'cert.pfx',
        password: 'secret'
      }),
      (err) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 502);
        assert.match(String(err.message), /emissor fiscal não está a responder/i);
        assert.equal(err.errors?.plugnotasCode, 'plugnotas_gateway_502');
        assert.equal(err.errors?.plugnotasRequest?.method, 'POST');
        assert.ok(String(err.errors?.plugnotasRequest?.path || '').includes('/certificado'));
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('empresa service trata conflito sem update como sucesso operacional', async () => {
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return createJsonResponse(409, { message: 'Empresa já cadastrada' });
    }
    return createJsonResponse(404, { message: 'Operação não suportada' });
  };

  try {
    const response = await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste'
    });

    assert.equal(calls.length, 2);
    assert.equal(response.operation, 'existing');
    assert.match(
      String(response.message || ''),
      /sucesso operacional/i
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST com PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE inclui nfse.config.prefeitura.codigoIbge (trilho B)', async () => {
  const prevDerive = process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE;
  process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE = 'true';
  const { cadastrarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return createJsonResponse(200, {
      message: 'OK',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await cadastrarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      certificado: 'cert-1',
      razaoSocial: 'Empresa Teste',
      endereco: {
        codigoCidade: '4115200',
        estado: 'PR',
        logradouro: 'Rua A',
        numero: '1',
        bairro: 'Centro',
        cep: '87000000'
      }
    });
    assert.equal(calls.length, 1);
    const sent = JSON.parse(calls[0].options.body);
    assert.deepEqual(sent.nfse.config.prefeitura, { codigoIbge: '4115200' });
  } finally {
    global.fetch = originalFetch;
    if (prevDerive === undefined) delete process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE;
    else process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE = prevDerive;
  }
});

test('PATCH com PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE inclui nfse.config.prefeitura.codigoIbge (trilho B, coerência POST)', async () => {
  const prevDerive = process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE;
  process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE = 'true';
  const { atualizarEmpresaPlugNotas } = await import('../src/services/plugnotas/empresa.service.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options, body: options.body });
    return createJsonResponse(200, {
      message: 'Empresa atualizada',
      data: { cnpj: '17422651000172' }
    });
  };

  try {
    await atualizarEmpresaPlugNotas({
      cpfCnpj: '17422651000172',
      razaoSocial: 'Empresa Teste',
      nfse: { ativo: true, tipoContrato: 0, config: { producao: true } },
      endereco: {
        codigoCidade: '4115200',
        estado: 'PR',
        logradouro: 'Rua A',
        numero: '1',
        bairro: 'Centro',
        cep: '87000000'
      }
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.method, 'PATCH');
    const sent = JSON.parse(calls[0].body);
    assert.deepEqual(sent.nfse.config.prefeitura, { codigoIbge: '4115200' });
  } finally {
    global.fetch = originalFetch;
    if (prevDerive === undefined) delete process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE;
    else process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE = prevDerive;
  }
});
