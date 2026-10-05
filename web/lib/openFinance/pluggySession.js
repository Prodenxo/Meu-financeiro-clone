const STORAGE_KEY = 'mf_pluggy_last_item_id';

export function savePluggyItemId(itemId) {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(itemId));
  } catch {
    /* ignore */
  }
}

export function readPluggyItemId() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
