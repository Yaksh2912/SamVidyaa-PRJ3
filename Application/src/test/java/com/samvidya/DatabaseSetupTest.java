package com.samvidya;

import com.samvidya.dao.UserDAO;
import com.samvidya.model.User;
import com.samvidya.util.DatabaseUtil;

public class DatabaseSetupTest {
    public static void main(String[] args) {
        try {
            // Test database connection
            System.out.println("Testing database connection...");
            DatabaseUtil.testConnection();
            
            // Test user retrieval
            System.out.println("Testing user retrieval...");
            UserDAO userDAO = new UserDAO();
            
            User admin = userDAO.findByUsername("admin");
            if (admin != null) {
                System.out.println("Found admin user: " + admin.getFullName());
                System.out.println("Role: " + admin.getRole());
                System.out.println("Using plain password: " + admin.isUsingPlainPassword());
            } else {
                System.out.println("Admin user not found!");
            }
            
            User instructor = userDAO.findByUsername("instructor1");
            if (instructor != null) {
                System.out.println("Found instructor user: " + instructor.getFullName());
                System.out.println("Role: " + instructor.getRole());
                System.out.println("Using plain password: " + instructor.isUsingPlainPassword());
            } else {
                System.out.println("Instructor user not found!");
            }
            
            System.out.println("Database setup test completed successfully!");
            
        } catch (Exception e) {
            System.err.println("Database setup test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}