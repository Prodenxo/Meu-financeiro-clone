import React, { useEffect, useState } from 'react';
import { APP_UPDATES } from '../config/updates';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';

const STORAGE_KEY_PREFIX = 'app_updates_last_seen_';

function getLocalKey(userId: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : STORAGE_KEY_PREFIX;
}

export default function UpdatesPanel() {
  const userId = useAuthStore((s) => s.userId);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  const latestUpdate = APP_UPDATES[0];

  useEffect(() => {
    if (!latestUpdate || checked) return;

    const checkSeen = async () => {
      setChecked(true);
      if (userId) {
        try {
          const result = await apiClient.get<{ lastSeenUpdateId: string | null }>('/auth/last-seen-update');
          if (result.lastSeenUpdateId !== latestUpdate.id) {
            setVisible(true);
          }
        } catch {
          // erro de rede — não exibe para não irritar o usuário
        }
        return;
      }

      try {
        const key = getLocalKey(null);
        const lastSeenId = window.localStorage.getItem(key);
        if (lastSeenId !== latestUpdate.id) {
          setVisible(true);
        }
      } catch {
        // sem localStorage, não mostra
      }
    };

    void checkSeen();
  }, [userId, latestUpdate?.id, checked]);

  if (!visible || !latestUpdate) return null;

  const handleClose = async () => {
    setVisible(false);

    const currentUserId = useAuthStore.getState().userId;

    if (currentUserId) {
      try {
        await apiClient.post('/auth/last-seen-update', { updateId: latestUpdate.id });
      } catch (err) {
        console.error('[UpdatesPanel] Falha ao salvar preferência no banco:', err);
      }
      return;
    }

    try {
      window.localStorage.setItem(getLocalKey(null), latestUpdate.id);
    } catch {
      // ignora erro de localStorage
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-20">
      <div className="planner-card max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold dark:text-white">Novidades do sistema</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Veja o que mudou desde sua última visita.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {APP_UPDATES.map((update) => (
            <div
              key={update.id}
              className="border-b last:border-b-0 border-slate-200/60 dark:border-slate-800/60 pb-4 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold underline text-slate-900 dark:text-white">
                  {update.title}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {update.date}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {update.summary}
              </p>
              <div className="space-y-2">
                {update.details.split('\n').map((line) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  return (
                    <p
                      key={trimmed}
                      className="text-sm text-slate-700 dark:text-slate-200"
                    >
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="planner-button"
          >
            Não mostrar mais
          </button>
        </div>
      </div>
    </div>
  );
}
