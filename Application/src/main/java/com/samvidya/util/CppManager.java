package com.samvidya.util;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Manages C/C++ compiler detection and configuration.
 * Supports both bundled MinGW and system-installed compilers.
 */
public class CppManager {
    private static final String BUNDLED_MINGW_PATH = "mingw64";
    private static String gppPath = null;
    private static String gccPath = null;
    private static boolean initialized = false;

    /**
     * Initialize compiler paths by detecting bundled or system compiler
     */
    public static synchronized void initialize() {
        if (initialized) {
            return;
        }

        // Try bundled MinGW first
        if (detectBundledMinGW()) {
            System.out.println("Using bundled MinGW for C/C++ compilation and execution");
            initialized = true;
            return;
        }

        // Fall back to system compiler
        if (detectSystemCompiler()) {
            System.out.println("Using system compiler for C/C++ compilation and execution");
            initialized = true;
            return;
        }

        // No compiler found
        System.err.println("WARNING: No C/C++ compiler found! C/C++ code execution will not be available.");
        System.err.println("Please install MinGW or place it in the 'mingw64' folder.");
        initialized = true;
    }

    /**
     * Detect bundled MinGW in the application directory
     */
    private static boolean detectBundledMinGW() {
        try {
            // Try multiple possible MinGW folder names
            String[] possiblePaths = {
                BUNDLED_MINGW_PATH,     // "mingw64"
                "mingw",                // Alternative name
                "mingw-w64",            // Alternative name
                "gcc"                   // Generic name
            };
            
            for (String mingwPath : possiblePaths) {
                Path bundledPath = Paths.get(mingwPath);
                Path gppFile = bundledPath.resolve("bin").resolve("g++.exe");
                Path gccFile = bundledPath.resolve("bin").resolve("gcc.exe");

                // For Unix/Linux/Mac
                if (!Files.exists(gppFile)) {
                    gppFile = bundledPath.resolve("bin").resolve("g++");
                    gccFile = bundledPath.resolve("bin").resolve("gcc");
                }

                if (Files.exists(gppFile) && Files.exists(gccFile)) {
                    gppPath = gppFile.toAbsolutePath().toString();
                    gccPath = gccFile.toAbsolutePath().toString();
                    System.out.println("Found bundled MinGW at: " + bundledPath.toAbsolutePath());
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Error detecting bundled MinGW: " + e.getMessage());
        }
        return false;
    }

    /**
     * Detect system-installed compiler
     */
    private static boolean detectSystemCompiler() {
        try {
            // Try to find g++ in system PATH
            String gppCommand = isWindows() ? "g++.exe" : "g++";
            String gccCommand = isWindows() ? "gcc.exe" : "gcc";
            
            // Check if g++ is in PATH
            ProcessBuilder pb = new ProcessBuilder(gppCommand, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                // g++ found in PATH, use command directly
                gppPath = gppCommand;
                gccPath = gccCommand;
                return true;
            }
        } catch (Exception e) {
            System.err.println("Error detecting system compiler: " + e.getMessage());
        }
        return false;
    }

    /**
     * Get the path to g++ compiler
     */
    public static String getGppPath() {
        if (!initialized) {
            initialize();
        }
        return gppPath;
    }

    /**
     * Get the path to gcc compiler
     */
    public static String getGccPath() {
        if (!initialized) {
            initialize();
        }
        return gccPath;
    }

    /**
     * Check if C/C++ compiler is available
     */
    public static boolean isCompilerAvailable() {
        if (!initialized) {
            initialize();
        }
        return gppPath != null && gccPath != null;
    }

    /**
     * Get compiler status message
     */
    public static String getCompilerStatus() {
        if (!initialized) {
            initialize();
        }

        if (isCompilerAvailable()) {
            return "C/C++ Compiler Available\nC++ Compiler: " + gppPath + "\nC Compiler: " + gccPath;
        } else {
            return "C/C++ Compiler Not Available\n\n" +
                   "To enable C/C++ code execution:\n" +
                   "1. Download MinGW-w64 from https://github.com/niXman/mingw-builds-binaries/releases\n" +
                   "2. Extract to 'mingw64' folder in application directory\n" +
                   "   OR\n" +
                   "3. Install MinGW system-wide and ensure it's in PATH";
        }
    }

    /**
     * Check if running on Windows
     */
    private static boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    /**
     * Get recommended MinGW download URL
     */
    public static String getMinGWDownloadURL() {
        return "https://github.com/niXman/mingw-builds-binaries/releases";
    }
}
