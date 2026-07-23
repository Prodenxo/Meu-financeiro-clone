import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isContaGlobalIntentFromUserText,
  isContaGlobalIntentPayload,
} from '../src/services/openclaw-conta-global-intent-guard.js'

test('R$ com banco BR NÃO é Conta Global (falso positivo histórico)', () => {
  assert.equal(
    isContaGlobalIntentFromUserText('Recebimento de R$ 0,29 na conta C6 Bank.'),
    false,
  )
  assert.equal(
    isContaGlobalIntentFromUserText('R$ 50 no Nubank'),
    false,
  )
  assert.equal(
    isContaGlobalIntentFromUserText(
      'um recebimento de vinte e nove centavos no C6 Bank',
    ),
    false,
  )
})

test('payload create_transaction com obs R$ + C6 NÃO redireciona Conta Global', () => {
  assert.equal(
    isContaGlobalIntentPayload({
      tipo: 'entrada',
      valor: 0.29,
      classificacao: 'Recebimento',
      status: 'recebido',
      obs: 'Recebimento de R$ 0,29 na conta C6 Bank.',
    }),
    false,
  )
})

test('dólar / US$ / $ ainda são Conta Global', () => {
  assert.equal(isContaGlobalIntentFromUserText('ganhei 100 dolares'), true)
  assert.equal(isContaGlobalIntentFromUserText('US$ 50'), true)
  assert.equal(isContaGlobalIntentFromUserText('$ 50'), true)
  assert.equal(isContaGlobalIntentFromUserText('adiciona 20 euros na conta global'), true)
})
