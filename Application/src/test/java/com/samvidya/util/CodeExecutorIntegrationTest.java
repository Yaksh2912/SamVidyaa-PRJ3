package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.util.ArrayList;
import java.util.List;

/**
 * Integration test for CodeExecutor with both Python and Java.
 */
public class CodeExecutorIntegrationTest {
    
    public static void main(String[] args) {
        System.out.println("=== Code Executor Integration Test ===\n");
        
        CodeExecutor executor = new CodeExecutor();
        
        boolean allPassed = true;
        allPassed &= testPythonExecution(executor);
        allPassed &= testJavaExecution(executor);
        
        System.out.println("\n=== Integration Test Summary ===");
        if (allPassed) {
            System.out.println("All integration tests PASSED");
        } else {
            System.err.println("Some integration tests FAILED");
        }
    }
    
    private static boolean testPythonExecution(CodeExecutor executor) {
        System.out.println("Test 1: Python Execution via CodeExecutor");
        
        String code = 
            "a = int(input())\n" +
            "b = int(input())\n" +
            "print(a + b)";
        
        List<TestCase> testCases = new ArrayList<>();
        TestCase tc = new TestCase();
        tc.setInput("10\n20");
        tc.setExpectedOutput("30");
        tc.setSample(false);
        testCases.add(tc);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, "Python", testCases);
            
            boolean passed = result.isAllTestsPassed();
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Score: " + result.getTotalScore() + "/" + result.getMaxScore());
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            e.printStackTrace();
            System.out.println();
            return false;
        }
    }
    
    private static boolean testJavaExecution(CodeExecutor executor) {
        System.out.println("Test 2: Java Execution via CodeExecutor");
        
        String code = 
            "import java.util.Scanner;\n" +
            "\n" +
            "public class Sum {\n" +
            "    public static void main(String[] args) {\n" +
            "        Scanner sc = new Scanner(System.in);\n" +
            "        int a = sc.nextInt();\n" +
            "        int b = sc.nextInt();\n" +
            "        System.out.println(a + b);\n" +
            "    }\n" +
            "}";
        
        List<TestCase> testCases = new ArrayList<>();
        TestCase tc = new TestCase();
        tc.setInput("15\n25");
        tc.setExpectedOutput("40");
        tc.setSample(false);
        testCases.add(tc);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, "Java", testCases);
            
            boolean passed = result.isAllTestsPassed();
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Score: " + result.getTotalScore() + "/" + result.getMaxScore());
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            e.printStackTrace();
            System.out.println();
            return false;
        }
    }
}
