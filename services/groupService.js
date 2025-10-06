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
    // Soft delete - mark as inactive instead of hard delete
    const query = `
      UPDATE public.study_groups 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id;
    `;
    const values = [groupId];
    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * Get all study groups with filters
   * @param {Object} filters - Optional filters
   * @param {number} currentUserId - Current user ID to check membership
   * @returns {Promise<Array>} - List of groups
   */
  static async getGroups(filters = {}, currentUserId = null) {
    let query = `
      SELECT 
        sg.id,
        sg.name,
        sg.description,
        sg.subject,
        sg.created_by,
        sg.created_at,
        sg.updated_at,
        p.full_name as creator_name,
        COUNT(sgm.id) as member_count
    `;

    // Add membership check if user is provided
    if (currentUserId) {
      query += `,
        CASE WHEN user_sgm.id IS NOT NULL THEN true ELSE false END as is_member
      `;
    }

    query += `
      FROM study_groups sg
      LEFT JOIN profiles p ON sg.created_by = p.id
      LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id AND sgm.is_active = true
    `;

    // Add join for current user membership
    if (currentUserId) {
      query += `
        LEFT JOIN study_group_members user_sgm ON sg.id = user_sgm.group_id AND user_sgm.user_id = $${currentUserId ? 1 : 0} AND user_sgm.is_active = true
      `;
    }

    query += `
      WHERE sg.is_active = true
    `;

    const values = [];
    let paramCount = currentUserId ? 1 : 0;

    if (currentUserId) {
      values.push(currentUserId);
    }

    if (filters.subject) {
      paramCount++;
      query += ` AND sg.subject ILIKE $${paramCount}`;
      values.push(`%${filters.subject}%`);
    }

    if (filters.created_by) {
      paramCount++;
      query += ` AND sg.created_by = $${paramCount}`;
      values.push(filters.created_by);
    }

    if (filters.member_of && currentUserId) {
      query += ` AND user_sgm.id IS NOT NULL`;
    }

    query += `
      GROUP BY sg.id, sg.name, sg.description, sg.subject, sg.created_by, sg.created_at, sg.updated_at, p.full_name
    `;

    if (currentUserId) {
      query += `, user_sgm.id`;
    }

    query += `
      ORDER BY sg.created_at DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get group by ID with details
   * @param {number} groupId - Group ID
   * @returns {Promise<Object>} - Group data with members
   */
  static async getGroupById(groupId) {
    const groupQuery = `
      SELECT 
        sg.id,
        sg.name,
        sg.description,
        sg.subject,
        sg.created_by,
        sg.created_at,
        sg.updated_at,
        p.full_name as creator_name
      FROM study_groups sg
      LEFT JOIN profiles p ON sg.created_by = p.id
      WHERE sg.id = $1 AND sg.is_active = true
    `;

    const membersQuery = `
      SELECT 
        sgm.id,
        sgm.user_id,
        sgm.joined_at,
        p.full_name,
        p.institutional_email,
        c.name as course_name
      FROM study_group_members sgm
      JOIN profiles p ON sgm.user_id = p.id
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE sgm.group_id = $1 AND sgm.is_active = true
      ORDER BY sgm.joined_at ASC
    `;

    const [groupResult, membersResult] = await Promise.all([
      pool.query(groupQuery, [groupId]),
      pool.query(membersQuery, [groupId])
    ]);

    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];
    group.members = membersResult.rows;
    group.member_count = membersResult.rows.length;

    return group;
  }

  /**
   * Join a study group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Member data
   */
  static async joinGroup(groupId, userId) {
    // First check if group exists and is active
    const groupQuery = `
      SELECT id, name, created_by 
      FROM study_groups 
      WHERE id = $1 AND is_active = true
    `;
    
    const groupResult = await pool.query(groupQuery, [groupId]);
    
    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];

    // Check if user is already a member
    const memberQuery = `
      SELECT id, is_active 
      FROM study_group_members 
      WHERE group_id = $1 AND user_id = $2
    `;
    
    const memberResult = await pool.query(memberQuery, [groupId, userId]);
    
    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];
      if (member.is_active) {
        return null;
      } else {
        // Reactivate membership
        const reactivateQuery = `
          UPDATE study_group_members 
          SET is_active = true, joined_at = NOW()
          WHERE group_id = $1 AND user_id = $2
          RETURNING id, group_id, user_id, joined_at, is_active
        `;
        
        const result = await pool.query(reactivateQuery, [groupId, userId]);
        return result.rows[0];
      }
    }

    // Add new member
    const insertQuery = `
      INSERT INTO study_group_members (group_id, user_id, is_active)
      VALUES ($1, $2, true)
      RETURNING id, group_id, user_id, joined_at, is_active
    `;
    
    const result = await pool.query(insertQuery, [groupId, userId]);
    return result.rows[0];
  }

  /**
   * Leave a study group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if left successfully
   */
  static async leaveGroup(groupId, userId) {
    // Check if group exists
    const groupQuery = `
      SELECT id, created_by 
      FROM study_groups 
      WHERE id = $1 AND is_active = true
    `;
    
    const groupResult = await pool.query(groupQuery, [groupId]);
    
    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];

    // Don't allow creator to leave their own group
    if (group.created_by === userId) {
      return null;
    }

    // Check if user is a member
    const memberQuery = `
      SELECT id 
      FROM study_group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [groupId, userId]);
    
    if (memberResult.rows.length === 0) {
      return null;
    }

    // Remove member (soft delete)
    const leaveQuery = `
      UPDATE study_group_members 
      SET is_active = false 
      WHERE group_id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(leaveQuery, [groupId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Check if user is member of a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if user is member
   */
  static async isUserMember(groupId, userId) {
    const query = `
      SELECT id 
      FROM study_group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const result = await pool.query(query, [groupId, userId]);
    return result.rows.length > 0;
  }
}

module.exports = GroupService;
