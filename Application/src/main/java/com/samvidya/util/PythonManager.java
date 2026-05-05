package com.samvidya.util;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Manages Python detection and configuration for Python code execution.
 * Supports both bundled Python and system-installed Python.
 */
public class PythonManager {
    private static final String BUNDLED_PYTHON_PATH = "python";
    private static String pythonPath = null;
    private static boolean initialized = false;

    /**
     * Initialize Python paths by detecting bundled or system Python
     */
    public static synchronized void initialize() {
        if (initialized) {
            return;
        }

        // Try bundled Python first
        if (detectBundledPython()) {
            System.out.println("Using bundled Python for code execution");
            initialized = true;
            return;
        }

        // Fall back to system Python
        if (detectSystemPython()) {
            System.out.println("Using system Python for code execution");
            initialized = true;
            return;
        }

        // No Python found
        System.err.println("WARNING: No Python found! Python code execution will not be available.");
        System.err.println("Please install Python or place it in the 'python' folder.");
        initialized = true;
    }

    /**
     * Detect bundled Python in the application directory
     */
    private static boolean detectBundledPython() {
        try {
            // Try multiple possible Python folder names
            String[] possiblePythonPaths = {
                BUNDLED_PYTHON_PATH,        // "python"
                "python-3.11.8",            // Specific version folder
                "python-3.11",              // Version prefix
                "python-3.12.8",            // Alternative version
                "python-3.12",              // Alternative version prefix
                "python3"                   // Generic python3
            };
            
            for (String pythonPathStr : possiblePythonPaths) {
                Path bundledPythonPath = Paths.get(pythonPathStr);
                Path pythonExe = bundledPythonPath.resolve("python.exe");

                // For Unix/Linux/Mac
                if (!Files.exists(pythonExe)) {
                    pythonExe = bundledPythonPath.resolve("python");
                    // Also try python3
                    if (!Files.exists(pythonExe)) {
                        pythonExe = bundledPythonPath.resolve("python3");
                    }
                }

                if (Files.exists(pythonExe)) {
                    pythonPath = pythonExe.toAbsolutePath().toString();
                    System.out.println("Found bundled Python at: " + bundledPythonPath.toAbsolutePath());
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Error detecting bundled Python: " + e.getMessage());
        }
        return false;
    }

    /**
     * Detect system-installed Python
     */
    private static boolean detectSystemPython() {
        try {
            // Try to find python in system PATH
            String pythonCommand = isWindows() ? "python.exe" : "python3";
            
            // Check if python is in PATH
            ProcessBuilder pb = new ProcessBuilder(pythonCommand, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                // python found in PATH, use command directly
                pythonPath = pythonCommand;
                return true;
            }

            // Try python3 on Windows as well
            if (isWindows()) {
                pb = new ProcessBuilder("python3.exe", "--version");
                pb.redirectErrorStream(true);
                process = pb.start();
                exitCode = process.waitFor();

                if (exitCode == 0) {
                    pythonPath = "python3.exe";
                    return true;
                }
            }

            // Try to find PYTHON_HOME
            String pythonHome = System.getenv("PYTHON_HOME");
            if (pythonHome != null && !pythonHome.isEmpty()) {
                Path pythonExe = Paths.get(pythonHome, "python.exe");
                if (!Files.exists(pythonExe)) {
                    pythonExe = Paths.get(pythonHome, "python");
                }

                if (Files.exists(pythonExe)) {
                    pythonPath = pythonExe.toAbsolutePath().toString();
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Error detecting system Python: " + e.getMessage());
        }
        return false;
    }

    /**
     * Get the path to python executable
     */
    public static String getPythonPath() {
        if (!initialized) {
            initialize();
        }
        return pythonPath;
    }

    /**
     * Check if Python is available
     */
    public static boolean isPythonAvailable() {
        if (!initialized) {
            initialize();
        }
        return pythonPath != null;
    }

    /**
     * Get Python status message
     */
    public static String getPythonStatus() {
        if (!initialized) {
            initialize();
        }

        if (isPythonAvailable()) {
            return "Python Available\nPath: " + pythonPath;
        } else {
            return "Python Not Available\n\n" +
                   "To enable Python code execution:\n" +
                   "1. Download Python from https://www.python.org/downloads/\n" +
                   "2. Extract embeddable package to 'python' folder in application directory\n" +
                   "   OR\n" +
                   "3. Install Python system-wide and ensure it's in PATH";
        }
    }

    /**
     * Check if running on Windows
     */
    private static boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    /**
     * Get recommended Python download URL
     */
    public static String getPythonDownloadURL() {
        String os = System.getProperty("os.name").toLowerCase();
        
        if (os.contains("win")) {
            return "https://www.python.org/downloads/windows/";
        } else if (os.contains("mac")) {
            return "https://www.python.org/downloads/macos/";
        } else if (os.contains("linux")) {
            return "https://www.python.org/downloads/source/";
        }
        return "https://www.python.org/downloads/";
    }
}
