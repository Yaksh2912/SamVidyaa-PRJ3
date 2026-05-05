package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

public class CodeExecutor {
    private static final int TIMEOUT_SECONDS = 30;
    private static final int MEMORY_LIMIT_MB = 128;
    
    private final PythonCodeExecutor pythonExecutor;
    private final JavaCodeExecutor javaExecutor;
    private final CppCodeExecutor cppExecutor;

    public CodeExecutor() {
        // Initialize Python executor
        this.pythonExecutor = new PythonCodeExecutor();
        
        // Initialize Java executor
        this.javaExecutor = new JavaCodeExecutor();
        
        // Initialize C/C++ executor
        this.cppExecutor = new CppCodeExecutor();
        System.out.println("CodeExecutor initialized - Python, Java, and C/C++ execution support enabled");
    }

    /**
     * Execute Python code with a single input
     */
    public ExecutionResult executePythonCode(String code, String input) {
        // Create a dummy test case to use PythonCodeExecutor
        TestCase dummyTestCase = new TestCase();
        dummyTestCase.setInput(input);
        dummyTestCase.setExpectedOutput(""); // Not used for single execution
        dummyTestCase.setSample(true);
        
        List<TestCase> testCases = new ArrayList<>();
        testCases.add(dummyTestCase);
        
        // Execute using PythonCodeExecutor
        TestExecutionResult testResult = pythonExecutor.executeWithTestCases(code, testCases);
        
        // Extract the execution result from the first test case
        if (testResult.getTestCaseResults().isEmpty()) {
            return new ExecutionResult(false, "", "No execution result", -1);
        }
        
        return testResult.getTestCaseResults().get(0).getExecutionResult();
    }

    /**
     * Execute code against multiple test cases
     */
    public TestExecutionResult executeWithTestCases(String code, String language, List<TestCase> testCases) {
        // Route to appropriate executor based on language
        if ("Java".equalsIgnoreCase(language)) {
            return javaExecutor.executeWithTestCases(code, testCases);
        } else if ("Python".equalsIgnoreCase(language)) {
            return pythonExecutor.executeWithTestCases(code, testCases);
        } else if ("C++".equalsIgnoreCase(language) || "CPP".equalsIgnoreCase(language)) {
            return cppExecutor.executeCppWithTestCases(code, testCases);
        } else if ("C".equalsIgnoreCase(language)) {
            return cppExecutor.executeCWithTestCases(code, testCases);
        } else {
            return executeWithTestCasesLocally(code, language, testCases);
        }
    }

    private TestExecutionResult executeWithTestCasesLocally(String code, String language, List<TestCase> testCases) {
        List<TestCaseResult> results = new ArrayList<>();
        int totalScore = 0;
        int maxScore = 0;
        boolean allPassed = true;

        for (TestCase testCase : testCases) {
            ExecutionResult result = executeLocally(code, testCase.getInput(), language);
            
            boolean passed = false;
            int score = 0;
            
            if (result.isSuccess()) {
                String actualOutput = result.getOutput().trim();
                String expectedOutput = testCase.getExpectedOutput().trim();
                passed = actualOutput.equals(expectedOutput);
                
                // Only validation test cases contribute to score
                if (passed && !testCase.isSample()) {
                    // Calculate score based on test case weight
                    // For now, distribute points equally among validation test cases
                    long validationCount = testCases.stream().filter(tc -> !tc.isSample()).count();
                    score = validationCount > 0 ? (int) Math.ceil(100.0 / validationCount) : 0;
                }
            }
            
            if (!passed) {
                allPassed = false;
            }
            
            totalScore += score;
            if (!testCase.isSample()) {
                maxScore += score > 0 ? score : (int) Math.ceil(100.0 / testCases.stream().filter(tc -> !tc.isSample()).count());
            }
            
            results.add(new TestCaseResult(testCase, result, passed, score));
        }

        return new TestExecutionResult(results, totalScore, maxScore, allPassed);
    }

    private ExecutionResult executeLocally(String code, String input, String language) {
        try {
            String extension = getFileExtension(language);
            String command = getExecutionCommand(language);
            
            // Create temporary file
            Path tempFile = Files.createTempFile("samvidya_", extension);
            Files.write(tempFile, code.getBytes());

            // Execute code
            ProcessBuilder pb = new ProcessBuilder(command, tempFile.toString());
            pb.redirectErrorStream(false);
            Process process = pb.start();

            // Handle input
            if (input != null && !input.trim().isEmpty()) {
                try (PrintWriter writer = new PrintWriter(process.getOutputStream())) {
                    writer.print(input);
                    writer.flush();
                }
                process.getOutputStream().close();
            }

            // Wait for completion with timeout
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new ExecutionResult(false, "", "Execution timed out after " + TIMEOUT_SECONDS + " seconds", -1);
            }

            // Read output
            String output = readStream(process.getInputStream());
            String error = readStream(process.getErrorStream());
            int exitCode = process.exitValue();

            // Cleanup
            Files.deleteIfExists(tempFile);

            return new ExecutionResult(exitCode == 0, output, error, exitCode);

        } catch (Exception e) {
            return new ExecutionResult(false, "", "Execution error: " + e.getMessage(), -1);
        }
    }

    private String getFileExtension(String language) {
        switch (language.toLowerCase()) {
            case "python": return ".py";
            case "java": return ".java";
            case "c++": case "cpp": return ".cpp";
            case "c": return ".c";
            case "javascript": return ".js";
            default: return ".py";
        }
    }

    private String getExecutionCommand(String language) {
        switch (language.toLowerCase()) {
            case "python": return "python";
            case "java": return "java"; // Will need compilation step
            case "c++": case "cpp": return "g++"; // Will need compilation step
            case "c": return "gcc"; // Will need compilation step
            case "javascript": return "node";
            default: return "python";
        }
    }

    private String readStream(InputStream inputStream) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    public static class ExecutionResult {
        private final boolean success;
        private final String output;
        private final String error;
        private final int exitCode;

        public ExecutionResult(boolean success, String output, String error, int exitCode) {
            this.success = success;
            this.output = output;
            this.error = error;
            this.exitCode = exitCode;
        }

        public boolean isSuccess() { return success; }
        public String getOutput() { return output; }
        public String getError() { return error; }
        public int getExitCode() { return exitCode; }
    }

    public static class TestCaseResult {
        private final TestCase testCase;
        private final ExecutionResult executionResult;
        private final boolean passed;
        private final int score;

        public TestCaseResult(TestCase testCase, ExecutionResult executionResult, boolean passed, int score) {
            this.testCase = testCase;
            this.executionResult = executionResult;
            this.passed = passed;
            this.score = score;
        }

        public TestCase getTestCase() { return testCase; }
        public ExecutionResult getExecutionResult() { return executionResult; }
        public boolean isPassed() { return passed; }
        public int getScore() { return score; }
    }

    public static class TestExecutionResult {
        private final List<TestCaseResult> testCaseResults;
        private final int totalScore;
        private final int maxScore;
        private final boolean allTestsPassed;

        public TestExecutionResult(List<TestCaseResult> testCaseResults, int totalScore, int maxScore, boolean allTestsPassed) {
            this.testCaseResults = testCaseResults;
            this.totalScore = totalScore;
            this.maxScore = maxScore;
            this.allTestsPassed = allTestsPassed;
        }

        public List<TestCaseResult> getTestCaseResults() { return testCaseResults; }
        public int getTotalScore() { return totalScore; }
        public int getMaxScore() { return maxScore; }
        public boolean isAllTestsPassed() { return allTestsPassed; }
        public double getScorePercentage() { 
            return maxScore > 0 ? (double) totalScore / maxScore * 100 : 0; 
        }
    }
}