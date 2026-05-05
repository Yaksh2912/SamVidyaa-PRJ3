package com.samvidya.util;

import com.samvidya.model.TestCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify multi-language code execution routing works correctly.
 * Tests that CodeExecutor properly routes to the correct language executor based on language parameter.
 */
public class MultiLanguageIntegrationTest {
    
    private CodeExecutor codeExecutor;

    @BeforeEach
    public void setUp() {
        codeExecutor = new CodeExecutor();
    }

    @Test
    public void testPythonExecution() {
        System.out.println("\n=== Testing Python Execution ===");
        
        String pythonCode = "a = int(input())\n" +
                           "b = int(input())\n" +
                           "print(a + b)";

        TestCase testCase = createTestCase("5\n3", "8");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            pythonCode, "Python", testCases);

        assertNotNull(result, "Result should not be null");
        assertTrue(result.isAllTestsPassed(), "Python test should pass");
        assertEquals(1, result.getTestCaseResults().size(), "Should have 1 test result");
        
        System.out.println("Python execution: PASSED");
    }

    @Test
    public void testJavaExecution() {
        System.out.println("\n=== Testing Java Execution ===");
        
        String javaCode = "import java.util.Scanner;\n" +
                         "public class Solution {\n" +
                         "    public static void main(String[] args) {\n" +
                         "        Scanner sc = new Scanner(System.in);\n" +
                         "        int a = sc.nextInt();\n" +
                         "        int b = sc.nextInt();\n" +
                         "        System.out.println(a + b);\n" +
                         "    }\n" +
                         "}";

        TestCase testCase = createTestCase("5\n3", "8");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            javaCode, "Java", testCases);

        assertNotNull(result, "Result should not be null");
        assertTrue(result.isAllTestsPassed(), "Java test should pass");
        assertEquals(1, result.getTestCaseResults().size(), "Should have 1 test result");
        
        System.out.println("Java execution: PASSED");
    }

    @Test
    public void testCppExecution() {
        System.out.println("\n=== Testing C++ Execution ===");
        
        String cppCode = "#include <iostream>\n" +
                        "using namespace std;\n" +
                        "int main() {\n" +
                        "    int a, b;\n" +
                        "    cin >> a >> b;\n" +
                        "    cout << a + b << endl;\n" +
                        "    return 0;\n" +
                        "}";

        TestCase testCase = createTestCase("5 3", "8");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            cppCode, "C++", testCases);

        assertNotNull(result, "Result should not be null");
        assertTrue(result.isAllTestsPassed(), "C++ test should pass");
        assertEquals(1, result.getTestCaseResults().size(), "Should have 1 test result");
        
        System.out.println("C++ execution: PASSED");
    }

    @Test
    public void testCExecution() {
        System.out.println("\n=== Testing C Execution ===");
        
        String cCode = "#include <stdio.h>\n" +
                      "int main() {\n" +
                      "    int a, b;\n" +
                      "    scanf(\"%d %d\", &a, &b);\n" +
                      "    printf(\"%d\\n\", a + b);\n" +
                      "    return 0;\n" +
                      "}";

        TestCase testCase = createTestCase("5 3", "8");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            cCode, "C", testCases);

        assertNotNull(result, "Result should not be null");
        assertTrue(result.isAllTestsPassed(), "C test should pass");
        assertEquals(1, result.getTestCaseResults().size(), "Should have 1 test result");
        
        System.out.println("C execution: PASSED");
    }

    @Test
    public void testMultipleLanguagesWithMultipleTestCases() {
        System.out.println("\n=== Testing Multiple Languages with Multiple Test Cases ===");
        
        // Test Python with multiple test cases
        String pythonCode = "n = int(input())\nprint(n * n)";
        TestCase py1 = createTestCase("5", "25");
        TestCase py2 = createTestCase("10", "100", false);
        
        CodeExecutor.TestExecutionResult pyResult = codeExecutor.executeWithTestCases(
            pythonCode, "Python", Arrays.asList(py1, py2));
        
        assertTrue(pyResult.isAllTestsPassed(), "Python multiple tests should pass");
        assertEquals(100, pyResult.getTotalScore(), "Python should score 100");
        System.out.println("Python multi-test: PASSED (Score: " + pyResult.getTotalScore() + "/100)");

        // Test C++ with multiple test cases
        String cppCode = "#include <iostream>\n" +
                        "using namespace std;\n" +
                        "int main() {\n" +
                        "    int n;\n" +
                        "    cin >> n;\n" +
                        "    cout << n * n << endl;\n" +
                        "    return 0;\n" +
                        "}";
        TestCase cpp1 = createTestCase("5", "25");
        TestCase cpp2 = createTestCase("10", "100", false);
        
        CodeExecutor.TestExecutionResult cppResult = codeExecutor.executeWithTestCases(
            cppCode, "C++", Arrays.asList(cpp1, cpp2));
        
        assertTrue(cppResult.isAllTestsPassed(), "C++ multiple tests should pass");
        assertEquals(100, cppResult.getTotalScore(), "C++ should score 100");
        System.out.println("C++ multi-test: PASSED (Score: " + cppResult.getTotalScore() + "/100)");
    }

    @Test
    public void testLanguageCaseInsensitivity() {
        System.out.println("\n=== Testing Language Case Insensitivity ===");
        
        String pythonCode = "print('Hello')";
        TestCase testCase = createTestCase("", "Hello");
        List<TestCase> testCases = Arrays.asList(testCase);

        // Test different case variations
        CodeExecutor.TestExecutionResult result1 = codeExecutor.executeWithTestCases(
            pythonCode, "python", testCases);
        assertTrue(result1.isAllTestsPassed(), "lowercase 'python' should work");

        CodeExecutor.TestExecutionResult result2 = codeExecutor.executeWithTestCases(
            pythonCode, "PYTHON", testCases);
        assertTrue(result2.isAllTestsPassed(), "uppercase 'PYTHON' should work");

        CodeExecutor.TestExecutionResult result3 = codeExecutor.executeWithTestCases(
            pythonCode, "Python", testCases);
        assertTrue(result3.isAllTestsPassed(), "mixed case 'Python' should work");
        
        System.out.println("Case insensitivity: PASSED");
    }

    @Test
    public void testCppAlternativeNames() {
        System.out.println("\n=== Testing C++ Alternative Names ===");
        
        String cppCode = "#include <iostream>\n" +
                        "using namespace std;\n" +
                        "int main() {\n" +
                        "    cout << \"Test\" << endl;\n" +
                        "    return 0;\n" +
                        "}";
        TestCase testCase = createTestCase("", "Test");
        List<TestCase> testCases = Arrays.asList(testCase);

        // Test "C++" name
        CodeExecutor.TestExecutionResult result1 = codeExecutor.executeWithTestCases(
            cppCode, "C++", testCases);
        assertTrue(result1.isAllTestsPassed(), "'C++' should work");

        // Test "CPP" name
        CodeExecutor.TestExecutionResult result2 = codeExecutor.executeWithTestCases(
            cppCode, "CPP", testCases);
        assertTrue(result2.isAllTestsPassed(), "'CPP' should work");

        // Test "cpp" name
        CodeExecutor.TestExecutionResult result3 = codeExecutor.executeWithTestCases(
            cppCode, "cpp", testCases);
        assertTrue(result3.isAllTestsPassed(), "'cpp' should work");
        
        System.out.println("C++ alternative names: PASSED");
    }

    @Test
    public void testCompilationErrorHandling() {
        System.out.println("\n=== Testing Compilation Error Handling ===");
        
        // Java with syntax error
        String badJavaCode = "public class Solution {\n" +
                            "    public static void main(String[] args) {\n" +
                            "        System.out.println(\"Missing semicolon\")\n" +
                            "    }\n" +
                            "}";
        
        TestCase testCase = createTestCase("", "Hello");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            badJavaCode, "Java", testCases);

        assertNotNull(result, "Result should not be null");
        assertFalse(result.isAllTestsPassed(), "Should fail due to compilation error");
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        String error = tcResult.getExecutionResult().getError();
        assertTrue(error.contains("Compilation Error"), "Should contain compilation error message");
        
        System.out.println("Compilation error handling: PASSED");
    }

    @Test
    public void testRuntimeErrorHandling() {
        System.out.println("\n=== Testing Runtime Error Handling ===");
        
        // Python with runtime error
        String badPythonCode = "print(undefined_variable)";
        
        TestCase testCase = createTestCase("", "Hello");
        List<TestCase> testCases = Arrays.asList(testCase);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            badPythonCode, "Python", testCases);

        assertNotNull(result, "Result should not be null");
        assertFalse(result.isAllTestsPassed(), "Should fail due to runtime error");
        
        CodeExecutor.TestCaseResult tcResult = result.getTestCaseResults().get(0);
        assertFalse(tcResult.getExecutionResult().isSuccess(), "Execution should not succeed");
        
        System.out.println("Runtime error handling: PASSED");
    }

    @Test
    public void testScoring() {
        System.out.println("\n=== Testing Scoring System ===");
        
        String pythonCode = "n = int(input())\nprint(n * 2)";
        
        TestCase sample = createTestCase("5", "10", true);  // Sample test
        TestCase val1 = createTestCase("3", "6", false);    // Validation test
        TestCase val2 = createTestCase("7", "14", false);   // Validation test
        
        List<TestCase> testCases = Arrays.asList(sample, val1, val2);

        CodeExecutor.TestExecutionResult result = codeExecutor.executeWithTestCases(
            pythonCode, "Python", testCases);

        assertTrue(result.isAllTestsPassed(), "All tests should pass");
        assertEquals(100, result.getTotalScore(), "Should score 100");
        assertEquals(100, result.getMaxScore(), "Max score should be 100");
        
        // Verify sample test doesn't contribute to score
        CodeExecutor.TestCaseResult sampleResult = result.getTestCaseResults().get(0);
        assertEquals(0, sampleResult.getScore(), "Sample test should have 0 score");
        
        // Verify validation tests contribute to score
        CodeExecutor.TestCaseResult val1Result = result.getTestCaseResults().get(1);
        assertTrue(val1Result.getScore() > 0, "Validation test should have positive score");
        
        System.out.println("Scoring system: PASSED");
    }

    // Helper method to create test cases
    private TestCase createTestCase(String input, String expectedOutput) {
        return createTestCase(input, expectedOutput, true);
    }

    private TestCase createTestCase(String input, String expectedOutput, boolean isSample) {
        TestCase testCase = new TestCase();
        testCase.setInput(input);
        testCase.setExpectedOutput(expectedOutput);
        testCase.setSample(isSample);
        testCase.setOrderIndex(1);
        return testCase;
    }
}
