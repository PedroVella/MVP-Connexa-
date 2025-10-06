const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

class AuthService {
  
  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token
   */
  static generateToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    return jwt.sign(payload, secret, { 
      expiresIn,
      issuer: 'mvp-connexa-api',
      audience: 'mvp-connexa-app'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  static verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'mvp-connexa-api',
        audience: 'mvp-connexa-app'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return null;
      } else if (error.name === 'JsonWebTokenError') {
        return null;
      } else {
        return null;
      }
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data and token
   */
  static async authenticateUser(email, password) {
    // Get user by email with password hash
    const query = `
      SELECT 
        p.id,
        p.full_name,
        p.institutional_email,
        p.password_hash,
        p.course_id,
        p.current_semester,
        p.created_at,
        c.name as course_name
      FROM profiles p
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE p.institutional_email = $1
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from user object
    delete user.password_hash;

    // Generate token
    const tokenPayload = {
      id: user.id,
      email: user.institutional_email,
      course_id: user.course_id
    };

    const token = this.generateToken(tokenPayload);

    return {
      user,
      token
    };
  }

  /**
   * Get user by ID (for protected routes)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User data
   */
  static async getUserById(userId) {
    const query = `
      SELECT 
        p.id,
        p.full_name,
        p.institutional_email,
        p.course_id,
        p.current_semester,
        p.created_at,
        c.name as course_name
      FROM profiles p
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Refresh token
   * @param {string} oldToken - Current token
   * @returns {string} - New token
   */
  static async refreshToken(oldToken) {
    try {
      const decoded = this.verifyToken(oldToken);
      
      // Generate new token with same payload
      const newTokenPayload = {
        id: decoded.id,
        email: decoded.email,
        course_id: decoded.course_id
      };

      return this.generateToken(newTokenPayload);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
