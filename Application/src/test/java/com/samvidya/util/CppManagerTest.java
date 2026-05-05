package com.samvidya.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test cases for CppManager
 */
public class CppManagerTest {

    @Test
    public void testCppManagerInitialization() {
        // Initialize CppManager
        CppManager.initialize();
        
        // Check if compiler is available
        boolean isAvailable = CppManager.isCompilerAvailable();
        
        // Print status for debugging
        System.out.println("C/C++ Compiler Available: " + isAvailable);
        System.out.println(CppManager.getCompilerStatus());
        
        if (isAvailable) {
            // If compiler is available, paths should not be null
            assertNotNull(CppManager.getGppPath(), "g++ path should not be null");
            assertNotNull(CppManager.getGccPath(), "gcc path should not be null");
            System.out.println("g++ path: " + CppManager.getGppPath());
            System.out.println("gcc path: " + CppManager.getGccPath());
        } else {
            System.out.println("WARNING: C/C++ compiler not found. This is expected if MinGW is not installed.");
        }
    }

    @Test
    public void testGetCompilerStatus() {
        String status = CppManager.getCompilerStatus();
        assertNotNull(status, "Compiler status should not be null");
        assertFalse(status.isEmpty(), "Compiler status should not be empty");
        System.out.println("Compiler Status:\n" + status);
    }

    @Test
    public void testGetMinGWDownloadURL() {
        String url = CppManager.getMinGWDownloadURL();
        assertNotNull(url, "Download URL should not be null");
        assertTrue(url.contains("github.com"), "URL should point to GitHub");
        System.out.println("MinGW Download URL: " + url);
    }
}
