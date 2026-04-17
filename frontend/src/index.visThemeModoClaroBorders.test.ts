// @vitest-environment node
/**
 * Contrato STORY-VIS-THEME-04: no tema claro, contornos exteriores das superfícies planner/admin
 * listadas alinham-se a `--color-surface-border` (via Tailwind arbitrary `border-[color:rgb(var(...))]`).
 *
 * Extração de blocos por profundidade de chavetas — robusta a `@apply` ou comentários multilinha
 * (mitigação ao review QA: regex `[^}]*` falhava se existisse `}` dentro do bloco, ex. comentário raro).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexCss = readFileSync(join(__dirname, 'index.css'), 'utf8');

const BORDER_TOKEN =
  'border-[color:rgb(var(--color-surface-border))]';

describe('index.css — STORY-VIS-THEME-04 (modo claro — bordas token)', () => {
  it('.planner-surface aplica borda token no claro', () => {
    const body = extractRuleBody(indexCss, '.planner-surface');
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain(BORDER_TOKEN);
  });

  it('.planner-card herda .planner-surface (FR-VIS-THEME-04 paridade)', () => {
    const body = extractRuleBody(indexCss, '.planner-card');
    expect(body).toMatch(/@apply\s+planner-surface/);
  });

  it('.admin-hero e .admin-section-card usam planner-card (borda via herança)', () => {
    for (const sel of ['.admin-hero', '.admin-section-card']) {
      const body = extractRuleBody(indexCss, sel);
      expect(body.length, sel).toBeGreaterThan(0);
      expect(body, sel).toMatch(/@apply\s+planner-card/);
    }
  });

  it('.planner-card-muted aplica borda token', () => {
    const body = extractRuleBody(indexCss, '.planner-card-muted');
    expect(body).toContain(BORDER_TOKEN);
  });

  it('.planner-button-secondary aplica borda token (FR-VIS-THEME-07 base)', () => {
    const body = extractRuleBody(indexCss, '.planner-button-secondary');
    expect(body).toContain(BORDER_TOKEN);
  });

  it('.planner-button-secondary-compact herda secundário', () => {
    const body = extractRuleBody(indexCss, '.planner-button-secondary-compact');
    expect(body).toMatch(/@apply\s+planner-button-secondary/);
  });

  it.each([
    ['.admin-stat-card', BORDER_TOKEN],
    ['.admin-toolbar', BORDER_TOKEN],
    ['.admin-table-shell', BORDER_TOKEN],
    ['.admin-table-row', 'border-t border-[color:rgb(var(--color-surface-border))]']
  ] as const)('%s — contorno coerente com token no claro', (selector, needle) => {
    const body = extractRuleBody(indexCss, selector);
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain(needle);
  });

  it('.admin-empty-state: tracejado + token (NFR-VIS-THEME-02)', () => {
    const body = extractRuleBody(indexCss, '.admin-empty-state');
    expect(body).toContain('border-dashed');
    expect(body).toContain(BORDER_TOKEN);
  });
});

/**
 * Corpo do primeiro bloco `selector { ... }` no CSS (profundidade de chavetas).
 * `selector` deve incluir o ponto (ex.: `.planner-surface`).
 */
function extractRuleBody(css: string, selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc}\\s*\\{`);
  const m = re.exec(css);
  if (!m || m.index === undefined) return '';
  let pos = m.index + m[0].length;
  let depth = 1;
  const start = pos;
  while (pos < css.length && depth > 0) {
    const c = css[pos];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    pos++;
  }
  return css.slice(start, pos - 1);
}
