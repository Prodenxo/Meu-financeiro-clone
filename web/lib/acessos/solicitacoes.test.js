import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSolicitacoesHref,
  canReviewAccessRequests,
  empresaDocLabel,
  formatAccessRequestError,
  formatEmpresaDoc,
  isStaleRequestError,
  normalizeHistory,
  normalizePendingList,
  parseSolicitacoesParams,
  requesterName,
} from './solicitacoes.js';

test('só o superadmin analisa solicitações', () => {
  assert.equal(canReviewAccessRequests('superadmin'), true);
  for (const role of ['admin', 'usuario', 'outsider', null, undefined, 'Superadmin ']) {
    assert.equal(canReviewAccessRequests(role), false);
  }
});

test('aba padrão é Pendentes e valores estranhos caem nela', () => {
  assert.deepEqual(parseSolicitacoesParams({}), { aba: 'pendentes' });
  assert.deepEqual(parseSolicitacoesParams({ aba: 'historico' }), { aba: 'historico' });
  assert.deepEqual(parseSolicitacoesParams({ aba: 'x' }), { aba: 'pendentes' });
  assert.equal(buildSolicitacoesHref({ aba: 'pendentes' }), '/configuracoes/solicitacoes');
  assert.equal(buildSolicitacoesHref({ aba: 'historico' }), '/configuracoes/solicitacoes?aba=historico');
});

test('CPF e CNPJ formatados como no app atual', () => {
  assert.equal(formatEmpresaDoc('12345678000190'), '12.345.678/0001-90');
  assert.equal(formatEmpresaDoc('12345678909'), '123.456.789-09');
  assert.equal(formatEmpresaDoc(null), '—');
  assert.equal(empresaDocLabel('12345678909'), 'CPF');
  assert.equal(empresaDocLabel('12345678000190'), 'CNPJ');
});

test('pendentes: descarta sem id e ordena do mais recente, com desempate estável', () => {
  const list = normalizePendingList([
    { userId: 'b', email: 'b@x.com', requestedAt: '2026-09-01T10:00:00Z', empresa: { nome: 'B' } },
    { userId: '', email: 'sem-id@x.com' },
    { userId: 'a', email: 'a@x.com', requestedAt: '2026-09-01T10:00:00Z' },
    { userId: 'c', email: 'c@x.com', requestedAt: '2026-09-20T10:00:00Z' },
  ]);
  assert.deepEqual(list.map((r) => r.userId), ['c', 'a', 'b']);
  assert.equal(list[2].empresa.nome, 'B');
  assert.equal(list[1].empresa.nome, null);
});

test('histórico: só aprovados mostram aprovador e data de aprovação', () => {
  const [first, second] = normalizeHistory([
    { id: '1', eventType: 'submitted', occurredAt: '2026-09-01T00:00:00Z', actorEmail: 'x@x.com', approvedAt: '2026-09-02' },
    { id: '2', eventType: 'approved', occurredAt: '2026-09-05T00:00:00Z', actorEmail: 'root@x.com', approvedAt: '2026-09-05T00:00:00Z' },
  ]);
  assert.equal(first.id, '2');
  assert.equal(first.actorEmail, 'root@x.com');
  assert.equal(second.actorEmail, null);
  assert.equal(second.approvedAt, null);
});

test('nome do solicitante cai para o e-mail', () => {
  assert.equal(requesterName({ fullName: null, email: 'a@x.com' }), 'a@x.com');
  assert.equal(requesterName({}), 'Sem nome');
});

test('erros traduzidos e pedido já tratado reconhecido', () => {
  assert.match(formatAccessRequestError('Solicitação não encontrada ou já processada.'), /já foi analisada/);
  assert.equal(isStaleRequestError('Solicitação não encontrada ou já processada.'), true);
  assert.match(formatAccessRequestError('Apenas superadmin.'), /superadmin/);
  assert.match(formatAccessRequestError('fetch failed'), /servidor/);
  assert.equal(formatAccessRequestError(''), 'Não foi possível concluir a operação.');
});
