package com.samvidya.dao;

import com.samvidya.model.Task;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TaskDAO {

    public Task getTaskById(Long id) throws SQLException {
        return findById(id);
    }

    public List<Task> getTasksByModuleId(Long moduleId) throws SQLException {
        return findByModuleId(moduleId);
    }

    public Task findById(Long id) throws SQLException {
        String sql = "SELECT * FROM tasks WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToTask(rs);
            }
            return null;
        }
    }

    public List<Task> findByModuleId(Long moduleId) throws SQLException {
        String sql = "SELECT * FROM tasks WHERE module_id = ? ORDER BY task_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            List<Task> tasks = new ArrayList<>();
            while (rs.next()) {
                tasks.add(mapResultSetToTask(rs));
            }
            return tasks;
        }
    }

    public Long save(Task task) throws SQLException {
        if (task.getId() == null) {
            return insert(task);
        } else {
            update(task);
            return task.getId();
        }
    }

    private Long insert(Task task) throws SQLException {
        String sql = "INSERT INTO tasks (module_id, task_name, description, problem_statement, expected_output, sample_input, sample_output, difficulty, points, time_limit, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setLong(1, task.getModuleId());
            stmt.setString(2, task.getTaskName());
            stmt.setString(3, task.getDescription());
            stmt.setString(4, task.getProblemStatement());
            stmt.setString(5, task.getExpectedOutput());
            stmt.setString(6, task.getSampleInput());
            stmt.setString(7, task.getSampleOutput());
            stmt.setString(8, task.getDifficulty());
            stmt.setInt(9, task.getPoints());
            stmt.setInt(10, task.getTimeLimit());
            stmt.setString(11, task.getLanguage());
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating task failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    task.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating task failed, no ID obtained.");
                }
            }
        }
    }

    private void update(Task task) throws SQLException {
        String sql = "UPDATE tasks SET module_id = ?, task_name = ?, description = ?, problem_statement = ?, expected_output = ?, sample_input = ?, sample_output = ?, difficulty = ?, points = ?, time_limit = ?, language = ?, test_cases_count = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, task.getModuleId());
            stmt.setString(2, task.getTaskName());
            stmt.setString(3, task.getDescription());
            stmt.setString(4, task.getProblemStatement());
            stmt.setString(5, task.getExpectedOutput());
            stmt.setString(6, task.getSampleInput());
            stmt.setString(7, task.getSampleOutput());
            stmt.setString(8, task.getDifficulty());
            stmt.setInt(9, task.getPoints());
            stmt.setInt(10, task.getTimeLimit());
            stmt.setString(11, task.getLanguage());
            stmt.setInt(12, task.getTestCasesCount());
            stmt.setLong(13, task.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM tasks WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public int countByModuleId(Long moduleId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM tasks WHERE module_id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, moduleId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        }
    }

    private Task mapResultSetToTask(ResultSet rs) throws SQLException {
        Task task = new Task();
        task.setId(rs.getLong("id"));
        task.setModuleId(rs.getLong("module_id"));
        task.setTaskName(rs.getString("task_name"));
        task.setDescription(rs.getString("description"));
        task.setProblemStatement(rs.getString("problem_statement"));
        task.setExpectedOutput(rs.getString("expected_output"));
        task.setSampleInput(rs.getString("sample_input"));
        task.setSampleOutput(rs.getString("sample_output"));
        task.setDifficulty(rs.getString("difficulty"));
        task.setPoints(rs.getInt("points"));
        task.setTimeLimit(rs.getInt("time_limit"));
        task.setLanguage(rs.getString("language"));
        task.setTestCasesCount(rs.getInt("test_cases_count"));
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            task.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            task.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return task;
    }
}