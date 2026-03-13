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
    /Webhook sem identificadores da nota fiscal/
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
    /ID da nota fiscal é obrigatório/
  );
  await assert.rejects(
    () => cancelarNota('user-1', '', {}),
    /ID da nota fiscal é obrigatório/
  );
  await assert.rejects(
    () => arquivarNota('user-1', '', {}),
    /ID da nota fiscal é obrigatório/
  );
});

test('mei-notas rejeita documentType inválido', async () => {
  const { emitirNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => emitirNota('user-1', {
      documentType: 'ABC',
      payload: {}
    }),
    /documentType inválido/
  );
});

test('mei-notas valida payload mínimo para NFe e NFCe', async () => {
  const { emitirNota } = await import('../src/services/mei-notas.service.js');

  await assert.rejects(
    () => emitirNota('user-1', {
      documentType: 'NFE',
      payload: {
        emitente: { cpfCnpj: '12345678000199' }
      }
    }),
    /Itens da NF-e são obrigatórios/
  );

  await assert.rejects(
    () => emitirNota('user-1', {
      documentType: 'NFCE',
      payload: {
        emitente: { cpfCnpj: '12345678000199' },
        itens: [{ codigo: 'A1', descricao: 'Produto', valor: 10 }],
        destinatario: { cpfCnpj: '123' }
      }
    }),
    /CPF\/CNPJ do destinatário da NFC-e inválido/
  );
});
