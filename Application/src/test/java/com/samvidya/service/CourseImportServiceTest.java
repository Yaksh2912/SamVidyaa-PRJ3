package com.samvidya.service;

import com.samvidya.dto.export.*;
import com.samvidya.model.ImportResult;
import org.junit.jupiter.api.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CourseImportServiceTest {
    
    @Test
    @Order(1)
    @DisplayName("Test course code conflict resolution - no conflict")
    void testCourseCodeNoConflict() {
        String originalCode = "CS101";
        ArrayList<String> existingCodes = new ArrayList<>();
        
        String resolvedCode = resolveCourseCodeConflict(originalCode, existingCodes);
        
        assertEquals("CS101", resolvedCode);
    }
    
    @Test
    @Order(2)
    @DisplayName("Test course code conflict resolution - short code with suffix")
    void testCourseCodeShortCodeConflict() {
        String originalCode = "CS101";
        ArrayList<String> existingCodes = new ArrayList<>();
        existingCodes.add("CS101");
        
        String resolvedCode = resolveCourseCodeConflict(originalCode, existingCodes);
        
        assertNotEquals("CS101", resolvedCode);
        assertTrue(resolvedCode.startsWith("CS101"));
        assertEquals(6, resolvedCode.length()); // CS101 + 1 char
    }
    
    @Test
    @Order(3)
    @DisplayName("Test course code conflict resolution - all suffixes exhausted")
    void testCourseCodeAllSuffixesExhausted() {
        String originalCode = "CS101";
        ArrayList<String> existingCodes = new ArrayList<>();
        existingCodes.add("CS101");
        
        // Add all A-Z suffixes
        for (char c = 'A'; c <= 'Z'; c++) {
            existingCodes.add("CS101" + c);
        }
        
        String resolvedCode = resolveCourseCodeConflict(originalCode, existingCodes);
        
        assertNotEquals("CS101", resolvedCode);
        assertEquals(6, resolvedCode.length()); // Should be 6 random chars
        assertTrue(resolvedCode.matches("[A-Z0-9]{6}"));
    }
    
    @Test
    @Order(4)
    @DisplayName("Test course code conflict resolution - long code")
    void testCourseCodeLongCode() {
        String originalCode = "ADVANCED_PYTHON_2024";
        ArrayList<String> existingCodes = new ArrayList<>();
        existingCodes.add("ADVANCED_PYTHON_2024");
        
        String resolvedCode = resolveCourseCodeConflict(originalCode, existingCodes);
        
        assertNotEquals("ADVANCED_PYTHON_2024", resolvedCode);
        assertEquals(6, resolvedCode.length()); // Should generate random 6-char code
        assertTrue(resolvedCode.matches("[A-Z0-9]{6}"));
    }
    
    @Test
    @Order(5)
    @DisplayName("Test random code generation uniqueness")
    void testRandomCodeGeneration() {
        ArrayList<String> existingCodes = new ArrayList<>();
        existingCodes.add("ABC123");
        existingCodes.add("XYZ789");
        
        String code1 = generateRandomCourseCode(existingCodes);
        existingCodes.add(code1);
        String code2 = generateRandomCourseCode(existingCodes);
        
        assertNotEquals(code1, code2);
        assertEquals(6, code1.length());
        assertEquals(6, code2.length());
        assertTrue(code1.matches("[A-Z0-9]{6}"));
        assertTrue(code2.matches("[A-Z0-9]{6}"));
    }
    
    @Test
    @Order(6)
    @DisplayName("Test course export DTO structure")
    void testCourseExportDTOStructure() {
        CourseExportDTO exportData = new CourseExportDTO();
        exportData.setExportType("COURSE");
        exportData.setExportVersion("1.0");
        exportData.setExportDate(LocalDateTime.now());
        
        CourseDTO courseDTO = new CourseDTO();
        courseDTO.setCourseCode("CS101");
        courseDTO.setCourseName("Introduction to Programming");
        courseDTO.setDescription("Learn programming basics");
        courseDTO.setSubject("Computer Science");
        courseDTO.setInstructorName("John Doe");
        courseDTO.setCourseTestQuestionsCount(10);
        courseDTO.setActive(true);
        courseDTO.setModules(new ArrayList<>());
        courseDTO.setCourseTestQuestions(new ArrayList<>());
        
        exportData.setCourse(courseDTO);
        
        assertNotNull(exportData.getExportType());
        assertNotNull(exportData.getExportVersion());
        assertNotNull(exportData.getExportDate());
        assertNotNull(exportData.getCourse());
        assertEquals("COURSE", exportData.getExportType());
        assertEquals("1.0", exportData.getExportVersion());
    }
    
    @Test
    @Order(7)
    @DisplayName("Test course with multiple modules")
    void testCourseWithMultipleModules() {
        CourseDTO courseDTO = new CourseDTO();
        courseDTO.setCourseCode("CS101");
        courseDTO.setCourseName("Programming Course");
        courseDTO.setModules(new ArrayList<>());
        
        // Add multiple modules
        for (int i = 1; i <= 5; i++) {
            ModuleDTO module = new ModuleDTO();
            module.setModuleName("Module " + i);
            module.setModuleOrder(i);
            module.setTasks(new ArrayList<>());
            module.setModuleTestQuestions(new ArrayList<>());
            courseDTO.getModules().add(module);
        }
        
        assertEquals(5, courseDTO.getModules().size());
        assertEquals("Module 1", courseDTO.getModules().get(0).getModuleName());
        assertEquals("Module 5", courseDTO.getModules().get(4).getModuleName());
    }
    
    @Test
    @Order(8)
    @DisplayName("Test ImportResult for course import")
    void testCourseImportResult() {
        ImportResult result = new ImportResult();
        result.setSuccess(true);
        result.setCourseCode("CS101");
        result.setCourseName("Programming Course");
        result.setModulesImported(5);
        result.setTasksImported(25);
        result.setQuestionsImported(15);
        result.setCourseQuestionsImported(10);
        
        assertTrue(result.isSuccess());
        assertEquals("CS101", result.getCourseCode());
        assertEquals("Programming Course", result.getCourseName());
        assertEquals(5, result.getModulesImported());
        assertEquals(25, result.getTasksImported());
        assertEquals(15, result.getQuestionsImported());
        assertEquals(10, result.getCourseQuestionsImported());
    }
    
    @Test
    @Order(9)
    @DisplayName("Test course import with code change warning")
    void testCourseImportWithCodeChange() {
        ImportResult result = new ImportResult();
        result.setSuccess(true);
        result.setCourseCode("CS101A");
        result.addWarning("Course code changed from 'CS101' to 'CS101A' due to conflict");
        
        assertTrue(result.isSuccess());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getWarnings().get(0).contains("CS101"));
        assertTrue(result.getWarnings().get(0).contains("CS101A"));
    }
    
    // Helper methods for testing
    private String resolveCourseCodeConflict(String courseCode, ArrayList<String> existingCodes) {
        if (!existingCodes.contains(courseCode)) {
            return courseCode;
        }
        
        // Try appending A-Z for short codes
        if (courseCode.length() <= 5) {
            for (char suffix = 'A'; suffix <= 'Z'; suffix++) {
                String newCode = courseCode + suffix;
                if (!existingCodes.contains(newCode)) {
                    return newCode;
                }
            }
        }
        
        // Generate random 6-character code
        return generateRandomCourseCode(existingCodes);
    }
    
    private String generateRandomCourseCode(ArrayList<String> existingCodes) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String newCode;
        
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            newCode = sb.toString();
        } while (existingCodes.contains(newCode));
        
        return newCode;
    }
}
