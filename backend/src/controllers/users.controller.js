import * as usersService from '../services/users.service.js';
import { sendSuccess } from '../utils/response.js';

export const listUsers = async (req, res, next) => {
  try {
    const result = await usersService.listUsers(req.accessToken);
    return sendSuccess(res, result, 'Usuários listados');
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const result = await usersService.createUser(req.accessToken, req.body);
    return sendSuccess(res, result, 'Usuário criado');
  } catch (error) {
    return next(error);
  }
};

export const syncPhone = async (req, res, next) => {
  try {
    const result = await usersService.syncPhone(req.user.id, req.body.phone);
    return sendSuccess(res, result, 'Telefone sincronizado');
  } catch (error) {
    return next(error);
  }
};

export const listEmpresas = async (req, res, next) => {
  try {
    const result = await usersService.listEmpresas(req.accessToken);
    return sendSuccess(res, result, 'Empresas listadas');
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const result = await usersService.updateUser(req.accessToken, req.params.userId, req.body);
    return sendSuccess(res, result, 'Usuário atualizado');
  } catch (error) {
    return next(error);
  }
};