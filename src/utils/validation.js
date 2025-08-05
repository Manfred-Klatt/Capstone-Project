const { validationResult } = require('express-validator');
const AppError = require('./appError');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    return next(
      new AppError('Validation failed', 400, {
        errors: errorMessages,
      })
    );
  };
};

const validateRequest = (validations) => {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const errorMessages = errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      }));

      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errorMessages,
      });
    },
  ];
};

module.exports = {
  validate,
  validateRequest,
};
