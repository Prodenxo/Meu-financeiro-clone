import * as categoriesService from '../services/categories.service.js';
import { sendSuccess } from '../utils/response.js';

export const listCategories = async (req, res, next) => {
  try {
    const data = await categoriesService.listCategories(req.user.id, req.query?.type);
    return sendSuccess(res, data, 'Categorias listadas');
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = await categoriesService.createCategory(req.user.id, req.body);
    return sendSuccess(res, data, 'Categoria criada');
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await categoriesService.updateCategory(req.user.id, req.body);
    return sendSuccess(res, data, 'Categoria atualizada');
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoriesService.deleteCategory(req.user.id, req.body, req.query);
    return sendSuccess(res, { success: true }, 'Categoria removida');
  } catch (error) {
    return next(error);
  }
};

export const listCategoryBudgets = async (req, res, next) => {
  try {
    const data = await categoriesService.listCategoryBudgets(req.user.id);
    return sendSuccess(res, data, 'Orçamentos listados');
  } catch (error) {
    return next(error);
  }
};

export const upsertCategoryBudget = async (req, res, next) => {
  try {
    const data = await categoriesService.upsertCategoryBudget(req.user.id, req.body);
    return sendSuccess(res, data, 'Orçamento atualizado');
  } catch (error) {
    return next(error);
  }
};

export const listCategoryBudgetsSummary = async (req, res, next) => {
  try {
    const data = await categoriesService.listCategoryBudgetsSummary(req.user.id);
    return sendSuccess(res, data, 'Resumo de orçamento listado');
  } catch (error) {
    return next(error);
  }
};
