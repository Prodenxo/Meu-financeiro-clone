import { apiClient } from '../lib/apiClient'

export type SupportTicketPriority = 'baixa' | 'media' | 'alta' | 'critica'

export interface SupportTicketProject {
  nome: string
  empresa_nome?: string
}

export interface SupportTicketFormConfig {
  slug: string
  projeto: SupportTicketProject
  formulario: Record<string, unknown>
}

export interface SupportTicketAttachment {
  uri: string
  name: string
  type?: string
}

export interface CreateSupportTicketInput {
  nome: string
  descricao?: string
  prioridade: SupportTicketPriority
  prazo: string
  nome_solicitante?: string
  email_solicitante?: string
  contato_solicitante?: string
}

export interface CreateSupportTicketResult {
  ticket?: Record<string, unknown> | null
  url?: string | null
  status?: string | null
  message?: string
}

export function defaultSupportTicketPrazo(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export async function fetchSupportTicketForm(): Promise<SupportTicketFormConfig> {
  return apiClient.get<SupportTicketFormConfig>('/support/ticket-form')
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
  attachments: SupportTicketAttachment[] = [],
): Promise<CreateSupportTicketResult> {
  const formData = new FormData()
  formData.append('nome', input.nome.trim())
  formData.append('prioridade', input.prioridade)
  formData.append('prazo', input.prazo)

  const descricao = input.descricao?.trim()
  if (descricao) formData.append('descricao', descricao)

  const nomeSolicitante = input.nome_solicitante?.trim()
  if (nomeSolicitante) formData.append('nome_solicitante', nomeSolicitante)

  const emailSolicitante = input.email_solicitante?.trim()
  if (emailSolicitante) formData.append('email_solicitante', emailSolicitante)

  const contatoSolicitante = input.contato_solicitante?.trim()
  if (contatoSolicitante) formData.append('contato_solicitante', contatoSolicitante)

  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'
  for (const file of attachments) {
    const mimeType = file.type || 'application/octet-stream'
    if (isWeb) {
      const response = await fetch(file.uri)
      const blob = await response.blob()
      const fileBlob = new File([blob], file.name, { type: mimeType })
      formData.append('anexos', fileBlob)
    } else {
      // @ts-expect-error React Native FormData aceita { uri, name, type }
      formData.append('anexos', { uri: file.uri, name: file.name, type: mimeType })
    }
  }

  return apiClient.postForm<CreateSupportTicketResult>('/support/tickets', formData)
}
