import { useAuthStore } from '../store/authStore'
import { isValidEmpresaCnpj } from './empresaCnpj'
import { fetchEmpresaCnpjOnboardingStatus } from '../services/empresaOnboardingService'
import { getEmpresa } from '../services/empresaService'

/**
 * Documento cadastral da “empresa” no sistema: CNPJ (PJ) ou CPF (PF).
 * Com CPF presente, o gate de CNPJ NÃO deve travar o app.
 */
export function hasDocumentoCadastral (cnpj?: string | null): boolean {
  const digits = String(cnpj || '').replace(/\D/g, '')
  if (digits.length === 14) return isValidEmpresaCnpj(digits)
  // PF: 11 dígitos bastam para liberar o app (MEI/NFSe pedem CNPJ depois).
  // Aceita presença do CPF mesmo se checksum falhar em dados legados.
  if (digits.length === 11) return true
  return false
}

/**
 * Admin sem CNPJ nem CPF cadastrado.
 * PF com CPF não é forçada a onboarding de CNPJ.
 *
 * Importante: se a API antiga ainda marcar `required: true` para CPF,
 * o app ignora isso quando `empresa.cnpj` já tem 11 dígitos.
 */
export async function isEmpresaCnpjOnboardingRequired (): Promise<boolean> {
  const role = useAuthStore.getState().role
  if (role !== 'admin') return false

  try {
    const status = await fetchEmpresaCnpjOnboardingStatus()
    if (status !== null) {
      if (hasDocumentoCadastral(status.empresa?.cnpj)) return false
      if (status.required === false) return false
      // API diz required, mas confirma no GET /empresas antes de travar
    }
  } catch {
    // fallback abaixo
  }

  try {
    const empresa = await getEmpresa()
    if (!empresa) return false
    return !hasDocumentoCadastral(empresa.cnpj)
  } catch {
    return false
  }
}
