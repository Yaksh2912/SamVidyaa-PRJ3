package com.samvidya.model;

import java.time.LocalDateTime;

public class User {
    private Long id;
    private String username;
    private String password; // Plain password for initial seed
    private String passwordHash; // BCrypt hash
    private String fullName;
    private String email;
    private String role; // ADMIN, INSTRUCTOR, STUDENT
    private String enrollmentNumber; // For students only
    private String institution;
    private String section;
    private Integer totalPoints; // Cumulative points earned
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    public User() {}

    public User(String username, String passwordHash, String fullName, String email, String role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }

    public String getInstitution() { return institution; }
    public void setInstitution(String institution) { this.institution = institution; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public Integer getTotalPoints() { return totalPoints; }
    public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    /**
     * Check if this user needs password migration from plain text to hash
     */
    public boolean needsPasswordMigration() {
        return password != null && !password.isEmpty() && 
               (passwordHash == null || passwordHash.isEmpty());
    }

    /**
     * Get the effective password for authentication
     * Returns plain password if hash is not available, otherwise returns hash
     */
    public String getEffectivePassword() {
        if (passwordHash != null && !passwordHash.isEmpty()) {
            return passwordHash;
        }
        return password;
    }

    /**
     * Check if user is using plain text password
     */
    public boolean isUsingPlainPassword() {
        return password != null && !password.isEmpty() && 
               (passwordHash == null || passwordHash.isEmpty());
    }

    /**
     * Get password for display in admin interface
     * Shows actual password if not hashed, shows hash if hashed
     */
    public String getDisplayPassword() {
        if (passwordHash != null && !passwordHash.isEmpty()) {
            return passwordHash; // Show hash
        } else if (password != null && !password.isEmpty()) {
            return password; // Show plain password
        }
        return ""; // No password set
    }
}