package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.util.ArrayList;
import java.util.List;

/**
 * Comprehensive test for Java code execution.
 * Tests compilation, execution, and test case validation.
 */
public class JavaCodeExecutorTest {
    
    public static void main(String[] args) {
        System.out.println("=== Java Code Executor Test ===\n");
        
        JavaCodeExecutor executor = new JavaCodeExecutor();
        
        if (!JDKManager.isJDKAvailable()) {
            System.err.println("Cannot run tests: JDK not available");
            return;
        }
        
        // Run all tests
        boolean allPassed = true;
        allPassed &= testHelloWorld(executor);
        allPassed &= testInputOutput(executor);
        allPassed &= testCompilationError(executor);
        allPassed &= testRuntimeError(executor);
        
        System.out.println("\n=== Test Summary ===");
        if (allPassed) {
            System.out.println("All tests PASSED");
        } else {
            System.err.println("Some tests FAILED");
        }
    }
    
    private static boolean testHelloWorld(JavaCodeExecutor executor) {
        System.out.println("Test 1: Hello World");
        
        String code = 
            "public class HelloWorld {\n" +
            "    public static void main(String[] args) {\n" +
            "        System.out.println(\"Hello, World!\");\n" +
            "    }\n" +
            "}";
        
        List<TestCase> testCases = new ArrayList<>();
        TestCase tc = new TestCase();
        tc.setInput("");
        tc.setExpectedOutput("Hello, World!");
        tc.setSample(false);
        testCases.add(tc);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, testCases);
            
            boolean passed = result.isAllTestsPassed();
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            if (!passed) {
                System.err.println("  Expected: Hello, World!");
                System.err.println("  Got: " + result.getTestCaseResults().get(0)
                    .getExecutionResult().getOutput());
            }
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            System.out.println();
            return false;
        }
    }
    
    private static boolean testInputOutput(JavaCodeExecutor executor) {
        System.out.println("Test 2: Input/Output (Sum of two numbers)");
        
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
        
        // Test case 1: 5 + 3 = 8
        TestCase tc1 = new TestCase();
        tc1.setInput("5\n3");
        tc1.setExpectedOutput("8");
        tc1.setSample(false);
        testCases.add(tc1);
        
        // Test case 2: 10 + 20 = 30
        TestCase tc2 = new TestCase();
        tc2.setInput("10\n20");
        tc2.setExpectedOutput("30");
        tc2.setSample(false);
        testCases.add(tc2);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, testCases);
            
            boolean passed = result.isAllTestsPassed();
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Score: " + result.getTotalScore() + "/" + result.getMaxScore());
            
            if (!passed) {
                for (int i = 0; i < result.getTestCaseResults().size(); i++) {
                    CodeExecutor.TestCaseResult tcr = result.getTestCaseResults().get(i);
                    if (!tcr.isPassed()) {
                        System.err.println("  Test Case " + (i+1) + " failed:");
                        System.err.println("    Expected: " + tcr.getTestCase().getExpectedOutput());
                        System.err.println("    Got: " + tcr.getExecutionResult().getOutput().trim());
                    }
                }
            }
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            System.out.println();
            return false;
        }
    }
    
    private static boolean testCompilationError(JavaCodeExecutor executor) {
        System.out.println("Test 3: Compilation Error Detection");
        
        String code = 
            "public class Invalid {\n" +
            "    public static void main(String[] args) {\n" +
            "        int x = 5\n" +  // Missing semicolon
            "    }\n" +
            "}";
        
        List<TestCase> testCases = new ArrayList<>();
        TestCase tc = new TestCase();
        tc.setInput("");
        tc.setExpectedOutput("");
        tc.setSample(false);
        testCases.add(tc);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, testCases);
            
            boolean hasError = !result.isAllTestsPassed();
            String error = result.getTestCaseResults().get(0)
                .getExecutionResult().getError();
            
            boolean passed = hasError && error.contains("Compilation Error");
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Error detected: " + hasError);
            if (hasError) {
                System.out.println("  Error message: " + 
                    error.substring(0, Math.min(100, error.length())) + "...");
            }
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            System.out.println();
            return false;
        }
    }
    
    private static boolean testRuntimeError(JavaCodeExecutor executor) {
        System.out.println("Test 4: Runtime Error Detection");
        
        String code = 
            "public class RuntimeError {\n" +
            "    public static void main(String[] args) {\n" +
            "        int x = 1 / 0;\n" +  // Division by zero
            "    }\n" +
            "}";
        
        List<TestCase> testCases = new ArrayList<>();
        TestCase tc = new TestCase();
        tc.setInput("");
        tc.setExpectedOutput("");
        tc.setSample(false);
        testCases.add(tc);
        
        try {
            CodeExecutor.TestExecutionResult result = 
                executor.executeWithTestCases(code, testCases);
            
            boolean hasError = !result.isAllTestsPassed();
            String error = result.getTestCaseResults().get(0)
                .getExecutionResult().getError();
            
            boolean passed = hasError && 
                (error.contains("ArithmeticException") || error.contains("/ by zero"));
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Error detected: " + hasError);
            if (hasError) {
                System.out.println("  Error type: ArithmeticException");
            }
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            System.out.println();
            return false;
        }
    }
}
