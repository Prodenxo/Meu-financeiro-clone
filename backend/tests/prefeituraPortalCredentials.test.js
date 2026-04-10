import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPrefeituraPortalCredentialsPolicy,
  isPrefeituraLoginRequiredUpstreamMessage,
  PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE
} from '../src/services/plugnotas/prefeituraPortalCredentials.js';

test('bloqueia login/senha no payload antes da chamada canónica', () => {
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
    (err) =>
      err.status === 400
      && err.errors?.plugnotasCode === PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE
      && String(err.message).includes('não aceita credenciais')
  );
});

test('objecto só com codigoIbge passa', () => {
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

test('mesmo com campos vazios, a presença das chaves login/senha é bloqueada', () => {
  const payload = {
    nfse: {
      ativo: true,
      config: {
        producao: true,
        prefeitura: { codigoIbge: '3550308', login: '', senha: '   ' }
      }
    }
  };
  assert.throws(
    () => applyPrefeituraPortalCredentialsPolicy(payload),
    (err) => err.status === 400 && err.errors?.plugnotasCode === PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE
  );
});

test('classifica mensagem upstream de prefeitura.login obrigatório', () => {
  assert.equal(
    isPrefeituraLoginRequiredUpstreamMessage(
      'Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura.login: Preenchimento obrigatório'
    ),
    true
  );
});

test('não classifica mensagens sem exigência explícita de prefeitura.login/senha', () => {
  assert.equal(
    isPrefeituraLoginRequiredUpstreamMessage(
      'Falha na validação do JSON de Empresa: fields.endereco.logradouro: Preenchimento obrigatório'
    ),
    false
  );
});
