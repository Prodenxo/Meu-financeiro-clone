import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateEmpresaCadastroMunicipioPreflight,
  resolveEmpresaCadastroMunicipioRuntimeDecision
} from '../src/services/plugnotas/empresa-cadastro-runtime-decision.js';

/**
 * Regressão FR-REC500 P2 — motor de decisão do preflight municipal.
 * Decisão de produto (PRD §18): `manter policy vigente` para `5002704` — não há ramo governado
 * «autorizado» no runtime até eventual `correcao controlada` + Epic 2.
 *
 * Estes testes fixam a semântica híbrida (`padraoNacionalEnabled` + `requiresLogin`/`requiresSenha`)
 * e a preservação da taxonomia `prefeitura_login_required_blocked` fora de qualquer override.
 */

const preflightFixture = (overrides = {}) => ({
  consulted: true,
  codigoIbge: '5002704',
  environment: 'producao',
  padraoNacionalEnabled: true,
  requiresLogin: false,
  requiresSenha: false,
  ...overrides
});

test('REC500 P2: preflight híbrido nacional+login → prefeitura_login_required_blocked; preserva padraoNacionalEnabled na decisão', () => {
  const d = evaluateEmpresaCadastroMunicipioPreflight(
    preflightFixture({ requiresLogin: true, requiresSenha: false })
  );
  assert.equal(d.scenario, 'prefeitura_login_required_blocked');
  assert.equal(d.padraoNacionalEnabled, true);
  assert.equal(d.requiresLogin, true);
  assert.equal(d.requiresSenha, false);
  assert.equal(d.upstreamCallSkipped, true);
});

test('REC500 P2: preflight híbrido nacional+senha → prefeitura_login_required_blocked', () => {
  const d = evaluateEmpresaCadastroMunicipioPreflight(
    preflightFixture({ requiresLogin: false, requiresSenha: true })
  );
  assert.equal(d.scenario, 'prefeitura_login_required_blocked');
  assert.equal(d.padraoNacionalEnabled, true);
});

test('REC500 P2: sem regra governada ativa — mesmo IBGE 5002704 permanece bloqueado no híbrido (ausência de override)', () => {
  const d = evaluateEmpresaCadastroMunicipioPreflight(
    preflightFixture({ requiresLogin: true })
  );
  assert.equal(d.scenario, 'prefeitura_login_required_blocked');
});

test('REC500 P2: outro município só com caminho nacional elegível → success_nacional (brownfield)', () => {
  const d = evaluateEmpresaCadastroMunicipioPreflight(
    preflightFixture({
      codigoIbge: '3106200',
      requiresLogin: false,
      requiresSenha: false
    })
  );
  assert.equal(d.scenario, 'success_nacional');
  assert.equal(d.upstreamCallSkipped, false);
});

test('REC500 P2: município fora do escopo REC500 com híbrido → mesmo bloqueio (policy global)', () => {
  const d = evaluateEmpresaCadastroMunicipioPreflight(
    preflightFixture({
      codigoIbge: '3550308',
      requiresLogin: true,
      padraoNacionalEnabled: true
    })
  );
  assert.equal(d.scenario, 'prefeitura_login_required_blocked');
});

const credVazia = {
  hasPartialKeys: false,
  hasNonEmptyCredentialPair: false,
  hasAnyPrefeituraCredentialKey: false
};

/**
 * FR-ALNFB Story 1.1 — matriz §12.2 / `resolveEmpresaCadastroMunicipioRuntimeDecision` (governança + flag).
 */
test('FR-ALNFB 1.1: auth municipal + flag off + sem credenciais → prefeitura_login_required_blocked', () => {
  const { allowUpstream, runtimeDecision } = resolveEmpresaCadastroMunicipioRuntimeDecision(
    preflightFixture({
      codigoIbge: '3550308',
      requiresLogin: true,
      padraoNacionalEnabled: true
    }),
    {
      prefeituraCredentialsEnabled: false,
      attemptNfseMode: 'nacional',
      credState: credVazia
    }
  );
  assert.equal(allowUpstream, false);
  assert.equal(runtimeDecision.scenario, 'prefeitura_login_required_blocked');
  assert.equal(runtimeDecision.upstreamCallSkipped, true);
  assert.equal(runtimeDecision.environment, 'producao');
});

test('FR-ALNFB 1.1: auth municipal + flag on + sem credenciais → prefeitura_login_required_fallback_available', () => {
  const { allowUpstream, runtimeDecision } = resolveEmpresaCadastroMunicipioRuntimeDecision(
    preflightFixture({
      codigoIbge: '3550308',
      requiresLogin: true,
      padraoNacionalEnabled: true
    }),
    {
      prefeituraCredentialsEnabled: true,
      attemptNfseMode: 'nacional',
      credState: credVazia
    }
  );
  assert.equal(allowUpstream, false);
  assert.equal(runtimeDecision.scenario, 'prefeitura_login_required_fallback_available');
  assert.equal(runtimeDecision.upstreamCallSkipped, true);
  assert.equal(runtimeDecision.consultedMunicipio, true);
  assert.equal(runtimeDecision.codigoIbge, '3550308');
});

test('FR-ALNFB 1.1: nacional puro + flag on → success_nacional (allowUpstream)', () => {
  const { allowUpstream, runtimeDecision } = resolveEmpresaCadastroMunicipioRuntimeDecision(
    preflightFixture({
      codigoIbge: '3106200',
      requiresLogin: false,
      requiresSenha: false,
      padraoNacionalEnabled: true
    }),
    {
      prefeituraCredentialsEnabled: true,
      attemptNfseMode: 'nacional',
      credState: credVazia
    }
  );
  assert.equal(allowUpstream, true);
  assert.equal(runtimeDecision.scenario, 'success_nacional');
  assert.equal(runtimeDecision.upstreamCallSkipped, false);
});

test('FR-ALNFB 1.1: prefeitura_ibge_apenas_insuficiente_dp02 não conflitua com fallback (sem auth explícita)', () => {
  const { allowUpstream, runtimeDecision } = resolveEmpresaCadastroMunicipioRuntimeDecision(
    preflightFixture({
      codigoIbge: '3106200',
      requiresLogin: false,
      requiresSenha: false,
      padraoNacionalEnabled: false
    }),
    {
      prefeituraCredentialsEnabled: true,
      attemptNfseMode: 'nacional',
      credState: credVazia
    }
  );
  assert.equal(allowUpstream, false);
  assert.equal(runtimeDecision.scenario, 'prefeitura_ibge_apenas_insuficiente_dp02');
});
