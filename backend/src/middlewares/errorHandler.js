export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  const errors = err.errors || null;

  res.status(status).json({
    success: false,
    data: null,
    message,
    errors
  });
};
