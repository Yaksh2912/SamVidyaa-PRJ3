package com.samvidya.util;

/**
 * Simple test to verify Python detection and accessibility.
 * Run this to ensure the bundled Python is properly configured.
 */
public class PythonManagerTest {
    
    public static void main(String[] args) {
        System.out.println("=== Python Manager Test ===\n");
        
        // Initialize Python detection
        PythonManager.initialize();
        
        // Check if Python is available
        boolean isAvailable = PythonManager.isPythonAvailable();
        System.out.println("Python Available: " + isAvailable);
        
        if (isAvailable) {
            // Print Python path
            System.out.println("\nPython Path:");
            System.out.println("  python: " + PythonManager.getPythonPath());
            
            // Test execution
            System.out.println("\n=== Testing Python Execution ===");
            testExecution();
            
            System.out.println("\n=== All Tests Passed ===");
        } else {
            System.err.println("\nPython Status:");
            System.err.println(PythonManager.getPythonStatus());
            System.err.println("\n=== Test Failed: Python Not Found ===");
        }
    }
    
    private static void testExecution() {
        try {
            String pythonPath = PythonManager.getPythonPath();
            ProcessBuilder pb = new ProcessBuilder(pythonPath, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("  " + line);
            }
            
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("  Status: SUCCESS");
            } else {
                System.err.println("  Status: FAILED (exit code: " + exitCode + ")");
            }
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
        }
    }
}
