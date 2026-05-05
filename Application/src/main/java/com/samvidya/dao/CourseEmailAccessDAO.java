package com.samvidya.dao;

import com.samvidya.util.DatabaseUtil;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CourseEmailAccessDAO {

    /**
     * Find all course IDs that a given email has access to
     */
    public List<Long> findCourseIdsForEmail(String email) throws SQLException {
        String sql = "SELECT course_id FROM course_email_access WHERE email = ? AND is_active = TRUE";
        List<Long> courseIds = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email.toLowerCase().trim());
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                courseIds.add(rs.getLong("course_id"));
            }
        }
        return courseIds;
    }

    /**
     * Find all emails that have access to a specific course
     */
    public List<String> findEmailsByCourseId(Long courseId) throws SQLException {
        String sql = "SELECT email FROM course_email_access WHERE course_id = ? AND is_active = TRUE ORDER BY email";
        List<String> emails = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                emails.add(rs.getString("email"));
            }
        }
        return emails;
    }

    /**
     * Add a single email to course access list
     */
    public void addEmail(String email, Long courseId) throws SQLException {
        String sql = "INSERT INTO course_email_access (email, course_id, is_active) VALUES (?, ?, TRUE)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email.toLowerCase().trim());
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    /**
     * Add multiple emails in batch for better performance
     */
    public void addEmailsBatch(List<String> emails, Long courseId) throws SQLException {
        String sql = "INSERT IGNORE INTO course_email_access (email, course_id, is_active) VALUES (?, ?, TRUE)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            conn.setAutoCommit(false);
            
            for (String email : emails) {
                stmt.setString(1, email.toLowerCase().trim());
                stmt.setLong(2, courseId);
                stmt.addBatch();
            }
            
            stmt.executeBatch();
            conn.commit();
            conn.setAutoCommit(true);
        }
    }

    /**
     * Remove an email from course access list
     */
    public void removeEmail(String email, Long courseId) throws SQLException {
        String sql = "DELETE FROM course_email_access WHERE email = ? AND course_id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email.toLowerCase().trim());
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    /**
     * Check if an email is allowed for a specific course
     */
    public boolean isEmailAllowed(String email, Long courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM course_email_access WHERE email = ? AND course_id = ? AND is_active = TRUE";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email.toLowerCase().trim());
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    /**
     * Deactivate an email (soft delete)
     */
    public void deactivateEmail(String email, Long courseId) throws SQLException {
        String sql = "UPDATE course_email_access SET is_active = FALSE WHERE email = ? AND course_id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email.toLowerCase().trim());
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }
}
