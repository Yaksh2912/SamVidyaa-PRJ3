package com.samvidya.dao;

import com.samvidya.model.TestCase;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TestCaseDAO {

    public List<TestCase> findByTaskId(Long taskId) throws SQLException {
        String sql = "SELECT * FROM test_cases WHERE task_id = ? ORDER BY order_index";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, taskId);
            ResultSet rs = stmt.executeQuery();
            
            List<TestCase> testCases = new ArrayList<>();
            while (rs.next()) {
                testCases.add(mapResultSetToTestCase(rs));
            }
            return testCases;
        }
    }

    public List<TestCase> findByQuestionId(Long questionId) throws SQLException {
        String sql = "SELECT * FROM test_cases WHERE question_id = ? ORDER BY order_index";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, questionId);
            ResultSet rs = stmt.executeQuery();
            
            List<TestCase> testCases = new ArrayList<>();
            while (rs.next()) {
                testCases.add(mapResultSetToTestCase(rs));
            }
            return testCases;
        }
    }

    public List<TestCase> findSampleTestCases(Long taskId, Long questionId) throws SQLException {
        String sql = "SELECT * FROM test_cases WHERE (task_id = ? OR question_id = ?) AND is_sample = TRUE ORDER BY order_index";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, taskId != null ? taskId : 0);
            stmt.setLong(2, questionId != null ? questionId : 0);
            ResultSet rs = stmt.executeQuery();
            
            List<TestCase> testCases = new ArrayList<>();
            while (rs.next()) {
                testCases.add(mapResultSetToTestCase(rs));
            }
            return testCases;
        }
    }

    public List<TestCase> findValidationTestCases(Long taskId, Long questionId) throws SQLException {
        String sql = "SELECT * FROM test_cases WHERE (task_id = ? OR question_id = ?) AND is_sample = FALSE ORDER BY order_index";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, taskId != null ? taskId : 0);
            stmt.setLong(2, questionId != null ? questionId : 0);
            ResultSet rs = stmt.executeQuery();
            
            List<TestCase> testCases = new ArrayList<>();
            while (rs.next()) {
                testCases.add(mapResultSetToTestCase(rs));
            }
            return testCases;
        }
    }

    public Long save(TestCase testCase) throws SQLException {
        if (testCase.getId() == null) {
            return insert(testCase);
        } else {
            update(testCase);
            return testCase.getId();
        }
    }

    private Long insert(TestCase testCase) throws SQLException {
        String sql = "INSERT INTO test_cases (task_id, question_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            // Set task_id (NULL if not set)
            if (testCase.getTaskId() != null) {
                stmt.setLong(1, testCase.getTaskId());
            } else {
                stmt.setNull(1, java.sql.Types.BIGINT);
            }
            
            // Set question_id (NULL if not set)
            if (testCase.getQuestionId() != null) {
                stmt.setLong(2, testCase.getQuestionId());
            } else {
                stmt.setNull(2, java.sql.Types.BIGINT);
            }
            
            stmt.setString(3, testCase.getInput());
            stmt.setString(4, testCase.getExpectedOutput());
            stmt.setBoolean(5, testCase.isSample());
            stmt.setInt(6, testCase.getOrderIndex());
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating test case failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    testCase.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating test case failed, no ID obtained.");
                }
            }
        }
    }

    private void update(TestCase testCase) throws SQLException {
        String sql = "UPDATE test_cases SET task_id = ?, question_id = ?, input = ?, expected_output = ?, is_sample = ?, order_index = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            // Set task_id (NULL if not set)
            if (testCase.getTaskId() != null) {
                stmt.setLong(1, testCase.getTaskId());
            } else {
                stmt.setNull(1, java.sql.Types.BIGINT);
            }
            
            // Set question_id (NULL if not set)
            if (testCase.getQuestionId() != null) {
                stmt.setLong(2, testCase.getQuestionId());
            } else {
                stmt.setNull(2, java.sql.Types.BIGINT);
            }
            
            stmt.setString(3, testCase.getInput());
            stmt.setString(4, testCase.getExpectedOutput());
            stmt.setBoolean(5, testCase.isSample());
            stmt.setInt(6, testCase.getOrderIndex());
            stmt.setLong(7, testCase.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM test_cases WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public void deleteByTaskId(Long taskId) throws SQLException {
        String sql = "DELETE FROM test_cases WHERE task_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, taskId);
            stmt.executeUpdate();
        }
    }

    public void deleteByQuestionId(Long questionId) throws SQLException {
        String sql = "DELETE FROM test_cases WHERE question_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, questionId);
            stmt.executeUpdate();
        }
    }

    public int getNextOrderForTask(Long taskId) throws SQLException {
        String sql = "SELECT COALESCE(MAX(order_index), 0) + 1 FROM test_cases WHERE task_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, taskId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 1;
        }
    }

    public int getNextOrderForQuestion(Long questionId) throws SQLException {
        String sql = "SELECT COALESCE(MAX(order_index), 0) + 1 FROM test_cases WHERE question_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, questionId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 1;
        }
    }

    private TestCase mapResultSetToTestCase(ResultSet rs) throws SQLException {
        TestCase testCase = new TestCase();
        testCase.setId(rs.getLong("id"));
        
        Long taskId = rs.getLong("task_id");
        if (!rs.wasNull()) {
            testCase.setTaskId(taskId);
        }
        
        Long questionId = rs.getLong("question_id");
        if (!rs.wasNull()) {
            testCase.setQuestionId(questionId);
        }
        
        testCase.setInput(rs.getString("input"));
        testCase.setExpectedOutput(rs.getString("expected_output"));
        testCase.setSample(rs.getBoolean("is_sample"));
        testCase.setOrderIndex(rs.getInt("order_index"));
        
        return testCase;
    }
}