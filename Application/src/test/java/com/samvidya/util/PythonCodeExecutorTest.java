package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.util.ArrayList;
import java.util.List;

/**
 * Comprehensive test for Python code execution.
 * Tests execution and test case validation.
 */
public class PythonCodeExecutorTest {
    
    public static void main(String[] args) {
        System.out.println("=== Python Code Executor Test ===\n");
        
        PythonCodeExecutor executor = new PythonCodeExecutor();
        
        if (!PythonManager.isPythonAvailable()) {
            System.err.println("Cannot run tests: Python not available");
            return;
        }
        
        // Run all tests
        boolean allPassed = true;
        allPassed &= testHelloWorld(executor);
        allPassed &= testInputOutput(executor);
        allPassed &= testSyntaxError(executor);
        allPassed &= testRuntimeError(executor);
        
        System.out.println("\n=== Test Summary ===");
        if (allPassed) {
            System.out.println("All tests PASSED");
        } else {
            System.err.println("Some tests FAILED");
        }
    }
    
    private static boolean testHelloWorld(PythonCodeExecutor executor) {
        System.out.println("Test 1: Hello World");
        
        String code = "print('Hello, World!')";
        
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
    
    private static boolean testInputOutput(PythonCodeExecutor executor) {
        System.out.println("Test 2: Input/Output (Sum of two numbers)");
        
        String code = 
            "a = int(input())\n" +
            "b = int(input())\n" +
            "print(a + b)";
        
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
    
    private static boolean testSyntaxError(PythonCodeExecutor executor) {
        System.out.println("Test 3: Syntax Error Detection");
        
        String code = 
            "print('Hello'\n" +  // Missing closing parenthesis
            "x = 5";
        
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
            
            boolean passed = hasError && error.contains("SyntaxError");
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Error detected: " + hasError);
            if (hasError) {
                System.out.println("  Error type: SyntaxError");
            }
            System.out.println();
            return passed;
        } catch (Exception e) {
            System.err.println("  Error: " + e.getMessage());
            System.out.println();
            return false;
        }
    }
    
    private static boolean testRuntimeError(PythonCodeExecutor executor) {
        System.out.println("Test 4: Runtime Error Detection");
        
        String code = 
            "x = 1 / 0";  // Division by zero
        
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
                (error.contains("ZeroDivisionError") || error.contains("division by zero"));
            System.out.println("  Result: " + (passed ? "PASSED" : "FAILED"));
            System.out.println("  Error detected: " + hasError);
            if (hasError) {
                System.out.println("  Error type: ZeroDivisionError");
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
