/** Apenas dígitos (CPF/CNPJ). */
export function onlyDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Máscara pt-BR para exibição ou entrada: CPF (11) ou CNPJ (14).
 * Trunca em 14 dígitos.
 */
export function formatCpfCnpjPtBr(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  let formatted = '';
  for (let i = 0; i < digits.length; i += 1) {
    formatted += digits[i];
    if (digits.length <= 11) {
      if (i === 2 || i === 5) formatted += '.';
      if (i === 8) formatted += '-';
    } else {
      if (i === 1 || i === 4) formatted += '.';
      if (i === 7) formatted += '/';
      if (i === 11) formatted += '-';
    }
  }
  return formatted;
}

/** Formata apenas para lista (usa documento já normalizado em dígitos). */
export function formatDocumentoListaPtBr(documentoDigitsOrRaw: string | null | undefined): string {
  if (!documentoDigitsOrRaw) return '—';
  const d = onlyDigits(documentoDigitsOrRaw);
  if (d.length !== 11 && d.length !== 14) return documentoDigitsOrRaw;
  return formatCpfCnpjPtBr(d);
}
