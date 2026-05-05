package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * Executes Python code using native Python interpreter.
 * Supports both bundled and system Python.
 */
public class PythonCodeExecutor {
    private static final int TIMEOUT_SECONDS = 30;
    private static final String TEMP_DIR_PREFIX = "samvidya_python_";

    public PythonCodeExecutor() {
        // Initialize Python detection
        PythonManager.initialize();
        
        if (!PythonManager.isPythonAvailable()) {
            System.err.println("WARNING: PythonCodeExecutor initialized but Python is not available!");
            System.err.println(PythonManager.getPythonStatus());
        } else {
            System.out.println("PythonCodeExecutor initialized successfully");
        }
    }

    /**
     * Execute Python code with multiple test cases
     */
    public CodeExecutor.TestExecutionResult executeWithTestCases(
            String code, List<TestCase> testCases) {

        // Check if Python is available
        if (!PythonManager.isPythonAvailable()) {
            return createErrorResult(testCases, 
                "Python interpreter not available.\n\n" + PythonManager.getPythonStatus());
        }

        List<CodeExecutor.TestCaseResult> results = new ArrayList<>();
        int totalScore = 0;
        int maxScore = 0;
        boolean allPassed = true;

        // Create temporary directory for execution
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory(TEMP_DIR_PREFIX);
            
            // Create Python file
            Path pythonFile = tempDir.resolve("solution.py");
            Files.write(pythonFile, code.getBytes());

            // Execute with each test case
            for (TestCase testCase : testCases) {
                CodeExecutor.ExecutionResult result =
                    executePythonCode(pythonFile, testCase.getInput());

                boolean passed = false;
                int score = 0;

                if (result.isSuccess()) {
                    String actualOutput = result.getOutput().trim();
                    String expectedOutput = testCase.getExpectedOutput().trim();
                    passed = actualOutput.equals(expectedOutput);

                    if (passed && !testCase.isSample()) {
                        long validationCount = testCases.stream()
                            .filter(tc -> !tc.isSample()).count();
                        score = validationCount > 0 ?
                            (int) Math.ceil(100.0 / validationCount) : 0;
                    }
                }

                if (!passed) allPassed = false;

                totalScore += score;
                if (!testCase.isSample()) {
                    maxScore += score > 0 ? score :
                        (int) Math.ceil(100.0 / testCases.stream()
                            .filter(tc -> !tc.isSample()).count());
                }

                results.add(new CodeExecutor.TestCaseResult(
                    testCase, result, passed, score));
            }

        } catch (Exception e) {
            return createErrorResult(testCases,
                "Execution Error: " + e.getMessage());
        } finally {
            // Clean up temporary directory
            if (tempDir != null) {
                deleteDirectory(tempDir);
            }
        }

        return new CodeExecutor.TestExecutionResult(
            results, totalScore, maxScore, allPassed);
    }

    /**
     * Execute Python code with input
     */
    private CodeExecutor.ExecutionResult executePythonCode(Path pythonFile, String input) {
        try {
            String pythonPath = PythonManager.getPythonPath();
            
            ProcessBuilder pb = new ProcessBuilder(
                pythonPath,
                pythonFile.toString()
            );
            pb.redirectErrorStream(false);

            Process process = pb.start();

            // Provide input
            if (input != null && !input.trim().isEmpty()) {
                try (PrintWriter writer = new PrintWriter(
                        new OutputStreamWriter(process.getOutputStream()))) {
                    writer.print(input);
                    writer.flush();
                }
            }
            process.getOutputStream().close();

            // Wait for completion with timeout
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new CodeExecutor.ExecutionResult(false, "",
                    "Execution timed out after " + TIMEOUT_SECONDS + " seconds.\n" +
                    "Check for infinite loops or very long running operations.", -1);
            }

            String output = readStream(process.getInputStream());
            String error = readStream(process.getErrorStream());
            int exitCode = process.exitValue();

            // Format error message if present
            if (exitCode != 0 && !error.isEmpty()) {
                error = formatPythonError(error);
            }

            return new CodeExecutor.ExecutionResult(
                exitCode == 0, output, error, exitCode);

        } catch (Exception e) {
            return new CodeExecutor.ExecutionResult(false, "",
                "Execution error: " + e.getMessage(), -1);
        }
    }

    /**
     * Format Python error for better readability
     */
    private String formatPythonError(String error) {
        if (error == null || error.trim().isEmpty()) {
            return "Unknown error";
        }

        // Remove temporary file paths for cleaner error messages
        error = error.replaceAll("\\\\", "/");
        error = error.replaceAll("File \"[^\"]*samvidya_python_[^\"]*\\/solution\\.py\"", 
                                 "File \"solution.py\"");
        
        return error;
    }

    /**
     * Read input stream to string
     */
    private String readStream(InputStream inputStream) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    /**
     * Delete directory recursively
     */
    private void deleteDirectory(Path directory) {
        try {
            Files.walk(directory)
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        // Ignore cleanup errors
                    }
                });
        } catch (IOException e) {
            // Ignore cleanup errors
        }
    }

    /**
     * Create error result for all test cases
     */
    private CodeExecutor.TestExecutionResult createErrorResult(
            List<TestCase> testCases, String errorMessage) {
        List<CodeExecutor.TestCaseResult> results = new ArrayList<>();

        for (TestCase testCase : testCases) {
            CodeExecutor.ExecutionResult errorResult =
                new CodeExecutor.ExecutionResult(false, "", errorMessage, -1);
            results.add(new CodeExecutor.TestCaseResult(
                testCase, errorResult, false, 0));
        }

        return new CodeExecutor.TestExecutionResult(results, 0, 100, false);
    }
}
