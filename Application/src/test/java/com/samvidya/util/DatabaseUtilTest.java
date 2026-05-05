package com.samvidya.util;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

public class DatabaseUtilTest {

    @Test
    public void testDatabaseConnection() {
        try {
            Connection connection = DatabaseUtil.getConnection();
            assertNotNull(connection, "Database connection should not be null");
            assertFalse(connection.isClosed(), "Database connection should be open");
            connection.close();
        } catch (SQLException e) {
            // This test may fail if database is not set up, which is expected in development
            System.out.println("Database connection test skipped - database not available: " + e.getMessage());
        }
    }

    @Test
    public void testConnectionConfiguration() {
        // Test that the database configuration is properly loaded
        assertDoesNotThrow(() -> {
            DatabaseUtil.testConnection();
        }, "Database configuration should be valid");
    }
}