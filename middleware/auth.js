const AuthService = require('../services/authService');

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        error: 'Authorization header não fornecido'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
        error: 'Token deve começar com "Bearer "'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        error: 'Token vazio'
      });
    }

    const decoded = AuthService.verifyToken(token);
    
    const user = await AuthService.getUserById(decoded.id);
    
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    let statusCode = 401;
    let message = 'Token inválido';

    if (error.message === 'Token expirado') {
      statusCode = 401;
      message = 'Token expirado';
    } else if (error.message === 'Usuário não encontrado') {
      statusCode = 404;
      message = 'Usuário não encontrado';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    // Try to verify token
    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.id);
    
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    // If token verification fails, continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};