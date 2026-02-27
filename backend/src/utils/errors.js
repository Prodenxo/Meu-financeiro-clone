export class HttpError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const badRequest = (message, errors = null) => new HttpError(400, message, errors);
export const unauthorized = (message = 'Não autenticado') => new HttpError(401, message);
export const forbidden = (message = 'Acesso negado') => new HttpError(403, message);
export const notFound = (message = 'Recurso não encontrado') => new HttpError(404, message);
export const serviceUnavailable = (message = 'Serviço indisponível') => new HttpError(503, message);
