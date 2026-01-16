import { proxyRequest } from '../services/googleCalendar.service.js';

export const proxyGoogleCalendar = async (req, res, next) => {
  try {
    const result = await proxyRequest({
      path: req.params.path || '',
      method: req.method,
      headers: { authorization: req.headers.authorization || '' },
      query: req.query,
      body: req.body
    });

    const contentType = result.contentType || '';
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const isJson = contentType.includes('application/json');
    const isSuccessStatus = result.status >= 200 && result.status < 400;

    if (isJson && isSuccessStatus && result.body) {
      try {
        const parsed = JSON.parse(result.body);
        if (parsed && typeof parsed === 'object' && 'data' in parsed) {
          res.status(result.status).json(parsed);
          return;
        }
        res.status(result.status).json({ data: parsed });
        return;
      } catch (error) {
        // Se falhar o parse, seguir com o body original
      }
    }

    res.status(result.status).send(result.body);
  } catch (error) {
    next(error);
  }
};
