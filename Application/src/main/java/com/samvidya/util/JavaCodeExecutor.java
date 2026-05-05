package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/**
 * Executes Java code with compilation and test case validation.
 * Supports both bundled and system JDK.
 */
public class JavaCodeExecutor {
    private static final int TIMEOUT_SECONDS = 30;
    private static final String TEMP_DIR_PREFIX = "samvidya_java_";

    public JavaCodeExecutor() {
        // Initialize JDK detection
        JDKManager.initialize();
        
        if (!JDKManager.isJDKAvailable()) {
            System.err.println("WARNING: JavaCodeExecutor initialized but JDK is not available!");
            System.err.println(JDKManager.getJDKStatus());
        } else {
            System.out.println("JavaCodeExecutor initialized successfully");
        }
    }

    /**
     * Execute Java code with multiple test cases
     */
    public CodeExecutor.TestExecutionResult executeWithTestCases(
            String code, List<TestCase> testCases) {

        // Check if JDK is available
        if (!JDKManager.isJDKAvailable()) {
            return createErrorResult(testCases, 
                "Java compiler not available.\n\n" + JDKManager.getJDKStatus());
        }

        List<CodeExecutor.TestCaseResult> results = new ArrayList<>();
        int totalScore = 0;
        int maxScore = 0;
        boolean allPassed = true;

        // Create temporary directory for compilation
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory(TEMP_DIR_PREFIX);

            // Extract class name and create source file
            String className = extractMainClassName(code);
            if (className == null) {
                return createErrorResult(testCases,
                    "Could not find public class with main method in Java code.\n\n" +
                    "Make sure your code has:\n" +
                    "public class YourClassName {\n" +
                    "    public static void main(String[] args) {\n" +
                    "        // your code\n" +
                    "    }\n" +
                    "}");
            }

            Path sourceFile = tempDir.resolve(className + ".java");
            Files.write(sourceFile, code.getBytes());

            // Compile the code
            CompilationResult compilation = compileJavaCode(sourceFile, tempDir);
            if (!compilation.isSuccess()) {
                return createErrorResult(testCases,
                    "Compilation Error:\n\n" + compilation.getError());
            }

            // Execute with each test case
            for (TestCase testCase : testCases) {
                CodeExecutor.ExecutionResult result =
                    executeCompiledCode(tempDir, className, testCase.getInput());

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
     * Compile Java source code
     */
    private CompilationResult compileJavaCode(Path sourceFile, Path outputDir) {
        try {
            String javacPath = JDKManager.getJavacPath();
            
            ProcessBuilder pb = new ProcessBuilder(
                javacPath,
                "-d", outputDir.toString(),
                "-encoding", "UTF-8",
                sourceFile.toString()
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return new CompilationResult(false,
                    "Compilation timed out after " + TIMEOUT_SECONDS + " seconds");
            }

            String output = readStream(process.getInputStream());
            int exitCode = process.exitValue();

            if (exitCode == 0) {
                return new CompilationResult(true, "Compilation successful");
            } else {
                return new CompilationResult(false, formatCompilationError(output));
            }

        } catch (Exception e) {
            return new CompilationResult(false,
                "Compilation failed: " + e.getMessage());
        }
    }

    /**
     * Execute compiled Java code
     */
    private CodeExecutor.ExecutionResult executeCompiledCode(
            Path classPath, String className, String input) {
        try {
            String javaPath = JDKManager.getJavaPath();
            
            ProcessBuilder pb = new ProcessBuilder(
                javaPath,
                "-cp", classPath.toString(),
                className
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
                error = formatRuntimeError(error);
            }

            return new CodeExecutor.ExecutionResult(
                exitCode == 0, output, error, exitCode);

        } catch (Exception e) {
            return new CodeExecutor.ExecutionResult(false, "",
                "Execution error: " + e.getMessage(), -1);
        }
    }

    /**
     * Extract main class name from Java code
     */
    private String extractMainClassName(String code) {
        // Pattern to match: public class ClassName
        Pattern pattern = Pattern.compile(
            "public\\s+class\\s+(\\w+)\\s*\\{");
        Matcher matcher = pattern.matcher(code);

        if (matcher.find()) {
            String className = matcher.group(1);
            // Verify it has a main method
            if (code.contains("public static void main")) {
                return className;
            }
        }

        // Fallback: look for any class with main method
        pattern = Pattern.compile(
            "class\\s+(\\w+)\\s*\\{[^}]*public\\s+static\\s+void\\s+main",
            Pattern.DOTALL);
        matcher = pattern.matcher(code);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    /**
     * Format compilation error for better readability
     */
    private String formatCompilationError(String error) {
        if (error == null || error.trim().isEmpty()) {
            return "Unknown compilation error";
        }

        // Remove file paths for cleaner error messages
        error = error.replaceAll("\\\\", "/");
        error = error.replaceAll("/tmp/samvidya_java_[^/]+/", "");
        
        return error;
    }

    /**
     * Format runtime error for better readability
     */
    private String formatRuntimeError(String error) {
        if (error == null || error.trim().isEmpty()) {
            return "Unknown runtime error";
        }

        // Extract the most relevant error information
        StringBuilder formatted = new StringBuilder();
        String[] lines = error.split("\n");
        
        for (String line : lines) {
            // Skip internal Java stack traces
            if (line.contains("at java.") || 
                line.contains("at sun.") ||
                line.contains("at jdk.")) {
                continue;
            }
            formatted.append(line).append("\n");
        }

        return formatted.toString().trim();
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

    /**
     * Compilation result class
     */
    public static class CompilationResult {
        private final boolean success;
        private final String error;

        public CompilationResult(boolean success, String error) {
            this.success = success;
            this.error = error;
        }

        public boolean isSuccess() { return success; }
        public String getError() { return error; }
    }
}
