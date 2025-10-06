// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      success: false,
      message: 'Erro de conexão com o banco de dados',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    if (err.constraint === 'profiles_institutional_email_key') {
      return res.status(409).json({
        success: false,
        message: 'Este email institucional já está cadastrado',
        error: 'Email duplicado'
      });
    }
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === '23503') {
    if (err.constraint === 'profiles_course_id_fkey') {
      return res.status(400).json({
        success: false,
        message: 'Curso não encontrado',
        error: 'ID do curso inválido'
      });
    }
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Erro interno do servidor'
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
