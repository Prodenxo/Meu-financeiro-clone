import { sendSuccess } from '../utils/response.js';
import { createPluggyConnectToken, isPluggyConfigured } from '../services/pluggy.service.js';
import {
  disconnectPluggyContaForUser,
  disconnectPluggyItemForUser,
  listUserPluggyItemIds,
  syncAllPluggyItemsForUser,
  syncPluggyContaForUser,
  syncPluggyItemForUser,
} from '../services/openFinancePluggy.service.js';
import { assertOpenFinanceCheckoutEnabled } from '../services/open-finance-billing.service.js';
import { assertCanConnectNewBank } from '../services/open-finance-entitlement.service.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

export const getPluggyConnections = async (req, res, next) => {
  try {
    const token = req.accessToken;
    if (!token) return next(badRequest('Sessão inválida.'));
    const itemIds = await listUserPluggyItemIds(req.user.id, token);
    return sendSuccess(
      res,
      { connected: itemIds.length > 0, itemIds },
      'Conexões Open Finance',
    );
  } catch (error) {
    return next(error);
  }
};

export const getPluggyStatus = async (_req, res, next) => {
  try {
    return sendSuccess(res, { configured: isPluggyConfigured() }, 'Status Open Finance');
  } catch (error) {
    return next(error);
  }
};

export const postPluggyConnectToken = async (req, res, next) => {
  try {
    assertOpenFinanceCheckoutEnabled();
    if (!isPluggyConfigured()) {
      return next(
        serviceUnavailable(
          'Open Finance (Pluggy) não configurado. Contacte o suporte ou configure PLUGGY_* no servidor.',
        ),
      );
    }
    const itemId = req.body?.itemId ? String(req.body.itemId).trim() : undefined;
    const ownItemIds = itemId ? await listUserPluggyItemIds(req.user.id, req.accessToken) : [];
    if (!itemId || !ownItemIds.includes(itemId)) {
      await assertCanConnectNewBank(req.user.id, req.accessToken);
    }
    const data = await createPluggyConnectToken(req.user.id, { itemId });
    return sendSuccess(res, data, 'Connect token gerado');
  } catch (error) {
    return next(error);
  }
};

export const postPluggyDisconnect = async (req, res, next) => {
  try {
    const token = req.accessToken;
    if (!token) return next(badRequest('Sessão inválida.'));
    const itemId = String(req.body?.itemId || '').trim();
    const contaId = String(req.body?.contaId || '').trim();
    if (!contaId && !itemId) {
      return next(badRequest('Informe contaId ou itemId para desconectar.'));
    }
    const data = contaId
      ? await disconnectPluggyContaForUser(req.user.id, contaId, token)
      : await disconnectPluggyItemForUser(req.user.id, itemId, token);
    return sendSuccess(res, data, 'Open Finance desconectado');
  } catch (error) {
    return next(error);
  }
};

export const postPluggySync = async (req, res, next) => {
  try {
    const itemId = String(req.body?.itemId || '').trim();
    const token = req.accessToken;
    if (!token) {
      return next(badRequest('Sessão inválida para sincronizar contas.'));
    }
    const mode = String(req.body?.mode || 'full').toLowerCase();
    const syncOptions = { importTransactions: mode !== 'balance' };
    const contaId = String(req.body?.contaId || '').trim();
    const data = contaId
      ? await syncPluggyContaForUser(req.user.id, contaId, token, syncOptions)
      : itemId
        ? await syncPluggyItemForUser(req.user.id, itemId, token, syncOptions)
        : await syncAllPluggyItemsForUser(req.user.id, token, syncOptions);
    return sendSuccess(res, data, 'Open Finance sincronizado');
  } catch (error) {
    return next(error);
  }
};
