package com.samvidya.dao;

import com.samvidya.model.CodingQuestion;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CodingQuestionDAO {

    public List<CodingQuestion> findByCourseIdAndType(Long courseId, String questionType) throws SQLException {
        String sql = "SELECT * FROM coding_questions WHERE course_id = ? AND question_type = ? ORDER BY created_at";
        List<CodingQuestion> questions = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, courseId);
            stmt.setString(2, questionType);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    questions.add(mapResultSetToCodingQuestion(rs));
                }
            }
        }
        
        return questions;
    }

    public List<CodingQuestion> findCourseTests(Long courseId) throws SQLException {
        return findByCourseIdAndType(courseId, "COURSE_TEST");
    }

    public List<CodingQuestion> findModuleTests(Long moduleId) throws SQLException {
        String sql = "SELECT * FROM coding_questions WHERE module_id = ? AND question_type = 'MODULE_TEST' ORDER BY created_at";
        List<CodingQuestion> questions = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, moduleId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    questions.add(mapResultSetToCodingQuestion(rs));
                }
            }
        }
        
        return questions;
    }

    public List<CodingQuestion> findByModuleId(Long moduleId) throws SQLException {
        return findModuleTests(moduleId);
    }

    public List<CodingQuestion> findByCourseId(Long courseId) throws SQLException {
        return findCourseTests(courseId);
    }

    public List<CodingQuestion> getQuestionsByModuleId(Long moduleId, String questionType) throws SQLException {
        String sql = "SELECT * FROM coding_questions WHERE module_id = ? AND question_type = ? ORDER BY created_at";
        List<CodingQuestion> questions = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, moduleId);
            stmt.setString(2, questionType);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    questions.add(mapResultSetToCodingQuestion(rs));
                }
            }
        }
        
        return questions;
    }

    public List<CodingQuestion> getQuestionsByCourseId(Long courseId, String questionType) throws SQLException {
        String sql = "SELECT * FROM coding_questions WHERE course_id = ? AND question_type = ? ORDER BY created_at";
        List<CodingQuestion> questions = new ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, courseId);
            stmt.setString(2, questionType);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    questions.add(mapResultSetToCodingQuestion(rs));
                }
            }
        }
        
        return questions;
    }

    public CodingQuestion getQuestionById(Long id) throws SQLException {
        return findById(id);
    }

    public CodingQuestion findById(Long id) throws SQLException {
        String sql = "SELECT * FROM coding_questions WHERE id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSetToCodingQuestion(rs);
                }
            }
        }
        
        return null;
    }

    public Long save(CodingQuestion question) throws SQLException {
        if (question.getId() == null) {
            return insert(question);
        } else {
            update(question);
            return question.getId();
        }
    }

    private Long insert(CodingQuestion question) throws SQLException {
        String sql = "INSERT INTO coding_questions (module_id, course_id, question_type, question_text, " +
                    "problem_statement, expected_output, sample_input, sample_output, difficulty, points, " +
                    "time_limit, language, test_cases, test_cases_count, attachment_paths, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setObject(1, question.getModuleId());
            stmt.setLong(2, question.getCourseId());
            stmt.setString(3, question.getQuestionType());
            stmt.setString(4, question.getQuestionText());
            stmt.setString(5, question.getProblemStatement());
            stmt.setString(6, question.getExpectedOutput());
            stmt.setString(7, question.getSampleInput());
            stmt.setString(8, question.getSampleOutput());
            stmt.setString(9, question.getDifficulty());
            stmt.setInt(10, question.getPoints());
            stmt.setInt(11, question.getTimeLimit());
            stmt.setString(12, question.getLanguage());
            stmt.setString(13, question.getTestCases() != null ? String.join(",", question.getTestCases()) : null);
            stmt.setInt(14, question.getTestCasesCount());
            stmt.setString(15, question.getAttachmentPaths() != null ? String.join(",", question.getAttachmentPaths()) : null);
            stmt.setTimestamp(16, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setTimestamp(17, Timestamp.valueOf(LocalDateTime.now()));
            
            stmt.executeUpdate();
            
            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    question.setId(generatedKeys.getLong(1));
                    return question.getId();
                }
            }
        }
        return null;
    }

    private void update(CodingQuestion question) throws SQLException {
        String sql = "UPDATE coding_questions SET module_id = ?, course_id = ?, question_type = ?, " +
                    "question_text = ?, problem_statement = ?, expected_output = ?, sample_input = ?, " +
                    "sample_output = ?, difficulty = ?, points = ?, time_limit = ?, language = ?, " +
                    "test_cases = ?, test_cases_count = ?, attachment_paths = ?, updated_at = ? WHERE id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setObject(1, question.getModuleId());
            stmt.setLong(2, question.getCourseId());
            stmt.setString(3, question.getQuestionType());
            stmt.setString(4, question.getQuestionText());
            stmt.setString(5, question.getProblemStatement());
            stmt.setString(6, question.getExpectedOutput());
            stmt.setString(7, question.getSampleInput());
            stmt.setString(8, question.getSampleOutput());
            stmt.setString(9, question.getDifficulty());
            stmt.setInt(10, question.getPoints());
            stmt.setInt(11, question.getTimeLimit());
            stmt.setString(12, question.getLanguage());
            stmt.setString(13, question.getTestCases() != null ? String.join(",", question.getTestCases()) : null);
            stmt.setInt(14, question.getTestCasesCount());
            stmt.setString(15, question.getAttachmentPaths() != null ? String.join(",", question.getAttachmentPaths()) : null);
            stmt.setTimestamp(16, Timestamp.valueOf(LocalDateTime.now()));
            stmt.setLong(17, question.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM coding_questions WHERE id = ?";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private CodingQuestion mapResultSetToCodingQuestion(ResultSet rs) throws SQLException {
        CodingQuestion question = new CodingQuestion();
        
        question.setId(rs.getLong("id"));
        question.setModuleId(rs.getObject("module_id", Long.class));
        question.setCourseId(rs.getLong("course_id"));
        question.setQuestionType(rs.getString("question_type"));
        question.setQuestionText(rs.getString("question_text"));
        question.setProblemStatement(rs.getString("problem_statement"));
        question.setExpectedOutput(rs.getString("expected_output"));
        question.setSampleInput(rs.getString("sample_input"));
        question.setSampleOutput(rs.getString("sample_output"));
        question.setDifficulty(rs.getString("difficulty"));
        question.setPoints(rs.getInt("points"));
        question.setTimeLimit(rs.getInt("time_limit"));
        question.setLanguage(rs.getString("language"));
        question.setTestCasesCount(rs.getInt("test_cases_count"));
        
        // Handle JSON fields
        String testCasesJson = rs.getString("test_cases");
        if (testCasesJson != null && !testCasesJson.isEmpty()) {
            question.setTestCases(List.of(testCasesJson.split(",")));
        }
        
        String attachmentPathsJson = rs.getString("attachment_paths");
        if (attachmentPathsJson != null && !attachmentPathsJson.isEmpty()) {
            question.setAttachmentPaths(List.of(attachmentPathsJson.split(",")));
        }
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            question.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            question.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return question;
    }
}