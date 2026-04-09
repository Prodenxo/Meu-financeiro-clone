import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPrefeituraPortalCredentialsPolicy,
  isPrefeituraPortalCredentialsEnabled
} from '../src/services/plugnotas/prefeituraPortalCredentials.js';

const orig = process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED;

test.afterEach(() => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = orig;
});

test('flag desligada — rejeita login/senha no payload', () => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = 'false';
  assert.equal(isPrefeituraPortalCredentialsEnabled(), false);
  const payload = {
    nfse: {
      ativo: true,
      config: {
        producao: true,
        prefeitura: { codigoIbge: '3550308', login: 'u', senha: 'p' }
      }
    }
  };
  assert.throws(
    () => applyPrefeituraPortalCredentialsPolicy(payload),
    (err) => err.status === 400 && String(err.message).includes('não está activo')
  );
});

test('flag desligada — objecto só com codigoIbge passa', () => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = 'false';
  const payload = {
    nfse: {
      ativo: true,
      config: {
        producao: true,
        prefeitura: { codigoIbge: '3550308' }
      }
    }
  };
  applyPrefeituraPortalCredentialsPolicy(payload);
  assert.deepEqual(payload.nfse.config.prefeitura, { codigoIbge: '3550308' });
});

test('flag ligada — merge e trim; preserva codigoIbge', () => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = 'true';
  const payload = {
    nfse: {
      ativo: true,
      config: {
        producao: true,
        prefeitura: { codigoIbge: '3550308', login: '  test-user  ', senha: '  test-pass  ' }
      }
    }
  };
  applyPrefeituraPortalCredentialsPolicy(payload);
  assert.deepEqual(payload.nfse.config.prefeitura, {
    codigoIbge: '3550308',
    login: 'test-user',
    senha: 'test-pass'
  });
});

test('flag ligada — só login preenchido falha', () => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = 'true';
  const payload = {
    nfse: { ativo: true, config: { producao: true, prefeitura: { login: 'x' } } }
  };
  assert.throws(
    () => applyPrefeituraPortalCredentialsPolicy(payload),
    (err) => err.status === 400 && String(err.message).includes('conjunto')
  );
});

test('flag ligada — login e senha vazios remove campos', () => {
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED = 'true';
  const payload = {
    nfse: {
      ativo: true,
      config: { producao: true, prefeitura: { codigoIbge: '3550308', login: '', senha: '   ' } }
    }
  };
  applyPrefeituraPortalCredentialsPolicy(payload);
  assert.deepEqual(payload.nfse.config.prefeitura, { codigoIbge: '3550308' });
});
