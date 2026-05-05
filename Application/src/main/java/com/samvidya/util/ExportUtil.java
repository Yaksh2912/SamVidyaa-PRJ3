package com.samvidya.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

public class ExportUtil {
    private static final ObjectMapper objectMapper;
    
    static {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        // Ignore unknown properties during deserialization to handle imports from different sources
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // Lenient parsing for other small schema inconsistencies
        objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        objectMapper.configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        objectMapper.configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
        objectMapper.configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);
        objectMapper.configure(com.fasterxml.jackson.databind.MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
    }
    
    /**
     * Convert object to JSON string
     */
    public static String toJson(Object data) throws Exception {
        return objectMapper.writeValueAsString(data);
    }
    
    /**
     * Convert JSON string to object
     */
    public static <T> T fromJson(String json, Class<T> classOfT) throws Exception {
        return objectMapper.readValue(json, classOfT);
    }
    
    /**
     * Create ZIP file with JSON content
     */
    public static String createZipFile(String jsonContent, String jsonFileName,
                                      String outputPath, String zipFileName) throws IOException {
        String zipFilePath = outputPath + File.separator + zipFileName;
        
        try (FileOutputStream fos = new FileOutputStream(zipFilePath);
             ZipOutputStream zos = new ZipOutputStream(fos)) {
            
            // Add JSON file to ZIP
            ZipEntry zipEntry = new ZipEntry(jsonFileName);
            zos.putNextEntry(zipEntry);
            zos.write(jsonContent.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
            
            // Add README
            String readme = generateReadme();
            ZipEntry readmeEntry = new ZipEntry("README.txt");
            zos.putNextEntry(readmeEntry);
            zos.write(readme.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        
        return zipFilePath;
    }
    
    /**
     * Read JSON file from ZIP
     */
    public static String readZipFile(String zipFilePath, String jsonFileName) throws IOException {
        try (FileInputStream fis = new FileInputStream(zipFilePath);
             ZipInputStream zis = new ZipInputStream(fis)) {
            
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().equals(jsonFileName)) {
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                    }
                    return baos.toString(StandardCharsets.UTF_8.name());
                }
            }
        }
        throw new IOException("File not found in ZIP: " + jsonFileName);
    }
    
    /**
     * Generate export filename with timestamp
     */
    public static String generateExportFileName(String type, String identifier) {
        String sanitized = sanitizeFileName(identifier);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("%s_export_%s_%s.zip", type, sanitized, timestamp);
    }
    
    /**
     * Sanitize filename by removing invalid characters
     */
    public static String sanitizeFileName(String name) {
        if (name == null || name.isEmpty()) {
            return "unnamed";
        }
        return name.replaceAll("[^a-zA-Z0-9_-]", "_");
    }
    
    /**
     * Generate README content for export
     */
    private static String generateReadme() {
        return "SamVidya Export File\n" +
               "===================\n\n" +
               "This ZIP file contains exported course/module data from SamVidya.\n" +
               "Export Date: " + LocalDateTime.now() + "\n\n" +
               "Contents:\n" +
               "- module_data.json or course_data.json: Main export data\n\n" +
               "To import this data, use the Import feature in SamVidya.\n" +
               "The import process will automatically handle any conflicts.\n\n" +
               "For more information, visit: https://samvidya.com";
    }
}
