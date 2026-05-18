import React, { useEffect, useRef, useState } from 'react';
import { APP_UPDATES } from '../config/updates';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';

export default function UpdatesPanel() {
  const userId = useAuthStore((s) => s.userId);
  const [visible, setVisible] = useState(false);
  const checkedRef = useRef<string | undefined>(undefined);

  const latestUpdate = APP_UPDATES[0];

  useEffect(() => {
    if (!latestUpdate || !userId) return;
    if (checkedRef.current === userId) return;

    checkedRef.current = userId;

    apiClient
      .get<{ lastSeenUpdateId: string | null }>('/auth/last-seen-update')
      .then((result) => {
        if (result.lastSeenUpdateId !== latestUpdate.id) {
          setVisible(true);
        }
      })
      .catch(() => {
        // erro de rede — não exibe
      });
  }, [userId, latestUpdate?.id]);

  if (!visible || !latestUpdate) return null;

  const handleClose = () => {
    setVisible(false);
    apiClient
      .post('/auth/last-seen-update', { updateId: latestUpdate.id })
      .catch((err) => console.error('[UpdatesPanel] Erro ao salvar:', err));
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
                    <p key={trimmed} className="text-sm text-slate-700 dark:text-slate-200">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
          <button type="button" onClick={handleClose} className="planner-button">
            Não mostrar mais
          </button>
        </div>
      </div>
    </div>
  );
}
