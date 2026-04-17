import { describe, expect, it } from 'vitest';
import type { NfseRecord } from '../services/meiNotasService';
import {
  anoCivilFromIsoCreatedAt,
  computeMeiLimiteProgresso,
  extrairValorLimiteMeiDaNota,
  extrairValorServicoTotalDoPayload,
  extrairValorTotalServicosDeObjeto,
  isDocumentTypeMeiLimiteRelevante,
  isNfseDocumento,
  nfseDeveEntrarNoSomatórioLimite,
  nfsePeriodoChaveBrFromCreatedAt,
  normalizarPayloadJsonNfse,
  parseValorMonetarioBr,
  resolverPayloadJsonDaNota,
  somarNfseAutorizadasNoAnoCivil
} from './meiLimiteFaturamento';

function nfseBase(over: Partial<NfseRecord> & Pick<NfseRecord, 'id' | 'user_id'>): NfseRecord {
  return {
    id: over.id,
    user_id: over.user_id,
    document_type: 'NFSE',
    status: 'concluido',
    created_at: over.created_at ?? '2026-06-15T12:00:00.000Z',
    payload_json: over.payload_json ?? {
      servico: [{ codigo: '01.01', cnae: '6201500', discriminacao: 'Teste', valor: { servico: 100 } }]
    },
    ...over
  };
}

describe('meiLimiteFaturamento', () => {
  it('ano civil usa America/Sao_Paulo (virada UTC vs BR)', () => {
    expect(anoCivilFromIsoCreatedAt('2026-01-15T10:00:00.000Z')).toBe(2026);
    // UTC já é 1/jan/2026; em SP ainda é 31/dez/2025
    expect(anoCivilFromIsoCreatedAt('2026-01-01T02:00:00.000Z')).toBe(2025);
    expect(anoCivilFromIsoCreatedAt('2026-01-01T04:00:00.000Z')).toBe(2026);
  });

  it('nfsePeriodoChaveBrFromCreatedAt retorna YYYY-MM em America/Sao_Paulo', () => {
    expect(nfsePeriodoChaveBrFromCreatedAt('2026-03-01T12:00:00.000Z')).toBe('2026-03');
    expect(nfsePeriodoChaveBrFromCreatedAt('2026-01-01T02:00:00.000Z')).toBe('2025-12');
  });

  it('lista vazia produz total zero', () => {
    const r = somarNfseAutorizadasNoAnoCivil([], { anoCivil: 2026 });
    expect(r.total).toBe(0);
    expect(r.notasConsideradas).toBe(0);
  });

  it('soma simples de duas NFS-e autorizadas no mesmo ano', () => {
    const list = [
      nfseBase({
        id: 'a',
        user_id: 'u',
        created_at: '2026-03-01T10:00:00.000Z',
        payload_json: {
          servico: [{ valor: { servico: 100 } }]
        }
      }),
      nfseBase({
        id: 'b',
        user_id: 'u',
        created_at: '2026-07-20T10:00:00.000Z',
        payload_json: {
          servico: [{ valor: { servico: 250.5 } }]
        }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBeCloseTo(350.5, 5);
    expect(r.notasConsideradas).toBe(2);
  });

  it('exclui ano civil diferente', () => {
    const list = [
      nfseBase({
        id: 'a',
        user_id: 'u',
        created_at: '2025-06-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 999 } }] }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(0);
    expect(r.notasConsideradas).toBe(0);
  });

  it('isDocumentTypeMeiLimiteRelevante: só NFSE (FR-GUIA-FISC-17)', () => {
    expect(isDocumentTypeMeiLimiteRelevante('NFSE')).toBe(true);
    expect(isDocumentTypeMeiLimiteRelevante('NFE')).toBe(false);
    expect(isDocumentTypeMeiLimiteRelevante('NFCE')).toBe(false);
    expect(isDocumentTypeMeiLimiteRelevante(undefined)).toBe(false);
  });

  it('exclui document_type diferente de NFSE (ex.: NFE)', () => {
    const list = [
      nfseBase({
        id: 'nfe',
        user_id: 'u',
        document_type: 'NFE',
        status: 'concluido',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 10_000 } }] }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(0);
    expect(r.notasConsideradas).toBe(0);
  });

  it('exclui document_type NFCE (FR-GUIA-FISC-17)', () => {
    const list = [
      nfseBase({
        id: 'nfce',
        user_id: 'u',
        document_type: 'NFCE',
        status: 'concluido',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 20_000 } }] }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(0);
    expect(r.notasConsideradas).toBe(0);
  });

  it('lista mista: só soma NFSE concluída (NFE/NFCE ignoradas)', () => {
    const list = [
      nfseBase({
        id: 'ok',
        user_id: 'u',
        document_type: 'NFSE',
        status: 'Concluída',
        created_at: '2026-04-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 200 } }] }
      }),
      nfseBase({
        id: 'nfe',
        user_id: 'u',
        document_type: 'NFE',
        status: 'concluido',
        created_at: '2026-04-02T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 99_999 } }] }
      }),
      nfseBase({
        id: 'nfce',
        user_id: 'u',
        document_type: 'NFCE',
        status: 'concluido',
        created_at: '2026-04-03T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 88_888 } }] }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(200);
    expect(r.notasConsideradas).toBe(1);
  });

  it('exclui cancelada e não concluída', () => {
    const list = [
      nfseBase({
        id: 'c',
        user_id: 'u',
        status: 'cancelado',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 500 } }] }
      }),
      nfseBase({
        id: 'p',
        user_id: 'u',
        status: 'processando',
        created_at: '2026-01-02T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 500 } }] }
      })
    ];
    expect(nfseDeveEntrarNoSomatórioLimite('cancelado')).toBe(false);
    expect(nfseDeveEntrarNoSomatórioLimite('Autorizado / concluido')).toBe(true);
    expect(nfseDeveEntrarNoSomatórioLimite('Concluída')).toBe(true);
    expect(nfseDeveEntrarNoSomatórioLimite('CONCLUÍDA')).toBe(true);
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(0);
    expect(r.notasConsideradas).toBe(0);
  });

  it('inclui nota Concluída somando valor só de payload_json', () => {
    const list = [
      nfseBase({
        id: 'ok',
        user_id: 'u',
        status: 'Concluída',
        created_at: '2026-02-01T10:00:00.000Z',
        payload_json: {
          servicos: [{ valorServico: 75, codigo: 'x' }]
        }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(75);
    expect(r.notasConsideradas).toBe(1);
  });

  it('parseValorMonetarioBr aceita string pt-BR em valor.servico', () => {
    expect(parseValorMonetarioBr('10,50')).toBeCloseTo(10.5, 5);
    expect(parseValorMonetarioBr('1.234,56')).toBeCloseTo(1234.56, 5);
    expect(parseValorMonetarioBr('R$ 1,00')).toBeCloseTo(1, 5);
    expect(
      extrairValorServicoTotalDoPayload({
        servico: [{ valor: { servico: '99,99' }, codigo: 'x' }]
      })
    ).toBeCloseTo(99.99, 5);
  });

  it('normalizarPayloadJsonNfse desembrulha JSON string duplo e array de um elemento', () => {
    const inner = { servico: [{ valor: { servico: 2 } }] };
    const once = JSON.stringify(JSON.stringify(inner));
    expect(normalizarPayloadJsonNfse(once)?.servico).toBeDefined();
    expect(extrairValorServicoTotalDoPayload(once)).toBe(2);
    expect(extrairValorServicoTotalDoPayload([inner] as unknown)).toBe(2);
  });

  it('extrai valor.servico do JSON string (estrutura real emitida / coluna payload_json)', () => {
    const jsonString = JSON.stringify({
      servico: [
        {
          cnae: '8599-6/04',
          valor: { servico: 1 },
          codigo: '080201',
          discriminacao: 'Testes'
        }
      ],
      tomador: { cpfCnpj: '17422651000172', razaoSocial: 'Cf' },
      prestador: { cpfCnpj: '65805583000173' },
      enviarEmail: false,
      idIntegracao: 'mei-test'
    });
    expect(extrairValorServicoTotalDoPayload(jsonString)).toBe(1);
    expect(extrairValorServicoTotalDoPayload(JSON.parse(jsonString))).toBe(1);
  });

  it('resolverPayloadJsonDaNota aceita payloadJson camelCase e payload_json string', () => {
    const parsed = resolverPayloadJsonDaNota({
      id: 'x',
      user_id: 'u',
      document_type: 'NFSE',
      payloadJson: '{"servico":[{"valor":{"servico":33}}]}'
    } as NfseRecord);
    expect(parsed?.servico).toBeDefined();
    expect(extrairValorServicoTotalDoPayload(parsed)).toBe(33);
  });

  it('isNfseDocumento infere NFSE quando document_type vazio mas há servico no payload', () => {
    expect(
      isNfseDocumento({
        id: 'x',
        user_id: 'u',
        document_type: '',
        payload_json: { servico: [{ valor: { servico: 10 } }] }
      } as NfseRecord)
    ).toBe(true);
  });

  it('isNfseDocumento infere NFSE quando só response_json tem servico', () => {
    expect(
      isNfseDocumento({
        id: 'x',
        user_id: 'u',
        document_type: '',
        response_json: { servico: [{ valor: { liquido: 1, servico: 1 } }] }
      } as NfseRecord)
    ).toBe(true);
  });

  it('extrairValorTotalServicosDeObjeto prioriza valor.liquido sobre valor.servico', () => {
    expect(
      extrairValorTotalServicosDeObjeto({
        servico: [{ valor: { liquido: 80, servico: 100 } }]
      })
    ).toBe(80);
  });

  it('extrairValorLimiteMeiDaNota usa response_json quando válido (ignora payload)', () => {
    const note = {
      id: 'x',
      user_id: 'u',
      document_type: 'NFSE',
      response_json: {
        servico: [{ valor: { liquido: 50, servico: 1 }, codigo: '080201' }]
      },
      payload_json: {
        servico: [{ valor: { servico: 999 } }]
      }
    } as NfseRecord;
    expect(extrairValorLimiteMeiDaNota(note)).toBe(50);
  });

  it('extrairValorLimiteMeiDaNota faz fallback ao payload se response sem linhas válidas', () => {
    const note = {
      id: 'x',
      user_id: 'u',
      document_type: 'NFSE',
      response_json: { servico: [] },
      payload_json: { servico: [{ valor: { servico: 12 } }] }
    } as NfseRecord;
    expect(extrairValorLimiteMeiDaNota(note)).toBe(12);
  });

  it('somarNfseAutorizadasNoAnoCivil soma a partir de response_json com liquido', () => {
    const list = [
      nfseBase({
        id: 'r',
        user_id: 'u',
        status: 'CONCLUIDO',
        created_at: '2026-03-23T12:00:00.000Z',
        payload_json: null,
        response_json: {
          status: 'CONCLUIDO',
          servico: [
            {
              cnae: '8599-6/04',
              valor: { liquido: 1, servico: 1 },
              codigo: '080201',
              discriminacao: 'Testes'
            }
          ]
        }
      })
    ];
    const r = somarNfseAutorizadasNoAnoCivil(list, { anoCivil: 2026 });
    expect(r.total).toBe(1);
    expect(r.notasConsideradas).toBe(1);
  });

  it('extrairValorServicoTotalDoPayload soma vários serviços e aceita servico singular', () => {
    expect(
      extrairValorServicoTotalDoPayload({
        servico: [
          { valor: { servico: 10 } },
          { valor: { servico: 20 } }
        ]
      })
    ).toBe(30);
    expect(
      extrairValorServicoTotalDoPayload({
        servico: { valor: { servico: 42 } }
      } as Record<string, unknown>)
    ).toBe(42);
    expect(
      extrairValorServicoTotalDoPayload({
        servicos: [{ valorServico: 5 }, { valor: { servico: 7 } }]
      } as Record<string, unknown>)
    ).toBe(12);
  });

  it('limite zero / indefinido: percentuais null e banda indeterminado', () => {
    const list = [
      nfseBase({
        id: 'x',
        user_id: 'u',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 1000 } }] }
      })
    ];
    const p0 = computeMeiLimiteProgresso(list, {
      anoCivil: 2026,
      limiteReferenciaReaisOverride: 0
    });
    expect(p0.percentualUtilizado).toBeNull();
    expect(p0.percentualUtilizadoParaBarra).toBeNull();
    expect(p0.banda).toBe('indeterminado');

    const pUnknown = computeMeiLimiteProgresso(list, {
      anoCivil: 2099,
      limiteReferenciaReaisOverride: null
    });
    expect(pUnknown.limiteReferenciaReais).toBeNull();
    expect(pUnknown.percentualUtilizado).toBeNull();
    expect(pUnknown.banda).toBe('indeterminado');
  });

  it('percentual pode exceder 100 e barra fica em 100', () => {
    const list = [
      nfseBase({
        id: 'x',
        user_id: 'u',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 90_000 } }] }
      })
    ];
    const p = computeMeiLimiteProgresso(list, {
      anoCivil: 2026,
      limiteReferenciaReaisOverride: 81_000
    });
    expect(p.percentualUtilizado).toBeCloseTo((90_000 / 81_000) * 100, 5);
    expect(p.percentualUtilizadoParaBarra).toBe(100);
    expect(p.banda).toBe('critico');
  });

  it('banda atenção entre 80 e 95%', () => {
    const list = [
      nfseBase({
        id: 'x',
        user_id: 'u',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 70_000 } }] }
      })
    ];
    const p = computeMeiLimiteProgresso(list, {
      anoCivil: 2026,
      limiteReferenciaReaisOverride: 81_000
    });
    expect(p.banda).toBe('atencao');
  });

  it('agregadoServidor da API substitui soma no cliente', () => {
    const list = [
      nfseBase({
        id: 'x',
        user_id: 'u',
        status: 'Concluída',
        created_at: '2026-01-01T10:00:00.000Z',
        payload_json: { servico: [{ valor: { servico: 1 } }] }
      })
    ];
    const p = computeMeiLimiteProgresso(list, {
      anoCivil: 2026,
      limiteReferenciaReaisOverride: 81_000,
      agregadoServidor: { totalUtilizadoReais: 99, notasConsideradas: 3 }
    });
    expect(p.totalUtilizadoReais).toBe(99);
    expect(p.notasConsideradas).toBe(3);
    expect(p.percentualUtilizado).toBeCloseTo((99 / 81_000) * 100, 5);
  });
});
