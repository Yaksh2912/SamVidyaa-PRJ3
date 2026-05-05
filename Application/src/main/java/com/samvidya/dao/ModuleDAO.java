package com.samvidya.dao;

import com.samvidya.model.Module;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ModuleDAO {

    public Module getModuleById(Long id) throws SQLException {
        return findById(id);
    }

    public Module findById(Long id) throws SQLException {
        String sql = "SELECT * FROM modules WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToModule(rs);
            }
            return null;
        }
    }

    public List<Module> findByCourseId(Long courseId) throws SQLException {
        String sql = "SELECT * FROM modules WHERE course_id = ? ORDER BY module_order";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, courseId);
            ResultSet rs = stmt.executeQuery();
            
            List<Module> modules = new ArrayList<>();
            while (rs.next()) {
                modules.add(mapResultSetToModule(rs));
            }
            return modules;
        }
    }

    public Long save(Module module) throws SQLException {
        if (module.getId() == null) {
            return insert(module);
        } else {
            update(module);
            return module.getId();
        }
    }

    private Long insert(Module module) throws SQLException {
        String sql = "INSERT INTO modules (course_id, module_name, description, module_order, tasks_per_module, module_test_questions, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setLong(1, module.getCourseId());
            stmt.setString(2, module.getModuleName());
            stmt.setString(3, module.getDescription());
            stmt.setInt(4, module.getModuleOrder());
            stmt.setInt(5, module.getTasksPerModule());
            stmt.setInt(6, module.getModuleTestQuestions());
            stmt.setBoolean(7, module.isActive());
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating module failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    module.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating module failed, no ID obtained.");
                }
            }
        }
    }

    private void update(Module module) throws SQLException {
        String sql = "UPDATE modules SET course_id = ?, module_name = ?, description = ?, module_order = ?, tasks_per_module = ?, module_test_questions = ?, total_tasks = ?, total_test_questions = ?, is_active = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, module.getCourseId());
            stmt.setString(2, module.getModuleName());
            stmt.setString(3, module.getDescription());
            stmt.setInt(4, module.getModuleOrder());
            stmt.setInt(5, module.getTasksPerModule());
            stmt.setInt(6, module.getModuleTestQuestions());
            stmt.setInt(7, module.getTotalTasks());
            stmt.setInt(8, module.getTotalTestQuestions());
            stmt.setBoolean(9, module.isActive());
            stmt.setLong(10, module.getId());
            
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM modules WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    private Module mapResultSetToModule(ResultSet rs) throws SQLException {
        Module module = new Module();
        module.setId(rs.getLong("id"));
        module.setCourseId(rs.getLong("course_id"));
        module.setModuleName(rs.getString("module_name"));
        module.setDescription(rs.getString("description"));
        module.setModuleOrder(rs.getInt("module_order"));
        module.setTasksPerModule(rs.getInt("tasks_per_module"));
        module.setModuleTestQuestions(rs.getInt("module_test_questions"));
        module.setTotalTasks(rs.getInt("total_tasks"));
        module.setTotalTestQuestions(rs.getInt("total_test_questions"));
        module.setActive(rs.getBoolean("is_active"));
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            module.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            module.setUpdatedAt(updatedAt.toLocalDateTime());
        }
        
        return module;
    }
}