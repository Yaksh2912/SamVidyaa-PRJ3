package com.samvidya.dao;

import com.samvidya.model.StudentAttempt;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class StudentAttemptDAO {

    public List<StudentAttempt> findLatestByStudentAndTask(Long studentId, Long taskId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND task_id = ? AND is_latest = TRUE ORDER BY submitted_at DESC";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, taskId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentAttempt> attempts = new ArrayList<>();
            while (rs.next()) {
                attempts.add(mapResultSetToStudentAttempt(rs));
            }
            return attempts;
        }
    }

    public StudentAttempt findLatestAttemptByStudentAndTask(Long studentId, Long taskId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND task_id = ? AND is_latest = TRUE ORDER BY submitted_at DESC LIMIT 1";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, taskId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToStudentAttempt(rs);
            }
            return null;
        }
    }

    public StudentAttempt findLatestAttemptByStudentAndQuestion(Long studentId, Long questionId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND question_id = ? AND is_latest = TRUE ORDER BY submitted_at DESC LIMIT 1";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, questionId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToStudentAttempt(rs);
            }
            return null;
        }
    }

    public List<StudentAttempt> findByStudentAndQuestion(Long studentId, Long questionId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND question_id = ? ORDER BY attempt_number DESC";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, questionId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentAttempt> attempts = new ArrayList<>();
            while (rs.next()) {
                attempts.add(mapResultSetToStudentAttempt(rs));
            }
            return attempts;
        }
    }

    public List<StudentAttempt> findByStudentAndModule(Long studentId, Long moduleId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND module_id = ? ORDER BY submitted_at DESC";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentAttempt> attempts = new ArrayList<>();
            while (rs.next()) {
                attempts.add(mapResultSetToStudentAttempt(rs));
            }
            return attempts;
        }
    }

    public List<StudentAttempt> findByStudentAndCourse(Long studentId, Long courseId) throws SQLException {
        String sql = "SELECT * FROM student_attempts WHERE student_id = ? AND course_id = ? ORDER BY submitted_at DESC";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentAttempt> attempts = new ArrayList<>();
            while (rs.next()) {
                attempts.add(mapResultSetToStudentAttempt(rs));
            }
            return attempts;
        }
    }

    public void save(StudentAttempt attempt) throws SQLException {
        Connection conn = null;
        try {
            conn = DatabaseUtil.getConnection();
            conn.setAutoCommit(false); // Start transaction
            
            // First, mark previous attempts as not latest for the same student-task/question combination
            if (attempt.getTaskId() != null) {
                String updateSql = "UPDATE student_attempts SET is_latest = FALSE " +
                                 "WHERE student_id = ? AND task_id = ? AND is_latest = TRUE";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setLong(1, attempt.getStudentId());
                    updateStmt.setLong(2, attempt.getTaskId());
                    updateStmt.executeUpdate();
                }
            }
            
            if (attempt.getQuestionId() != null) {
                String updateSql = "UPDATE student_attempts SET is_latest = FALSE " +
                                 "WHERE student_id = ? AND question_id = ? AND is_latest = TRUE";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setLong(1, attempt.getStudentId());
                    updateStmt.setLong(2, attempt.getQuestionId());
                    updateStmt.executeUpdate();
                }
            }
            
            // Now insert the new attempt as latest
            String insertSql = "INSERT INTO student_attempts " +
                "(student_id, task_id, question_id, module_id, course_id, attempt_type, " +
                " submitted_code, execution_result, is_correct, score, max_score, attempt_number, " +
                " execution_time, status, is_latest, is_peer_helped, peer_help_request_id, submitted_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insertStmt.setLong(1, attempt.getStudentId());
                if (attempt.getTaskId() != null) {
                    insertStmt.setLong(2, attempt.getTaskId());
                } else {
                    insertStmt.setNull(2, Types.BIGINT);
                }
                if (attempt.getQuestionId() != null) {
                    insertStmt.setLong(3, attempt.getQuestionId());
                } else {
                    insertStmt.setNull(3, Types.BIGINT);
                }
                if (attempt.getModuleId() != null) {
                    insertStmt.setLong(4, attempt.getModuleId());
                } else {
                    insertStmt.setNull(4, Types.BIGINT);
                }
                insertStmt.setLong(5, attempt.getCourseId());
                insertStmt.setString(6, attempt.getAttemptType());
                insertStmt.setString(7, attempt.getSubmittedCode());
                insertStmt.setString(8, attempt.getExecutionResult());
                insertStmt.setBoolean(9, attempt.isCorrect());
                insertStmt.setInt(10, attempt.getScore());
                insertStmt.setInt(11, attempt.getMaxScore());
                insertStmt.setInt(12, attempt.getAttemptNumber());
                insertStmt.setLong(13, attempt.getExecutionTime());
                insertStmt.setString(14, attempt.getStatus());
                insertStmt.setBoolean(15, true); // Always true for new attempts
                insertStmt.setBoolean(16, attempt.isPeerHelped());
                if (attempt.getPeerHelpRequestId() != null) {
                    insertStmt.setLong(17, attempt.getPeerHelpRequestId());
                } else {
                    insertStmt.setNull(17, Types.BIGINT);
                }
                insertStmt.setTimestamp(18, attempt.getSubmittedAt() != null ?
                    Timestamp.valueOf(attempt.getSubmittedAt()) : new Timestamp(System.currentTimeMillis()));
                insertStmt.setTimestamp(19, attempt.getCompletedAt() != null ?
                    Timestamp.valueOf(attempt.getCompletedAt()) : null);
                
                insertStmt.executeUpdate();
                
                try (ResultSet rs = insertStmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        attempt.setId(rs.getLong(1));
                    }
                }
            }
            
            conn.commit(); // Commit transaction first
            
            // Manually call the stored procedure to update progression (outside transaction)
            // Only for module-related attempts (course tests don't have module_id)
            if (attempt.getModuleId() != null) {
                try {
                    String callSql = "CALL UpdateStudentProgression(?, ?, ?)";
                    try (PreparedStatement callStmt = conn.prepareStatement(callSql)) {
                        callStmt.setLong(1, attempt.getStudentId());
                        callStmt.setLong(2, attempt.getCourseId());
                        callStmt.setLong(3, attempt.getModuleId());
                        callStmt.execute();
                    }
                } catch (SQLException e) {
                    System.err.println("Warning: Failed to update progression: " + e.getMessage());
                }
            }
            
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Rollback on error
                } catch (SQLException rollbackEx) {
                    e.addSuppressed(rollbackEx);
                }
            }
            throw e;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true); // Reset auto-commit
                    conn.close();
                } catch (SQLException closeEx) {
                    // Log but don't throw
                    System.err.println("Warning: Failed to close connection: " + closeEx.getMessage());
                }
            }
        }
    }

    public int countPassedTasksForModule(Long studentId, Long moduleId) throws SQLException {
        String sql = "SELECT COUNT(DISTINCT task_id) FROM student_attempts " +
                    "WHERE student_id = ? AND module_id = ? AND attempt_type = 'TASK' " +
                    "AND is_latest = TRUE AND score >= (max_score * 0.5)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        }
    }

    public boolean isModuleTestPassed(Long studentId, Long moduleId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM student_attempts " +
                    "WHERE student_id = ? AND module_id = ? AND attempt_type = 'MODULE_TEST' " +
                    "AND is_latest = TRUE AND score >= (max_score * 0.5)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
            return false;
        }
    }

    public boolean isCourseTestPassed(Long studentId, Long courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM student_attempts " +
                    "WHERE student_id = ? AND course_id = ? AND attempt_type = 'COURSE_TEST' " +
                    "AND is_latest = TRUE AND score >= (max_score * 0.5)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
            return false;
        }
    }

    private StudentAttempt mapResultSetToStudentAttempt(ResultSet rs) throws SQLException {
        StudentAttempt attempt = new StudentAttempt();
        attempt.setId(rs.getLong("id"));
        attempt.setStudentId(rs.getLong("student_id"));
        
        Long taskId = rs.getLong("task_id");
        if (!rs.wasNull()) {
            attempt.setTaskId(taskId);
        }
        
        Long questionId = rs.getLong("question_id");
        if (!rs.wasNull()) {
            attempt.setQuestionId(questionId);
        }
        
        Long moduleId = rs.getObject("module_id", Long.class);
        attempt.setModuleId(moduleId); // This can be null for course tests
        attempt.setCourseId(rs.getLong("course_id"));
        attempt.setAttemptType(rs.getString("attempt_type"));
        attempt.setSubmittedCode(rs.getString("submitted_code"));
        attempt.setExecutionResult(rs.getString("execution_result"));
        attempt.setCorrect(rs.getBoolean("is_correct"));
        attempt.setScore(rs.getInt("score"));
        attempt.setMaxScore(rs.getInt("max_score"));
        attempt.setAttemptNumber(rs.getInt("attempt_number"));
        attempt.setExecutionTime(rs.getLong("execution_time"));
        attempt.setStatus(rs.getString("status"));
        attempt.setLatest(rs.getBoolean("is_latest"));
        attempt.setPeerHelped(rs.getBoolean("is_peer_helped"));
        Long peerReqId = rs.getObject("peer_help_request_id", Long.class);
        attempt.setPeerHelpRequestId(peerReqId);
        
        Timestamp submittedAt = rs.getTimestamp("submitted_at");
        if (submittedAt != null) {
            attempt.setSubmittedAt(submittedAt.toLocalDateTime());
        }
        
        Timestamp completedAt = rs.getTimestamp("completed_at");
        if (completedAt != null) {
            attempt.setCompletedAt(completedAt.toLocalDateTime());
        }
        
        return attempt;
    }
}