import { env } from '../config/env.js'

const PRIORIDADES = new Set(['baixa', 'media', 'alta', 'critica'])
const MAX_ANEXO_BYTES = 50 * 1024 * 1024

const buildPublicOrigin = () =>
  String(env.SCRUMHUB_PUBLIC_ORIGIN || 'https://scrumhub.com.br').trim().replace(/\/$/, '')

const buildApiBase = () => String(env.SCRUMHUB_API_BASE_URL || '').trim().replace(/\/$/, '')

const buildFormConfigUrl = (slug) =>
  `${buildPublicOrigin()}/public/formulario-config/slug/${encodeURIComponent(slug)}`

/** Cache em memória da API key obtida via slug (quando SCRUMHUB_API_KEY não está no env). */
let cachedApiKeyFromSlug = ''

const fetchFormConfigPayload = async (slug) => {
  const response = await fetch(buildFormConfigUrl(slug))
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw Object.assign(
      new Error(payload?.error || 'Erro ao carregar configuração do ScrumHub.'),
      { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
    )
  }
  return payload
}

const resolveApiKey = async () => {
  const fromEnv = String(env.SCRUMHUB_API_KEY || '').trim()
  if (fromEnv) return fromEnv

  if (cachedApiKeyFromSlug) return cachedApiKeyFromSlug

  const slug = assertFormConfigured()
  const payload = await fetchFormConfigPayload(slug)
  const apiKey = String(payload?.data?.api_key || '').trim()
  if (!apiKey) {
    throw Object.assign(new Error('ScrumHub não retornou API Key para o slug informado.'), { status: 502 })
  }

  cachedApiKeyFromSlug = apiKey
  return apiKey
}

const assertFormConfigured = () => {
  const slug = String(env.SCRUMHUB_TICKET_SLUG || '').trim()
  if (!slug) {
    throw Object.assign(new Error('Integração ScrumHub não configurada (SCRUMHUB_TICKET_SLUG).'), { status: 503 })
  }
  return slug
}

const assertTicketsConfigured = () => {
  const slug = assertFormConfigured()
  const base = buildApiBase()
  if (!base) {
    throw Object.assign(new Error('Integração ScrumHub não configurada (SCRUMHUB_API_BASE_URL).'), { status: 503 })
  }
  return { slug, base }
}

export const getTicketFormConfig = async () => {
  const slug = assertFormConfigured()
  const payload = await fetchFormConfigPayload(slug)
  const data = payload?.data || {}

  return {
    slug,
    projeto: data.projeto || { nome: 'Meu Financeiro' },
    formulario: data.formulario || {},
  }
}

const normalizePrazo = (value) => {
  const raw = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw Object.assign(new Error('Prazo inválido. Use o formato AAAA-MM-DD.'), { status: 400 })
  }
  return raw
}

const normalizePrioridade = (value) => {
  const prioridade = String(value || 'media').trim().toLowerCase()
  if (!PRIORIDADES.has(prioridade)) {
    throw Object.assign(
      new Error('Prioridade inválida. Use: baixa, media, alta ou critica.'),
      { status: 400 },
    )
  }
  return prioridade
}

const appendAnexos = (formData, files = []) => {
  for (const file of files) {
    if (!file?.buffer?.length) continue
    if (file.size > MAX_ANEXO_BYTES) {
      throw Object.assign(
        new Error(`Anexo "${file.originalname || 'arquivo'}" excede 50MB.`),
        { status: 400 },
      )
    }
    const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' })
    formData.append('anexos', blob, file.originalname || 'anexo')
  }
}

export const createExternalTicket = async ({ body, files = [] }) => {
  const { base } = assertTicketsConfigured()
  const apiKey = await resolveApiKey()

  const nome = String(body?.nome || '').trim()
  if (!nome) {
    throw Object.assign(new Error('Assunto é obrigatório.'), { status: 400 })
  }

  const prioridade = normalizePrioridade(body?.prioridade)
  const prazo = normalizePrazo(body?.prazo)

  const formData = new FormData()
  formData.append('nome', nome)
  formData.append('prioridade', prioridade)
  formData.append('prazo', prazo)

  const descricao = String(body?.descricao || '').trim()
  if (descricao) formData.append('descricao', descricao)

  const nomeSolicitante = String(body?.nome_solicitante || '').trim()
  if (nomeSolicitante) formData.append('nome_solicitante', nomeSolicitante)

  const emailSolicitante = String(body?.email_solicitante || '').trim()
  if (emailSolicitante) formData.append('email_solicitante', emailSolicitante)

  const contatoSolicitante = String(body?.contato_solicitante || '').trim()
  if (contatoSolicitante) formData.append('contato_solicitante', contatoSolicitante)

  appendAnexos(formData, files)

  const response = await fetch(`${base}/public/tickets`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: formData,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.success === false) {
    throw Object.assign(
      new Error(payload?.error || payload?.message || 'Erro ao criar chamado no ScrumHub.'),
      { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
    )
  }

  const ticket = payload?.data?.ticket || payload?.data || null
  return {
    ticket,
    url: payload?.data?.url || ticket?.url || null,
    status: payload?.data?.status || null,
    message: payload?.message || payload?.data?.message || 'Chamado criado com sucesso.',
  }
}

export { PRIORIDADES, MAX_ANEXO_BYTES }
