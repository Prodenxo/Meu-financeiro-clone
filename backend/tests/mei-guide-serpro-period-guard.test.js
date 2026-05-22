import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSerproDasPeriodoDisponivel,
  isPeriodoIndisponivelSerproMessage,
  MEI_DAS_PERIODO_INDISPONIVEL_CODE
} from '../src/services/mei-guide-serpro-period-guard.js';

test('detecta contribuinte não optante (MSG_23008)', () => {
  assert.equal(
    isPeriodoIndisponivelSerproMessage('Contribuinte não optante pelo SIMEI'),
    true
  );
  assert.equal(
    isPeriodoIndisponivelSerproMessage('[EntradaIncorreta-PGMEI-MSG_23008]'),
    true
  );
});

test('assertSerproDasPeriodoDisponivel lança 400 com código MEI_DAS_PERIODO_INDISPONIVEL', () => {
  assert.throws(
    () => assertSerproDasPeriodoDisponivel({
      raw: {
        mensagens: ['[EntradaIncorreta-PGMEI-MSG_23008] Contribuinte não optante pelo SIMEI']
      }
    }, '02/2026'),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.errors?.code, MEI_DAS_PERIODO_INDISPONIVEL_CODE);
      assert.match(String(err.message), /n[aã]o era optante/i);
      return true;
    }
  );
});
