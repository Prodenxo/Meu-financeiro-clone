import React, { useState, useEffect } from 'react';
import { Repeat, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRecorrenciaStore } from '../store/recorrenciaStore';
import type { Recorrencia, CreateRecorrenciaInput, UpdateRecorrenciaInput } from '../services/recorrenciaService';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import RecorrenciaModal from '../components/RecorrenciaModal';
import RecorrenciaDeleteModal from '../components/RecorrenciaDeleteModal';
import { toast } from '../lib/toast';

const formatValor = (v: number) =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Recorrencias() {
  const {
    recorrencias,
    loading,
    error,
    fetchRecorrencias,
    addRecorrencia,
    updateRecorrencia,
    removeRecorrencia,
  } = useRecorrenciaStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recorrencia | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Recorrencia | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  useEffect(() => {
    void fetchRecorrencias();
  }, [fetchRecorrencias]);

  const handleSave = async (payload: CreateRecorrenciaInput | UpdateRecorrenciaInput) => {
    setSaveError(null);
    setSaving(true);
    try {
      if (editing) {
        const result = await updateRecorrencia(editing.id, payload as UpdateRecorrenciaInput);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
        toast.success('Recorrência atualizada.');
      } else {
        const result = await addRecorrencia(payload as CreateRecorrenciaInput);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
        toast.success('Recorrência criada. O lançamento será gerado no dia marcado de cada mês.');
      }
      setModalOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeletingInProgress(true);
    try {
      const result = await removeRecorrencia(deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Recorrência removida.');
      setDeleteModalOpen(false);
      setDeleting(null);
    } finally {
      setDeletingInProgress(false);
    }
  };

  const tipoLabel = (t: string) => (t === 'entrada' ? 'Entrada' : 'Saída');

  return (
    <PageShell>
      <PageTitle subtitle="Lançamentos que se repetem todo mês no dia escolhido">
        Recorrências
      </PageTitle>

      {error && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className="planner-button flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setSaveError(null);
            setModalOpen(true);
          }}
        >
          <PlusCircle size={18} />
          Nova recorrência
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 dark:text-slate-400 py-8 text-center">Carregando...</div>
      ) : !recorrencias.length ? (
        <EmptyState
          title="Nenhuma recorrência"
          description="Crie uma recorrência para que um lançamento seja gerado automaticamente todo mês no dia escolhido (ex.: dia 5, Netflix R$ 50)."
          actionLabel="Nova recorrência"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <ul className="space-y-3">
          {recorrencias.map((r) => (
            <li
              key={r.id}
              className="planner-card p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Repeat size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium dark:text-white truncate">{r.classificacao}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Todo dia {r.dia_do_mes} · {tipoLabel(r.tipo)} · R$ {formatValor(r.valor)}
                    {!r.ativo && ' · Inativa'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Editar"
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    setEditing(r);
                    setSaveError(null);
                    setModalOpen(true);
                  }}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Excluir"
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    setDeleting(r);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RecorrenciaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setSaveError(null);
        }}
        onSave={handleSave}
        recorrencia={editing}
        saving={saving}
        error={saveError}
      />

      <RecorrenciaDeleteModal
        open={deleteModalOpen}
        recorrencia={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deletingInProgress}
      />
    </PageShell>
  );
}
