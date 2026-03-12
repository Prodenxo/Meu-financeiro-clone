import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';

test('mei-notas valida payload de emissao antes de integrar', async () => {
  const { emitirNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => emitirNota('user-1', {
      servico: {
        codigo: '1.01',
        cnae: '6201500',
        discriminacao: 'Servico teste',
        aliquota: 2,
        valorServico: 100
      }
    }),
    /CNPJ do prestador é obrigatório/
  );
});

test('mei-notas normaliza payload.servico objeto unico antes da validacao', async () => {
  const { emitirNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => emitirNota('user-1', {
      payload: {
        servico: {
          codigo: '1.01',
          cnae: '6201500',
          discriminacao: 'Servico teste',
          aliquota: 2,
          valor: { servico: 100 }
        }
      }
    }),
    /CNPJ do prestador é obrigatório/
  );
});

test('mei-notas rejeita tomador com documento invalido', async () => {
  const { emitirNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => emitirNota('user-1', {
      prestadorCpfCnpj: '12345678000199',
      tomadorCpfCnpj: '12345',
      servico: {
        codigo: '1.01',
        cnae: '6201500',
        discriminacao: 'Servico teste',
        aliquota: 2,
        valorServico: 100
      }
    }),
    /CPF\/CNPJ do tomador inválido/
  );
});

test('mei-notas rejeita webhook sem identificadores', async () => {
  const { processarWebhook } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => processarWebhook({}),
    /Webhook sem identificadores da NFSe/
  );
});

test('mei-notas rejeita atualização sem campos editáveis', async () => {
  const { atualizarNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => atualizarNota('user-1', 'nfse-1', {}),
    /Informe ao menos um campo editável/
  );
});

test('mei-notas rejeita operações sem ID', async () => {
  const { atualizarNota, cancelarNota, arquivarNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => atualizarNota('user-1', '', { descricaoInterna: 'teste' }),
    /ID da NFSe é obrigatório/
  );
  await assert.rejects(
    () => cancelarNota('user-1', '', {}),
    /ID da NFSe é obrigatório/
  );
  await assert.rejects(
    () => arquivarNota('user-1', '', {}),
    /ID da NFSe é obrigatório/
  );
});
