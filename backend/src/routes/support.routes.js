import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middlewares/auth.js'
import * as controller from '../controllers/support.controller.js'
import { MAX_ANEXO_BYTES } from '../services/scrumhub-support.service.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ANEXO_BYTES,
    files: 10,
  },
})

router.get('/ticket-form', requireAuth, controller.getTicketForm)
router.post(
  '/tickets',
  requireAuth,
  upload.array('anexos', 10),
  controller.createTicket,
)

export default router
