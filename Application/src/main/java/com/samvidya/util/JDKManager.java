package com.samvidya.util;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Manages JDK detection and configuration for Java code compilation and execution.
 * Supports both bundled JDK and system-installed JDK.
 */
public class JDKManager {
    private static final String BUNDLED_JDK_PATH = "jdk";
    private static String javacPath = null;
    private static String javaPath = null;
    private static boolean initialized = false;

    /**
     * Initialize JDK paths by detecting bundled or system JDK
     */
    public static synchronized void initialize() {
        if (initialized) {
            return;
        }

        // Try bundled JDK first
        if (detectBundledJDK()) {
            System.out.println("Using bundled JDK for Java compilation and execution");
            initialized = true;
            return;
        }

        // Fall back to system JDK
        if (detectSystemJDK()) {
            System.out.println("Using system JDK for Java compilation and execution");
            initialized = true;
            return;
        }

        // No JDK found
        System.err.println("WARNING: No JDK found! Java code execution will not be available.");
        System.err.println("Please install JDK or place it in the 'jdk' folder.");
        initialized = true;
    }

    /**
     * Detect bundled JDK in the application directory
     */
    private static boolean detectBundledJDK() {
        try {
            // Try multiple possible JDK folder names
            String[] possibleJdkPaths = {
                BUNDLED_JDK_PATH,           // "jdk"
                "jdk-17.0.18",              // Specific version folder
                "jdk-17",                   // Version prefix
                "jdk-11"                    // Alternative version
            };
            
            for (String jdkPath : possibleJdkPaths) {
                Path bundledJdkPath = Paths.get(jdkPath);
                Path javacFile = bundledJdkPath.resolve("bin").resolve("javac.exe");
                Path javaFile = bundledJdkPath.resolve("bin").resolve("java.exe");

                // For Unix/Linux/Mac
                if (!Files.exists(javacFile)) {
                    javacFile = bundledJdkPath.resolve("bin").resolve("javac");
                    javaFile = bundledJdkPath.resolve("bin").resolve("java");
                }

                if (Files.exists(javacFile) && Files.exists(javaFile)) {
                    javacPath = javacFile.toAbsolutePath().toString();
                    javaPath = javaFile.toAbsolutePath().toString();
                    System.out.println("Found bundled JDK at: " + bundledJdkPath.toAbsolutePath());
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Error detecting bundled JDK: " + e.getMessage());
        }
        return false;
    }

    /**
     * Detect system-installed JDK
     */
    private static boolean detectSystemJDK() {
        try {
            // Try to find javac in system PATH
            String javacCommand = isWindows() ? "javac.exe" : "javac";
            String javaCommand = isWindows() ? "java.exe" : "java";

            // Check if javac is in PATH
            ProcessBuilder pb = new ProcessBuilder(javacCommand, "-version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                // javac found in PATH, use command directly
                javacPath = javacCommand;
                javaPath = javaCommand;
                return true;
            }

            // Try to find JAVA_HOME
            String javaHome = System.getenv("JAVA_HOME");
            if (javaHome != null && !javaHome.isEmpty()) {
                Path javacFile = Paths.get(javaHome, "bin", javacCommand);
                Path javaFile = Paths.get(javaHome, "bin", javaCommand);

                if (Files.exists(javacFile) && Files.exists(javaFile)) {
                    javacPath = javacFile.toAbsolutePath().toString();
                    javaPath = javaFile.toAbsolutePath().toString();
                    return true;
                }
            }
        } catch (Exception e) {
            System.err.println("Error detecting system JDK: " + e.getMessage());
        }
        return false;
    }

    /**
     * Get the path to javac compiler
     */
    public static String getJavacPath() {
        if (!initialized) {
            initialize();
        }
        return javacPath;
    }

    /**
     * Get the path to java runtime
     */
    public static String getJavaPath() {
        if (!initialized) {
            initialize();
        }
        return javaPath;
    }

    /**
     * Check if JDK is available
     */
    public static boolean isJDKAvailable() {
        if (!initialized) {
            initialize();
        }
        return javacPath != null && javaPath != null;
    }

    /**
     * Get JDK status message
     */
    public static String getJDKStatus() {
        if (!initialized) {
            initialize();
        }

        if (isJDKAvailable()) {
            return "JDK Available\nCompiler: " + javacPath + "\nRuntime: " + javaPath;
        } else {
            return "JDK Not Available\n\n" +
                   "To enable Java code execution:\n" +
                   "1. Download JDK from https://adoptium.net/\n" +
                   "2. Extract to 'jdk' folder in application directory\n" +
                   "   OR\n" +
                   "3. Install JDK system-wide and set JAVA_HOME";
        }
    }

    /**
     * Check if running on Windows
     */
    private static boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    /**
     * Get recommended JDK download URL
     */
    public static String getJDKDownloadURL() {
        String os = System.getProperty("os.name").toLowerCase();
        String arch = System.getProperty("os.arch").toLowerCase();

        if (os.contains("win")) {
            return "https://adoptium.net/temurin/releases/?os=windows&arch=x64&package=jdk";
        } else if (os.contains("mac")) {
            return "https://adoptium.net/temurin/releases/?os=mac&package=jdk";
        } else if (os.contains("linux")) {
            return "https://adoptium.net/temurin/releases/?os=linux&arch=x64&package=jdk";
        }
        return "https://adoptium.net/temurin/releases/";
    }
}
