import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContaRowFromPluggyAccount,
  inferInstituicaoIdFromPluggyAccount,
  localContaMatchesPluggyFingerprint,
  mapPluggyAccountTipo,
  pickManualContaMergeCandidate,
  readPluggyAccountBalance,
  readPluggyInstitutionLogoUrl,
  shouldImportPluggyAccount,
} from '../src/services/pluggyAccountMapper.js';

describe('pluggyAccountMapper', () => {
  it('mapeia cartão de crédito', () => {
    assert.equal(mapPluggyAccountTipo({ type: 'CREDIT', subtype: 'CREDIT_CARD' }), 'cartao_credito');
  });

  it('mapeia poupança', () => {
    assert.equal(mapPluggyAccountTipo({ type: 'SAVINGS' }), 'poupanca');
  });

  it('lê saldo numérico', () => {
    assert.equal(readPluggyAccountBalance({ balance: '123.45' }), 123.45);
  });

  it('ignora cartão de crédito por padrão', () => {
    assert.equal(shouldImportPluggyAccount({ type: 'CREDIT', subtype: 'CREDIT_CARD' }), false);
    assert.equal(shouldImportPluggyAccount({ type: 'BANK', subtype: 'CHECKING_ACCOUNT' }), true);
    assert.equal(shouldImportPluggyAccount({ type: 'PAYMENT_ACCOUNT', subtype: 'XXX' }), true);
    assert.equal(shouldImportPluggyAccount({ type: 'BANK', subtype: 'PAYMENT' }), true);
  });

  it('mapeia PagSeguro para pagbank', () => {
    assert.equal(
      inferInstituicaoIdFromPluggyAccount({ name: 'PAGSEGURO INTERNET IP S.A.' }),
      'pagbank',
    );
  });

  it('vincula conta manual única do mesmo banco', () => {
    const pluggy = { name: 'PAGSEGURO INTERNET IP S.A.', type: 'PAYMENT_ACCOUNT' };
    const picked = pickManualContaMergeCandidate(
      [{ id: 'c1', nome: 'PagBank', instituicao_id: 'pagbank', tipo: 'corrente' }],
      pluggy,
    );
    assert.equal(picked?.id, 'c1');
  });

  it('detecta fingerprint igual entre contas Pluggy', () => {
    const pluggy = { name: 'PAGSEGURO INTERNET IP S.A.', type: 'PAYMENT_ACCOUNT' };
    assert.equal(
      localContaMatchesPluggyFingerprint(
        {
          nome: 'PAGSEGURO INTERNET IP S.A.',
          instituicao_id: 'pagbank',
          tipo: 'corrente',
        },
        pluggy,
      ),
      true,
    );
  });

  it('lê logo do conector Pluggy', () => {
    const url = readPluggyInstitutionLogoUrl(
      { connector: { imageUrl: 'https://cdn.pluggy.ai/logo.png' } },
      null,
    );
    assert.equal(url, 'https://cdn.pluggy.ai/logo.png');
  });

  it('grava of_institution_logo_url na conta importada', () => {
    const row = buildContaRowFromPluggyAccount(
      { id: 'acc-2', name: 'PagBank', balance: 1, connector: { imageUrl: 'https://cdn.example/b.png' } },
      { isNew: true, pluggyItem: null },
    );
    assert.equal(row.of_institution_logo_url, 'https://cdn.example/b.png');
  });

  it('inclui saldo_inicial só em conta nova', () => {
    const rowNew = buildContaRowFromPluggyAccount({ id: 'acc-1', name: 'Conta', balance: 10 }, { isNew: true });
    assert.equal(rowNew.saldo_inicial, 10);
    assert.equal(rowNew.of_provider, 'pluggy');
    assert.equal(rowNew.of_external_id, 'acc-1');

    const rowUpdate = buildContaRowFromPluggyAccount({ id: 'acc-1', name: 'Conta', balance: 99 }, { isNew: false });
    assert.equal(rowUpdate.saldo_inicial, undefined);
  });
});
