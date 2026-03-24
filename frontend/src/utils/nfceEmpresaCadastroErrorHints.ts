/**
 * US-NFCE-EMP-03: quando oferecer copy/link para troubleshooting NFC-e no cadastro.
 * Heurística simples (sem reparsear JSON) — o backend já consolidou texto em `message`/`details`.
 */
export function shouldOfferNfceCadastroDocHint(message: string): boolean {
  const m = String(message || '').toLowerCase();
  if (m.includes('versaoqrcode')) return true;
  if (m.includes('nfce.config.sefaz')) return true;
  const mentionsNfceBlock = m.includes('nfce') || m.includes('nfc-e');
  if (mentionsNfceBlock && m.includes('sefaz')) return true;
  return false;
}

/**
 * Mensagens geradas só no cliente (validação de formulário / fluxo antes da API), sem erro do provedor.
 * Usado para não exibir rodapé de “Plugnotas recusou” quando o QA sinalizou desalinhamento (mitigação pós QA US-03).
 */
export function isLikelyLocalOnlyGuiaMeiEmpresaCertError(message: string): boolean {
  const t = String(message || '').trim();
  if (!t) return true;
  if (/^selecione /i.test(t)) return true;
  if (/^informe /i.test(t)) return true;
  if (/^não foi possível identificar um cnpj válido/i.test(t)) return true;
  if (/^o sistema de emissão fiscal não retornou/i.test(t)) return true;
  if (/^informe um cnpj válido/i.test(t)) return true;
  if (/^cnpj /i.test(t) && /obrigatório/i.test(t)) return true;
  if (/^erro ao remover certificado/i.test(t)) return true;
  return false;
}
