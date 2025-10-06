const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const AuthService = require('../services/authService');
const GroupService = require('../services/groupService');
const { validateUserLogin, validateUserRegistration, validateGroupCreation, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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

/**
 * POST /api/users/groups/create
 * Create a new study group
 */
router.post('/groups/create', authenticateToken, validateGroupCreation, handleValidationErrors, async (req, res, next) => {
  try {
    const { name, description, subject } = req.body;
    const created_by = req.user.id; // User ID from the authenticated token

    const newGroup = await GroupService.createGroup({
      name,
      description,
      subject,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: 'Grupo de estudos criado com sucesso',
      data: {
        group: newGroup
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/groups/:id
 * Delete a study group by ID
 */
router.delete('/groups/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID do grupo inválido'
      });
    }

    const deleted = await GroupService.deleteGroup(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Grupo de estudos não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grupo de estudos deletado com sucesso'
    });
  } catch (error) {
    if (error.message === 'Sem permissão para deletar este grupo') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

/**
 * GET /api/users/groups
 * Get all study groups
 */
router.get('/groups', optionalAuth, async (req, res, next) => {
  try {
    const { subject, my_groups, member_of } = req.query;
    const filters = {};
    const currentUserId = req.user ? req.user.id : null;

    if (subject) {
      filters.subject = subject;
    }

    // If user wants only their created groups
    if (my_groups === 'true' && req.user) {
      filters.created_by = req.user.id;
    }

    // If user wants only groups they are members of
    if (member_of === 'true' && req.user) {
      filters.member_of = req.user.id;
    }

    const groups = await GroupService.getGroups(filters, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Grupos recuperados com sucesso',
      data: {
        groups
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/groups/:id
 * Get group details by ID
 */
router.get('/groups/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID do grupo inválido'
      });
    }

    const group = await GroupService.getGroupById(parseInt(id));

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grupo recuperado com sucesso',
      data: {
        group
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/groups/:id/join
 * Join a study group
 */
router.post('/groups/:id/join', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID do grupo inválido'
      });
    }

    const member = await GroupService.joinGroup(parseInt(id), userId);

    res.status(201).json({
      success: true,
      message: 'Você entrou no grupo com sucesso',
      data: {
        membership: member
      }
    });
  } catch (error) {
    if (error.message === 'Grupo não encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Você já é membro deste grupo') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

/**
 * POST /api/users/groups/:id/leave
 * Leave a study group
 */
router.post('/groups/:id/leave', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID do grupo inválido'
      });
    }

    const success = await GroupService.leaveGroup(parseInt(id), userId);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível sair do grupo'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Você saiu do grupo com sucesso'
    });
  } catch (error) {
    if (error.message === 'Grupo não encontrado' || error.message === 'Você não é membro deste grupo') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('criador do grupo não pode sair')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

module.exports = router;

