// @vitest-environment node
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Contrato STORY-VIS-THEME-02 (Opção A): contornos neutros via `.ui-border-section`;
// não reintroduzir classes border-slate com opacidade (ex.: border-slate-200/80).
const src = readFileSync(join(__dirname, 'GuidesMei.tsx'), 'utf8');
const indexCss = readFileSync(join(__dirname, '..', 'index.css'), 'utf8');

describe('GuidesMei — STORY-VIS-THEME-02 (divisórias neutras)', () => {
  it('index.css define .ui-border-section com par canónico §5.1', () => {
    expect(indexCss).toMatch(/\.ui-border-section\s*\{/);
    expect(indexCss).toMatch(/border-slate-200/);
    expect(indexCss).toMatch(/dark:border-slate-700/);
  });

  it('mantém usos de ui-border-section (par §5.1 via index.css)', () => {
    const n = (src.match(/ui-border-section/g) ?? []).length;
    expect(n).toBeGreaterThanOrEqual(11);
  });

  it('não reintroduz bordas slate neutras com opacidade (varredura Opção A)', () => {
    const legacy = [
      /border-slate-200\/[0-9]/,
      /border-slate-300\/[0-9]/,
      /dark:border-slate-600\/[0-9]/,
      /dark:border-slate-700\/[0-9]/
    ];
    for (const rx of legacy) {
      expect(src).not.toMatch(rx);
    }
  });
});
