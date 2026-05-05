package com.samvidya.util;

import com.samvidya.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CodeExecutorTest {

    private CodeExecutor codeExecutor;

    @BeforeEach
    void setUp() {
        codeExecutor = new CodeExecutor();
    }

    @Test
    void testSimplePythonExecution() {
        String code = "print('Hello, World!')";
        String input = "";
        
        CodeExecutor.ExecutionResult result = codeExecutor.executePythonCode(code, input);
        
        assertTrue(result.isSuccess());
        assertEquals("Hello, World!\n", result.getOutput());
        assertEquals("", result.getError());
        assertEquals(0, result.getExitCode());
    }

    @Test
    void testPythonWithInput() {
        String code = "name = input()\nprint('Hello, ' + name + '!')";
        String input = "Alice";
        
        CodeExecutor.ExecutionResult result = codeExecutor.executePythonCode(code, input);
        
        assertTrue(result.isSuccess());
        assertEquals("Hello, Alice!\n", result.getOutput());
    }

    @Test
    void testPythonWithError() {
        String code = "print(undefined_variable)";
        String input = "";
        
        CodeExecutor.ExecutionResult result = codeExecutor.executePythonCode(code, input);
        
        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("NameError"));
    }

    @Test
    void testExecuteWithTestCases() {
        String code = "a = int(input())\nb = int(input())\nprint(a + b)";
        
        // Create test cases
        TestCase testCase1 = new TestCase();
        testCase1.setId(1L);
        testCase1.setInput("5\n3");
        testCase1.setExpectedOutput("8");
        testCase1.setSample(true);
        testCase1.setOrderIndex(1);
        
        TestCase testCase2 = new TestCase();
        testCase2.setId(2L);
        testCase2.setInput("10\n20");
        testCase2.setExpectedOutput("30");
        testCase2.setSample(false);
        testCase2.setOrderIndex(2);
        
        List<TestCase> testCases = Arrays.asList(testCase1, testCase2);
        
        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(code, "Python", testCases);
        
        assertTrue(result.isAllTestsPassed());
        assertEquals(100, result.getTotalScore());
        assertEquals(100, result.getMaxScore());
        assertEquals(2, result.getTestCaseResults().size());
        
        // Check individual test case results
        CodeExecutor.TestCaseResult result1 = result.getTestCaseResults().get(0);
        assertTrue(result1.isPassed());
        assertEquals(0, result1.getScore()); // Sample test case, no score
        
        CodeExecutor.TestCaseResult result2 = result.getTestCaseResults().get(1);
        assertTrue(result2.isPassed());
        assertEquals(100, result2.getScore()); // Validation test case, full score
    }

    @Test
    void testExecuteWithFailingTestCase() {
        String code = "a = int(input())\nb = int(input())\nprint(a * b)"; // Wrong operation
        
        TestCase testCase = new TestCase();
        testCase.setId(1L);
        testCase.setInput("5\n3");
        testCase.setExpectedOutput("8"); // Expected sum, but code does multiplication
        testCase.setSample(false);
        testCase.setOrderIndex(1);
        
        List<TestCase> testCases = Arrays.asList(testCase);
        
        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(code, "Python", testCases);
        
        assertFalse(result.isAllTestsPassed());
        assertEquals(0, result.getTotalScore());
        assertEquals(100, result.getMaxScore());
        
        CodeExecutor.TestCaseResult testResult = result.getTestCaseResults().get(0);
        assertFalse(testResult.isPassed());
        assertEquals("15\n", testResult.getExecutionResult().getOutput()); // 5 * 3 = 15
    }
}