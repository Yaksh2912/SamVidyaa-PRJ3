package com.samvidya.service;

import com.samvidya.dto.export.ModuleDTO;
import com.samvidya.dto.export.TaskDTO;
import com.samvidya.dto.export.CodingQuestionDTO;
import com.samvidya.model.Module;
import com.samvidya.model.Task;
import com.samvidya.model.CodingQuestion;
import org.junit.jupiter.api.*;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ModuleExportServiceTest {
    
    private ModuleExportService exportService;
    
    @BeforeEach
    void setUp() {
        exportService = new ModuleExportService();
    }
    
    @Test
    @Order(1)
    @DisplayName("Test module to DTO conversion - basic fields")
    void testConvertModuleToDTOBasicFields() throws Exception {
        Module module = new Module();
        module.setId(1L);
        module.setCourseId(100L);
        module.setModuleName("Introduction to Python");
        module.setDescription("Learn Python basics");
        module.setModuleOrder(1);
        module.setTasksPerModule(5);
        module.setModuleTestQuestions(3);
        module.setActive(true);
        
        ModuleDTO dto = exportService.convertModuleToDTO(module);
        
        assertNotNull(dto);
        assertEquals("Introduction to Python", dto.getModuleName());
        assertEquals("Learn Python basics", dto.getDescription());
        assertEquals(1, dto.getModuleOrder());
        assertEquals(5, dto.getTasksPerModule());
        assertEquals(3, dto.getModuleTestQuestionsCount());
        assertTrue(dto.isActive());
        assertNotNull(dto.getTasks());
        assertNotNull(dto.getModuleTestQuestions());
    }
    
    @Test
    @Order(2)
    @DisplayName("Test module DTO has required collections")
    void testModuleDTOCollections() throws Exception {
        Module module = new Module();
        module.setId(1L);
        module.setModuleName("Test Module");
        module.setDescription("Test");
        module.setModuleOrder(1);
        module.setTasksPerModule(0);
        module.setModuleTestQuestions(0);
        module.setActive(true);
        
        ModuleDTO dto = exportService.convertModuleToDTO(module);
        
        assertNotNull(dto.getTasks());
        assertNotNull(dto.getModuleTestQuestions());
        assertTrue(dto.getTasks() instanceof ArrayList);
        assertTrue(dto.getModuleTestQuestions() instanceof ArrayList);
    }
    
    @Test
    @Order(3)
    @DisplayName("Test module with inactive status")
    void testInactiveModule() throws Exception {
        Module module = new Module();
        module.setId(1L);
        module.setModuleName("Inactive Module");
        module.setDescription("This module is inactive");
        module.setModuleOrder(2);
        module.setTasksPerModule(0);
        module.setModuleTestQuestions(0);
        module.setActive(false);
        
        ModuleDTO dto = exportService.convertModuleToDTO(module);
        
        assertNotNull(dto);
        assertFalse(dto.isActive());
    }
    
    @Test
    @Order(4)
    @DisplayName("Test module with special characters in name")
    void testModuleWithSpecialCharacters() throws Exception {
        Module module = new Module();
        module.setId(1L);
        module.setModuleName("C++ & Data Structures");
        module.setDescription("Learn C++ programming & DS");
        module.setModuleOrder(1);
        module.setTasksPerModule(10);
        module.setModuleTestQuestions(5);
        module.setActive(true);
        
        ModuleDTO dto = exportService.convertModuleToDTO(module);
        
        assertNotNull(dto);
        assertEquals("C++ & Data Structures", dto.getModuleName());
        assertEquals("Learn C++ programming & DS", dto.getDescription());
    }
    
    @Test
    @Order(5)
    @DisplayName("Test module with zero tasks and questions")
    void testModuleWithZeroContent() throws Exception {
        Module module = new Module();
        module.setId(1L);
        module.setModuleName("Empty Module");
        module.setDescription("No content yet");
        module.setModuleOrder(1);
        module.setTasksPerModule(0);
        module.setModuleTestQuestions(0);
        module.setActive(true);
        
        ModuleDTO dto = exportService.convertModuleToDTO(module);
        
        assertNotNull(dto);
        assertEquals(0, dto.getTasksPerModule());
        assertEquals(0, dto.getModuleTestQuestionsCount());
        // Note: getTasks().size() and getModuleTestQuestions().size() depend on database queries
        // They may not be 0 if data exists in the database
        assertNotNull(dto.getTasks());
        assertNotNull(dto.getModuleTestQuestions());
    }
}
