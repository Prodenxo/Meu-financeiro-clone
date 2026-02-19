import * as meiGuideService from '../services/mei-guide.service.js';
import { sendSuccess } from '../utils/response.js';

export const createGuide = async (req, res, next) => {
  try {
    const data = await meiGuideService.createGuide(req.user.id, {
      ...req.body,
      autorPedidoDados: req.body?.autorPedidoDados,
      contribuinte: req.body?.contribuinte
    });
    return sendSuccess(res, data, 'Guia MEI gerada');
  } catch (error) {
    return next(error);
  }
};

export const downloadGuide = async (req, res, next) => {
  try {
    const { id } = req.params || {};
    const autorPedidoDados = req.query?.autorNumero ? {
      numero: req.query.autorNumero,
      tipo: req.query?.autorTipo
    } : null;
    const contribuinte = req.query?.contribuinteNumero ? {
      numero: req.query.contribuinteNumero,
      tipo: req.query?.contribuinteTipo
    } : null;
    const file = await meiGuideService.downloadGuide({
      userId: req.user.id,
      cnpj: req.query?.cnpj,
      periodoApuracao: id,
      autorPedidoDados,
      contribuinte
    });
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

export const uploadCertificate = async (req, res, next) => {
  try {
    const data = await meiGuideService.uploadCertificate(req.user.id, {
      file: req.file,
      password: req.body?.password
    });
    return sendSuccess(res, data, 'Certificado carregado');
  } catch (error) {
    return next(error);
  }
};

export const removeCertificate = async (req, res, next) => {
  try {
    const data = await meiGuideService.removeCertificate(req.user.id);
    return sendSuccess(res, data, 'Certificado removido');
  } catch (error) {
    return next(error);
  }
};

export const getCertificateStatus = async (req, res, next) => {
  try {
    const data = await meiGuideService.getCertificateStatus(req.user.id);
    return sendSuccess(res, data, 'Status do certificado obtido');
  } catch (error) {
    return next(error);
  }
};

export const getSerproToken = async (_req, res, next) => {
  try {
    const data = await meiGuideService.getSerproTokenForFrontend();
    return sendSuccess(res, data, 'Token Serpro gerado');
  } catch (error) {
    return next(error);
  }
};

export const validateGuide = async (req, res, next) => {
  try {
    const data = await meiGuideService.validateGuide(req.user.id, {
      ...req.body
    });
    return sendSuccess(res, data, 'Validação concluída');
  } catch (error) {
    return next(error);
  }
};

export const listPeriods = async (req, res, next) => {
  try {
    const autorPedidoDados = req.query?.autorNumero ? {
      numero: req.query.autorNumero,
      tipo: req.query?.autorTipo
    } : null;
    const contribuinte = req.query?.contribuinteNumero ? {
      numero: req.query.contribuinteNumero,
      tipo: req.query?.contribuinteTipo
    } : null;
    const data = await meiGuideService.listPeriods(req.user.id, {
      cnpj: req.query?.cnpj,
      autorPedidoDados,
      contribuinte
    });
    return sendSuccess(res, data, 'Períodos MEI listados');
  } catch (error) {
    return next(error);
  }
};
