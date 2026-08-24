import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SCRUMHUB_TICKET_SLUG = 'meu-financeiro'
process.env.SCRUMHUB_PUBLIC_ORIGIN = 'https://scrumhub.example.test'
process.env.SCRUMHUB_API_BASE_URL = 'https://scrumhub-backend.example.test'
process.env.SCRUMHUB_API_KEY = 'server-side-key'

const service = await import('../src/services/scrumhub-support.service.js')

test('getTicketFormConfig usa origem pública e não expõe api_key', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url) => {
    assert.match(String(url), /^https:\/\/scrumhub\.example\.test\/public\/formulario-config\/slug\/meu-financeiro$/)
    return new Response(JSON.stringify({
      success: true,
      data: {
        projeto: { nome: 'Meu Financeiro', empresa_nome: 'Foco MEI' },
        formulario: { campos: [] },
        api_key: 'secret-should-not-leak',
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const config = await service.getTicketFormConfig()
    assert.equal(config.slug, 'meu-financeiro')
    assert.equal(config.projeto.nome, 'Meu Financeiro')
    assert.equal(config.formulario.campos.length, 0)
    assert.equal('api_key' in config, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('createExternalTicket valida assunto obrigatório', async () => {
  await assert.rejects(
    () => service.createExternalTicket({ body: { prioridade: 'media', prazo: '2026-08-31' } }),
    (error) => {
      assert.equal(error.status, 400)
      assert.match(error.message, /Assunto/i)
      return true
    },
  )
})

test('createExternalTicket envia POST para API base com X-API-Key', async () => {
  const originalFetch = globalThis.fetch
  let capturedUrl = ''
  let capturedHeaders = null

  globalThis.fetch = async (url, options = {}) => {
    capturedUrl = String(url)
    capturedHeaders = options.headers
    return new Response(JSON.stringify({
      success: true,
      message: 'ok',
      data: { ticket: { id: 1, nome: 'Teste' }, url: 'https://scrumhub.com.br/ticket/1' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const result = await service.createExternalTicket({
      body: {
        nome: 'Assunto teste',
        prioridade: 'alta',
        prazo: '2026-09-01',
        descricao: 'Detalhe',
      },
    })
    assert.equal(capturedUrl, 'https://scrumhub-backend.example.test/public/tickets')
    assert.equal(capturedHeaders['X-API-Key'], 'server-side-key')
    assert.equal(result.ticket.id, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
