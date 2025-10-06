const bcrypt = require('bcrypt');
const pool = require('../config/database');

class UserService {
  
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if password matches
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check if email already exists
   * @param {string} email - Institutional email
   * @returns {Promise<boolean>} - True if email exists
   */
  static async emailExists(email) {
    const query = 'SELECT id FROM profiles WHERE institutional_email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Check if course exists
   * @param {number} courseId - Course ID
   * @returns {Promise<boolean>} - True if course exists
   */
  static async courseExists(courseId) {
    const query = 'SELECT id FROM courses WHERE id = $1';
    const result = await pool.query(query, [courseId]);
    return result.rows.length > 0;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user (without password)
   */
  static async createUser(userData) {
    const { full_name, institutional_email, password, course_id, current_semester } = userData;

    // Hash the password
    const password_hash = await this.hashPassword(password);

    const query = `
      INSERT INTO profiles (full_name, institutional_email, password_hash, course_id, current_semester)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, institutional_email, course_id, current_semester, created_at
    `;

    const values = [full_name, institutional_email, password_hash, course_id, current_semester];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  /**
   * Get all courses
   * @returns {Promise<Array>} - List of courses
   */
  static async getCourses() {
    const query = 'SELECT id, name FROM courses ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = UserService;
