import { describe, expect, it } from 'vitest';
import {
  meiFiscalDocumentTypeBadgeClass,
  meiFiscalDocumentTypeShortLabel,
  meiFiscalListFilterEmptyMessage,
  normalizeMeiFiscalDocumentType
} from './meiFiscalDocumentTypeUi';

describe('meiFiscalDocumentTypeUi', () => {
  it('normaliza códigos conhecidos', () => {
    expect(normalizeMeiFiscalDocumentType('nfse')).toBe('NFSE');
    expect(normalizeMeiFiscalDocumentType('NFE')).toBe('NFE');
    expect(normalizeMeiFiscalDocumentType('nfce')).toBe('NFCE');
    expect(normalizeMeiFiscalDocumentType('cte')).toBe('CTE');
  });

  it('UNKNOWN para vazio ou desconhecido', () => {
    expect(normalizeMeiFiscalDocumentType('')).toBe('UNKNOWN');
    expect(normalizeMeiFiscalDocumentType(null)).toBe('UNKNOWN');
    expect(normalizeMeiFiscalDocumentType('XYZ')).toBe('UNKNOWN');
  });

  it('rótulos curtos', () => {
    expect(meiFiscalDocumentTypeShortLabel('NFSE')).toBe('NFS-e');
    expect(meiFiscalDocumentTypeShortLabel('NFE')).toBe('NF-e');
    expect(meiFiscalDocumentTypeShortLabel('NFCE')).toBe('NFC-e');
    expect(meiFiscalDocumentTypeShortLabel('CTE')).toBe('CT-e');
    expect(meiFiscalDocumentTypeShortLabel(null)).toBe('—');
  });

  it('classes de badge', () => {
    expect(meiFiscalDocumentTypeBadgeClass('NFSE')).toBe('admin-badge-primary');
    expect(meiFiscalDocumentTypeBadgeClass('NFE')).toBe('admin-badge-warning');
    expect(meiFiscalDocumentTypeBadgeClass('NFCE')).toBe('admin-badge-success');
    expect(meiFiscalDocumentTypeBadgeClass('CTE')).toBe('admin-badge-neutral');
    expect(meiFiscalDocumentTypeBadgeClass(null)).toBe('admin-badge-neutral');
  });

  it('mensagens de lista vazia por filtro (UX §7.3)', () => {
    expect(meiFiscalListFilterEmptyMessage('NFSE')).toBe('Não há notas deste tipo no período visível.');
    expect(meiFiscalListFilterEmptyMessage('NFE')).toBe('Não há notas deste tipo no período visível.');
    expect(meiFiscalListFilterEmptyMessage('NFCE')).toBe('Não há notas deste tipo no período visível.');
    expect(meiFiscalListFilterEmptyMessage('all')).toContain('filtros');
  });
});
