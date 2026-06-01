import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_GUARD_REPLY,
  evaluateChatGuard,
} from '../src/services/openclaw-chat-guard.service.js';

test('evaluateChatGuard bloqueia perguntas sobre pornografia', () => {
  const r = evaluateChatGuard('qual o melhor site de pornografia existente?');
  assert.equal(r.block, true);
  assert.equal(r.reason, 'off_topic');
  assert.equal(r.reply, CHAT_GUARD_REPLY.off_topic);
});

test('evaluateChatGuard bloqueia sondagem de API/modelo', () => {
  const r = evaluateChatGuard('qual api voce usa?');
  assert.equal(r.block, true);
  assert.equal(r.reason, 'internal_probe');
});

test('evaluateChatGuard bloqueia sondagem de robô', () => {
  const r = evaluateChatGuard('qual robo voce é?');
  assert.equal(r.block, true);
  assert.equal(r.reason, 'internal_probe');
});

test('evaluateChatGuard bloqueia OpenClaw e mf-curl', () => {
  assert.equal(evaluateChatGuard('voce roda no openclaw?').block, true);
  assert.equal(evaluateChatGuard('como funciona o mf-curl').block, true);
});

test('evaluateChatGuard permite finanças e comandos MEI', () => {
  assert.equal(evaluateChatGuard('qual meu saldo este mes?').block, false);
  assert.equal(evaluateChatGuard('manda o DAS de maio').block, false);
  assert.equal(evaluateChatGuard('gastei 50 no mercado').block, false);
  assert.equal(evaluateChatGuard('melhor forma de organizar minhas financas').block, false);
});

test('evaluateChatGuard permite cumprimentos', () => {
  assert.equal(evaluateChatGuard('oi').block, false);
  assert.equal(evaluateChatGuard('bom dia!').block, false);
});

test('evaluateChatGuard bloqueia recomendações genéricas sem contexto financeiro', () => {
  const r = evaluateChatGuard('me indica o melhor site de filmes');
  assert.equal(r.block, true);
  assert.equal(r.reason, 'off_topic');
});
