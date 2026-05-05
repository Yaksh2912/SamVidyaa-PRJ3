package com.samvidya.util;

import com.samvidya.model.TestCase;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * Executes C/C++ code with compilation and test case validation.
 * Supports both bundled MinGW and system-installed compilers.
 */
public class CppCodeExecutor {
    private static final int TIMEOUT_SECONDS = 30;
    private static final String TEMP_DIR_PREFIX = "samvidya_cpp_";

    public CppCodeExecutor() {
        // Initialize compiler detection
        CppManager.initialize();
        
        if (!CppManager.isCompilerAvailable()) {
            System.err.println("WARNING: CppCodeExecutor initialized but C/C++ compiler is not available!");
            System.err.println(CppManager.getCompilerStatus());
        } else {
            System.out.println("CppCodeExecutor initialized successfully");
        }
    }

    /**
     * Execute C++ code with multiple test cases
     */
    public CodeExecutor.TestExecutionResult executeCppWithTestCases(
            String code, List<TestCase> testCases) {
        return executeWithTestCases(code, testCases, true);
    }

    /**
     * Execute C code with multiple test cases
     */
    public CodeExecutor.TestExecutionResult executeCWithTestCases(
            String code, List<TestCase> testCases) {
        return executeWithTestCases(code, testCases, false);
    }

    /**
     * Execute C/C++ code with multiple test cases
     */
    private CodeExecutor.TestExecutionResult executeWithTestCases(
            String code, List<TestCase> testCases, boolean isCpp) {

        // Check if compiler is available
        if (!CppManager.isCompilerAvailable()) {
            return createErrorResult(testCases, 
                "C/C++ compiler not available.\n\n" + CppManager.getCompilerStatus());
        }

        List<CodeExecutor.TestCaseResult> results = new ArrayList<>();
        int totalScore = 0;
        int maxScore = 0;
        boolean allPassed = true;

        // Create temporary directory for compilation
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory(TEMP_DIR_PREFIX);

            // Create source file
            String extension = isCpp ? ".cpp" : ".c";
            Path sourceFile = tempDir.resolve("solution" + extension);
            Files.write(sourceFile, code.getBytes());

            // Compile the code
            CompilationResult compilation = compileCode(sourceFile, tempDir, isCpp);
            if (!compilation.isSuccess()) {
                return createErrorResult(testCases,
                    "Compilation Error:\n\n" + compilation.getError());
            }

            // Execute with each test case
            for (TestCase testCase : testCases) {
                CodeExecutor.ExecutionResult result =
                    executeCompiledCode(compilation.getExecutablePath(), testCase.getInput());

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
     * Compile C/C++ source code
     */
    private CompilationResult compileCode(Path sourceFile, Path outputDir, boolean isCpp) {
        try {
            String compilerPath = isCpp ? CppManager.getGppPath() : CppManager.getGccPath();
            String executableName = isWindows() ? "solution.exe" : "solution";
            Path executablePath = outputDir.resolve(executableName);
            
            ProcessBuilder pb = new ProcessBuilder(
                compilerPath,
                sourceFile.toString(),
                "-o", executablePath.toString()
            );
            pb.redirectErrorStream(true);

            // Add MinGW bin directory to PATH if using bundled compiler
            if (compilerPath.contains("mingw")) {
                Path mingwBinPath = Paths.get(compilerPath).getParent();
                String pathEnv = mingwBinPath.toString() + File.pathSeparator + 
                                System.getenv("PATH");
                pb.environment().put("PATH", pathEnv);
            }

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return new CompilationResult(false, null,
                    "Compilation timed out after " + TIMEOUT_SECONDS + " seconds");
            }

            String output = readStream(process.getInputStream());
            int exitCode = process.exitValue();

            if (exitCode == 0) {
                return new CompilationResult(true, executablePath, "Compilation successful");
            } else {
                return new CompilationResult(false, null, formatCompilationError(output));
            }

        } catch (Exception e) {
            return new CompilationResult(false, null,
                "Compilation failed: " + e.getMessage());
        }
    }

    /**
     * Execute compiled C/C++ code
     */
    private CodeExecutor.ExecutionResult executeCompiledCode(Path executablePath, String input) {
        try {
            ProcessBuilder pb = new ProcessBuilder(executablePath.toString());
            pb.redirectErrorStream(false);

            // Add MinGW bin directory to PATH for DLL dependencies
            String gppPath = CppManager.getGppPath();
            if (gppPath != null && gppPath.contains(File.separator)) {
                // Extract bin directory from compiler path
                Path binPath = Paths.get(gppPath).getParent();
                String pathEnv = binPath.toString() + File.pathSeparator + 
                                System.getenv("PATH");
                pb.environment().put("PATH", pathEnv);
            }

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

            return new CodeExecutor.ExecutionResult(
                exitCode == 0, output, error, exitCode);

        } catch (Exception e) {
            return new CodeExecutor.ExecutionResult(false, "",
                "Execution error: " + e.getMessage(), -1);
        }
    }

    /**
     * Format compilation error for better readability
     */
    private String formatCompilationError(String error) {
        if (error == null || error.trim().isEmpty()) {
            return "Unknown compilation error";
        }

        // Remove temporary file paths for cleaner error messages
        error = error.replaceAll("\\\\", "/");
        error = error.replaceAll("/tmp/samvidya_cpp_[^/]+/", "");
        error = error.replaceAll("samvidya_cpp_[^/]+/", "");
        
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
     * Check if running on Windows
     */
    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
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
        private final Path executablePath;
        private final String error;

        public CompilationResult(boolean success, Path executablePath, String error) {
            this.success = success;
            this.executablePath = executablePath;
            this.error = error;
        }

        public boolean isSuccess() { return success; }
        public Path getExecutablePath() { return executablePath; }
        public String getError() { return error; }
    }
}
