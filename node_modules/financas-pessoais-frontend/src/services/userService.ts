import { apiClient } from './apiClient';

/**
 * Sincroniza o telefone do usuário com a tabela n8n_link
 */
export async function syncUserPhone(
  userId: string,
  phone: string
): Promise<void> {
  await apiClient.post('/users/sync-phone', { phone });
}
