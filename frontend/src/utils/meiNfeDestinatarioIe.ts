/** Situação de Inscrição Estadual do destinatário (tag SEFAZ indIEDest). */

export type DestinatarioIndIeDest = '1' | '2' | '9'

export const DEFAULT_DESTINATARIO_IND_IE_DEST: DestinatarioIndIeDest = '9'

/** Texto de ajuda na secção de IE do destinatário (não confundir com IE do emitente MEI). */
export const DESTINATARIO_IE_SECTION_HINT =
  'IE do cliente (destinatário), não a IE do seu MEI. Condomínios e consumidores = não contribuinte.'

export const DESTINATARIO_IE_OPTIONS: ReadonlyArray<{
  value: DestinatarioIndIeDest
  label: string
  hint: string
}> = [
  {
    value: '9',
    label: 'Não contribuinte',
    hint: 'Consumidor, condomínio ou pessoa física — não use a IE do seu MEI aqui',
  },
  {
    value: '2',
    label: 'Isento de IE',
    hint: 'Pessoa jurídica isenta de Inscrição Estadual do cliente',
  },
  {
    value: '1',
    label: 'Contribuinte ICMS',
    hint: 'Informe a IE do destinatário (cliente) — não a IE do emitente',
  },
]

export function normalizeDestinatarioIndIeDest(value: unknown): DestinatarioIndIeDest {
  const raw = String(value ?? '').trim()
  if (raw === '1' || raw === '2' || raw === '9') return raw
  return DEFAULT_DESTINATARIO_IND_IE_DEST
}

export function buildDestinatarioIePayload(
  indIEDest: DestinatarioIndIeDest,
  inscricaoEstadual?: string,
): { indIEDest: DestinatarioIndIeDest; inscricaoEstadual?: string } {
  if (indIEDest === '1') {
    const ie = String(inscricaoEstadual ?? '').trim().replace(/\D/g, '')
    return ie ? { indIEDest, inscricaoEstadual: ie } : { indIEDest }
  }
  return { indIEDest }
}

export function getDestinatarioIeValidationMessage(
  indIEDest: DestinatarioIndIeDest,
  inscricaoEstadual: string,
  label = 'NF-e',
): string | null {
  if (indIEDest !== '1') return null
  const ie = String(inscricaoEstadual ?? '').trim().replace(/\D/g, '')
  if (!ie) {
    return `Informe a Inscrição Estadual do destinatário da ${label} (contribuinte ICMS).`
  }
  return null
}
