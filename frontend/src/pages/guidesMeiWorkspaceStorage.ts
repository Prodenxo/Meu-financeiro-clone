export type GuidesMeiWorkspace = 'overview' | 'das' | 'nfse' | 'parcelamentos';

export const MEI_WORKSPACE_STORAGE_KEY = 'meu-financeiro:mei-workspace-last';

const MEI_WORKSPACE_VALUES: GuidesMeiWorkspace[] = ['overview', 'das', 'nfse', 'parcelamentos'];

export function parseStoredWorkspace(raw: string | null): GuidesMeiWorkspace | null {
  if (raw == null || raw === '') return null;
  const v = raw.trim() as GuidesMeiWorkspace;
  return MEI_WORKSPACE_VALUES.includes(v) ? v : null;
}

export function readWorkspaceFromStorage(): GuidesMeiWorkspace | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return parseStoredWorkspace(localStorage.getItem(MEI_WORKSPACE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function resolveInitialWorkspace(
  stored: GuidesMeiWorkspace | null,
  canViewNfseArea: boolean
): GuidesMeiWorkspace {
  if (!stored) return 'overview';
  if (stored === 'nfse' && !canViewNfseArea) return 'overview';
  return stored;
}
