package com.samvidya.dao;

import com.samvidya.model.User;
import com.samvidya.util.DatabaseUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {

    public User findByUsername(String username) throws SQLException {
        String sql = "SELECT * FROM users WHERE username = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUser(rs);
            }
            return null;
        }
    }

    public User findByEnrollmentNumber(String enrollmentNumber) throws SQLException {
        String sql = "SELECT * FROM users WHERE enrollment_number = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, enrollmentNumber);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUser(rs);
            }
            return null;
        }
    }

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return mapResultSetToUser(rs);
            return null;
        }
    }

    public User findById(Long id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUser(rs);
            }
            return null;
        }
    }

    public List<User> findByRole(String role) throws SQLException {
        String sql = "SELECT * FROM users WHERE role = ? ORDER BY full_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, role);
            ResultSet rs = stmt.executeQuery();
            
            List<User> users = new ArrayList<>();
            while (rs.next()) {
                users.add(mapResultSetToUser(rs));
            }
            return users;
        }
    }

    public Long save(User user) throws SQLException {
        if (user.getId() == null) {
            return insert(user);
        } else {
            update(user);
            return user.getId();
        }
    }

    private Long insert(User user) throws SQLException {
        String sql = "INSERT INTO users (username, password, password_hash, full_name, email, role, enrollment_number, institution, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getPassword());
            stmt.setString(3, user.getPasswordHash());
            stmt.setString(4, user.getFullName());
            stmt.setString(5, user.getEmail());
            stmt.setString(6, user.getRole());
            stmt.setString(7, user.getEnrollmentNumber());
            stmt.setString(8, user.getInstitution());
            stmt.setString(9, user.getSection());
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating user failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    Long id = generatedKeys.getLong(1);
                    user.setId(id);
                    return id;
                } else {
                    throw new SQLException("Creating user failed, no ID obtained.");
                }
            }
        }
    }

    private void update(User user) throws SQLException {
        String sql = "UPDATE users SET username = ?, password = ?, password_hash = ?, full_name = ?, email = ?, role = ?, enrollment_number = ?, institution = ?, section = ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getPassword());
            stmt.setString(3, user.getPasswordHash());
            stmt.setString(4, user.getFullName());
            stmt.setString(5, user.getEmail());
            stmt.setString(6, user.getRole());
            stmt.setString(7, user.getEnrollmentNumber());
            stmt.setString(8, user.getInstitution());
            stmt.setString(9, user.getSection());
            stmt.setLong(10, user.getId());
            
            stmt.executeUpdate();
        }
    }

    public void updateLastLogin(Long userId) throws SQLException {
        String sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.executeUpdate();
        }
    }

    public void delete(Long id) throws SQLException {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    public List<User> findAll() throws SQLException {
        String sql = "SELECT * FROM users ORDER BY full_name";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            ResultSet rs = stmt.executeQuery();
            List<User> users = new ArrayList<>();
            while (rs.next()) {
                users.add(mapResultSetToUser(rs));
            }
            return users;
        }
    }

    // Registration code methods for admin user management
    public String getRegistrationCode(String role) throws SQLException {
        String sql = "SELECT code FROM registration_codes WHERE role = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, role);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getString("code");
            }
            return null;
        }
    }

    public void updateRegistrationCode(String role, String newCode) throws SQLException {
        String sql = "UPDATE registration_codes SET code = ? WHERE role = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, newCode);
            stmt.setString(2, role);
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                // If no rows were updated, insert a new record
                String insertSql = "INSERT INTO registration_codes (role, code) VALUES (?, ?)";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setString(1, role);
                    insertStmt.setString(2, newCode);
                    insertStmt.executeUpdate();
                }
            }
        }
    }

    public void createUser(String username, String password, String fullName, String email, String role, String section) throws SQLException {
        String sql = "INSERT INTO users (username, password, full_name, email, role, section) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            stmt.setString(2, password); // Store as plain text initially, will be hashed on first login
            stmt.setString(3, fullName);
            stmt.setString(4, email);
            stmt.setString(5, role);
            stmt.setString(6, section);
            
            stmt.executeUpdate();
        }
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setPassword(rs.getString("password")); // Plain password
        user.setPasswordHash(rs.getString("password_hash")); // Hashed password
        user.setFullName(rs.getString("full_name"));
        user.setEmail(rs.getString("email"));
        user.setRole(rs.getString("role"));
        user.setEnrollmentNumber(rs.getString("enrollment_number"));
        user.setInstitution(rs.getString("institution"));
        user.setSection(rs.getString("section"));
        user.setTotalPoints(rs.getInt("total_points")); // Cumulative points
        
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            user.setCreatedAt(createdAt.toLocalDateTime());
        }
        
        Timestamp lastLogin = rs.getTimestamp("last_login");
        if (lastLogin != null) {
            user.setLastLogin(lastLogin.toLocalDateTime());
        }
        
        return user;
    }

    public void resetPassword(Long userId, String newPassword) throws SQLException {
        String sql = "UPDATE users SET password = ?, password_hash = NULL WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, newPassword);
            stmt.setLong(2, userId);
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Password reset failed, user not found.");
            }
        }
    }

    /**
     * Add points to a user's total_points
     * @param userId The user ID
     * @param points The points to add (can be negative to subtract)
     * @throws SQLException if database operation fails
     */
    public void addPoints(Long userId, int points) throws SQLException {
        String sql = "UPDATE users SET total_points = total_points + ? WHERE id = ?";
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, points);
            stmt.setLong(2, userId);
            
            int affectedRows = stmt.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Adding points failed, user not found.");
            }
            
            System.out.println("=== POINTS UPDATE ===");
            System.out.println("User ID: " + userId);
            System.out.println("Points Added: " + points);
        }
    }
}