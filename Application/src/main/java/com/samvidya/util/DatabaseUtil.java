package com.samvidya.util;

import io.github.cdimascio.dotenv.Dotenv;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseUtil {
    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    
    private static final String DB_HOST = dotenv.get("DB_HOST", "localhost");
    private static final String DB_PORT = dotenv.get("DB_PORT", "3306");
    private static final String DB_NAME = dotenv.get("DB_NAME", "samvidya");
    private static final String DB_USERNAME = dotenv.get("DB_USERNAME", "Admin");
    private static final String DB_PASSWORD = dotenv.get("DB_PASSWORD", "Admin@123");
    
    private static final String DB_URL = String.format(
        "jdbc:mysql://%s:%s/%s?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
        DB_HOST, DB_PORT, DB_NAME
    );

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(DB_URL, DB_USERNAME, DB_PASSWORD);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC Driver not found", e);
        }
    }

    public static void testConnection() throws SQLException {
        try (Connection connection = getConnection()) {
            System.out.println("Database connection successful!");
            System.out.println("Connected to: " + connection.getMetaData().getURL());
        }
    }
}