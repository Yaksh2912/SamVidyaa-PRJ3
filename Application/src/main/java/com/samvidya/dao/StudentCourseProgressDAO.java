package com.samvidya.dao;

import com.samvidya.model.StudentCourseProgress;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class StudentCourseProgressDAO {

    public StudentCourseProgress findByStudentAndCourse(Long studentId, Long courseId) throws SQLException {
        String sql = "SELECT * FROM student_course_progress WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToStudentCourseProgress(rs);
            }
            return null;
        }
    }

    public List<StudentCourseProgress> findByStudent(Long studentId) throws SQLException {
        String sql = "SELECT * FROM student_course_progress WHERE student_id = ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            ResultSet rs = stmt.executeQuery();
            
            List<StudentCourseProgress> progressList = new ArrayList<>();
            while (rs.next()) {
                progressList.add(mapResultSetToStudentCourseProgress(rs));
            }
            return progressList;
        }
    }

    public void save(StudentCourseProgress progress) throws SQLException {
        if (progress.getId() == null) {
            create(progress);
        } else {
            update(progress);
        }
    }

    public void create(StudentCourseProgress progress) throws SQLException {
        String sql = "INSERT INTO student_course_progress " +
            "(student_id, course_id, current_module_order, modules_completed, total_modules, total_course_points, " +
            " can_attempt_course_test, course_test_completed, course_test_score, course_test_max_score, course_test_passed," +
            " peer_helps_given, peer_help_points_earned) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setLong(1, progress.getStudentId());
            stmt.setLong(2, progress.getCourseId());
            stmt.setInt(3, progress.getCurrentModuleOrder());
            stmt.setInt(4, progress.getModulesCompleted());
            stmt.setInt(5, progress.getTotalModules());
            stmt.setInt(6, progress.getTotalCoursePoints());
            stmt.setBoolean(7, progress.isCanAttemptCourseTest());
            stmt.setBoolean(8, progress.isCourseTestCompleted());
            stmt.setInt(9, progress.getCourseTestScore());
            stmt.setInt(10, progress.getCourseTestMaxScore());
            stmt.setBoolean(11, progress.isCourseTestPassed());
            stmt.setInt(12, progress.getPeerHelpsGiven());
            stmt.setInt(13, progress.getPeerHelpPointsEarned());
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    progress.setId(rs.getLong(1));
                }
            }
        }
    }

    public void update(StudentCourseProgress progress) throws SQLException {
        String sql = "UPDATE student_course_progress SET " +
            "current_module_order = ?, modules_completed = ?, total_modules = ?, total_course_points = ?, " +
            "can_attempt_course_test = ?, course_test_completed = ?, course_test_score = ?, " +
            "course_test_max_score = ?, course_test_passed = ?, updated_at = CURRENT_TIMESTAMP " +
            "WHERE id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, progress.getCurrentModuleOrder());
            stmt.setInt(2, progress.getModulesCompleted());
            stmt.setInt(3, progress.getTotalModules());
            stmt.setInt(4, progress.getTotalCoursePoints());
            stmt.setBoolean(5, progress.isCanAttemptCourseTest());
            stmt.setBoolean(6, progress.isCourseTestCompleted());
            stmt.setInt(7, progress.getCourseTestScore());
            stmt.setInt(8, progress.getCourseTestMaxScore());
            stmt.setBoolean(9, progress.isCourseTestPassed());
            stmt.setLong(10, progress.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM student_course_progress WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public StudentCourseProgress createOrUpdate(Long studentId, Long courseId, int totalModules) throws SQLException {
        StudentCourseProgress existing = findByStudentAndCourse(studentId, courseId);
        
        if (existing != null) {
            existing.setTotalModules(totalModules);
            update(existing);
            return existing;
        } else {
            StudentCourseProgress newProgress = new StudentCourseProgress(studentId, courseId);
            newProgress.setTotalModules(totalModules);
            create(newProgress);
            return newProgress;
        }
    }

    public void updateCurrentModuleOrder(Long studentId, Long courseId, int moduleOrder) throws SQLException {
        String sql = "UPDATE student_course_progress SET current_module_order = ?, updated_at = CURRENT_TIMESTAMP " +
                    "WHERE student_id = ? AND course_id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, moduleOrder);
            stmt.setLong(2, studentId);
            stmt.setLong(3, courseId);
            stmt.executeUpdate();
        }
    }

    public void updateModulesCompleted(Long studentId, Long courseId, int modulesCompleted) throws SQLException {
        String sql = "UPDATE student_course_progress SET " +
                    "modules_completed = ?, " +
                    "can_attempt_course_test = (modules_completed >= total_modules), " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE student_id = ? AND course_id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, modulesCompleted);
            stmt.setLong(2, studentId);
            stmt.setLong(3, courseId);
            stmt.executeUpdate();
        }
    }

    public void updateCoursePoints(Long studentId, Long courseId) throws SQLException {
        String sql = "UPDATE student_course_progress scp " +
                    "SET total_course_points = COALESCE(( " +
                    "    SELECT SUM(best_score) " +
                    "    FROM ( " +
                    "        SELECT task_id, MAX(score) as best_score " +
                    "        FROM student_attempts " +
                    "        WHERE student_id = scp.student_id " +
                    "          AND course_id = scp.course_id " +
                    "          AND task_id IS NOT NULL " +
                    "          AND is_latest = TRUE " +
                    "        GROUP BY task_id " +
                    "        UNION ALL " +
                    "        SELECT question_id, MAX(score) as best_score " +
                    "        FROM student_attempts " +
                    "        WHERE student_id = scp.student_id " +
                    "          AND course_id = scp.course_id " +
                    "          AND question_id IS NOT NULL " +
                    "          AND is_latest = TRUE " +
                    "        GROUP BY question_id " +
                    "    ) course_scores " +
                    "), 0), " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE student_id = ? AND course_id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            stmt.executeUpdate();
        }
    }

    private StudentCourseProgress mapResultSetToStudentCourseProgress(ResultSet rs) throws SQLException {
        StudentCourseProgress progress = new StudentCourseProgress();
        progress.setId(rs.getLong("id"));
        progress.setStudentId(rs.getLong("student_id"));
        progress.setCourseId(rs.getLong("course_id"));
        progress.setCurrentModuleOrder(rs.getInt("current_module_order"));
        progress.setModulesCompleted(rs.getInt("modules_completed"));
        progress.setTotalModules(rs.getInt("total_modules"));
        progress.setTotalCoursePoints(rs.getInt("total_course_points"));
        progress.setCanAttemptCourseTest(rs.getBoolean("can_attempt_course_test"));
        progress.setCourseTestCompleted(rs.getBoolean("course_test_completed"));
        progress.setCourseTestScore(rs.getInt("course_test_score"));
        progress.setCourseTestMaxScore(rs.getInt("course_test_max_score"));
        progress.setCourseTestPassed(rs.getBoolean("course_test_passed"));
        progress.setPeerHelpsGiven(rs.getInt("peer_helps_given"));
        progress.setPeerHelpPointsEarned(rs.getInt("peer_help_points_earned"));
        
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