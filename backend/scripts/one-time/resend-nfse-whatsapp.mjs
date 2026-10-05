#!/usr/bin/env node
/**
 * Força reenvio do PDF NFSe via Z-API e imprime o resultado real.
 *
 * Uso:
 *   node scripts/one-time/resend-nfse-whatsapp.mjs --nota-id=<uuid>
 *   node scripts/one-time/resend-nfse-whatsapp.mjs --nota-id=<uuid> --phone=5521983992146
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchOpenclawNfsePdfBase64 } from '../../src/services/openclaw-nfse.service.js'
import { sendWhatsappMessage, isWhatsappOutboundConfigured, getWhatsappOutboundChannel } from '../../src/services/whatsapp-outbound.service.js'
import { isZapiOutboundConfigured } from '../../src/services/zapi-outbound.service.js'
import { env } from '../../src/config/env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../../.env') })

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const i = a.indexOf('=')
    if (!a.startsWith('--')) return [a, true]
    if (i === -1) return [a.slice(2), true]
    return [a.slice(2, i), a.slice(i + 1)]
  }),
)

const notaId = String(args['nota-id'] || args.notaId || '5bb21629-028f-48b1-beb2-6cf4e82cfa61').trim()
const phoneOverride = args.phone ? String(args.phone).replace(/\D/g, '') : null

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

console.log('channel', getWhatsappOutboundChannel())
console.log('outboundConfigured', isWhatsappOutboundConfigured())
console.log('zapiConfigured', isZapiOutboundConfigured())
console.log('zapiInstance', Boolean((env.ZAPI_INSTANCE_ID || '').trim()))
console.log('notaId', notaId)

const { data: row, error } = await admin
  .from('mei_nfse')
  .select('id, user_id, status, pdf_url, plugnotas_id, metadata_json')
  .eq('id', notaId)
  .maybeSingle()

if (error) throw new Error(error.message)
if (!row) throw new Error('Nota não encontrada')

const meta = row.metadata_json && typeof row.metadata_json === 'object' ? { ...row.metadata_json } : {}
const phone = phoneOverride || String(meta.openclawWhatsappPhone || '').replace(/\D/g, '')
if (!phone) throw new Error('Telefone ausente — passe --phone=55...')

console.log({
  userId: row.user_id,
  status: row.status,
  plugnotas_id: row.plugnotas_id,
  hasPdfUrl: Boolean(row.pdf_url),
  phone,
  previousSentAt: meta.openclawWhatsappPdfSentAt || null,
  previousChannel: meta.openclawWhatsappPdfSentChannel || null,
})

// Limpa sentAt para permitir novo claim/envio
delete meta.openclawWhatsappPdfSentAt
delete meta.openclawWhatsappPdfSentChannel
meta.openclawWhatsappPdfPending = true
meta.openclawWhatsappPdfSendingAt = null
meta.openclawWhatsappPdfLastError = null
meta.openclawWhatsappPhone = phone
meta.openclawWhatsappPdfRequestedAt = new Date().toISOString()

const { error: upErr } = await admin
  .from('mei_nfse')
  .update({ metadata_json: meta, updated_at: new Date().toISOString() })
  .eq('id', notaId)
  .eq('user_id', row.user_id)
if (upErr) throw new Error(upErr.message)
console.log('metadata reset OK')

console.log('baixando PDF…')
const pdf = await fetchOpenclawNfsePdfBase64(row.user_id, { id: notaId, sync: true })
console.log('pdf', {
  fileName: pdf.fileName,
  base64Len: String(pdf.base64 || '').length,
  mimeType: pdf.mimeType,
  status: pdf.nota?.status,
})

console.log('enviando Z-API…')
try {
  const result = await sendWhatsappMessage({
    phone,
    pdfBase64: pdf.base64,
    fileName: pdf.fileName,
    message: 'Segue a NFSe emitida (reenvio).',
    source: 'manual_resend_script',
    userId: row.user_id,
    notaId,
  })
  console.log('ZAPI_RESULT', JSON.stringify(result, null, 2))

  meta.openclawWhatsappPdfPending = false
  meta.openclawWhatsappPdfSentAt = new Date().toISOString()
  meta.openclawWhatsappPdfSentChannel = result?.channel || 'zapi'
  meta.openclawWhatsappPdfLastError = null
  meta.openclawWhatsappPdfSendingAt = null
  meta.openclawWhatsappPdfLastResendAt = new Date().toISOString()
  meta.openclawWhatsappPdfLastZapiBody = result?.body ?? null
  await admin
    .from('mei_nfse')
    .update({ metadata_json: meta, updated_at: new Date().toISOString() })
    .eq('id', notaId)
    .eq('user_id', row.user_id)

  console.log('REENVIO_OK — confira o WhatsApp do celular agora.')
} catch (err) {
  console.error('REENVIO_FAIL', err?.message || err)
  meta.openclawWhatsappPdfLastError = String(err?.message || err).slice(0, 500)
  meta.openclawWhatsappPdfPending = true
  meta.openclawWhatsappPdfSendingAt = null
  await admin
    .from('mei_nfse')
    .update({ metadata_json: meta, updated_at: new Date().toISOString() })
    .eq('id', notaId)
    .eq('user_id', row.user_id)
  process.exit(1)
}
