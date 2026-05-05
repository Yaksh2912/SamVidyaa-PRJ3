package com.samvidya.service;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.BCryptUtil;

import java.sql.SQLException;
import java.util.List;

public class UserService {
    private UserDAO userDAO;

    public UserService() {
        this.userDAO = new UserDAO();
    }

    /**
     * Authenticate user with username and password
     */
    public User authenticateUser(String username, String password, String expectedRole) throws SQLException {
        User user = userDAO.findByUsername(username);
        
        if (user == null) {
            return null; // User not found
        }
        
        if (!user.getRole().equals(expectedRole)) {
            return null; // Role mismatch
        }
        
        if (!BCryptUtil.verifyPassword(password, user.getPasswordHash())) {
            return null; // Invalid password
        }
        
        // Update last login
        userDAO.updateLastLogin(user.getId());
        
        return user;
    }

    /**
     * Create a new user account
     */
    public User createUser(String username, String password, String fullName, String email, String role, String institution) throws SQLException {
        // Check if username already exists
        if (userDAO.findByUsername(username) != null) {
            throw new SQLException("Username already exists");
        }
        
        // Hash the password
        String hashedPassword = BCryptUtil.hashPassword(password);
        
        // Create user object
        User user = new User(username, hashedPassword, fullName, email, role);
        user.setInstitution(institution);
        
        // Save to database
        Long userId = userDAO.save(user);
        user.setId(userId);
        
        return user;
    }

    /**
     * Update user information
     */
    public void updateUser(User user) throws SQLException {
        userDAO.save(user);
    }

    /**
     * Change user password
     */
    public void changePassword(Long userId, String oldPassword, String newPassword) throws SQLException {
        User user = userDAO.findById(userId);
        if (user == null) {
            throw new SQLException("User not found");
        }
        
        if (!BCryptUtil.verifyPassword(oldPassword, user.getPasswordHash())) {
            throw new SQLException("Invalid current password");
        }
        
        String hashedNewPassword = BCryptUtil.hashPassword(newPassword);
        user.setPasswordHash(hashedNewPassword);
        userDAO.save(user);
    }

    /**
     * Get all users by role
     */
    public List<User> getUsersByRole(String role) throws SQLException {
        return userDAO.findByRole(role);
    }

    /**
     * Get user by ID
     */
    public User getUserById(Long id) throws SQLException {
        return userDAO.findById(id);
    }

    /**
     * Delete user account
     */
    public void deleteUser(Long userId) throws SQLException {
        userDAO.delete(userId);
    }

    /**
     * Get all users
     */
    public List<User> getAllUsers() throws SQLException {
        return userDAO.findAll();
    }
}