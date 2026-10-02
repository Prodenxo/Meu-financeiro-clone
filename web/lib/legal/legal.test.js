import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { privacyDocument } from './privacy.js';
import { termsDocument } from './terms.js';

describe('documentos legais (paridade com frontend/public/*.html)', () => {
  it('termos: data e seções principais', () => {
    assert.equal(termsDocument.updatedLabel, '19 de maio de 2026');
    assert.equal(termsDocument.sections.length, 8);
    assert.deepEqual(
      termsDocument.sections.map((s) => s.title),
      [
        'O serviço',
        'Sua conta',
        'Integrações de terceiros',
        'Conteúdo e propriedade',
        'Limitações importantes',
        'Suspensão e encerramento',
        'Alterações',
        'Contato',
      ],
    );
  });

  it('privacidade: data, Google Agenda e subseções', () => {
    assert.equal(privacyDocument.updatedLabel, '15 de junho de 2026');
    const titles = privacyDocument.sections.map((s) => s.title);
    assert.ok(titles.includes('Google Agenda (opcional)'));
    assert.ok(titles.includes('Dados do Google que coletamos'));
    assert.ok(titles.includes('Com quem compartilhamos, transferimos ou divulgamos dados do Google'));
    assert.ok(titles.includes('Proteção e retenção dos dados do Google'));
    assert.ok(titles.includes('Parceiros de infraestrutura (dados gerais)'));
  });

  it('cada seção tem id único', () => {
    for (const doc of [termsDocument, privacyDocument]) {
      const ids = doc.sections.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length);
    }
  });
});
