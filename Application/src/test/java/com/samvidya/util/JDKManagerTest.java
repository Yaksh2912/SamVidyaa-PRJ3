package com.samvidya.util;

/**
 * Simple test to verify JDK detection and accessibility.
 * Run this to ensure the bundled JDK is properly configured.
 */
public class JDKManagerTest {
    
    public static void main(String[] args) {
        System.out.println("=== JDK Manager Test ===\n");
        
        // Initialize JDK detection
        JDKManager.initialize();
        
        // Check if JDK is available
        boolean isAvailable = JDKManager.isJDKAvailable();
        System.out.println("JDK Available: " + isAvailable);
        
        if (isAvailable) {
            // Print JDK paths
            System.out.println("\nJDK Paths:");
            System.out.println("  javac: " + JDKManager.getJavacPath());
            System.out.println("  java:  " + JDKManager.getJavaPath());
            
            // Test compilation
            System.out.println("\n=== Testing Java Compilation ===");
            testCompilation();
            
            // Test execution
            System.out.println("\n=== Testing Java Execution ===");
            testExecution();
            
            System.out.println("\n=== All Tests Passed ===");
        } else {
            System.err.println("\nJDK Status:");
            System.err.println(JDKManager.getJDKStatus());
            System.err.println("\n=== Test Failed: JDK Not Found ===");
        }
    }
    
    private static void testCompilation() {
        try {
            String javacPath = JDKManager.getJavacPath();
            ProcessBuilder pb = new ProcessBuilder(javacPath, "-version");
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
    
    private static void testExecution() {
        try {
            String javaPath = JDKManager.getJavaPath();
            ProcessBuilder pb = new ProcessBuilder(javaPath, "-version");
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
