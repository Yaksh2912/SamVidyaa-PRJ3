package com.samvidya.util;

import com.samvidya.dto.export.ModuleDTO;
import com.samvidya.dto.export.TaskDTO;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExportUtilTest {
    
    @TempDir
    Path tempDir;
    
    @Test
    @Order(1)
    @DisplayName("Test JSON serialization")
    void testToJson() throws Exception {
        ModuleDTO module = new ModuleDTO();
        module.setModuleName("Test Module");
        module.setDescription("Test Description");
        module.setModuleOrder(1);
        module.setTasksPerModule(5);
        module.setModuleTestQuestionsCount(3);
        module.setActive(true);
        module.setTasks(new ArrayList<>());
        module.setModuleTestQuestions(new ArrayList<>());
        
        String json = ExportUtil.toJson(module);
        
        assertNotNull(json);
        assertTrue(json.contains("Test Module"));
        assertTrue(json.contains("Test Description"));
        assertTrue(json.contains("\"moduleOrder\" : 1"));
    }
    
    @Test
    @Order(2)
    @DisplayName("Test JSON deserialization")
    void testFromJson() throws Exception {
        String json = "{\n" +
                "  \"moduleName\" : \"Test Module\",\n" +
                "  \"description\" : \"Test Description\",\n" +
                "  \"moduleOrder\" : 1,\n" +
                "  \"tasksPerModule\" : 5,\n" +
                "  \"moduleTestQuestionsCount\" : 3,\n" +
                "  \"active\" : true,\n" +
                "  \"tasks\" : [],\n" +
                "  \"moduleTestQuestions\" : []\n" +
                "}";
        
        ModuleDTO module = ExportUtil.fromJson(json, ModuleDTO.class);
        
        assertNotNull(module);
        assertEquals("Test Module", module.getModuleName());
        assertEquals("Test Description", module.getDescription());
        assertEquals(1, module.getModuleOrder());
        assertEquals(5, module.getTasksPerModule());
        assertEquals(3, module.getModuleTestQuestionsCount());
        assertTrue(module.isActive());
    }
    
    @Test
    @Order(3)
    @DisplayName("Test ZIP file creation")
    void testCreateZipFile() throws Exception {
        String jsonContent = "{\"test\": \"data\"}";
        String outputPath = tempDir.toString();
        String zipFileName = "test_export.zip";
        
        String zipFilePath = ExportUtil.createZipFile(
            jsonContent, 
            "test_data.json", 
            outputPath, 
            zipFileName
        );
        
        assertNotNull(zipFilePath);
        File zipFile = new File(zipFilePath);
        assertTrue(zipFile.exists());
        assertTrue(zipFile.length() > 0);
        assertTrue(zipFilePath.endsWith(".zip"));
    }
    
    @Test
    @Order(4)
    @DisplayName("Test ZIP file reading")
    void testReadZipFile() throws Exception {
        // First create a ZIP file
        String jsonContent = "{\"test\": \"data\", \"value\": 123}";
        String outputPath = tempDir.toString();
        String zipFileName = "test_read.zip";
        
        String zipFilePath = ExportUtil.createZipFile(
            jsonContent, 
            "test_data.json", 
            outputPath, 
            zipFileName
        );
        
        // Now read it back
        String readContent = ExportUtil.readZipFile(zipFilePath, "test_data.json");
        
        assertNotNull(readContent);
        assertEquals(jsonContent, readContent);
    }
    
    @Test
    @Order(5)
    @DisplayName("Test export filename generation")
    void testGenerateExportFileName() {
        String fileName = ExportUtil.generateExportFileName("module", "Python Basics");
        
        assertNotNull(fileName);
        assertTrue(fileName.startsWith("module_export_"));
        assertTrue(fileName.contains("Python_Basics"));
        assertTrue(fileName.endsWith(".zip"));
    }
    
    @Test
    @Order(6)
    @DisplayName("Test filename sanitization")
    void testSanitizeFileName() {
        assertEquals("Test_Module", ExportUtil.sanitizeFileName("Test Module"));
        assertEquals("Python_101", ExportUtil.sanitizeFileName("Python 101"));
        assertEquals("C___Programming", ExportUtil.sanitizeFileName("C++ Programming"));
        assertEquals("Data_Science___ML", ExportUtil.sanitizeFileName("Data Science & ML"));
        assertEquals("unnamed", ExportUtil.sanitizeFileName(""));
        assertEquals("unnamed", ExportUtil.sanitizeFileName(null));
    }
    
    @Test
    @Order(7)
    @DisplayName("Test round-trip serialization")
    void testRoundTripSerialization() throws Exception {
        // Create a complex object
        TaskDTO task = new TaskDTO();
        task.setTaskName("Test Task");
        task.setDescription("Task Description");
        task.setProblemStatement("Solve this problem");
        task.setDifficulty("Medium");
        task.setPoints(10);
        task.setTimeLimit(30);
        task.setLanguage("Python");
        task.setTestCases(new ArrayList<>());
        
        // Serialize to JSON
        String json = ExportUtil.toJson(task);
        
        // Deserialize back
        TaskDTO deserializedTask = ExportUtil.fromJson(json, TaskDTO.class);
        
        // Verify all fields match
        assertEquals(task.getTaskName(), deserializedTask.getTaskName());
        assertEquals(task.getDescription(), deserializedTask.getDescription());
        assertEquals(task.getProblemStatement(), deserializedTask.getProblemStatement());
        assertEquals(task.getDifficulty(), deserializedTask.getDifficulty());
        assertEquals(task.getPoints(), deserializedTask.getPoints());
        assertEquals(task.getTimeLimit(), deserializedTask.getTimeLimit());
        assertEquals(task.getLanguage(), deserializedTask.getLanguage());
    }
    
    @Test
    @Order(8)
    @DisplayName("Test deserialization with unknown properties")
    void testDeserializationWithUnknownProperties() throws Exception {
        // JSON with extra fields that don't exist in TaskDTO
        String jsonWithExtraFields = "{\n" +
                "  \"taskName\" : \"Test Task\",\n" +
                "  \"description\" : \"Task Description\",\n" +
                "  \"problemStatement\" : \"Solve this\",\n" +
                "  \"difficulty\" : \"Medium\",\n" +
                "  \"points\" : 10,\n" +
                "  \"timeLimit\" : 30,\n" +
                "  \"language\" : \"Python\",\n" +
                "  \"testCases\" : [],\n" +
                "  \"expectedOutput\" : \"This field doesn't exist in TaskDTO\",\n" +
                "  \"metadata\" : { \"source\": \"external\", \"version\": \"2.0\" },\n" +
                "  \"customField\" : \"Should be ignored\"\n" +
                "}";
        
        // Should not throw exception - unknown fields should be ignored
        TaskDTO task = ExportUtil.fromJson(jsonWithExtraFields, TaskDTO.class);
        
        // Verify known fields are correctly deserialized
        assertNotNull(task);
        assertEquals("Test Task", task.getTaskName());
        assertEquals("Task Description", task.getDescription());
        assertEquals("Solve this", task.getProblemStatement());
        assertEquals("Medium", task.getDifficulty());
        assertEquals(10, task.getPoints());
        assertEquals(30, task.getTimeLimit());
        assertEquals("Python", task.getLanguage());
        assertNotNull(task.getTestCases());
        assertEquals(0, task.getTestCases().size());
    }
}
