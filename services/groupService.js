const pool = require('../config/database');

class GroupService {
  /**
   * Create a new study group
   * @param {Object} groupData - Data for the new group
   * @param {string} groupData.name - Name of the group
   * @param {string} [groupData.description] - Description of the group
   * @param {string} [groupData.subject] - Subject of the group
   * @param {number} groupData.created_by - ID of the user who created the group
   * @returns {Promise<Object>} - Created group
   */
  static async createGroup({ name, description, subject, created_by }) {
    const query = `
      INSERT INTO public.study_groups (name, description, subject, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, subject, created_by, created_at, updated_at, is_active;
    `;
    const values = [name, description, subject, created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a study group by ID
   * @param {number} groupId - ID of the group to delete
   * @returns {Promise<boolean>} - True if the group was deleted, false otherwise
   */
  static async deleteGroup(groupId) {
    const query = `
      DELETE FROM public.study_groups
      WHERE id = $1
      RETURNING id;
    `;
    const values = [groupId];
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }
}

module.exports = GroupService;