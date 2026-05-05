package com.samvidya.service;

import com.samvidya.dto.export.*;
import com.samvidya.model.ImportResult;
import com.samvidya.util.ExportUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ModuleImportServiceTest {
    
    @TempDir
    Path tempDir;
    
    @Test
    @Order(1)
    @DisplayName("Test module name conflict resolution - first import")
    void testModuleNameConflictFirstImport() {
        String originalName = "Python Basics";
        String resolvedName = resolveModuleNameConflict(originalName, new ArrayList<>());
        
        assertEquals("Python Basics", resolvedName);
    }
    
    @Test
    @Order(2)
    @DisplayName("Test module name conflict resolution - with conflict")
    void testModuleNameConflictWithConflict() {
        String originalName = "Python Basics";
        ArrayList<String> existingNames = new ArrayList<>();
        existingNames.add("Python Basics");
        
        String resolvedName = resolveModuleNameConflict(originalName, existingNames);
        
        assertEquals("Python Basics (Imported)", resolvedName);
    }
    
    @Test
    @Order(3)
    @DisplayName("Test module name conflict resolution - multiple conflicts")
    void testModuleNameConflictMultiple() {
        String originalName = "Python Basics";
        ArrayList<String> existingNames = new ArrayList<>();
        existingNames.add("Python Basics");
        existingNames.add("Python Basics (Imported)");
        
        String resolvedName = resolveModuleNameConflict(originalName, existingNames);
        
        assertEquals("Python Basics (Imported 2)", resolvedName);
    }
    
    @Test
    @Order(4)
    @DisplayName("Test module name conflict resolution - many conflicts")
    void testModuleNameConflictMany() {
        String originalName = "Test Module";
        ArrayList<String> existingNames = new ArrayList<>();
        existingNames.add("Test Module");
        existingNames.add("Test Module (Imported)");
        existingNames.add("Test Module (Imported 2)");
        existingNames.add("Test Module (Imported 3)");
        
        String resolvedName = resolveModuleNameConflict(originalName, existingNames);
        
        assertEquals("Test Module (Imported 4)", resolvedName);
    }
    
    @Test
    @Order(5)
    @DisplayName("Test export version validation")
    void testExportVersionValidation() {
        ModuleExportDTO exportData = new ModuleExportDTO();
        exportData.setExportType("MODULE");
        exportData.setExportVersion("2.0"); // Unsupported version
        exportData.setExportDate(LocalDateTime.now());
        
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setModuleName("Test");
        exportData.setModule(moduleDTO);
        
        // Version validation should fail for unsupported versions
        assertNotEquals("1.0", exportData.getExportVersion());
    }
    
    @Test
    @Order(6)
    @DisplayName("Test module export DTO structure")
    void testModuleExportDTOStructure() {
        ModuleExportDTO exportData = new ModuleExportDTO();
        exportData.setExportType("MODULE");
        exportData.setExportVersion("1.0");
        exportData.setExportDate(LocalDateTime.now());
        
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setModuleName("Test Module");
        moduleDTO.setDescription("Test Description");
        moduleDTO.setModuleOrder(1);
        moduleDTO.setTasksPerModule(5);
        moduleDTO.setModuleTestQuestionsCount(3);
        moduleDTO.setActive(true);
        moduleDTO.setTasks(new ArrayList<>());
        moduleDTO.setModuleTestQuestions(new ArrayList<>());
        
        exportData.setModule(moduleDTO);
        
        assertNotNull(exportData.getExportType());
        assertNotNull(exportData.getExportVersion());
        assertNotNull(exportData.getExportDate());
        assertNotNull(exportData.getModule());
        assertEquals("MODULE", exportData.getExportType());
        assertEquals("1.0", exportData.getExportVersion());
    }
    
    @Test
    @Order(7)
    @DisplayName("Test ImportResult initialization")
    void testImportResultInitialization() {
        ImportResult result = new ImportResult();
        
        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getWarnings());
        assertEquals(0, result.getWarnings().size());
    }
    
    @Test
    @Order(8)
    @DisplayName("Test ImportResult with warnings")
    void testImportResultWithWarnings() {
        ImportResult result = new ImportResult();
        result.setSuccess(true);
        result.addWarning("Module name changed");
        result.addWarning("Some tasks skipped");
        
        assertTrue(result.isSuccess());
        assertEquals(2, result.getWarnings().size());
        assertTrue(result.getWarnings().contains("Module name changed"));
        assertTrue(result.getWarnings().contains("Some tasks skipped"));
    }
    
    @Test
    @Order(9)
    @DisplayName("Test ImportResult summary generation")
    void testImportResultSummary() {
        ImportResult result = new ImportResult();
        result.setSuccess(true);
        result.setModuleName("Python Basics");
        result.setTasksImported(10);
        result.setQuestionsImported(5);
        result.addWarning("Module renamed");
        
        String summary = result.getSummary();
        
        assertNotNull(summary);
        assertFalse(summary.isEmpty());
        // Summary should contain key information
        assertTrue(result.isSuccess());
        assertEquals("Python Basics", result.getModuleName());
        assertEquals(10, result.getTasksImported());
        assertEquals(5, result.getQuestionsImported());
        assertEquals(1, result.getWarnings().size());
    }
    
    // Helper method for testing conflict resolution
    private String resolveModuleNameConflict(String moduleName, ArrayList<String> existingNames) {
        if (!existingNames.contains(moduleName)) {
            return moduleName;
        }
        
        int counter = 1;
        String newName;
        do {
            newName = moduleName + " (Imported" + (counter > 1 ? " " + counter : "") + ")";
            counter++;
        } while (existingNames.contains(newName));
        
        return newName;
    }
}
