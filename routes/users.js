const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const AuthService = require('../services/authService');
const { validateUserLogin, validateUserRegistration, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', validateUserRegistration, handleValidationErrors, async (req, res, next) => {
  try {
    const { full_name, institutional_email, password, course_id, current_semester } = req.body;

    // Check if email already exists
    const emailExists = await UserService.emailExists(institutional_email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Este email institucional já está cadastrado',
        error: 'Email duplicado'
      });
    }

    // Check if course exists
    const courseExists = await UserService.courseExists(course_id);
    if (!courseExists) {
      return res.status(400).json({
        success: false,
        message: 'Curso não encontrado',
        error: 'ID do curso inválido'
      });
    }

    // Create user
    const newUser = await UserService.createUser({
      full_name,
      institutional_email,
      password,
      course_id,
      current_semester
    });

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/login
 * Authenticate user and return JWT token
 */
router.post('/login', validateUserLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { institutional_email, password } = req.body;

    // Authenticate user
    const authResult = await AuthService.authenticateUser(institutional_email, password);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: authResult.user,
        token: authResult.token,
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos',
        error: 'Credenciais inválidas'
      });
    }
    next(error);
  }
});

/**
 * POST /api/users/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido para renovação',
        error: 'Authorization header inválido'
      });
    }

    const token = authHeader.substring(7);
    const newToken = await AuthService.refreshToken(token);

    res.status(200).json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Falha na renovação do token',
      error: error.message
    });
  }
});

/**
 * GET /api/users/profile
 * Get current user profile (protected route)
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    // User data is already available from authenticateToken middleware
    res.status(200).json({
      success: true,
      message: 'Perfil recuperado com sucesso',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/courses
 * Get all available courses
 */
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await UserService.getCourses();
    
    res.status(200).json({
      success: true,
      message: 'Cursos recuperados com sucesso',
      data: {
        courses
      }
    });

  } catch (error) {
    next(error);
  }
});

router.post('/create', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, subject } = req.body;
    const created_by = req.user.id; // User ID from the authenticated token

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'O campo "name" é obrigatório.',
      });
    }

    const newGroup = await GroupService.createGroup({
      name,
      description,
      subject,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: 'Grupo de estudos criado com sucesso.',
      data: newGroup,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/delete/:id
 * Delete a study group by ID
 */
router.delete('/delete/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await GroupService.deleteGroup(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Grupo de estudos não encontrado.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grupo de estudos deletado com sucesso.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

