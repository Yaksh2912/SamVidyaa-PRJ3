package com.samvidya.dao;

import com.samvidya.model.Course;
import com.samvidya.model.Module;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO {

    public Course getCourseById(Long id) throws SQLException {
        return findById(id);
    }

    public Course findById(Long id) throws SQLException {
        String sql = "SELECT * FROM courses WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToCourse(rs);
            }
            return null;
        }
    }

    public Course findByCourseCode(String courseCode) throws SQLException {
        String sql = "SELECT * FROM courses WHERE course_code = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, courseCode);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToCourse(rs);
            }
            return null;
        }
    }

    public List<Course> findByInstructorId(Long instructorId) throws SQLException {
        String sql = "SELECT * FROM courses WHERE instructor_id = ? AND is_active = TRUE ORDER BY course_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, instructorId);
            ResultSet rs = stmt.executeQuery();
            
            List<Course> courses = new ArrayList<>();
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                loadModulesForCourse(course);
                courses.add(course);
            }
            return courses;
        }
    }

    public List<Course> findAllByInstructorId(Long instructorId) throws SQLException {
        String sql = "SELECT * FROM courses WHERE instructor_id = ? ORDER BY course_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, instructorId);
            ResultSet rs = stmt.executeQuery();
            
            List<Course> courses = new ArrayList<>();
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                loadModulesForCourse(course);
                courses.add(course);
            }
            return courses;
        }
    }

    public List<Course> findActiveCourses() throws SQLException {
        String sql = "SELECT * FROM courses WHERE is_active = TRUE ORDER BY course_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            ResultSet rs = stmt.executeQuery();
            List<Course> courses = new ArrayList<>();
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                loadModulesForCourse(course);
                courses.add(course);
            }
            return courses;
        }
    }

    public List<Course> findAllCourses() throws SQLException {
        String sql = "SELECT * FROM courses ORDER BY course_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            ResultSet rs = stmt.executeQuery();
            List<Course> courses = new ArrayList<>();
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                loadModulesForCourse(course);
                courses.add(course);
            }
            return courses;
        }
    }
    
    private void loadModulesForCourse(Course course) throws SQLException {
        if (course.getId() != null) {
            ModuleDAO moduleDAO = new ModuleDAO();
            List<Module> modules = moduleDAO.findByCourseId(course.getId());
            course.setModules(modules);
        }
    }

    public Long save(Course course) throws SQLException {
        if (course.getId() == null) {
            return insert(course);
        } else {
            update(course);
            return course.getId();
        }
    }

    private Long insert(Course course) throws SQLException {
        String sql = "INSERT INTO courses (course_code, course_name, description, subject, instructor_id, instructor_name, course_test_questions, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, course.getCourseCode());
            stmt.setString(2, course.getCourseName());
            stmt.setString(3, course.getDescription());
            stmt.setString(4, course.getSubject());
            stmt.setLong(5, course.getInstructorId());
            stmt.setString(6, course.getInstructorName());
            stmt.setInt(7, course.getCourseTestQuestions());
            stmt.setBoolean(8, course.isActive());
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating course failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    course.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating course failed, no ID obtained.");
                }
            }
        }
    }

    private void update(Course course) throws SQLException {
        String sql = "UPDATE courses SET course_code = ?, course_name = ?, description = ?, subject = ?, instructor_id = ?, instructor_name = ?, course_test_questions = ?, is_active = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, course.getCourseCode());
            stmt.setString(2, course.getCourseName());
            stmt.setString(3, course.getDescription());
            stmt.setString(4, course.getSubject());
            stmt.setLong(5, course.getInstructorId());
            stmt.setString(6, course.getInstructorName());
            stmt.setInt(7, course.getCourseTestQuestions());
            stmt.setBoolean(8, course.isActive());
            stmt.setLong(9, course.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM courses WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public List<Course> findEnrolledCourses(Long studentId) throws SQLException {
        String sql = "SELECT c.* FROM courses c " +
                    "INNER JOIN student_enrollments se ON c.id = se.course_id " +
                    "WHERE se.student_id = ? AND se.is_active = TRUE AND c.is_active = TRUE " +
                    "ORDER BY c.course_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, studentId);
            ResultSet rs = stmt.executeQuery();
            
            List<Course> courses = new ArrayList<>();
            while (rs.next()) {
                courses.add(mapResultSetToCourse(rs));
            }
            return courses;
        }
    }

    private Course mapResultSetToCourse(ResultSet rs) throws SQLException {
        Course course = new Course();
        course.setId(rs.getLong("id"));
        course.setCourseCode(rs.getString("course_code"));
        course.setCourseName(rs.getString("course_name"));
        course.setDescription(rs.getString("description"));
        course.setSubject(rs.getString("subject"));
        course.setInstructorId(rs.getLong("instructor_id"));
        course.setInstructorName(rs.getString("instructor_name"));
        course.setCourseTestQuestions(rs.getInt("course_test_questions"));
        course.setActive(rs.getBoolean("is_active"));
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            course.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            course.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return course;
    }
}