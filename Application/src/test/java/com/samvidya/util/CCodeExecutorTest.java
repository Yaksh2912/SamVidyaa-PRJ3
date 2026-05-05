package com.samvidya.util;

import com.samvidya.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test cases for C code execution
 */
public class CCodeExecutorTest {
    private CppCodeExecutor executor;

    @BeforeEach
    public void setUp() {
        executor = new CppCodeExecutor();
    }

    static boolean isCppAvailable() {
        CppManager.initialize();
        return CppManager.isCompilerAvailable();
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testSimpleCHelloWorld() {
        String code = "#include <stdio.h>\n" +
                     "int main() {\n" +
                     "    printf(\"Hello, World!\\n\");\n" +
                     "    return 0;\n" +
                     "}";

        TestCase testCase = new TestCase();
        testCase.setInput("");
        testCase.setExpectedOutput("Hello, World!");
        testCase.setSample(true);

        List<TestCase> testCases = Arrays.asList(testCase);
        CodeExecutor.TestExecutionResult result = executor.executeCWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(1, result.getTestCaseResults().size());
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        assertTrue(tcResult.isPassed(), "Test case should pass");
        assertTrue(tcResult.getExecutionResult().isSuccess(), "Execution should succeed");
        
        System.out.println("C Hello World Test:");
        System.out.println("Output: " + tcResult.getExecutionResult().getOutput());
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCWithInput() {
        String code = "#include <stdio.h>\n" +
                     "int main() {\n" +
                     "    int a, b;\n" +
                     "    scanf(\"%d %d\", &a, &b);\n" +
                     "    printf(\"%d\\n\", a + b);\n" +
                     "    return 0;\n" +
                     "}";

        TestCase testCase1 = new TestCase();
        testCase1.setInput("5 3");
        testCase1.setExpectedOutput("8");
        testCase1.setSample(true);

        TestCase testCase2 = new TestCase();
        testCase2.setInput("10 20");
        testCase2.setExpectedOutput("30");
        testCase2.setSample(false);

        List<TestCase> testCases = Arrays.asList(testCase1, testCase2);
        CodeExecutor.TestExecutionResult result = executor.executeCWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(2, result.getTestCaseResults().size());
        assertTrue(result.isAllTestsPassed(), "All test cases should pass");
        
        System.out.println("C Input/Output Test:");
        for (CodeExecutor.TestCaseResult tcResult : result.getTestCaseResults()) {
            System.out.println("Input: " + tcResult.getTestCase().getInput());
            System.out.println("Output: " + tcResult.getExecutionResult().getOutput());
            System.out.println("Passed: " + tcResult.isPassed());
        }
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCCompilationError() {
        String code = "#include <stdio.h>\n" +
                     "int main() {\n" +
                     "    printf(\"Missing semicolon\")\n" +  // Missing semicolon
                     "    return 0;\n" +
                     "}";

        TestCase testCase = new TestCase();
        testCase.setInput("");
        testCase.setExpectedOutput("Hello");
        testCase.setSample(true);

        List<TestCase> testCases = Arrays.asList(testCase);
        CodeExecutor.TestExecutionResult result = executor.executeCWithTestCases(code, testCases);

        assertNotNull(result);
        assertFalse(result.isAllTestsPassed(), "Should fail due to compilation error");
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        assertFalse(tcResult.isPassed());
        String error = tcResult.getExecutionResult().getError();
        assertTrue(error.contains("Compilation Error"), "Should contain compilation error message");
        
        System.out.println("C Compilation Error Test:");
        System.out.println("Error: " + error);
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCMultipleTestCases() {
        String code = "#include <stdio.h>\n" +
                     "int main() {\n" +
                     "    int n;\n" +
                     "    scanf(\"%d\", &n);\n" +
                     "    printf(\"%d\\n\", n * n);\n" +
                     "    return 0;\n" +
                     "}";

        TestCase testCase1 = new TestCase();
        testCase1.setInput("5");
        testCase1.setExpectedOutput("25");
        testCase1.setSample(true);

        TestCase testCase2 = new TestCase();
        testCase2.setInput("10");
        testCase2.setExpectedOutput("100");
        testCase2.setSample(false);

        TestCase testCase3 = new TestCase();
        testCase3.setInput("7");
        testCase3.setExpectedOutput("49");
        testCase3.setSample(false);

        List<TestCase> testCases = Arrays.asList(testCase1, testCase2, testCase3);
        CodeExecutor.TestExecutionResult result = executor.executeCWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(3, result.getTestCaseResults().size());
        assertTrue(result.isAllTestsPassed(), "All test cases should pass");
        assertTrue(result.getTotalScore() > 0, "Should have positive score");
        
        System.out.println("C Multiple Test Cases:");
        System.out.println("Total Score: " + result.getTotalScore() + "/" + result.getMaxScore());
        System.out.println("All Passed: " + result.isAllTestsPassed());
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCStringOperations() {
        String code = "#include <stdio.h>\n" +
                     "#include <string.h>\n" +
                     "int main() {\n" +
                     "    char str[100];\n" +
                     "    scanf(\"%s\", str);\n" +
                     "    printf(\"%d\\n\", (int)strlen(str));\n" +
                     "    return 0;\n" +
                     "}";

        TestCase testCase1 = new TestCase();
        testCase1.setInput("hello");
        testCase1.setExpectedOutput("5");
        testCase1.setSample(true);

        TestCase testCase2 = new TestCase();
        testCase2.setInput("world");
        testCase2.setExpectedOutput("5");
        testCase2.setSample(false);

        List<TestCase> testCases = Arrays.asList(testCase1, testCase2);
        CodeExecutor.TestExecutionResult result = executor.executeCWithTestCases(code, testCases);

        assertNotNull(result);
        assertTrue(result.isAllTestsPassed(), "All test cases should pass");
        
        System.out.println("C String Operations Test:");
        System.out.println("Total Score: " + result.getTotalScore() + "/" + result.getMaxScore());
    }
}
