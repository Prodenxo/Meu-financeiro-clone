import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SERPRO_API_BASE_URL = process.env.SERPRO_API_BASE_URL || 'https://serpro.example';
process.env.SERPRO_OAUTH_TOKEN_URL = process.env.SERPRO_OAUTH_TOKEN_URL || 'https://serpro.example/oauth/token';
process.env.SERPRO_CONSUMER_KEY = process.env.SERPRO_CONSUMER_KEY || 'consumer-key';
process.env.SERPRO_CONSUMER_SECRET = process.env.SERPRO_CONSUMER_SECRET || 'consumer-secret';
process.env.SERPRO_OAUTH_TOKEN_NO_MTLS = process.env.SERPRO_OAUTH_TOKEN_NO_MTLS || 'true';

test('mei-guide usa cache local para marcar períodos pagos sem chamar SERPRO', async () => {
  const { __buildPeriodsFromPdfForTests } = await import('../src/services/mei-guide.service.js');
  let createCalls = 0;

  const items = await __buildPeriodsFromPdfForTests('user-1', {
    cnpj: '12345678000199',
    useCertificate: false
  }, {
    listPaidCompetenciasFn: async ({ competencias }) => competencias,
    createGuideByCnpjFn: async () => {
      createCalls += 1;
      return {};
    }
  });

  assert.equal(createCalls, 0);
  assert.equal(items.length, 12);
  assert.equal(items.every((item) => item.status === 'pago'), true);
});

test('mei-guide classifica timeout da SERPRO como erro técnico no histórico', async () => {
  const { __buildPeriodsFromPdfForTests } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  const items = await __buildPeriodsFromPdfForTests('user-2', {
    cnpj: '12345678000199',
    useCertificate: false
  }, {
    listPaidCompetenciasFn: async () => [],
    createGuideByCnpjFn: async () => {
      throw new Error('timeout de rede');
    },
    markCompetenciaAsPaidFn: async () => {
      persistedPaid += 1;
    }
  });

  assert.equal(persistedPaid, 0);
  assert.equal(items.length, 12);
  assert.equal(items.every((item) => item.status === 'erro'), true);
  assert.equal(items.every((item) => String(item.errorMessage || '').includes('timeout')), true);
});

test('mei-guide classifica erro de autorização como erro técnico', async () => {
  const { __buildPeriodsFromPdfForTests } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  const items = await __buildPeriodsFromPdfForTests('user-2b', {
    cnpj: '12345678000199',
    useCertificate: false
  }, {
    listPaidCompetenciasFn: async () => [],
    createGuideByCnpjFn: async () => {
      throw new Error('Não autorizado pela Serpro');
    },
    markCompetenciaAsPaidFn: async () => {
      persistedPaid += 1;
    }
  });

  assert.equal(persistedPaid, 0);
  assert.equal(items.length, 12);
  assert.equal(items.every((item) => item.status === 'erro'), true);
  assert.equal(items.every((item) => String(item.errorMessage || '').toLowerCase().includes('não autorizado')), true);
});

test('mei-guide persiste pago quando erro indica período quitado', async () => {
  const { __buildPeriodsFromPdfForTests } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  const items = await __buildPeriodsFromPdfForTests('user-3', {
    cnpj: '12345678000199',
    useCertificate: false
  }, {
    listPaidCompetenciasFn: async () => [],
    createGuideByCnpjFn: async () => {
      throw new Error('Guia já foi pago para o período');
    },
    markCompetenciaAsPaidFn: async () => {
      persistedPaid += 1;
    }
  });

  assert.equal(items.length, 12);
  assert.equal(items.every((item) => item.status === 'pago'), true);
  assert.equal(persistedPaid, items.length);
});

test('mei-guide marca período como pago quando resposta vem sem PDF', async () => {
  const { __buildPeriodsFromPdfForTests } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  const items = await __buildPeriodsFromPdfForTests('user-3b', {
    cnpj: '12345678000199',
    useCertificate: false
  }, {
    listPaidCompetenciasFn: async () => [],
    createGuideByCnpjFn: async () => {
      throw new Error('PDF do DAS não retornado');
    },
    markCompetenciaAsPaidFn: async () => {
      persistedPaid += 1;
    }
  });

  assert.equal(items.length, 12);
  assert.equal(items.every((item) => item.status === 'pago'), true);
  assert.equal(persistedPaid, items.length);
});

test('downloadGuide devolve PDF armazenado quando período já está pago', async () => {
  const { downloadGuide } = await import('../src/services/mei-guide.service.js');
  const stored = Buffer.from('%PDF-test').toString('base64');
  let createCalls = 0;

  const file = await downloadGuide({
    userId: 'user-4',
    cnpj: '12345678000199',
    periodoApuracao: '202601'
  }, {
    isCompetenciaPaidFn: async () => true,
    getDasBase64Fn: async () => stored,
    createGuideByCnpjFn: async () => {
      createCalls += 1;
      return null;
    }
  });

  assert.equal(createCalls, 0);
  assert.equal(file.filename, 'DAS-2026-01.pdf');
  assert.equal(file.buffer.toString(), '%PDF-test');
});

test('downloadGuide bloqueia quando pago sem PDF armazenado', async () => {
  const { downloadGuide } = await import('../src/services/mei-guide.service.js');

  await assert.rejects(
    () => downloadGuide({
      userId: 'user-4b',
      cnpj: '12345678000199',
      periodoApuracao: '202601'
    }, {
      isCompetenciaPaidFn: async () => true,
      getDasBase64Fn: async () => null
    }),
    /Período já consta como pago/
  );
});

test('downloadGuide persiste pago quando SERPRO retorna período quitado', async () => {
  const { downloadGuide } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  await assert.rejects(
    () => downloadGuide({
      userId: 'user-5',
      cnpj: '12345678000199',
      periodoApuracao: '202602'
    }, {
      isCompetenciaPaidFn: async () => false,
      createGuideByCnpjFn: async () => {
        throw new Error('Não há débitos para o período informado');
      },
      markCompetenciaAsPaidFn: async () => {
        persistedPaid += 1;
      }
    }),
    /Período já consta como pago/
  );

  assert.equal(persistedPaid, 1);
});

test('downloadGuide persiste pago quando SERPRO responde sem PDF', async () => {
  const { downloadGuide } = await import('../src/services/mei-guide.service.js');
  let persistedPaid = 0;

  await assert.rejects(
    () => downloadGuide({
      userId: 'user-6',
      cnpj: '12345678000199',
      periodoApuracao: '202603'
    }, {
      isCompetenciaPaidFn: async () => false,
      createGuideByCnpjFn: async () => {
        throw new Error('PDF do DAS não retornado');
      },
      markCompetenciaAsPaidFn: async () => {
        persistedPaid += 1;
      }
    }),
    /Período já consta como pago/
  );

  assert.equal(persistedPaid, 1);
});
