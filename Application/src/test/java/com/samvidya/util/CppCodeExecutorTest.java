package com.samvidya.util;

import com.samvidya.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test cases for CppCodeExecutor
 */
public class CppCodeExecutorTest {
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
    public void testSimpleCppHelloWorld() {
        String code = "#include <iostream>\n" +
                     "using namespace std;\n" +
                     "int main() {\n" +
                     "    cout << \"Hello, World!\" << endl;\n" +
                     "    return 0;\n" +
                     "}";

        TestCase testCase = new TestCase();
        testCase.setInput("");
        testCase.setExpectedOutput("Hello, World!");
        testCase.setSample(true);

        List<TestCase> testCases = Arrays.asList(testCase);
        CodeExecutor.TestExecutionResult result = executor.executeCppWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(1, result.getTestCaseResults().size());
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        
        System.out.println("C++ Hello World Test:");
        System.out.println("Passed: " + tcResult.isPassed());
        System.out.println("Output: " + tcResult.getExecutionResult().getOutput());
        System.out.println("Error: " + tcResult.getExecutionResult().getError());
        System.out.println("Exit Code: " + tcResult.getExecutionResult().getExitCode());
        
        assertTrue(tcResult.isPassed(), "Test case should pass");
        assertTrue(tcResult.getExecutionResult().isSuccess(), "Execution should succeed");
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCppWithInput() {
        String code = "#include <iostream>\n" +
                     "using namespace std;\n" +
                     "int main() {\n" +
                     "    int a, b;\n" +
                     "    cin >> a >> b;\n" +
                     "    cout << a + b << endl;\n" +
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
        CodeExecutor.TestExecutionResult result = executor.executeCppWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(2, result.getTestCaseResults().size());
        assertTrue(result.isAllTestsPassed(), "All test cases should pass");
        
        System.out.println("C++ Input/Output Test:");
        for (CodeExecutor.TestCaseResult tcResult : result.getTestCaseResults()) {
            System.out.println("Input: " + tcResult.getTestCase().getInput());
            System.out.println("Output: " + tcResult.getExecutionResult().getOutput());
            System.out.println("Passed: " + tcResult.isPassed());
        }
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCppCompilationError() {
        String code = "#include <iostream>\n" +
                     "using namespace std;\n" +
                     "int main() {\n" +
                     "    cout << \"Missing semicolon\"\n" +  // Missing semicolon
                     "    return 0;\n" +
                     "}";

        TestCase testCase = new TestCase();
        testCase.setInput("");
        testCase.setExpectedOutput("Hello");
        testCase.setSample(true);

        List<TestCase> testCases = Arrays.asList(testCase);
        CodeExecutor.TestExecutionResult result = executor.executeCppWithTestCases(code, testCases);

        assertNotNull(result);
        assertFalse(result.isAllTestsPassed(), "Should fail due to compilation error");
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        assertFalse(tcResult.isPassed());
        String error = tcResult.getExecutionResult().getError();
        assertTrue(error.contains("Compilation Error"), "Should contain compilation error message");
        
        System.out.println("C++ Compilation Error Test:");
        System.out.println("Error: " + error);
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCppRuntimeError() {
        String code = "#include <iostream>\n" +
                     "using namespace std;\n" +
                     "int main() {\n" +
                     "    int arr[5];\n" +
                     "    cout << arr[1000000] << endl;\n" +  // Array out of bounds
                     "    return 0;\n" +
                     "}";

        TestCase testCase = new TestCase();
        testCase.setInput("");
        testCase.setExpectedOutput("0");
        testCase.setSample(true);

        List<TestCase> testCases = Arrays.asList(testCase);
        CodeExecutor.TestExecutionResult result = executor.executeCppWithTestCases(code, testCases);

        assertNotNull(result);
        
        System.out.println("C++ Runtime Error Test:");
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        System.out.println("Passed: " + tcResult.isPassed());
        System.out.println("Output: " + tcResult.getExecutionResult().getOutput());
        System.out.println("Error: " + tcResult.getExecutionResult().getError());
    }

    @Test
    @EnabledIf("isCppAvailable")
    public void testCppMultipleTestCases() {
        String code = "#include <iostream>\n" +
                     "using namespace std;\n" +
                     "int main() {\n" +
                     "    int n;\n" +
                     "    cin >> n;\n" +
                     "    cout << n * n << endl;\n" +
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
        CodeExecutor.TestExecutionResult result = executor.executeCppWithTestCases(code, testCases);

        assertNotNull(result);
        assertEquals(3, result.getTestCaseResults().size());
        assertTrue(result.isAllTestsPassed(), "All test cases should pass");
        assertTrue(result.getTotalScore() > 0, "Should have positive score");
        
        System.out.println("C++ Multiple Test Cases:");
        System.out.println("Total Score: " + result.getTotalScore() + "/" + result.getMaxScore());
        System.out.println("All Passed: " + result.isAllTestsPassed());
    }
}
