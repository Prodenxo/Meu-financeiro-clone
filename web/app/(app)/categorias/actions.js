'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { normalizarTipo } from '@/lib/finance/normalize';
import { DEFAULT_CATEGORY_ID } from '@/lib/finance/categorias';

const TABLE = 'categorias_id';
const MAX_NOME = 60;

function revalidateAll() {
  revalidatePath('/categorias');
  revalidatePath('/transacoes');
  revalidatePath('/orcamentos');
  revalidatePath('/visao-geral');
}

/** Mesma chave de duplicidade do backend (`categoryCopyKey`): nome sem acento/caixa + tipo. */
function copyKey(nome, tipo) {
  const base = String(nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return `${base}:${normalizarTipo(tipo)}`;
}

async function findDuplicate(supabase, userId, nome, tipo, ignoreId) {
  const { data, error } = await supabase.from(TABLE).select('id, nome, tipo').eq('user_id', userId);
  if (error) return { error };
  const key = copyKey(nome, tipo);
  const dup = (data || []).find((c) => String(c.id) !== String(ignoreId || '') && copyKey(c.nome, c.tipo) === key);
  return { dup };
}

/**
 * Cria ou edita uma categoria — mesmas regras do `CategoriaModal` do app atual
 * (nome + tipo; só categorias do próprio usuário) e a checagem de duplicidade do backend.
 */
export async function saveCategoriaAction(_prevState, formData) {
  const session = await requireUser();
  const { supabase, userId } = session;

  const id = String(formData.get('id') || '').trim();
  const nome = String(formData.get('nome') || '').trim();
  const tipo = normalizarTipo(formData.get('tipo'));

  const errors = {};
  if (!nome) errors.nome = 'Informe o nome da categoria.';
  else if (nome.length > MAX_NOME) errors.nome = `Use até ${MAX_NOME} caracteres.`;
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const { dup, error: dupErr } = await findDuplicate(supabase, userId, nome, tipo, id);
  if (dupErr) return { ok: false, errors: { form: `Não foi possível verificar duplicidade: ${dupErr.message}` } };
  if (dup) return { ok: false, errors: { nome: `Já existe a categoria "${dup.nome}" em ${tipo === 'entrada' ? 'receitas' : 'saídas'}.` } };

  if (id) {
    const { data: current, error: curErr } = await supabase.from(TABLE).select('id, nome').eq('id', id).eq('user_id', userId).maybeSingle();
    if (curErr) return { ok: false, errors: { form: curErr.message } };
    if (!current) return { ok: false, errors: { form: 'Você não tem permissão para editar esta categoria.' } };

    const { error } = await supabase.from(TABLE).update({ nome, tipo }).eq('id', id).eq('user_id', userId);
    if (error) return { ok: false, errors: { form: `Não foi possível salvar: ${error.message}` } };

    // Lançamentos guardam a categoria pelo nome: renomear a categoria acompanha os lançamentos.
    if (current.nome !== nome) {
      const { error: txErr } = await supabase.from('lancamentos_id').update({ classificacao: nome }).eq('classificacao', current.nome).eq('user_id', userId);
      if (txErr) return { ok: false, errors: { form: `Categoria salva, mas os lançamentos não foram renomeados: ${txErr.message}` } };
    }
    revalidateAll();
    return { ok: true, mode: 'edit', nome };
  }

  const { error } = await supabase.from(TABLE).insert({ nome, tipo, user_id: userId });
  if (error) return { ok: false, errors: { form: `Não foi possível criar a categoria: ${error.message}` } };

  revalidateAll();
  return { ok: true, mode: 'create', nome };
}

/**
 * Exclui a categoria — porta do `handleDeleteCategoria` do app atual: os lançamentos
 * passam para a categoria padrão do tipo antes de apagar.
 */
export async function deleteCategoriaAction(idRaw) {
  const session = await requireUser();
  const { supabase, userId } = session;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Categoria inválida.' };

  const { data: categoria, error: catErr } = await supabase.from(TABLE).select('id, nome, tipo').eq('id', id).eq('user_id', userId).maybeSingle();
  if (catErr) return { ok: false, error: catErr.message };
  if (!categoria) return { ok: false, error: 'Você não tem permissão para excluir esta categoria.' };

  const tipo = normalizarTipo(categoria.tipo);
  const { data: padrao } = await supabase.from(TABLE).select('nome').eq('id', DEFAULT_CATEGORY_ID[tipo]).maybeSingle();
  if (!padrao?.nome) return { ok: false, error: 'Não foi possível encontrar a categoria padrão.' };
  if (String(padrao.nome) === String(categoria.nome)) return { ok: false, error: 'Esta é a categoria padrão e não pode ser excluída.' };

  const { error: txErr } = await supabase.from('lancamentos_id').update({ classificacao: padrao.nome }).eq('classificacao', categoria.nome).eq('user_id', userId);
  if (txErr) return { ok: false, error: 'Não foi possível atualizar as transações relacionadas.' };

  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) return { ok: false, error: 'Não foi possível excluir a categoria.' };

  revalidateAll();
  return { ok: true, movedTo: padrao.nome };
}
