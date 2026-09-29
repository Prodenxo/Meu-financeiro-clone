import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanPhone,
  getPasswordStrength,
  inviteStatusUserMessage,
  isValidCnpjDigits,
  isValidCpfDigits,
  maskCnpj,
  maskCpf,
  strongPasswordRules,
  validatePasswordMatch,
  validateRecoveryPassword,
  validateStrongPassword,
} from './validation.js';

describe('senha forte (cadastro)', () => {
  it('exige 8+ caracteres, maiúscula e especial', () => {
    assert.equal(validateStrongPassword('').ok, false);
    assert.match(validateStrongPassword('Ab!1').message, /mínimo 8/);
    assert.match(validateStrongPassword('abcdefg!').message, /maiúscula/);
    assert.match(validateStrongPassword('Abcdefgh').message, /especial/);
    assert.deepEqual(validateStrongPassword('Abcdefg!'), { ok: true });
    assert.equal(validateStrongPassword(`A!${'a'.repeat(127)}`).ok, false);
  });

  it('regras ao vivo seguem os mesmos critérios', () => {
    assert.deepEqual(
      strongPasswordRules('Abcdefg!').map((r) => r.ok),
      [true, true, true],
    );
    assert.deepEqual(
      strongPasswordRules('abc').map((r) => r.ok),
      [false, false, false],
    );
  });
});

describe('senha de recuperação', () => {
  it('exige 8+ caracteres com letra e número', () => {
    assert.equal(validateRecoveryPassword(''), 'Informe uma senha.');
    assert.ok(validateRecoveryPassword('abcdefgh'));
    assert.equal(validateRecoveryPassword('abcdefg1'), null);
    assert.equal(getPasswordStrength('Abcdef1!').level, 'strong');
    assert.equal(getPasswordStrength('abcdefg1').level, 'medium');
  });

  it('confere a confirmação', () => {
    assert.equal(validatePasswordMatch('a', ''), 'Confirme a nova senha.');
    assert.equal(validatePasswordMatch('a', 'b'), 'As senhas não coincidem.');
    assert.equal(validatePasswordMatch('a', 'a'), null);
  });
});

describe('documentos e telefone', () => {
  it('valida dígitos verificadores de CPF e CNPJ', () => {
    assert.equal(isValidCpfDigits('52998224725'), true);
    assert.equal(isValidCpfDigits('52998224724'), false);
    assert.equal(isValidCpfDigits('11111111111'), false);
    assert.equal(isValidCnpjDigits('11222333000181'), true);
    assert.equal(isValidCnpjDigits('11222333000180'), false);
  });

  it('aplica máscaras progressivas', () => {
    assert.equal(maskCnpj('11222333000181'), '11.222.333/0001-81');
    assert.equal(maskCnpj('11222'), '11.222');
    assert.equal(maskCpf('52998224725'), '529.982.247-25');
  });

  it('normaliza telefone com DDI 55', () => {
    assert.equal(cleanPhone('(11) 99999-9999'), '5511999999999');
    assert.equal(cleanPhone('5511999999999'), '5511999999999');
    assert.equal(cleanPhone(''), null);
  });

  it('traduz o status do convite', () => {
    assert.equal(inviteStatusUserMessage('expired'), 'Este convite expirou. Peça um novo link ao administrador.');
    assert.equal(inviteStatusUserMessage('network_error'), 'Não foi possível verificar o convite. Tente novamente.');
  });
});
