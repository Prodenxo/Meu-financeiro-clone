import * as scrumhubSupportService from '../services/scrumhub-support.service.js'
import { sendCreated, sendSuccess } from '../utils/response.js'

export const getTicketForm = async (_req, res, next) => {
  try {
    const data = await scrumhubSupportService.getTicketFormConfig()
    return sendSuccess(res, data)
  } catch (error) {
    return next(error)
  }
}

export const createTicket = async (req, res, next) => {
  try {
    const data = await scrumhubSupportService.createExternalTicket({
      body: req.body,
      files: req.files || [],
    })
    return sendCreated(res, data, data.message || 'Chamado criado')
  } catch (error) {
    return next(error)
  }
}
