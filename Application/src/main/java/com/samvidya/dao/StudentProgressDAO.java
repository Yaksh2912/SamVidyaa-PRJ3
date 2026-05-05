package com.samvidya.dao;

import com.samvidya.model.StudentProgress;
import com.samvidya.util.DatabaseUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class StudentProgressDAO {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void createProgress(StudentProgress progress) throws SQLException {
        String sql = "INSERT INTO student_progress " +
            "(student_id, course_id, module_id, completed_tasks, total_tasks, " +
            " module_test_completed, course_test_completed, total_score, max_possible_score, " +
            " progress_percentage, assigned_question_ids, module_status, tasks_passed_count, " +
            " min_tasks_required, can_attempt_module_test, module_test_score, module_test_max_score, module_test_passed) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setLong(1, progress.getStudentId());
            stmt.setLong(2, progress.getCourseId());
            stmt.setLong(3, progress.getModuleId());
            stmt.setInt(4, progress.getCompletedTasks());
            stmt.setInt(5, progress.getTotalTasks());
            stmt.setBoolean(6, progress.isModuleTestCompleted());
            stmt.setBoolean(7, progress.isCourseTestCompleted());
            stmt.setInt(8, progress.getTotalScore());
            stmt.setInt(9, progress.getMaxPossibleScore());
            stmt.setDouble(10, progress.getProgressPercentage());
            stmt.setString(11, progress.getAssignedQuestionIds() != null ? 
                objectMapper.writeValueAsString(progress.getAssignedQuestionIds()) : null);
            stmt.setString(12, progress.getModuleStatus());
            stmt.setInt(13, progress.getTasksPassedCount());
            stmt.setInt(14, progress.getMinTasksRequired());
            stmt.setBoolean(15, progress.isCanAttemptModuleTest());
            stmt.setInt(16, progress.getModuleTestScore());
            stmt.setInt(17, progress.getModuleTestMaxScore());
            stmt.setBoolean(18, progress.isModuleTestPassed());
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    progress.setId(rs.getLong(1));
                }
            }
        } catch (Exception e) {
            throw new SQLException("Error creating student progress", e);
        }
    }

    public StudentProgress findByStudentCourseModule(Long studentId, Long courseId, Long moduleId) throws SQLException {
        String sql = "SELECT * FROM student_progress WHERE student_id = ? AND course_id = ? AND module_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.setLong(3, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToStudentProgress(rs);
            }
            return null;
        }
    }

    public List<StudentProgress> findByStudentAndCourse(Long studentId, Long courseId) throws SQLException {
        String sql = "SELECT sp.*, m.module_name, m.module_order FROM student_progress sp " +
                    "JOIN modules m ON sp.module_id = m.id " +
                    "WHERE sp.student_id = ? AND sp.course_id = ? " +
                    "ORDER BY m.module_order";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentProgress> progressList = new ArrayList<>();
            while (rs.next()) {
                progressList.add(mapResultSetToStudentProgress(rs));
            }
            return progressList;
        }
    }

    public void updateProgress(StudentProgress progress) throws SQLException {
        String sql = "UPDATE student_progress SET " +
            "completed_tasks = ?, total_tasks = ?, module_test_completed = ?, " +
            "course_test_completed = ?, total_score = ?, max_possible_score = ?, " +
            "progress_percentage = ?, assigned_question_ids = ?, module_status = ?, " +
            "tasks_passed_count = ?, min_tasks_required = ?, can_attempt_module_test = ?, " +
            "module_test_score = ?, module_test_max_score = ?, module_test_passed = ?, " +
            "last_activity = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP " +
            "WHERE id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, progress.getCompletedTasks());
            stmt.setInt(2, progress.getTotalTasks());
            stmt.setBoolean(3, progress.isModuleTestCompleted());
            stmt.setBoolean(4, progress.isCourseTestCompleted());
            stmt.setInt(5, progress.getTotalScore());
            stmt.setInt(6, progress.getMaxPossibleScore());
            stmt.setDouble(7, progress.getProgressPercentage());
            stmt.setString(8, progress.getAssignedQuestionIds() != null ? 
                objectMapper.writeValueAsString(progress.getAssignedQuestionIds()) : null);
            stmt.setString(9, progress.getModuleStatus());
            stmt.setInt(10, progress.getTasksPassedCount());
            stmt.setInt(11, progress.getMinTasksRequired());
            stmt.setBoolean(12, progress.isCanAttemptModuleTest());
            stmt.setInt(13, progress.getModuleTestScore());
            stmt.setInt(14, progress.getModuleTestMaxScore());
            stmt.setBoolean(15, progress.isModuleTestPassed());
            stmt.setLong(16, progress.getId());
            
            stmt.executeUpdate();
        } catch (Exception e) {
            throw new SQLException("Error updating student progress", e);
        }
    }

    public StudentProgress createOrUpdateProgress(Long studentId, Long courseId, Long moduleId) throws SQLException {
        StudentProgress existing = findByStudentCourseModule(studentId, courseId, moduleId);
        if (existing != null) {
            return existing;
        }

        // Create new progress record
        StudentProgress progress = new StudentProgress(studentId, courseId, moduleId);
        
        // Get module configuration
        String sql = "SELECT tasks_per_module, total_tasks FROM modules WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, moduleId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                progress.setMinTasksRequired(rs.getInt("tasks_per_module"));
                progress.setTotalTasks(rs.getInt("total_tasks"));
            }
        }

        createProgress(progress);
        return progress;
    }

    private StudentProgress mapResultSetToStudentProgress(ResultSet rs) throws SQLException {
        StudentProgress progress = new StudentProgress();
        progress.setId(rs.getLong("id"));
        progress.setStudentId(rs.getLong("student_id"));
        progress.setCourseId(rs.getLong("course_id"));
        progress.setModuleId(rs.getLong("module_id"));
        progress.setCompletedTasks(rs.getInt("completed_tasks"));
        progress.setTotalTasks(rs.getInt("total_tasks"));
        progress.setModuleTestCompleted(rs.getBoolean("module_test_completed"));
        progress.setCourseTestCompleted(rs.getBoolean("course_test_completed"));
        progress.setTotalScore(rs.getInt("total_score"));
        progress.setMaxPossibleScore(rs.getInt("max_possible_score"));
        progress.setProgressPercentage(rs.getDouble("progress_percentage"));
        progress.setModuleStatus(rs.getString("module_status"));
        progress.setTasksPassedCount(rs.getInt("tasks_passed_count"));
        progress.setMinTasksRequired(rs.getInt("min_tasks_required"));
        progress.setCanAttemptModuleTest(rs.getBoolean("can_attempt_module_test"));
        progress.setModuleTestScore(rs.getInt("module_test_score"));
        progress.setModuleTestMaxScore(rs.getInt("module_test_max_score"));
        progress.setModuleTestPassed(rs.getBoolean("module_test_passed"));
        
        // Handle JSON fields
        try {
            String assignedQuestionIds = rs.getString("assigned_question_ids");
            if (assignedQuestionIds != null && !assignedQuestionIds.isEmpty()) {
                progress.setAssignedQuestionIds(objectMapper.readValue(assignedQuestionIds, 
                    new TypeReference<List<Long>>() {}));
            }
        } catch (Exception e) {
            // Handle JSON parsing errors gracefully
            progress.setAssignedQuestionIds(new ArrayList<>());
        }
        
        // Handle timestamps
        Timestamp lastActivity = rs.getTimestamp("last_activity");
        if (lastActivity != null) {
            progress.setLastActivity(lastActivity.toLocalDateTime());
        }
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            progress.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            progress.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return progress;
    }
}