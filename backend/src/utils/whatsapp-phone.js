/**
 * Telefone vindo do WhatsApp / Z-API / perfil: parte antes de @, só dígitos.
 * Usar em `n8n_link.user_number` e no lookup Hermes para bater sempre igual.
 */
export const normalizeWhatsappPhoneDigits = (raw) => {
  if (raw === null || raw === undefined) return '';
  const beforeAt = String(raw).split('@')[0];
  return beforeAt.replace(/\D/g, '');
};
