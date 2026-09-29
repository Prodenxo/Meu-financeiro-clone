import { projectRecurrences, isProjecao, buildMaterializationPayload } from '../recorrenciaProjection';
import type { Recorrencia } from '../../store/recorrenciaStore';

const baseRec = (overrides: Partial<Recorrencia> = {}): Recorrencia => ({
  id: 'rec-1',
  user_id: 'user-1',
  dia_do_mes: 15,
  valor: 100,
  classificacao: 'Aluguel',
  tipo: 'saida',
  status: 'a_pagar',
  obs: null,
  categoria: null,
  ativo: true,
  max_ocorrencias: null,
  ocorrencias_geradas: 0,
  criado_em: '2026-01-10T00:00:00Z',
  atualizado_em: '2026-01-10T00:00:00Z',
  ...overrides,
});

const range = (year: number, month: number) => ({
  startYear: year,
  startMonth: month,
  endYear: year,
  endMonth: month,
});

describe('projectRecurrences — limite max_ocorrencias', () => {
  describe('regressão: navegar para mês isolado fora do limite NÃO deve projetar', () => {
    // Bug histórico: quando o usuário visualizava um único mês depois do limite,
    // o contador `projectedSoFar` zerava a cada chamada e o limite nunca era
    // atingido. Resultado: recorrência aparecia infinitamente.
    it('rec criada em jan/2026 com max=3 — viewing mai/2026 NÃO projeta', () => {
      const rec = baseRec({ max_ocorrencias: 3, criado_em: '2026-01-10T00:00:00Z' });
      const result = projectRecurrences([rec], [], range(2026, 5));
      expect(result).toHaveLength(0);
    });

    it('rec criada em jan/2026 com max=3 — viewing abr/2026 NÃO projeta (4ª ocorrência)', () => {
      const rec = baseRec({ max_ocorrencias: 3, criado_em: '2026-01-10T00:00:00Z' });
      const result = projectRecurrences([rec], [], range(2026, 4));
      expect(result).toHaveLength(0);
    });

    it('rec criada em jan/2026 com max=3 — viewing mar/2026 PROJETA (3ª ocorrência)', () => {
      const rec = baseRec({ max_ocorrencias: 3, criado_em: '2026-01-10T00:00:00Z' });
      const result = projectRecurrences([rec], [], range(2026, 3));
      expect(result).toHaveLength(1);
      expect(result[0].recorrencia_ano_mes).toBe('2026-03');
    });
  });

  describe('limite respeitado em range que cruza o limite', () => {
    it('range jan-jun, max=3 → projeta apenas jan, fev, mar', () => {
      const rec = baseRec({ max_ocorrencias: 3, criado_em: '2026-01-10T00:00:00Z' });
      const result = projectRecurrences([rec], [], {
        startYear: 2026,
        startMonth: 1,
        endYear: 2026,
        endMonth: 6,
      });
      expect(result.map((p) => p.recorrencia_ano_mes)).toEqual(['2026-01', '2026-02', '2026-03']);
    });

    it('range jan-dez, max=12 → projeta o ano todo', () => {
      const rec = baseRec({ max_ocorrencias: 12, criado_em: '2026-01-10T00:00:00Z' });
      const result = projectRecurrences([rec], [], {
        startYear: 2026,
        startMonth: 1,
        endYear: 2026,
        endMonth: 12,
      });
      expect(result).toHaveLength(12);
    });
  });

  describe('sem limite', () => {
    it('max_ocorrencias=null → projeta sempre', () => {
      const rec = baseRec({ max_ocorrencias: null });
      const result = projectRecurrences([rec], [], range(2030, 6));
      expect(result).toHaveLength(1);
    });
  });

  describe('comportamento independente de ocorrencias_geradas (campo legado)', () => {
    it('ignora ocorrencias_geradas — usa cálculo absoluto desde criado_em', () => {
      // Antes do fix, ocorrencias_geradas=0 + projectedSoFar=0 < limit=3 → projetava
      // depois do limite. Agora o cálculo é absoluto.
      const rec = baseRec({
        max_ocorrencias: 2,
        ocorrencias_geradas: 999, // valor "errado" no banco — deve ser ignorado
        criado_em: '2026-01-10T00:00:00Z',
      });
      const result = projectRecurrences([rec], [], range(2026, 2));
      // Fev = 2ª ocorrência ≤ limite 2 → ainda projeta
      expect(result).toHaveLength(1);
    });
  });
});

describe('projectRecurrences — outras regras', () => {
  it('não projeta meses anteriores à criação', () => {
    const rec = baseRec({ criado_em: '2026-05-10T00:00:00Z' });
    const result = projectRecurrences([rec], [], range(2026, 3));
    expect(result).toHaveLength(0);
  });

  it('recorrência inativa não projeta', () => {
    const rec = baseRec({ ativo: false });
    const result = projectRecurrences([rec], [], range(2026, 5));
    expect(result).toHaveLength(0);
  });

  it('dedup por materialização — não projeta se já há lançamento real', () => {
    const rec = baseRec({ id: 'rec-X' });
    const result = projectRecurrences(
      [rec],
      [
        {
          recorrencia_id: 'rec-X',
          recorrencia_ano_mes: '2026-05',
          classificacao: 'Aluguel',
          tipo: 'saida',
          data: '2026-05-15',
        },
      ],
      range(2026, 5),
    );
    expect(result).toHaveLength(0);
  });

  it('dedup por skip explícito — não projeta', () => {
    const rec = baseRec({ id: 'rec-X' });
    const result = projectRecurrences([rec], [], range(2026, 5), [
      { recorrencia_id: 'rec-X', ano_mes: '2026-05' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('dedup órfão — match por classificação+tipo+ano_mes', () => {
    const rec = baseRec({ classificacao: 'Aluguel', tipo: 'saida' });
    const result = projectRecurrences(
      [rec],
      [
        {
          // Sem recorrencia_id (órfão)
          classificacao: 'Aluguel',
          tipo: 'saída',
          data: '2026-05-15',
        },
      ],
      range(2026, 5),
    );
    expect(result).toHaveLength(0);
  });

  it('clamp do dia_do_mes em fevereiro (dia 31 → 28)', () => {
    const rec = baseRec({ dia_do_mes: 31 });
    const result = projectRecurrences([rec], [], range(2026, 2));
    expect(result[0].data).toBe('2026-02-28');
  });
});

describe('isProjecao', () => {
  it('detecta __projecao=true', () => {
    expect(isProjecao({ __projecao: true })).toBe(true);
  });
  it('detecta id com prefixo proj_', () => {
    expect(isProjecao({ id: 'proj_xyz_2026-05' })).toBe(true);
  });
  it('rejeita transação real', () => {
    expect(isProjecao({ id: 'uuid-real' })).toBe(false);
  });
});

describe('buildMaterializationPayload', () => {
  it('retorna payload sem __projecao', () => {
    const proj = {
      id: 'proj_X_2026-05',
      user_id: 'u',
      data: '2026-05-15',
      tipo: 'saida',
      valor: 100,
      classificacao: 'Aluguel',
      status: 'a_pagar',
      obs: null,
      categoria: null,
      recorrencia_id: 'X',
      recorrencia_ano_mes: '2026-05',
      __projecao: true as const,
    };
    const payload = buildMaterializationPayload(proj);
    expect(payload).not.toHaveProperty('__projecao');
    expect(payload).not.toHaveProperty('id');
    expect(payload.recorrencia_id).toBe('X');
    expect(payload.recorrencia_ano_mes).toBe('2026-05');
  });
});
