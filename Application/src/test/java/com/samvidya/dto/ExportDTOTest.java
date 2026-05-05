package com.samvidya.dto;

import com.samvidya.dto.export.*;
import org.junit.jupiter.api.*;

import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExportDTOTest {
    
    @Test
    @Order(1)
    @DisplayName("Test ModuleDTO initialization")
    void testModuleDTOInitialization() {
        ModuleDTO dto = new ModuleDTO();
        
        assertNotNull(dto);
        assertNotNull(dto.getTasks());
        assertNotNull(dto.getModuleTestQuestions());
        assertEquals(0, dto.getTasks().size());
        assertEquals(0, dto.getModuleTestQuestions().size());
    }
    
    @Test
    @Order(2)
    @DisplayName("Test CourseDTO initialization")
    void testCourseDTOInitialization() {
        CourseDTO dto = new CourseDTO();
        
        assertNotNull(dto);
        assertNotNull(dto.getModules());
        assertNotNull(dto.getCourseTestQuestions());
        assertEquals(0, dto.getModules().size());
        assertEquals(0, dto.getCourseTestQuestions().size());
    }
    
    @Test
    @Order(3)
    @DisplayName("Test TaskDTO getters and setters")
    void testTaskDTOGettersSetters() {
        TaskDTO dto = new TaskDTO();
        
        dto.setTaskName("Test Task");
        dto.setDescription("Task Description");
        dto.setProblemStatement("Solve this");
        dto.setDifficulty("Medium");
        dto.setPoints(10);
        dto.setTimeLimit(30);
        dto.setLanguage("Python");
        dto.setTestCases(new ArrayList<>());
        
        assertEquals("Test Task", dto.getTaskName());
        assertEquals("Task Description", dto.getDescription());
        assertEquals("Solve this", dto.getProblemStatement());
        assertEquals("Medium", dto.getDifficulty());
        assertEquals(10, dto.getPoints());
        assertEquals(30, dto.getTimeLimit());
        assertEquals("Python", dto.getLanguage());
        assertNotNull(dto.getTestCases());
    }
    
    @Test
    @Order(4)
    @DisplayName("Test CodingQuestionDTO getters and setters")
    void testCodingQuestionDTOGettersSetters() {
        CodingQuestionDTO dto = new CodingQuestionDTO();
        
        dto.setQuestionText("Write a function");
        dto.setProblemStatement("Problem details");
        dto.setDifficulty("Hard");
        dto.setPoints(20);
        dto.setTimeLimit(45);
        dto.setLanguage("Java");
        dto.setTestCases(new ArrayList<>());
        
        assertEquals("Write a function", dto.getQuestionText());
        assertEquals("Problem details", dto.getProblemStatement());
        assertEquals("Hard", dto.getDifficulty());
        assertEquals(20, dto.getPoints());
        assertEquals(45, dto.getTimeLimit());
        assertEquals("Java", dto.getLanguage());
        assertNotNull(dto.getTestCases());
    }
    
    @Test
    @Order(5)
    @DisplayName("Test TestCaseDTO getters and setters")
    void testTestCaseDTOGettersSetters() {
        TestCaseDTO dto = new TestCaseDTO();
        
        dto.setInput("5");
        dto.setExpectedOutput("120");
        dto.setSample(true);
        dto.setOrderIndex(1);
        
        assertEquals("5", dto.getInput());
        assertEquals("120", dto.getExpectedOutput());
        assertTrue(dto.isSample());
        assertEquals(1, dto.getOrderIndex());
    }
    
    @Test
    @Order(6)
    @DisplayName("Test ModuleExportDTO structure")
    void testModuleExportDTOStructure() {
        ModuleExportDTO dto = new ModuleExportDTO();
        
        dto.setExportType("MODULE");
        dto.setExportVersion("1.0");
        dto.setExportDate(LocalDateTime.now());
        
        ModuleDTO module = new ModuleDTO();
        module.setModuleName("Test Module");
        dto.setModule(module);
        
        assertEquals("MODULE", dto.getExportType());
        assertEquals("1.0", dto.getExportVersion());
        assertNotNull(dto.getExportDate());
        assertNotNull(dto.getModule());
        assertEquals("Test Module", dto.getModule().getModuleName());
    }
    
    @Test
    @Order(7)
    @DisplayName("Test CourseExportDTO structure")
    void testCourseExportDTOStructure() {
        CourseExportDTO dto = new CourseExportDTO();
        
        dto.setExportType("COURSE");
        dto.setExportVersion("1.0");
        dto.setExportDate(LocalDateTime.now());
        
        CourseDTO course = new CourseDTO();
        course.setCourseCode("CS101");
        course.setCourseName("Test Course");
        dto.setCourse(course);
        
        assertEquals("COURSE", dto.getExportType());
        assertEquals("1.0", dto.getExportVersion());
        assertNotNull(dto.getExportDate());
        assertNotNull(dto.getCourse());
        assertEquals("CS101", dto.getCourse().getCourseCode());
        assertEquals("Test Course", dto.getCourse().getCourseName());
    }
    
    @Test
    @Order(8)
    @DisplayName("Test ModuleDTO with tasks and questions")
    void testModuleDTOWithContent() {
        ModuleDTO dto = new ModuleDTO();
        dto.setModuleName("Python Basics");
        dto.setTasksPerModule(5);
        dto.setModuleTestQuestionsCount(3);
        
        // Add tasks
        for (int i = 1; i <= 5; i++) {
            TaskDTO task = new TaskDTO();
            task.setTaskName("Task " + i);
            dto.getTasks().add(task);
        }
        
        // Add questions
        for (int i = 1; i <= 3; i++) {
            CodingQuestionDTO question = new CodingQuestionDTO();
            question.setQuestionText("Question " + i);
            dto.getModuleTestQuestions().add(question);
        }
        
        assertEquals(5, dto.getTasks().size());
        assertEquals(3, dto.getModuleTestQuestions().size());
        assertEquals(5, dto.getTasksPerModule());
        assertEquals(3, dto.getModuleTestQuestionsCount());
    }
    
    @Test
    @Order(9)
    @DisplayName("Test CourseDTO with modules")
    void testCourseDTOWithModules() {
        CourseDTO dto = new CourseDTO();
        dto.setCourseCode("CS101");
        dto.setCourseName("Programming Course");
        dto.setCourseTestQuestionsCount(10);
        
        // Add modules
        for (int i = 1; i <= 3; i++) {
            ModuleDTO module = new ModuleDTO();
            module.setModuleName("Module " + i);
            module.setModuleOrder(i);
            dto.getModules().add(module);
        }
        
        // Add course test questions
        for (int i = 1; i <= 10; i++) {
            CodingQuestionDTO question = new CodingQuestionDTO();
            question.setQuestionText("Course Question " + i);
            dto.getCourseTestQuestions().add(question);
        }
        
        assertEquals(3, dto.getModules().size());
        assertEquals(10, dto.getCourseTestQuestions().size());
        assertEquals(10, dto.getCourseTestQuestionsCount());
    }
    
    @Test
    @Order(10)
    @DisplayName("Test TaskDTO with test cases")
    void testTaskDTOWithTestCases() {
        TaskDTO dto = new TaskDTO();
        dto.setTaskName("Factorial");
        dto.setTestCases(new ArrayList<>());
        
        // Add test cases
        for (int i = 0; i < 5; i++) {
            TestCaseDTO testCase = new TestCaseDTO();
            testCase.setInput(String.valueOf(i));
            testCase.setExpectedOutput(String.valueOf(factorial(i)));
            testCase.setSample(i < 2); // First 2 are sample
            testCase.setOrderIndex(i);
            dto.getTestCases().add(testCase);
        }
        
        assertEquals(5, dto.getTestCases().size());
        assertTrue(dto.getTestCases().get(0).isSample());
        assertTrue(dto.getTestCases().get(1).isSample());
        assertFalse(dto.getTestCases().get(2).isSample());
    }
    
    private int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
}
