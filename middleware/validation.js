const { body, validationResult } = require('express-validator');

// Validation rules for user login
const validateUserLogin = [
  body('institutional_email')
    .isEmail()
    .withMessage('Email institucional deve ter um formato válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 1 })
    .withMessage('Senha não pode estar vazia')
];

// Validation rules for group creation
const validateGroupCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome do grupo deve ter entre 3 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/)
    .withMessage('Nome do grupo deve conter apenas letras, números, espaços e os caracteres: - _ .'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Matéria deve ter no máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_.]*$/)
    .withMessage('Matéria deve conter apenas letras, números, espaços e os caracteres: - _ .')
];

// Validation rules for user registration
const validateUserRegistration = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome completo deve ter entre 2 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome completo deve conter apenas letras e espaços'),

  body('institutional_email')
    .isEmail()
    .withMessage('Email institucional deve ter um formato válido')
    .normalizeEmail()
    .custom((value) => {
      // Validate institutional email format (you can customize this)
      if (!value.includes('@') || !value.endsWith('.edu.br') && !value.endsWith('.edu')) {
        throw new Error('Email deve ser um email institucional válido');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),

  body('course_id')
    .isInt({ min: 1 })
    .withMessage('ID do curso deve ser um número inteiro positivo'),

  body('current_semester')
    .isInt({ min: 1, max: 20 })
    .withMessage('Semestre atual deve ser um número entre 1 e 20')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

module.exports = {
  validateUserLogin,
  validateUserRegistration,
  validateGroupCreation,
  handleValidationErrors
};
