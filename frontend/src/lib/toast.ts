/**
 * Toasts padronizados (6A):
 * - Sucesso: verde, autoClose 3s
 * - Erro: vermelho, autoClose 5s (usuário pode fechar antes)
 * - Info: neutro, autoClose 4s
 */
import { toast as rtToast, ToastOptions } from 'react-toastify';

const defaultSuccess: ToastOptions = { autoClose: 3000, type: 'success' };
const defaultError: ToastOptions = { autoClose: 5000, type: 'error' };
const defaultInfo: ToastOptions = { autoClose: 4000, type: 'info' };

export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    rtToast.success(message, { ...defaultSuccess, ...opts }),
  error: (message: string, opts?: ToastOptions) =>
    rtToast.error(message, { ...defaultError, ...opts }),
  info: (message: string, opts?: ToastOptions) =>
    rtToast.info(message, { ...defaultInfo, ...opts }),
};
