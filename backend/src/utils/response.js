export const sendSuccess = (res, data = null, message = 'OK') => {
  return res.json({
    success: true,
    data,
    message,
    errors: null
  });
};

export const sendError = (res, message, status = 500, errors = null) => {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    errors
  });
};
