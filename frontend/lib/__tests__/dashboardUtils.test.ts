import {
  normalizarTipo,
  normalizarValor,
  parsearData,
  normalizeCategoryKey,
  getMonthStart,
  formatarDataParaExibicao,
} from '../dashboardUtils';

describe('dashboardUtils', () => {
  describe('normalizarTipo', () => {
    it('retorna "entrada" para "entrada"', () => {
      expect(normalizarTipo('entrada')).toBe('entrada');
    });
    it('retorna "saida" para "saída"', () => {
      expect(normalizarTipo('saída')).toBe('saida');
    });
    it('retorna "saida" para "saida"', () => {
      expect(normalizarTipo('saida')).toBe('saida');
    });
    it('retorna "saida" para string vazia', () => {
      expect(normalizarTipo('')).toBe('saida');
    });
  });

  describe('normalizarValor', () => {
    it('retorna número para number', () => {
      expect(normalizarValor(10)).toBe(10);
    });
    it('retorna 0 para NaN', () => {
      expect(normalizarValor(NaN)).toBe(0);
    });
    it('retorna número para string numérica', () => {
      expect(normalizarValor('12.5')).toBe(12.5);
    });
    it('retorna 0 para string inválida', () => {
      expect(normalizarValor('abc')).toBe(0);
    });
  });

  describe('parsearData', () => {
    it('parseia YYYY-MM-DD', () => {
      const d = parsearData('2024-06-15', '');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(5);
      expect(d.getDate()).toBe(15);
    });
    it('usa criado_em quando dataStr vazio', () => {
      const d = parsearData('', '2024-01-01T10:00:00Z');
      expect(d.getTime()).toBeGreaterThan(0);
    });
  });

  describe('normalizeCategoryKey', () => {
    it('trim e lowercase', () => {
      expect(normalizeCategoryKey('  Alimentação  ')).toBe('alimentação');
    });
  });

  describe('getMonthStart', () => {
    it('retorna YYYY-MM-01 para data', () => {
      const d = new Date(2024, 5, 15); // June 15
      expect(getMonthStart(d)).toBe('2024-06-01');
    });
  });

  describe('formatarDataParaExibicao', () => {
    it('formata YYYY-MM-DD para pt-BR', () => {
      expect(formatarDataParaExibicao('2024-06-15')).toMatch(/\d{1,2}\/\d{1,2}\/2024/);
    });
    it('retorna vazio para string vazia', () => {
      expect(formatarDataParaExibicao('')).toBe('');
    });
  });
});
