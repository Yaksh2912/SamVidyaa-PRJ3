package com.samvidya.dao;

import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EnrollmentNumberDAO {

    public List<Long> findCourseIdsForEnrollmentNumber(String enrollmentNumber) throws SQLException {
        List<Long> courseIds = new ArrayList<>();
        
        // First check for exact matches
        String exactMatchSql = "SELECT course_id FROM enrollment_numbers WHERE enrollment_number = ? AND is_active = TRUE";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(exactMatchSql)) {
            
            stmt.setString(1, enrollmentNumber);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                courseIds.add(rs.getLong("course_id"));
            }
        }
        
        // Then check for range matches
        String rangeSql = "SELECT course_id, enrollment_number FROM enrollment_numbers WHERE enrollment_number LIKE '%-%' AND is_active = TRUE";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(rangeSql)) {
            
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                String rangePattern = rs.getString("enrollment_number");
                Long courseId = rs.getLong("course_id");
                
                if (isEnrollmentInRange(enrollmentNumber, rangePattern)) {
                    // Avoid duplicates
                    if (!courseIds.contains(courseId)) {
                        courseIds.add(courseId);
                    }
                }
            }
        }
        
        return courseIds;
    }
    
    /**
     * Check if an enrollment number falls within a range pattern like "230600-230700"
     */
    private boolean isEnrollmentInRange(String enrollmentNumber, String rangePattern) {
        if (!rangePattern.contains("-")) {
            return false;
        }
        
        try {
            String[] parts = rangePattern.split("-");
            if (parts.length != 2) {
                return false;
            }
            
            long enrollmentNum = Long.parseLong(enrollmentNumber.trim());
            long rangeStart = Long.parseLong(parts[0].trim());
            long rangeEnd = Long.parseLong(parts[1].trim());
            
            return enrollmentNum >= rangeStart && enrollmentNum <= rangeEnd;
            
        } catch (NumberFormatException e) {
            // If parsing fails, it's not a valid numeric range
            return false;
        }
    }

    public List<String> findEnrollmentNumbersByCourseId(Long courseId) throws SQLException {
        String sql = "SELECT enrollment_number FROM enrollment_numbers WHERE course_id = ? AND is_active = TRUE";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            
            List<String> enrollmentNumbers = new ArrayList<>();
            while (rs.next()) {
                enrollmentNumbers.add(rs.getString("enrollment_number"));
            }
            return enrollmentNumbers;
        }
    }

    public void addEnrollmentNumber(String enrollmentNumber, Long courseId) throws SQLException {
        // First check if this enrollment number already exists for this course
        // This now includes checking ranges
        if (isEnrollmentNumberValid(enrollmentNumber, courseId)) {
            if (enrollmentNumber.contains("-")) {
                throw new SQLException("Range '" + enrollmentNumber + "' overlaps with existing enrollments in this course");
            } else {
                throw new SQLException("Enrollment number '" + enrollmentNumber + "' is already enrolled in this course or covered by an existing range");
            }
        }
        
        // If adding a range, check for conflicts with existing individual numbers
        if (enrollmentNumber.contains("-")) {
            List<String> existingNumbers = findEnrollmentNumbersByCourseId(courseId);
            for (String existing : existingNumbers) {
                if (!existing.contains("-") && isEnrollmentInRange(existing, enrollmentNumber)) {
                    throw new SQLException("Range '" + enrollmentNumber + "' conflicts with existing enrollment number '" + existing + "'");
                }
            }
        }
        
        String sql = "INSERT INTO enrollment_numbers (enrollment_number, course_id, is_active) VALUES (?, ?, TRUE)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, enrollmentNumber);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    /**
     * Add multiple enrollment numbers in batch for better performance
     */
    public void addEnrollmentNumbersBatch(List<String> enrollmentNumbers, Long courseId) throws SQLException {
        String sql = "INSERT IGNORE INTO enrollment_numbers (enrollment_number, course_id, is_active) VALUES (?, ?, TRUE)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            conn.setAutoCommit(false);
            
            for (String enrollmentNumber : enrollmentNumbers) {
                stmt.setString(1, enrollmentNumber);
                stmt.setLong(2, courseId);
                stmt.addBatch();
            }
            
            stmt.executeBatch();
            conn.commit();
            conn.setAutoCommit(true);
        }
    }

    public void removeEnrollmentNumber(String enrollmentNumber, Long courseId) throws SQLException {
        String sql = "DELETE FROM enrollment_numbers WHERE enrollment_number = ? AND course_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, enrollmentNumber);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    public void deactivateEnrollmentNumber(String enrollmentNumber, Long courseId) throws SQLException {
        String sql = "UPDATE enrollment_numbers SET is_active = FALSE WHERE enrollment_number = ? AND course_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, enrollmentNumber);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    public boolean isEnrollmentNumberValid(String enrollmentNumber, Long courseId) throws SQLException {
        // Check for exact match first
        String exactMatchSql = "SELECT COUNT(*) FROM enrollment_numbers WHERE enrollment_number = ? AND course_id = ? AND is_active = TRUE";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(exactMatchSql)) {
            
            stmt.setString(1, enrollmentNumber);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next() && rs.getInt(1) > 0) {
                return true;
            }
        }
        
        // Check for range matches
        String rangeSql = "SELECT enrollment_number FROM enrollment_numbers WHERE enrollment_number LIKE '%-%' AND course_id = ? AND is_active = TRUE";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(rangeSql)) {
            
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                String rangePattern = rs.getString("enrollment_number");
                if (isEnrollmentInRange(enrollmentNumber, rangePattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}